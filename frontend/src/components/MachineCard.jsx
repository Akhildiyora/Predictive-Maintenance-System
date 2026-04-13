import React from 'react';
import { Activity, Thermometer, Zap, Gauge, ArrowRight, AlertTriangle } from 'lucide-react';

export function MachineCard({ machine, data }) {
  const isOnline = Boolean(data);
  const prediction = data?.prediction;
  
  let severity = 'nominal';
  let healthScore = 100;
  
  if (isOnline) {
    if (prediction) {
      healthScore = Math.round(100 - (prediction.probability * 100));
      if (prediction.probability > 0.8 || prediction.anomalyScore < -0.1) {
        severity = 'critical';
      } else if (prediction.probability > 0.4 || prediction.anomalyScore < -0.05) {
        severity = 'warning';
      }
    } else {
      if (data.temperature > 85 || data.vibration > 0.1) {
        severity = 'critical';
        healthScore = 42;
      } else if (data.temperature > 70 || data.vibration > 0.05) {
        severity = 'warning';
        healthScore = 78;
      }
    }
  }

  const metrics = [
    { label: 'Temp', value: isOnline ? `${data.temperature.toFixed(1)}°C` : '--', icon: <Thermometer size={14} />, color: 'text-orange-400' },
    { label: 'Vib', value: isOnline ? `${data.vibration.toFixed(3)}g` : '--', icon: <Activity size={14} />, color: 'text-blue-400' },
    { label: 'Load', value: isOnline ? `${data.pressure.toFixed(0)}psi` : '--', icon: <Gauge size={14} />, color: 'text-purple-400' },
    { label: 'RPM', value: isOnline ? Math.round(data.rpm) : '--', icon: <Zap size={14} />, color: 'text-yellow-400' }
  ];

  return (
    <article className={`p-10 rounded-[40px] bg-[#111111]/60 backdrop-blur-xl border border-white/5 relative overflow-hidden group hover:bg-[#111111]/80 hover:border-white/10 transition-all h-full flex flex-col ${!isOnline ? 'opacity-50 grayscale' : ''}`}>
      {/* Decorative Gradient Glow */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 blur-[80px] rounded-full transition-opacity duration-1000 ${severity === 'critical' ? 'bg-red-500/20' : severity === 'warning' ? 'bg-orange-500/20' : 'bg-blue-500/10'}`} />

      <header className="flex justify-between items-start mb-10 relative z-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500">{machine.id}</span>
            {isOnline && prediction?.anomalyScore < -0.05 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-black animate-pulse">
                <AlertTriangle size={10} /> ANOMALY
              </div>
            )}
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-blue-400 transition-colors uppercase">{machine.name}</h3>
        </div>
        <StatusBadge severity={isOnline ? severity : 'offline'} />
      </header>

      <div className="grid grid-cols-2 gap-5 mb-10 relative z-10">
        {metrics.map((metric) => (
          <div key={metric.label} className="p-6 rounded-3xl bg-white/2 border border-white/5 group-hover:border-white/10 transition-all flex flex-col gap-4">
            <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
              <span className={metric.color}>{metric.icon}</span>
              <span>{metric.label}</span>
            </div>
            <span className="text-lg font-black text-white tabular-nums tracking-tighter">{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="space-y-5 mb-10 mt-auto relative z-10">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Neural Health Index</p>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">RUL Estimate: {isOnline ? `${prediction?.remainingUsefulLifeHours ?? '--'}H` : '--'}</p>
          </div>
          <span className={`text-xl font-black tracking-tighter ${severity === 'critical' ? 'text-red-500' : severity === 'warning' ? 'text-orange-500' : 'text-blue-400'}`}>
            {isOnline ? `${healthScore}%` : '0%'}
          </span>
        </div>
        <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_-3px_currentColor] ${severity === 'critical' ? 'bg-red-500' : severity === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`} 
            style={{ width: `${isOnline ? healthScore : 0}%` }} 
          />
        </div>
      </div>

      <footer className="flex justify-between items-center pt-8 border-t border-white/5 relative z-10">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest max-w-[80%] line-clamp-1 italic">
          AI Suggestion: <span className="text-slate-400 non-italic">{prediction?.recommendedAction ?? 'Awaiting Telemetry Sync...'}</span>
        </p>
        <div className="w-8 h-8 rounded-xl bg-white/2 border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-blue-400 group-hover:border-blue-400 group-hover:bg-blue-400/10 transition-all">
          <ArrowRight size={14} />
        </div>
      </footer>
    </article>
  );
}

function StatusBadge({ severity }) {
  const configs = {
    nominal: { label: 'Operational', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    warning: { label: 'Degraded', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    critical: { label: 'Failure Risk', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    offline: { label: 'Air Gapped', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' }
  };

  const { label, color } = configs[severity];

  return (
    <span className={`px-6 py-2 rounded-xl border text-[11px] font-black uppercase tracking-[0.2em] shadow-sm ${color}`}>
      {label}
    </span>
  );
}
