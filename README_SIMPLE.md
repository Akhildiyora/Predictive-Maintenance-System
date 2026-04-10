# 🚀 Predict.AI QuickStart Guide

Welcome to your Smart Factory Predictive Maintenance dashboard. This guide will help you understand the system in simple terms.

## 🕹️ 1. How to use the Dashboard

- **Fleet Control**: Your main viewing area. Check the "AI Health" bar—anything below 70% needs attention.
- **Network Map**: A visual map of your sensors. If a node is pulsing, it's sending live data.
- **Technical Logs**: Every time a sensor exceeds a limit or the AI detects an anomaly, it's recorded here.
- **Raise Alert**: Use this button if you personally see something wrong on the factory floor. It will notify all other engineers.
- **Export CSV**: Click this in the Technical Logs to download a report of what you see on your screen.

## 🛠️ 2. System Layer Checklist
All these must be running for the dashboard to work:
1. **IoT Sensors**: The generators that simulate your machines.
2. **The Bridge (MQTT)**: The courier that carries the data.
3. **The Brain (ML)**: Predicts when failures will happen (RUL).
4. **The Database**: Remembers everything.
5. **The Dashboard**: What you are looking at now!

## 🧪 3. Final Verification (Technical)
Run this command in your terminal to verify system health:
```bash
python infra/health_check.py
```

## ⚠️ Important Note on Environments
The system uses `.env` files located in the `backend/` and `frontend/` folders. **Do not delete these**, as they contain the secret connection keys that make the pieces talk to each other.

---
*Created for Akhil-Projects by Predict.AI PRO*
