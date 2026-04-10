import { useMemo } from 'react';

export default function LiveTelemetryTable({ telemetry = [] }) {
  const limited = useMemo(() => telemetry.slice(0, 12), [telemetry]);
  const formatMetric = (value, digits = 1) =>
    typeof value === 'number' ? value.toFixed(digits) : '-';

  return (
    <section className="panel card telemetry-panel">
      <header>
        <h2>Live telemetry stream</h2>
        <p>Newest sensor batches from connected machines.</p>
      </header>
      {limited.length === 0 ? (
        <p className="muted-text">Waiting for telemetry data...</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Device</th>
                <th>Temp (°C)</th>
                <th>Vibration</th>
                <th>Pressure</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {limited.map((entry) => {
                const { deviceId, metrics, timestamp } = entry;
                return (
                  <tr key={`${deviceId}-${timestamp}`}>
                    <td>{deviceId}</td>
                    <td>{formatMetric(metrics?.temperature)}</td>
                    <td>{formatMetric(metrics?.vibration, 2)}</td>
                    <td>{formatMetric(metrics?.pressure)}</td>
                    <td>{new Date(timestamp).toLocaleTimeString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
