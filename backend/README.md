# Smart Factory Backend

Hono-powered HTTP + MQTT bridge that registers devices, ingests sensor telemetry, raises threshold alerts, and exposes ML-friendly endpoints.

## Getting started

1. Copy `.env.example` to `.env` and adjust thresholds or MQTT connection settings.
2. Run `npm install` once (already executed during scaffolding).
3. Start the server:
   - `npm run dev` (uses `node --watch` for rapid iteration).
   - `npm start` for production-style start.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/devices` | List registered machines. |
| `POST` | `/api/devices` | Register/refresh device metadata (`id`, `name`, `plant`, etc.). |
| `POST` | `/api/telemetry` | Inject telemetry from edge or HTTP clients (`deviceId`, `metrics`, `timestamp`). |
| `GET` | `/api/telemetry/recent` | Read recent telemetry points. |
| `GET` | `/api/dashboard/health` | Aggregate health summaries by device. |
| `GET` | `/api/alerts` | Fraction threshold-based alerts generated while ingesting. |
| `POST` | `/api/maintenance` | Schedule a maintenance activity (`deviceId`, `scheduledFor`, `notes`). |
| `GET` | `/api/maintenance` | View pending/completed maintenance. |
| `POST` | `/api/ml/predict` | Get inference for `metrics` payload. |
| `POST` | `/api/telemetry/mqtt` | Proxy MQTT messages back to the broker for fan-out testing. |

## MQTT simulation

- Server subscribes to `factory/+/machine/+/telemetry` by default; set `MQTT_TELEMETRY_TOPIC` to customize.
- Sensor payloads should include `deviceId`, `metrics` object, and optional timestamp.

## Persistence

Telemetry, alerts, devices, and maintenance scheduling data persist under `data/store.json` so the service resumes between restarts.
