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
  listMaintenance,
  updateMaintenanceStatus
} from './services/telemetry.js';
import { predictFailureMetrics } from './services/prediction.js';
import { initWebSocketServer, broadcastMqttStatus, broadcastMqttRaw } from './services/broadcast.js';
import { hashPassword, comparePassword, generateToken, verifyToken } from './services/auth.js';
import { findUserByEmail, createUser } from './services/user.js';
import { getSchemaInfo, executeRawQuery, getDatabaseMetrics } from './services/database.js';

dotenv.config();

const app = new Hono();
app.use('/*', cors());

// 0. Force HTTPS in Production (Step 5.3)
app.use('*', async (ctx, next) => {
  const protocol = ctx.req.header('x-forwarded-proto');
  if (protocol && protocol !== 'https' && process.env.NODE_ENV === 'production') {
    return ctx.redirect(`https://${ctx.req.header('host')}${ctx.req.path}`);
  }
  await next();
});

const JWT_SECRET = process.env.JWT_SECRET || 'factory-floor-secret-99';

// JWT Validation Middleware
const authMiddleware = async (ctx, next) => {
  const authHeader = ctx.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ctx.json({ error: 'Unauthorized: Missing token' }, 401);
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return ctx.json({ error: 'Unauthorized: Invalid or expired token' }, 401);
  }
  ctx.set('user', payload);
  await next();
};

const port = Number(process.env.PORT ?? 4000);
const wsPort = Number(process.env.WS_PORT ?? 3001);
const mqttUrl = process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883';
const mqttTopic = 'factory/+/sensor/data';

// WebSocket and MQTT initialized via services

// 1. Initialize WebSocket Server (Step 6)
initWebSocketServer({ port: wsPort });

// 2. MQTT Setup (Step 4)
const mqttClient = mqtt.connect(mqttUrl, {
  username: process.env.MQTT_USERNAME || process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD || process.env.MQTT_PASS,
  protocol: mqttUrl.startsWith('mqtts') ? 'mqtts' : 'mqtt'
});

mqttClient.on('connect', () => {
  console.log(`[backend] connected to MQTT broker ${mqttUrl}`);
  mqttClient.subscribe(mqttTopic);
  broadcastMqttStatus('connected', { url: mqttUrl, topic: mqttTopic });
});

mqttClient.on('error', (err) => {
  console.error('[backend] MQTT error', err);
  broadcastMqttStatus('error', { message: err.message });
});

mqttClient.on('close', () => {
  broadcastMqttStatus('disconnected', { message: 'Broker connection lost' });
});

mqttClient.on('message', async (topic, payload) => {
  try {
    const rawPayload = payload.toString();
    // 1. Broadcast raw message for the Gateway View
    broadcastMqttRaw(topic, rawPayload);

    // 2. Process telemetry normally
    const data = JSON.parse(rawPayload);
    await pushTelemetry(data).catch(e => console.error('[backend] pushTelemetry error', e.message));
  } catch (err) {
    console.error('[backend] failed to process MQTT message', err);
  }
});

app.get('/', (ctx) => ctx.text('Predict.AI Secure API Active'));

// Auth Endpoints
app.post('/auth/signup', async (ctx) => {
  try {
    const { email, password, full_name } = await ctx.req.json();
    const existing = await findUserByEmail(email);
    if (existing) return ctx.json({ error: 'user already exists' }, 400);

    const hashedPassword = await hashPassword(password);
    const user = await createUser({ email, password: hashedPassword, full_name });
    const token = generateToken({ id: user.id, email: user.email });
    return ctx.json({ token, user });
  } catch (err) {
    return ctx.json({ error: 'signup failed' }, 500);
  }
});

