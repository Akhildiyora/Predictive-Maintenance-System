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
import { Activity } from 'lucide-react';

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
    <div className="p-10 rounded-[40px] bg-[#111111]/60 backdrop-blur-xl border border-white/5 space-y-10 group hover:bg-[#111111]/80 transition-all shadow-2xl relative overflow-hidden">
      {/* Dynamic Glow Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-500">Live Neural Stream</p>
          <h3 className="text-2xl font-black text-white uppercase tracking-tight">Sensor Telemetry Grid</h3>
        </div>
        <div className="flex items-center gap-3">
           <div className={`w-1.5 h-1.5 rounded-full ${formatted.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`} />
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {formatted.length} Frames Synced · {data.length ? 'Streaming' : 'Standalone'}
          </span>
        </div>
      </div>

      {formatted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 border-2 border-dashed border-white/5 rounded-[32px] opacity-20">
          <div className="animate-spin-slow text-blue-400">
            <Activity size={40} />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.5em]">Awaiting Uplink...</p>
        </div>
      ) : (
        <div className="w-full h-[280px] bg-white/2 rounded-[32px] p-6 border border-white/5 transition-all group-hover:bg-white/5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formatted}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(5, 6, 8, 0.95)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '20px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(10px)',
                  padding: '20px'
                }} 
                itemStyle={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
              />
              <Legend 
                verticalAlign="top" 
                align="right"
                height={40} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', paddingBottom: '24px' }}
              />
              <Line type="monotone" dataKey="temperature" stroke="#3b82f6" dot={false} strokeWidth={3} animationDuration={1000} />
              <Line type="monotone" dataKey="vibration" stroke="#a855f7" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="pressure" stroke="#f97316" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
