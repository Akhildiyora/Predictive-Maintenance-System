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
      // Fallback to basic thresholds
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
    { label: 'Temp', value: isOnline ? `${data.temperature.toFixed(1)} °C` : '--', icon: <Thermometer size={14} /> },
    { label: 'Vib', value: isOnline ? `${data.vibration.toFixed(3)}g` : '--', icon: <Activity size={14} /> },
    { label: 'Load', value: isOnline ? `${data.pressure.toFixed(0)} psi` : '--', icon: <Gauge size={14} /> },
    { label: 'RPM', value: isOnline ? Math.round(data.rpm) : '--', icon: <Zap size={14} /> }
  ];

  return (
    <article className={`machine-card ${!isOnline ? 'machine-card-offline' : ''}`}>
      <header className="machine-card-header">
        <div className="flex flex-col">
          <span className="machine-card-subtitle flex items-center gap-2">
            {machine.id}
            {isOnline && prediction?.anomalyScore < -0.05 && (
              <span className="text-red-400 flex items-center gap-1 animate-pulse">
                <AlertTriangle size={12} /> ANOMALY
              </span>
            )}
          </span>
          <h3 className="machine-card-title">{machine.name}</h3>
        </div>
        <StatusBadge severity={isOnline ? severity : 'offline'} />
      </header>

      <div className="machine-card-data">
        {metrics.map((metric) => (
          <div key={metric.label} className="machine-card-metric">
            <div className="machine-card-metric-label">
              {metric.icon}
              <span>{metric.label}</span>
            </div>
            <span className="machine-card-metric-value">{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="machine-card-forecast">
        <div className="forecast-text">
          <p>AI Health & RUL Estimate</p>
          <span>{isOnline ? `${healthScore}% · ${prediction?.remainingUsefulLifeHours ?? '--'}h rem.` : '0%'}</span>
        </div>
        <div className="forecast-track">
          <div className={`forecast-fill ${severity === 'critical' ? 'bg-red-500' : ''}`} 
               style={{ width: `${isOnline ? healthScore : 0}%`, transition: 'width 1s ease' }} />
        </div>
      </div>

      <footer className="machine-card-footer">
        <span className="text-xs opacity-60">Status: {prediction?.recommendedAction ?? 'Waiting for data...'}</span>
        <ArrowRight size={18} className="opacity-40" />
      </footer>
    </article>
  );
}

function StatusBadge({ severity }) {
  const labels = {
    nominal: 'Nominal',
    warning: 'Warning',
    critical: 'Danger',
    offline: 'Offline'
  };

  return <span className={`machine-status pill-${severity}`}>{labels[severity]}</span>;
}
