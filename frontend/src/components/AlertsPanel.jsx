const severityClasses = {
  critical: 'status-critical',
  warning: 'status-warning',
  info: 'status-nominal'
};

export default function AlertsPanel({ alerts = [] }) {
  const trimmed = alerts.slice(0, 6);

  return (
    <section className="panel card alerts-panel">
      <header>
        <h2>Alerts</h2>
        <p>Generated once telemetry exceeds thresholds.</p>
      </header>
      {trimmed.length === 0 ? (
        <p className="muted-text">No alerts yet.</p>
      ) : (
        <ul className="alert-list">
          {trimmed.map((alert) => (
            <li key={alert.id} className={`alert-item ${severityClasses[alert.severity] || ''}`}>
              <strong>
                {alert.metric} {alert.value}
              </strong>
              <span>
                {new Date(alert.timestamp).toLocaleTimeString()} · threshold {alert.threshold}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
