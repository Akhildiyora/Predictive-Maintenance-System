import pool from './db.js';
import { writeApi, queryApi, Point } from './influx.js';
import { defaultThresholds } from '../constants/thresholds.js';
import { broadcastAlert, broadcastTelemetry } from './broadcast.js';
import { predictFailureMetrics } from './prediction.js';

export async function listDevices() {
  const result = await pool.query('SELECT * FROM devices ORDER BY id ASC');
  return result.rows;
}

export async function registerDevice(payload) {
  const { id, name, type, location } = payload;
  const query = `
    INSERT INTO devices (id, name, type, location, status)
    VALUES ($1, $2, $3, $4, 'online')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      type = EXCLUDED.type,
      location = EXCLUDED.location,
      status = 'online'
    RETURNING *
  `;
  const result = await pool.query(query, [id, name, type, location]);
  return result.rows[0];
}

export async function pushTelemetry(entry) {
  const { machine_id, temperature, vibration, pressure, rpm, voltage, timestamp } = entry;
  
  // 0. Ensure device exists (auto-registration) to avoid FK violations
  await pool.query(
    'INSERT INTO devices (id, name, type, status) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
    [machine_id, machine_id, 'UNKNOWN', 'online']
  );

  // 1. Save to InfluxDB (Time-series)
  const point = new Point('machine_metrics')
    .tag('machine_id', machine_id)
    .floatField('temperature', temperature)
    .floatField('vibration', vibration)
    .floatField('pressure', pressure)
    .floatField('rpm', rpm)
    .floatField('voltage', voltage);

  if (timestamp) {
    point.timestamp(new Date(timestamp));
  }

  writeApi.writePoint(point);
  // Note: writeApi.flush() is usually handled automatically, but we can flush if needed
  
  // 2. Evaluate thresholds and save alerts to Postgres
  await evaluateThresholds(entry);

  // 3. Get ML Predictions and merge into entry for real-time UI
  try {
    const prediction = await predictFailureMetrics(entry);
    entry.prediction = prediction;
  } catch (err) {
    console.error('ML Prediction failed in pipeline', err);
  }

  broadcastTelemetry(entry);
  
  return entry;
}

async function evaluateThresholds(entry) {
  const { machine_id, timestamp } = entry;
  
  for (const [key, threshold] of Object.entries(defaultThresholds)) {
    const val = entry[key];
    if (val !== undefined && val >= threshold) {
      const severity = val > threshold * 1.25 ? 'critical' : 'warning';
      const message = `${key.toUpperCase()} exceeded threshold: ${val} (Limit: ${threshold})`;
      
      const query = `
        INSERT INTO alerts (device_id, alert_type, message, severity, created_at)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await pool.query(query, [machine_id, key, message, severity, timestamp || new Date()]);
      broadcastAlert({
        machine_id,
        alert_type: key,
        message,
        severity,
        value: val,
        threshold,
        timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
      });
    }
  }
}

export async function getTelemetry(machineId, hours = 1) {
  const fluxQuery = `
    from(bucket: "telemetry_bucket")
      |> range(start: -${hours}h)
      |> filter(fn: (r) => r["_measurement"] == "machine_metrics")
      |> filter(fn: (r) => r["machine_id"] == "${machineId}")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
  `;
  
  return queryApi.collectRows(fluxQuery);
}

export async function listAlerts(limit = 20) {
  const result = await pool.query('SELECT * FROM alerts ORDER BY created_at DESC LIMIT $1', [limit]);
  return result.rows;
}

export async function scheduleMaintenance(payload) {
  const { deviceId, scheduledFor, reason } = payload;
  const query = `
    INSERT INTO maintenance_schedules (device_id, scheduled_for, reason)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await pool.query(query, [deviceId, scheduledFor, reason]);
  return result.rows[0];
}

export async function listMaintenance() {
  const result = await pool.query('SELECT * FROM maintenance_schedules ORDER BY scheduled_for ASC');
  return result.rows;
}

export async function archiveAlerts() {
  const query = 'DELETE FROM alerts WHERE id IN (SELECT id FROM alerts ORDER BY created_at DESC LIMIT 100)';
  const result = await pool.query(query);
  return { deletedCount: result.rowCount };
}

export async function updateDeviceStatus(id, status) {
  const query = 'UPDATE devices SET status = $2 WHERE id = $1 RETURNING *';
  const result = await pool.query(query, [id, status]);
  return result.rows[0];
}

export async function createManualAlert(payload) {
  const { device_id, message, severity } = payload;
  const query = `
    INSERT INTO alerts (device_id, alert_type, message, severity)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await pool.query(query, [device_id || 'manual-system', 'MANUAL_TRIGGER', message, severity || 'info']);
  return result.rows[0];
}
