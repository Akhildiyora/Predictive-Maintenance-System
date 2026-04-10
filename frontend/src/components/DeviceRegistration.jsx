import { useState } from 'react';

import { registerDevice } from '../utils/api';

const initialState = {
  id: '',
  name: '',
  plant: '',
  line: '',
  type: ''
};

export default function DeviceRegistration({ onRegistered }) {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.id.trim()) {
      setStatus('Device id is required');
      return;
    }
    setLoading(true);
    try {
      await registerDevice(form);
      setForm(initialState);
      setStatus('Device registered successfully');
      onRegistered?.();
    } catch (err) {
      setStatus(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel card">
      <header>
        <h2>Device registration</h2>
        <p>Keep device metadata aligned with the MQTT topic prefix.</p>
      </header>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Device ID
          <input name="id" value={form.id} onChange={handleChange} placeholder="machine-001" />
        </label>
        <label>
          Friendly name
          <input name="name" value={form.name} onChange={handleChange} placeholder="Lathe 1" />
        </label>
        <label>
          Plant
          <input name="plant" value={form.plant} onChange={handleChange} placeholder="Plant A" />
        </label>
        <label>
          Line
          <input name="line" value={form.line} onChange={handleChange} placeholder="Line 3" />
        </label>
        <label>
          Machine type
          <input name="type" value={form.type} onChange={handleChange} placeholder="Lathe" />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Registering…' : 'Register device'}
        </button>
      </form>
      {status && <p className="muted-text">{status}</p>}
    </section>
  );
}
