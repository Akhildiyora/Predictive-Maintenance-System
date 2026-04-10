# Smart Factory Monitoring & Predictive Maintenance System

IoT + Industry 4.0 proof-of-concept for streaming machine health, predictive maintenance, and actionable alerts.

## Objective
- Monitor industrial machines in real time and predict failures before they occur.

## Tech stack
- Frontend: React
- Backend: Node.js with Hono
- IoT ingestion: MQTT Broker
- Machine Learning: Python (Scikit-learn)
- Databases: InfluxDB for time-series / PostgreSQL for relational needs
- Cloud targets: AWS (e.g., IoT Core, Lambda, EventBridge) or Azure (IoT Hub, Functions)

## Core capabilities
- Device onboarding + metadata
- Live sensor telemetry streaming and storage
- Machine health visibility and maintenance scheduling
- Threshold-based alerts + anomaly detection
- Failure prediction + Remaining Useful Life (RUL) insights

## Repository layout
- `backend/` – REST + MQTT bridge powered by Hono
- `frontend/` – React dashboard with live charts and scheduling UI
- `iot/` – MQTT topic specs, simulator scripts, data processor helpers
- `ml/` – Model training + inference pipelines (Scikit-learn)
- `docs/` – Architecture, deployment guidance, runbooks
- `infra/` – Infrastructure-as-code stubs (CloudFormation/Terraform) + CI templates
