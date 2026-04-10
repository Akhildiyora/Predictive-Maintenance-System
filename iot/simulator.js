import mqtt from 'mqtt';

const MQTT_BROKER = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const client = mqtt.connect(MQTT_BROKER);

const MACHINES = [
  { id: 'machine-001', name: 'CNC Lathe Alpha' },
  { id: 'machine-002', name: 'Welding Robot Beta' },
  { id: 'machine-003', name: 'Hydraulic Press Gamma' }
];

const SENSOR_BASES = {
  temperature: { min: 45, max: 80, unit: 'C' },
  vibration: { min: 0.01, max: 0.05, unit: 'g' },
  pressure: { min: 90, max: 120, unit: 'psi' },
  rpm: { min: 1200, max: 3200, unit: 'rpm' },
  voltage: { min: 210, max: 240, unit: 'V' }
};

function generateMetric(type, isAnomaly = false) {
  const base = SENSOR_BASES[type];
  let val = base.min + Math.random() * (base.max - base.min);
  if (isAnomaly) {
    val *= 1.5; // Spike for anomaly
  }
  return Number(val.toFixed(2));
}

client.on('connect', () => {
  console.log(`[IoT Simulator] Connected to MQTT Broker at ${MQTT_BROKER}`);
  
  setInterval(() => {
    MACHINES.forEach(machine => {
      // Occasional anomalies (5% chance)
      const isAnomaly = Math.random() < 0.05;
      
      const payload = {
        machine_id: machine.id,
        timestamp: new Date().toISOString(),
        temperature: generateMetric('temperature', isAnomaly),
        vibration: generateMetric('vibration', isAnomaly),
        pressure: generateMetric('pressure'),
        rpm: generateMetric('rpm'),
        voltage: generateMetric('voltage')
      };

      // Topic structure from user: factory/{machine_id}/sensor/{sensor_type}
      // We'll publish the full state to a 'telemetry' endpoint for efficiency
      const topic = `factory/${machine.id}/telemetry`;
      
      client.publish(topic, JSON.stringify(payload));
      console.log(`[IoT Simulator] Published to ${topic}:`, payload);
    });
  }, 3000); // Every 3 seconds
});

client.on('error', (err) => {
  console.error('[IoT Simulator] MQTT Connection Error:', err);
});
