export const defaultThresholds = {
  temperature: Number(process.env.TEMP_THRESHOLD ?? 75),
  vibration: Number(process.env.VIBRATION_THRESHOLD ?? 12),
  pressure: 120,
  rpm: 3500,
  voltage: 245
};

export const alertSamples = [
  { level: 'info', color: 'blue' },
  { level: 'warning', color: 'orange' },
  { level: 'critical', color: 'red' }
];
