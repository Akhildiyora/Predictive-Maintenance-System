from argparse import ArgumentParser
from pathlib import Path

import joblib
import numpy as np


MODEL_DIR = Path(__file__).resolve().parent / "models"


def load_model(name):
    path = MODEL_DIR / name
    if not path.exists():
        raise FileNotFoundError(f"{name} missing. Run `train_model.py` first.")
    return joblib.load(path)


def build_feature_vector(metrics):
    required = ["temperature", "vibration", "pressure", "runtime_hours", "load_factor"]
    return np.array([[float(metrics.get(key, 0)) for key in required]])


def main():
    parser = ArgumentParser(description="Run inference against serialized ML models.")
    parser.add_argument("--temperature", type=float, required=True)
    parser.add_argument("--vibration", type=float, required=True)
    parser.add_argument("--pressure", type=float, default=110.0)
    parser.add_argument("--runtime-hours", type=float, default=1000.0)
    parser.add_argument("--load-factor", type=float, default=0.65)
    args = parser.parse_args()

    metrics = {
        "temperature": args.temperature,
        "vibration": args.vibration,
        "pressure": args.pressure,
        "runtime_hours": args.runtime_hours,
        "load_factor": args.load_factor
    }

    rul_model = load_model("rul_predictor.joblib")
    failure_model = load_model("failure_classifier.joblib")
    isolation_model = load_model("anomaly_detector.joblib")

    feature_vector = build_feature_vector(metrics)
    rul = int(rul_model.predict(feature_vector)[0])
    failure_proba = failure_model.predict_proba(feature_vector)[0][1]
    anomaly_score = isolation_model.decision_function(feature_vector)[0]

    outcome = {
        "remaining_useful_life_days": rul,
        "failure_probability": round(float(failure_proba), 3),
        "anomaly_score": round(float(anomaly_score), 3),
        "recommendation": "Trigger maintenance review" if failure_proba > 0.7 else "Monitor closely"
    }

    print("Inference result:", outcome)


if __name__ == "__main__":
    main()
