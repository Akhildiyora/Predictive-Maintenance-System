import React from 'react';
import { ShieldCheck, AlertCircle, Clock, Zap } from 'lucide-react';

export function Scoreboard({ devices, alerts }) {
  const activeAlerts = alerts.filter(a => a.severity === 'critical').length;
  const avgHealth = 92; // Mocked for design parity

  return (
    <div className="grid grid-cols-4 gap-6 mb-10">
      <KPIBox 
        label="Fleet Health" 
        value={`${avgHealth}%`} 
        detail="Target: 95%" 
        icon={<ShieldCheck className="text-primary"/>} 
      />
      <KPIBox 
        label="Active Alerts" 
        value={activeAlerts} 
        detail={`${alerts.length} total warnings`} 
        icon={<AlertCircle className="text-error" />} 
        alert={activeAlerts > 0}
      />
      <KPIBox 
        label="Mean Time Between Failures" 
        value="742h" 
        detail="+12h from last month" 
        icon={<Clock className="text-on-surface-variant" />} 
      />
      <KPIBox 
        label="Energy Load" 
        value="4.2 MW" 
        detail="Peak: 5.1 MW" 
        icon={<Zap className="text-secondary" />} 
      />
    </div>
  );
}

function KPIBox({ label, value, detail, icon, alert }) {
  return (
    <div className="layer-2 p-5 rounded-xl border border-white/[0.03] card-vibe">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
          {icon}
        </div>
        {alert && <div className="w-2 h-2 rounded-full bg-error pulse-critical mt-2" />}
      </div>
      <p className="text-[10px] technical-label text-on-surface-variant uppercase tracking-widest font-bold mb-1">
        {label}
      </p>
      <h2 className="text-2xl font-bold font-mono tracking-tighter mb-1">{value}</h2>
      <p className="text-[10px] text-on-surface-variant font-medium">{detail}</p>
    </div>
  );
}
