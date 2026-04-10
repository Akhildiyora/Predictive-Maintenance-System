import React from 'react';

const severityBadge = {
  critical: 'incident-critical',
  warning: 'incident-warning',
  info: 'incident-info'
};

export default function IncidentLogPanel({ alerts = [], onArchive }) {
  return (
    <div className="incident-panel">
      <div className="incident-header">
        <div>
          <p className="incident-title">Incident Logs</p>
          <p className="incident-meta">{alerts.length} total events detected</p>
        </div>
        <div className="flex gap-2">
          <button className="incident-action" onClick={onArchive}>Archive</button>
          <button className="incident-action" onClick={() => {
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
          }}>Export</button>
        </div>
      </div>
      <div className="incident-scroll">
        {alerts.length === 0 ? (
          <p className="incident-empty">No incidents detected in the past hour.</p>
        ) : (
          alerts.map((alert, index) => {
            const key = alert.id ? `alert-${alert.id}` : `${alert.device_id ?? 'machine'}-${alert.timestamp}-${index}`;
            return (
              <article key={key} className="incident-card">
                <div className={`incident-trail ${severityBadge[alert.severity] ?? ''}`} />
                <div className="incident-card-body">
                  <div className="incident-card-top">
                    <span className="incident-badge-text">{alert.severity?.toUpperCase() ?? 'INFO'}</span>
                    <span className="incident-time">
                      {new Date(alert.created_at ?? alert.timestamp ?? Date.now()).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="incident-msg">
                    {alert.message?.length > 90 ? `${alert.message.slice(0, 90)}…` : alert.message}
                  </p>
                  <p className="incident-detail">
                    {alert.device_id ?? alert.deviceId ?? 'machine'} · Limit {alert.threshold ?? '—'}
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
