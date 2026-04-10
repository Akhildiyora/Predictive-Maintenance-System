import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

export default function SensorTrendChart({ data = [] }) {
  const formatted = data
    .slice(0, 40)
    .map((entry) => ({
      timestamp: entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : '',
      temperature: entry.temperature ?? entry.metrics?.temperature,
      vibration: entry.vibration ?? entry.metrics?.vibration,
      pressure: entry.pressure ?? entry.metrics?.pressure
    }))
    .reverse();

  return (
    <div className="glass-panel chart-panel">
      <div className="chart-header">
        <div>
          <p className="text-xs uppercase text-dim tracking-widest">Live stream</p>
          <h3 className="text-lg font-semibold">Sensor trends</h3>
        </div>
        <span className="text-[11px] text-dim">
          {formatted.length} samples · {data.length ? 'streaming' : 'waiting'}
        </span>
      </div>
      {formatted.length === 0 ? (
        <div className="text-xs text-dim italic px-4 py-12 text-center">
          Waiting for live telemetry to populate the chart.
        </div>
      ) : (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={formatted}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="timestamp" tick={{ fill: '#cbd5f5', fontSize: 11 }} />
              <YAxis tick={{ fill: '#cbd5f5', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 8 }} />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="temperature" stroke="#fb923c" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="vibration" stroke="#34d399" dot={false} />
              <Line type="monotone" dataKey="pressure" stroke="#60a5fa" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
