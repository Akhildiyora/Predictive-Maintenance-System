import { WebSocketServer } from 'ws';

const clients = new Set();

function safeSend(socket, payload) {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

export function initWebSocketServer({ port = 3001 } = {}) {
  try {
    const wss = new WebSocketServer({ port });

    wss.on('connection', (socket) => {
      clients.add(socket);
      safeSend(socket, { type: 'status', payload: { message: 'connected' } });

    socket.on('close', () => {
      clients.delete(socket);
    });

    socket.on('error', () => {
      clients.delete(socket);
    });
  });

  wss.on('listening', () => {
    console.log(`[backend] websocket server listening on ws://localhost:${port}`);
  });

    return wss;
  } catch (err) {
    console.error(`[backend] WARNING: Failed to start WebSocket server on ${port}. Bridge mode disabled.`, err.message);
    return null;
  }
}

function broadcast(type, payload) {
  const message = { type, payload, timestamp: new Date().toISOString() };
  clients.forEach((client) => safeSend(client, message));
}

export function broadcastTelemetry(payload) {
  broadcast('telemetry', payload);
}

export function broadcastAlert(payload) {
  broadcast('alert', payload);
}

export function broadcastMqttStatus(status, details) {
  broadcast('mqtt_status', { status, details });
}

export function broadcastMqttRaw(topic, payload) {
  broadcast('mqtt_raw', { topic, payload });
}
