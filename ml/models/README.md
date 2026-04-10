## ML model artifacts

This directory stores the serialized assets produced by `train_model.py`.

- `rul_predictor.joblib` – Random forest regressor that estimates remaining useful life.
- `failure_classifier.joblib` – Binary classifier that flags likely failures from telemetry.
- `anomaly_detector.joblib` – Isolation forest capturing outliers in the normal telemetry distribution.
- `training_summary.json` – Metrics describing the latest training run (MAE, accuracy, etc.).

Run `python train_model.py` whenever new labeled telemetry arrives; the script regenerates the `models/` directory and overwrites the summary file.
