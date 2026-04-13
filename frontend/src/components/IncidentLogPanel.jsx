import React from 'react';
import { Activity } from 'lucide-react';

const severityConfigs = {
  critical: 'bg-red-500 shadow-[0_0_10px_#ef4444]',
  warning: 'bg-orange-500 shadow-[0_0_10px_#f97316]',
  info: 'bg-blue-500 shadow-[0_0_10px_#3b82f6]'
};

export default function IncidentLogPanel({ alerts = [], onArchive }) {
  return (
    <div className="flex flex-col h-full gap-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-base font-black text-white uppercase tracking-[0.3em]">Neural Incident Log</p>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{alerts.length} neural events captured</p>
        </div>
        <div className="flex gap-3">
          <button 
            className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all" 
            onClick={onArchive}
          >
            Purge Buffer
          </button>
          <button 
            className="px-6 py-2.5 rounded-xl bg-blue-600/10 border border-blue-600/20 text-[11px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-600/20 transition-all" 
            onClick={() => {
              if (alerts.length === 0) return;
              const headers = "id,machine_id,alert_type,message,severity,timestamp\n";
              const rows = alerts.map(a => `${a.id},${a.device_id},${a.alert_type},"${a.message}",${a.severity},${a.created_at}`).join("\n");
              const blob = new Blob([headers + rows], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `alerts_export_${new Date().toISOString().slice(0,10)}.csv`);
              document.body.appendChild(link);
              link.click();
              link.remove();
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 gap-4 opacity-10">
            <div className="p-5 rounded-full border-2 border-dashed border-white">
              <Activity size={32} />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.5em]">No Disruptions Detected</p>
          </div>
        ) : (
          alerts.map((alert, index) => {
            const key = alert.id ? `alert-${alert.id}` : `${alert.device_id ?? 'machine'}-${alert.timestamp}-${index}`;
            return (
              <article key={key} className="p-5 rounded-3xl bg-white/2 border border-white/5 flex gap-5 group hover:bg-white/5 transition-all mb-4 relative overflow-hidden">
                <div className={`w-1 h-12 rounded-full shrink-0 ${severityConfigs[alert.severity] ?? severityConfigs.info}`} />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.2em]">
                    <span className={alert.severity === 'critical' ? 'text-red-400' : alert.severity === 'warning' ? 'text-orange-400' : 'text-blue-400'}>
                      {alert.severity?.toUpperCase() ?? 'INFO'}
                    </span>
                    <span className="text-slate-600 group-hover:text-slate-400 transition-colors">
                      {new Date(alert.created_at ?? alert.timestamp ?? Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white leading-relaxed">
                    {alert.message?.length > 90 ? `${alert.message.slice(0, 90)}…` : alert.message}
                  </p>
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">
                    Node: <span className="text-slate-300">{alert.device_id ?? alert.deviceId ?? 'cluster-0'}</span> · Precision: <span className="text-slate-300">{alert.threshold ?? '99.9%'}</span>
                  </p>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
