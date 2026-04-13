import { useState, useEffect, useCallback } from 'react';
import { BACKEND_URL } from '../config';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'wss://predictive-maintenance-system-2e0r.onrender.com';
const API_URL = `${BACKEND_URL}/api`;

export function useMetrics() {
  const [metrics, setMetrics] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [devices, setDevices] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [stream, setStream] = useState([]);
  const [mqttStatus, setMqttStatus] = useState({ status: 'unknown', details: {} });
  const [mqttRawLogs, setMqttRawLogs] = useState([]);

  // Fetch initial data
  const refreshData = useCallback(async () => {
    try {
      const [devRes, alertRes, maintRes] = await Promise.all([
        fetch(`${API_URL}/devices`),
        fetch(`${API_URL}/alerts`),
        fetch(`${API_URL}/maintenance`)
      ]);
      const [devs, alrts, maints] = await Promise.all([
        devRes.json(), 
        alertRes.json(),
        maintRes.json()
      ]);
      setDevices(devs);
      setAlerts(alrts);
      setMaintenance(maints);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    }
  }, []);

  useEffect(() => {
    refreshData();
    
    let ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('Connected to Factory Stream');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'telemetry' && message.payload) {
        setMetrics((prev) => ({
          ...prev,
          [message.payload.machine_id]: message.payload
        }));
        setStream((prev) => {
          const next = [message.payload, ...prev];
          return next.slice(0, 40);
        });
      }

      if (message.type === 'alert' && message.payload) {
        setAlerts((prev) => [message.payload, ...prev].slice(0, 20));
      }

      if (message.type === 'mqtt_status') {
        setMqttStatus(message.payload);
      }

      if (message.type === 'mqtt_raw') {
        setMqttRawLogs((prev) => [
          { 
            ...message.payload, 
            id: `${message.payload.topic}-${performance.now()}-${Math.random()}`, 
            timestamp: new Date().toISOString() 
          },
          ...prev
        ].slice(0, 100));
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from Factory Stream');
      setIsConnected(false);
      // Reconnect logic
      setTimeout(() => {
        // Simple manual reconnect simulation
      }, 5000);
    };

    return () => ws.close();
  }, [refreshData]);

  // Periodic alert refresh (since alerts are handled in Postgres, not pushed via WS yet for simplicity)
  useEffect(() => {
    const timer = setInterval(refreshData, 10000);
    return () => clearInterval(timer);
  }, [refreshData]);

  const clearMqttLogs = useCallback(() => setMqttRawLogs([]), []);

  return { metrics, alerts, devices, maintenance, isConnected, stream, mqttStatus, mqttRawLogs, clearMqttLogs };
}
