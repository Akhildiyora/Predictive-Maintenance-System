import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.join(__dirname, '..', '..', 'data', 'store.json');

const state = {
  devices: [],
  telemetry: [],
  alerts: [],
  maintenance: []
};

export async function loadStore() {
  try {
    const payload = await fs.readFile(storePath, 'utf8');
    Object.assign(state, JSON.parse(payload));
  } catch (err) {
    await persistStore();
  }
}

export async function persistStore() {
  const payload = JSON.stringify(state, null, 2);
  await fs.writeFile(storePath, payload, 'utf8');
}

export function getStore() {
  return state;
}

export function mergeState(patch) {
  Object.assign(state, patch);
}
