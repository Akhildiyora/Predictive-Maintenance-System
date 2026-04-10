import { useState } from 'react';

import { scheduleMaintenance } from '../utils/api';

const initialForm = {
  deviceId: '',
  maintenanceType: 'inspection',
  scheduledFor: '',
  notes: ''
};

export default function MaintenanceScheduler({ existing = [], onScheduled }) {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.deviceId || !form.scheduledFor) {
      setStatus('Device and date are required');
      return;
    }
    setLoading(true);
    try {
      const record = await scheduleMaintenance(form);
      setForm(initialForm);
      setStatus('Maintenance scheduled');
      onScheduled?.(record);
    } catch (err) {
      setStatus(err.message || 'Unable to schedule');
    } finally {
      setLoading(false);
    }
  };

  const upcoming = existing.slice(-3).reverse();

  return (
    <section className="panel card">
      <header>
        <h2>Maintenance scheduler</h2>
        <p>Plan preventive work based on computed health.</p>
      </header>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Device ID
          <input name="deviceId" value={form.deviceId} onChange={handleChange} />
        </label>
        <label>
          Type
          <select name="maintenanceType" value={form.maintenanceType} onChange={handleChange}>
            <option value="inspection">Inspection</option>
            <option value="calibration">Calibration</option>
            <option value="repair">Repair</option>
          </select>
        </label>
        <label>
          Scheduled for
          <input name="scheduledFor" type="date" value={form.scheduledFor} onChange={handleChange} />
        </label>
        <label>
          Notes
          <input name="notes" value={form.notes} onChange={handleChange} placeholder="Downtime window" />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Scheduling…' : 'Schedule maintenance'}
        </button>
      </form>
      {status && <p className="muted-text">{status}</p>}
      <div className="upcoming-list">
        <p className="muted-text">Upcoming events</p>
        <ul>
          {upcoming.length === 0 ? (
            <li className="muted-text">No scheduled work yet.</li>
          ) : (
            upcoming.map((item) => (
              <li key={item.id}>
                <strong>{item.deviceId}</strong> · {item.maintenanceType} on{' '}
                {new Date(item.scheduledFor).toLocaleDateString()} ({item.notes ?? 'No notes'})
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
