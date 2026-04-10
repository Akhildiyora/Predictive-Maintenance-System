import { BACKEND_URL } from '../config';

const jsonHeaders = {
  'Content-Type': 'application/json'
};

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'backend error');
  }
  return res.json();
}

export function fetchTelemetry() {
  return fetch(`${BACKEND_URL}/api/telemetry/recent`).then(handleResponse);
}

export function fetchDevices() {
  return fetch(`${BACKEND_URL}/api/devices`).then(handleResponse);
}

export function fetchAlerts() {
  return fetch(`${BACKEND_URL}/api/alerts`).then(handleResponse);
}

export function fetchMaintenance() {
  return fetch(`${BACKEND_URL}/api/maintenance`).then(handleResponse);
}

export function fetchHealthSummary() {
  return fetch(`${BACKEND_URL}/api/dashboard/health`).then(handleResponse);
}

export function registerDevice(payload) {
  return fetch(`${BACKEND_URL}/api/devices`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  }).then(handleResponse);
}

export function scheduleMaintenance(payload) {
  return fetch(`${BACKEND_URL}/api/maintenance`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  }).then(handleResponse);
}

export function predictFailure(metrics) {
  return fetch(`${BACKEND_URL}/api/ml/predict`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ metrics })
  }).then(handleResponse);
}
