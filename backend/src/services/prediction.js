export async function predictFailureMetrics(metrics = {}) {
  const ML_URL = process.env.ML_SERVICE_URL ?? 'http://localhost:8000';
  
  try {
    const res = await fetch(`${ML_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics)
    });
    if (!res.ok) throw new Error('ML Service Error');
    const data = await res.json();
    return {
      probability: data.failure_risk,
      remainingUsefulLifeHours: data.predicted_rul_hours,
      anomalyScore: data.anomaly_score,
      recommendedAction: data.recommendation,
      generatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('[backend] Error calling ML service, falling back to heuristic', err);
    // Fallback heuristic
    const temp = Number(metrics.temperature ?? 0);
    const vibration = Number(metrics.vibration ?? 0);
    const confidence = Math.min(1, (temp / 120) + (vibration / 40));
    const rul = Math.max(1, Math.round(48 - confidence * 48));
    return {
      probability: Number(confidence.toFixed(3)),
      remainingUsefulLifeHours: rul,
      anomalyScore: Number((0.1 - confidence).toFixed(3)), // Inverse for anomaly score logic
      recommendedAction: confidence > 0.7 ? 'Prioritize maintenance window this shift' : 'Monitor for gradual change',
      generatedAt: new Date().toISOString()
    };
  }
}

