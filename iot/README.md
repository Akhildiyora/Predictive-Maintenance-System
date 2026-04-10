# IoT & MQTT guide

This folder collects MQTT topic conventions, simulator ideas, and expected payloads used across the Smart Factory system.

## MQTT topic structure

| Component | Topic example | Description |
| --- | --- | --- |
| Telemetry | `factory/plant-a/machine/001/telemetry` | Machine sends sensor values periodically. |
| Alerts | `factory/+/machine/+/alerts` | Backend or edge syndicates alerts for dashboards. |
| Commands | `factory/{plant}/machine/{id}/commands` | Operator-issued instructions (e.g., `pause`, `maintenance`). |

Sensors should publish JSON payloads:

```json
{
  "deviceId": "machine-001",
  "metrics": {
    "temperature": 68.5,
    "vibration": 9.4,
    "pressure": 110
  },
  "timestamp": "2026-04-10T05:00:00Z"
}
```

## Simulator concept

- Use `node`/Python scripts to publish these payloads to the MQTT broker listed in `backend/.env`.
- Sample jitter: vary temperature and vibration per machine to exercise alert rules.
- You can also POST the same payload to `backend/api/telemetry` during early development without a broker.

## Further steps

- Wire an MQTT ingress (AWS IoT Core rule, Azure IoT Hub routing) to forward to the backend HTTP endpoint if needed.
- Store raw telemetry in InfluxDB (via backend worker) and forward aggregates to frontend via SSE/WebSocket.
