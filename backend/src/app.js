import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import dotenv from 'dotenv';
import mqtt from 'mqtt';

import {
  listDevices,
  registerDevice,
  pushTelemetry,
  getTelemetry,
  listAlerts,
  archiveAlerts,
  updateDeviceStatus,
  createManualAlert,
  scheduleMaintenance,
  listMaintenance
} from './services/telemetry.js';
import { predictFailureMetrics } from './services/prediction.js';
import { initWebSocketServer } from './services/broadcast.js';

dotenv.config();

const app = new Hono();
app.use('/*', cors());
const port = Number(process.env.PORT ?? 4000);
const wsPort = Number(process.env.WS_PORT ?? 3001);
const mqttUrl = process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883';
const mqttTopic = 'factory/+/sensor/data'; // Updated as per Step 4 spec

// 1. Initialize WebSocket Server (Step 6)
initWebSocketServer({ port: wsPort });

// 2. MQTT Setup (Step 4)
const mqttClient = mqtt.connect(mqttUrl, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD
});

mqttClient.on('connect', () => {
  console.log(`[backend] connected to MQTT broker ${mqttUrl}`);
  mqttClient.subscribe(mqttTopic, (err) => {
    if (err) {
      console.error('[backend] failed to subscribe to sensor topic', err);
    } else {
      console.log(`[backend] subscribed to ${mqttTopic}`);
    }
  });
});

mqttClient.on('message', async (topic, payload) => {
  try {
    const data = JSON.parse(payload.toString());
    
    // Process and Save (InfluxDB + Postgres)
    const processedData = await pushTelemetry(data);
    console.log(`[backend] Streamed data for ${data.machine_id}`);
  } catch (err) {
    console.error('[backend] failed to process MQTT message', err);
  }
});

app.get('/', (ctx) => ctx.text('Smart Factory API + WebSocket Streaming Active'));

// REST Endpoints
app.get('/api/devices', async (ctx) => ctx.json(await listDevices()));
app.post('/api/devices', async (ctx) => {
  const payload = await ctx.req.json();
  if (!payload?.id) {
    return ctx.json({ error: 'device id is required' }, 400);
  }
  return ctx.json(await registerDevice(payload));
});
app.get('/api/telemetry/:machineId', async (ctx) => {
  const machineId = ctx.req.param('machineId');
  const hours = Number(ctx.req.query('hours') || 1);
  return ctx.json(await getTelemetry(machineId, hours));
});
app.get('/api/alerts', async (ctx) => ctx.json(await listAlerts()));
app.post('/api/alerts', async (ctx) => {
  const payload = await ctx.req.json();
  return ctx.json(await createManualAlert(payload));
});
app.get('/api/maintenance', async (ctx) => ctx.json(await listMaintenance()));

app.post('/api/maintenance', async (ctx) => {
  const payload = await ctx.req.json();
  return ctx.json(await scheduleMaintenance(payload));
});

app.post('/api/ml/predict', async (ctx) => {
  const payload = await ctx.req.json();
  const result = await predictFailureMetrics(payload.metrics);
  return ctx.json(result);
});

app.delete('/api/alerts', async (ctx) => {
  return ctx.json(await archiveAlerts());
});

app.patch('/api/devices/:id', async (ctx) => {
  const id = ctx.req.param('id');
  const payload = await ctx.req.json();
  return ctx.json(await updateDeviceStatus(id, payload.status));
});

app.onError((err, ctx) => {
  console.error('[backend] unhandled error', err);
  return ctx.json({ error: 'internal server error' }, 500);
});

serve({
  fetch: app.fetch,
  port
});

console.log(`[backend] HTTP server is running on http://localhost:${port}`);
