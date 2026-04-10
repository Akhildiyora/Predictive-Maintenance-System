import { useState } from 'react';

import { predictFailure } from '../utils/api';

const formDefaults = {
  temperature: 65,
  vibration: 8,
  pressure: 110,
  runtime_hours: 750,
  load_factor: 0.7
};

export default function MlInferencePanel() {
  const [form, setForm] = useState(formDefaults);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      const metrics = {
        temperature: form.temperature,
        vibration: form.vibration,
        pressure: form.pressure,
        runtime_hours: form.runtime_hours,
        load_factor: form.load_factor
      };
      const payload = await predictFailure(metrics);
      setResult(payload);
      setStatus('Prediction complete');
    } catch (err) {
      setStatus(err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel card">
      <header>
        <h2>ML inference</h2>
        <p>Estimate RUL and probability of failure per metric set.</p>
      </header>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Temperature
          <input name="temperature" type="number" value={form.temperature} step="0.1" onChange={handleChange} />
        </label>
        <label>
          Vibration
          <input name="vibration" type="number" value={form.vibration} step="0.1" onChange={handleChange} />
        </label>
        <label>
          Pressure
          <input name="pressure" type="number" value={form.pressure} onChange={handleChange} />
        </label>
        <label>
          Runtime hours
          <input name="runtime_hours" type="number" value={form.runtime_hours} onChange={handleChange} />
        </label>
        <label>
          Load factor
          <input name="load_factor" type="number" step="0.05" value={form.load_factor} onChange={handleChange} />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Predicting…' : 'Run inference'}
        </button>
      </form>
      {status && <p className="muted-text">{status}</p>}
      {result && (
        <div className="inference-result">
          <p>
            <strong>RUL:</strong> {result.remainingUsefulLifeDays} days
          </p>
          <p>
            <strong>Failure probability:</strong> {(result.failure_probability * 100).toFixed(1)}%
          </p>
          <p>
            <strong>Anomaly score:</strong> {result.anomaly_score}
          </p>
          <p className="muted-text">{result.recommendation}</p>
        </div>
      )}
    </section>
  );
}
