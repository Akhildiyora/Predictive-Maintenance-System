import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, mean_absolute_error

def engineer_features(df):
    """
    Step 9: Feature Engineering
    - Rolling Averages
    - Time-based features
    """
    df = df.sort_values('timestamp')
    df['timestamp'] = pd.to_datetime(df['timestamp'], format='mixed')
    
    # Rolling averages
    df['temp_roll_5'] = df['temperature'].rolling(window=5).mean()
    df['vib_roll_5'] = df['vibration'].rolling(window=5).mean()
    df['temp_roll_10'] = df['temperature'].rolling(window=10).mean()
    df['vib_std_10'] = df['vibration'].rolling(window=10).std()
    
    # Hour of day
    df['hour'] = df['timestamp'].dt.hour
    
    # Step 10: Binary Failure Label
    df['failure'] = ((df['temperature'] > 85) | (df['vibration'] > 0.1)).astype(int)
    
    # Step 12: Synthesize RUL (Remaining Useful Life)
    # RUL is time until the next 'failure=1' event
    df['next_failure_time'] = df.loc[df['failure'] == 1, 'timestamp']
    df['next_failure_time'] = df['next_failure_time'].bfill()
    
    # RUL in hours
    df['rul'] = (df['next_failure_time'] - df['timestamp']).dt.total_seconds() / 3600
    df['rul'] = df['rul'].fillna(48) # Default to 48h if no failure in window
    
    return df.dropna()

def train_full_suite(data_path=None):
    if data_path is None:
        data_path = Path(__file__).resolve().parent / "data" / "factory_telemetry.csv"
    
    if not Path(data_path).exists():
        print(f"Error: {data_path} not found.")
        return

    df = pd.read_csv(data_path)
    df_engineered = engineer_features(df)
    
    features = [
        'temperature', 'vibration', 'pressure', 'rpm', 
        'temp_roll_5', 'vib_roll_5', 'temp_roll_10', 'vib_std_10', 'hour'
    ]
    
    X = df_engineered[features]
    y_cla = df_engineered['failure']
    y_reg = df_engineered['rul']

    # Step 10: Failure Classifier
    X_train, X_test, y_train, y_test = train_test_split(X, y_cla, test_size=0.2, random_state=42)
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    print(f"Classifier Accuracy: {accuracy_score(y_test, clf.predict(X_test)):.2f}")

    # Step 11: Anomaly Detector (Isolation Forest)
    print("Training IsolationForest for anomalies...")
    iso = IsolationForest(contamination=0.05, random_state=42)
    iso.fit(X) # Unsupervised
    
    # Step 12: RUL Regressor (Linear Regression)
    print("Training LinearRegression for RUL...")
    X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(X, y_reg, test_size=0.2, random_state=42)
    reg = LinearRegression()
    reg.fit(X_train_r, y_train_r)
    print(f"RUL MAE: {mean_absolute_error(y_test_r, reg.predict(X_test_r)):.2f} hours")

    # Storage
    model_dir = Path(__file__).resolve().parent / "models"
    model_dir.mkdir(exist_ok=True)
    joblib.dump(clf, model_dir / "failure_classifier.joblib")
    joblib.dump(iso, model_dir / "anomaly_detector.joblib")
    joblib.dump(reg, model_dir / "rul_regressor.joblib")
    joblib.dump(features, model_dir / "feature_names.joblib")
    
    print(f"All models export to {model_dir}")

if __name__ == "__main__":
    train_full_suite()
