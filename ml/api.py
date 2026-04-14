from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from collections import deque
from datetime import datetime

MODEL_DIR = Path(__file__).resolve().parent / "models"

app = FastAPI(title="Smart Factory Predictive ML Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
clf_model = None  # Failure Classifier
iso_model = None  # Anomaly Detector
reg_model = None  # RUL Regressor
feature_list = []

# Rolling Buffer to calculate dynamic features (Step 9)
# Store last 10 samples per machine_id
sample_buffers = {} 

@app.on_event("startup")
def load_models():
    global clf_model, iso_model, reg_model, feature_list
    try:
        clf_model = joblib.load(MODEL_DIR / "failure_classifier.joblib")
        iso_model = joblib.load(MODEL_DIR / "anomaly_detector.joblib")
        reg_model = joblib.load(MODEL_DIR / "rul_regressor.joblib")
        feature_list = joblib.load(MODEL_DIR / "feature_names.joblib")
        print("All models and feature list loaded.")
    except Exception as e:
        print(f"Warning: Failed to load models: {e}")

class Metrics(BaseModel):
    machine_id: str
    temperature: float
    vibration: float
    pressure: float
    rpm: float
    voltage: float

class PredictResponse(BaseModel):
    machine_id: str
    failure_detected: bool
    failure_risk: float  # Step 13 Alignment
    anomaly_score: float
    predicted_rul_hours: float
    recommendation: str

@app.post("/predict", response_model=PredictResponse)
def predict(metrics: Metrics):
    global sample_buffers
    
    m_id = metrics.machine_id
    if m_id not in sample_buffers:
        sample_buffers[m_id] = deque(maxlen=10)
    
    # Add to buffer
    sample_buffers[m_id].append({
        "temperature": metrics.temperature,
        "vibration": metrics.vibration,
        "pressure": metrics.pressure,
        "rpm": metrics.rpm,
        "voltage": metrics.voltage,
        "hour": datetime.now().hour
    })

    if not clf_model or not feature_list or len(sample_buffers[m_id]) < 5:
        return PredictResponse(
            machine_id=m_id,
            failure_detected=False,
            failure_risk=0.0,
            anomaly_score=0.0,
            predicted_rul_hours=48.0,
            recommendation="Intelligence engine calibrating... Please wait for more data."
        )

    # Engineering Features (Same as train_model.py)
    df = pd.DataFrame(list(sample_buffers[m_id]))
    
    features_data = {
        'temperature': metrics.temperature,
        'vibration': metrics.vibration,
        'pressure': metrics.pressure,
        'rpm': metrics.rpm,
        'temp_roll_5': df['temperature'].tail(5).mean(),
        'vib_roll_5': df['vibration'].tail(5).mean(),
        'temp_roll_10': df['temperature'].mean(),
        'vib_std_10': df['vibration'].std() if len(df) > 1 else 0.0,
        'hour': datetime.now().hour
    }

    # Prepare vector (Preserve feature names to silence warnings)
    vector = pd.DataFrame([features_data])[feature_list]

    # Predictions
    is_failure = bool(clf_model.predict(vector)[0])
    # Risk probability (using predict_proba)
    failure_proba = float(clf_model.predict_proba(vector)[0][1])
    anomaly = float(iso_model.decision_function(vector)[0])
    rul = float(reg_model.predict(vector)[0])

    return PredictResponse(
        machine_id=m_id,
        failure_detected=is_failure,
        failure_risk=round(failure_proba, 4),
        anomaly_score=round(anomaly, 4),
        predicted_rul_hours=round(max(0, rul), 1),
        recommendation="Urgent maintenance" if is_failure else ("Check sensor" if anomaly < -0.05 else "Normal")
    )

if __name__ == "__main__":
    import uvicorn
    # Render uses the PORT environment variable
    port = int(os.getenv("PORT", 8000))
    # reload=False is safer for production deployments on Render
    uvicorn.run("api:app", host="0.0.0.0", port=port, reload=False)