app.post('/auth/login', async (ctx) => {
  try {
    const { email, password } = await ctx.req.json();
    console.log(`[DEBUG] Login attempt for: ${email}`);
    
    const user = await findUserByEmail(email);
    if (!user) {
      console.log(`[DEBUG] User not found: ${email}`);
      return ctx.json({ error: 'invalid credentials' }, 401);
    }
    
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      console.log(`[DEBUG] Password mismatch for: ${email}`);
       return ctx.json({ error: 'invalid credentials' }, 401);
    }
    
    console.log(`[DEBUG] Login successful: ${email}`);
    const token = generateToken({ id: user.id, email: user.email });
    return ctx.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } });
  } catch (err) {
    console.error(`[DEBUG] Login error: ${err.message}`);
    return ctx.json({ error: 'login failed' }, 500);
  }
});

// REST Endpoints
app.get('/api/devices', async (ctx) => ctx.json(await listDevices()));
app.get('/api/alerts', async (ctx) => ctx.json(await listAlerts()));
app.get('/api/maintenance', async (ctx) => ctx.json(await listMaintenance()));

app.get('/api/telemetry/:machineId', async (ctx) => {
  const machineId = ctx.req.param('machineId');
  const hours = Number(ctx.req.query('hours') || 1);
  return ctx.json(await getTelemetry(machineId, hours));
});

// Protected Endpoints
app.post('/api/devices', authMiddleware, async (ctx) => {
  const payload = await ctx.req.json();
  return ctx.json(await registerDevice(payload));
});

app.post('/api/alerts', authMiddleware, async (ctx) => {
  const payload = await ctx.req.json();
  return ctx.json(await createManualAlert(payload));
});

app.post('/api/maintenance', authMiddleware, async (ctx) => {
  const payload = await ctx.req.json();
  return ctx.json(await scheduleMaintenance(payload));
});

app.patch('/api/maintenance/:id', authMiddleware, async (ctx) => {
  try {
    const id = ctx.req.param('id');
    const { status } = await ctx.req.json();
    const updated = await updateMaintenanceStatus(id, status);
    if (!updated) return ctx.json({ error: 'Schedule not found' }, 404);
    return ctx.json(updated);
  } catch (err) {
    return ctx.json({ error: err.message }, 400);
  }
});

app.delete('/api/alerts', authMiddleware, async (ctx) => {
  return ctx.json(await archiveAlerts());
});

app.patch('/api/devices/:id', authMiddleware, async (ctx) => {
  const id = ctx.req.param('id');
  const payload = await ctx.req.json();
  return ctx.json(await updateDeviceStatus(id, payload.status));
});

app.post('/api/ml/predict', async (ctx) => {
  const payload = await ctx.req.json();
  return ctx.json(await predictFailureMetrics(payload.metrics));
});

// Secure MQTT Publish Endpoint (Step 6 Implementation)
app.post('/api/mqtt/publish', authMiddleware, async (ctx) => {
  try {
    const { topic, payload } = await ctx.req.json();
    if (!topic || !payload) return ctx.json({ error: 'topic and payload required' }, 400);

    const message = typeof payload === 'object' ? JSON.stringify(payload) : payload;
    mqttClient.publish(topic, message);
    
    console.log(`[backend] manual publish to ${topic} by ${ctx.get('user')?.email}`);
    return ctx.json({ success: true, topic, message });
  } catch (err) {
    return ctx.json({ error: 'publish failed' }, 500);
  }
});

// Database Command Center Endpoints
app.get('/api/db/schema', authMiddleware, async (ctx) => {
  try {
    return ctx.json(await getSchemaInfo());
  } catch (err) {
    return ctx.json({ error: 'failed to fetch schema' }, 500);
  }
});

app.get('/api/db/metrics', authMiddleware, async (ctx) => {
  try {
    return ctx.json(await getDatabaseMetrics());
  } catch (err) {
    return ctx.json({ error: 'failed to fetch metrics' }, 500);
  }
});

app.post('/api/db/query', authMiddleware, async (ctx) => {
  try {
    const { sql } = await ctx.req.json();
    if (!sql) return ctx.json({ error: 'sql query required' }, 400);
    return ctx.json(await executeRawQuery(sql));
  } catch (err) {
    return ctx.json({ error: err.message || 'query execution failed' }, 400);
  }
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
