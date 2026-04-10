# Architecture Overview

1. **Edge/IoT layer**
   - Machines publish telemetry to MQTT topics (e.g., `factory/{plant}/machine/{id}/telemetry`).
   - Device registration metadata stored in PostgreSQL and synced to analytics service.
2. **Backend ingestion**
   - Hono-powered HTTP/MQTT gateway handles device register/update calls and streams incoming telemetry.
   - MQTT messages forwarded to a worker that writes to InfluxDB for time-series and publishes aggregates via WebSocket/Server-Sent Events.
3. **ML services**
   - Python pipeline trains Scikit-learn models with historical telemetry (RUL, anomaly detection).
   - Models expose inference endpoints used by backend to tag alerts and gauge health.
4. **Frontend dashboard**
   - React app renders live charts via Recharts/Chart.js and connects to Hono SSE or WebSockets.
   - Scheduling UI lets operators plan maintenance tasks in PostgreSQL-backed calendar.
5. **Alerting + workflows**
   - Threshold-based alerts triggered in backend and persisted as events; optionally fan out to email/SMS via AWS SNS or Azure Logic Apps.
