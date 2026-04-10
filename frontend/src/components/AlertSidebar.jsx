import React from 'react';
import { AlertCircle, Clock, Info, ShieldAlert } from 'lucide-react';

export function AlertSidebar({ alerts }) {
  return (
    <div className="layer-1 h-full flex flex-col border-l border-white/[0.03]">
      <div className="p-8 border-b border-white/[0.03]">
        <h2 className="text-sm technical-label font-bold flex items-center gap-2 uppercase tracking-[0.2em]">
          <ShieldAlert className="text-secondary" size={16}/>
          Incident Logs
        </h2>
        <p className="text-[10px] text-on-surface-variant font-medium mt-1">
          {alerts.length} total events detected
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-on-surface-variant gap-4 opacity-50">
             <Info size={32} strokeWidth={1}/>
             <p className="text-xs technical-label font-bold uppercase tracking-widest">No Active Incidents</p>
          </div>
        ) : (
          alerts.map((alert, idx) => (
            <div key={idx} className="p-4 rounded-xl layer-2 border border-white/[0.03] card-vibe">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-[8px] technical-label font-bold px-2 py-0.5 rounded uppercase ${
                  alert.severity === 'critical' ? 'bg-error/10 text-error' : 'bg-secondary/10 text-secondary'
                }`}>
                  {alert.severity}
                </span>
                <span className="text-[10px] text-on-surface-variant flex items-center gap-1 font-mono">
                  <Clock size={10}/>
                  {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs font-bold leading-tight mb-1">{alert.device_id}</p>
              <p className="text-[10px] text-on-surface-variant leading-relaxed mb-0">{alert.message}</p>
            </div>
          ))
        )}
      </div>

      <div className="p-6 border-t border-white/[0.03] bg-black/10">
         <button className="w-full py-2 bg-white/5 rounded-lg text-[10px] technical-label font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
            Archive All Logs
         </button>
      </div>
    </div>
  );
}
