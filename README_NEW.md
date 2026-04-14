# 🚀 Predict.AI: Smart Factory Maintenance System

Predict.AI is a high-fidelity predictive maintenance dashboard designed for industrial monitoring. It uses real-time telemetry from IoT sensors to predict machine failures before they happen, allowing for optimized maintenance scheduling and reduced downtime.

## 📁 System Architecture

- `backend/` – API & Data Bridge (Hono)
- `frontend/` – React Dashboard with live charts & scheduling UI
- `iot/` – Data simulators & MQTT payload specs
- `ml/` – Machine Learning diagnostic & prediction engine
- `infra/` – Core infrastructure (Postgres, InfluxDB, MQTT Broker)
- `docs/` – Technical guides and architecture diagrams

---

## ⚡ Quick Start Guide (Deployment)

Follow these steps in sequence to start the full industrial ecosystem.

### 1. Infrastructure (Databases & Messaging)
Spin up the core database and messaging containers.
```powershell
cd infra
docker-compose up -d
```

### 2. Backend API
Install dependencies and initialize the operational database.
```powershell
cd backend
npm install
npm run init-db  # Setup database tables (First time only)
npm run dev      # Start API in watch mode
```

### 3. Intelligence Engine (ML)
Start the AI prediction service to enable real-time risk assessment and RUL (Remaining Useful Life) calculations.
```powershell
cd ml
py api.py
```

### 4. Data Simulator (IoT)
Start feeding live machine data into the system. You can use either the Node.js or Python simulator.
```powershell
# Option A: Python (Standard)
cd iot
py simulator.py

# Option B: Node.js (Alternative)
cd iot
npm install
npm start
```

### 5. Frontend Dashboard
Start the visual control center.
```powershell
cd frontend
npm install
npm run dev
```

---

## 🛠️ Operational Guide

- **Machine Overview**: Your primary cock-pit. Monitor health scores and live trends.
- **Maintenance Schedule**: Manage upcoming and historical maintenance windows. Use the "Start Job" and "Mark Complete" buttons to track progress.
- **Reporting Issues**: Use the **"Report Issue"** button in the header if you observe a problem on the factory floor.
- **Device Map**: A visual mesh showing all connected sensors and their signal links.
- **Live Data Stream**: A real-time terminal view of the raw MQTT data flowing through the factory.

## ⚙️ Technical Requirements
- **Docker Desktop**: For running the infrastructure stack.
- **Node.js**: v18+ recommended.
- **Python**: v3.10+ (for ML and IoT scripts).
- **MQTT**: Mosquitto used as the default broker.

---
*Created for industrial-grade predictive maintenance monitoring.*
