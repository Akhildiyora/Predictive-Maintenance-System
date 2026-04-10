const statusColors = {
  Nominal: 'status-nominal',
  Attention: 'status-warning',
  Degraded: 'status-critical'
};

export default function HealthDashboard({ summary = { devicesMonitored: 0, health: [] } }) {
  const { devicesMonitored, health } = summary;
  const healthList = Array.isArray(health) ? health : [];

  return (
    <section className="panel card health-panel">
      <header>
        <h2>Machine health</h2>
        <p>Aggregated status derived from the live telemetry stream.</p>
      </header>
      <div className="stat-grid">
        <div>
          <p className="stat-label">Devices monitored</p>
          <p className="stat-value">{devicesMonitored ?? 0}</p>
        </div>
        <div>
          <p className="stat-label">Alerts in view</p>
          <p className="stat-value">{healthList.length}</p>
        </div>
      </div>
      <div className="health-grid">
        {healthList.length === 0 ? (
          <p className="muted-text">Waiting for telemetry to compute health.</p>
        ) : (
          healthList.slice(0, 3).map((item) => {
            const { deviceId, latest, status } = item;
            return (
              <article key={deviceId} className="health-card">
                <header>
                  <span className={`status-dot ${statusColors[status] ?? ''}`} />
                  <h3>{deviceId}</h3>
                </header>
                <dl>
                  <div>
                    <dt>Temp</dt>
                    <dd>{latest?.metrics?.temperature?.toFixed?.(1) ?? '—'} °C</dd>
                  </div>
                  <div>
                    <dt>Vibration</dt>
                    <dd>{latest?.metrics?.vibration?.toFixed?.(2) ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>Pressure</dt>
                    <dd>{latest?.metrics?.pressure?.toFixed?.(1) ?? '—'}</dd>
                  </div>
                </dl>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
