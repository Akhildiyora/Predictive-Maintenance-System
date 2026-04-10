import React, { useMemo, useState } from 'react';
import { useMetrics } from './hooks/useMetrics';
import { BACKEND_URL } from './config';
import { MachineCard } from './components/MachineCard';
import SensorTrendChart from './components/SensorTrendChart';
import IncidentLogPanel from './components/IncidentLogPanel';
import { LayoutDashboard, Network, Calendar, FileText, Settings, Cloud, Menu, X } from 'lucide-react';
import './App.css';

const primaryNav = [
  { label: 'Fleet Control', icon: <LayoutDashboard size={18} /> },
  { label: 'Network Map', icon: <Network size={18} /> },
  { label: 'Schedules', icon: <Calendar size={18} /> },
  { label: 'Technical Logs', icon: <FileText size={18} /> }
];

const systemNav = ['MQTT Gateway', 'ML Engine', 'Postgres SQL'];

function App() {
  const { metrics, alerts, devices, maintenance, isConnected, stream } = useMetrics();
  const [activeControl, setActiveControl] = useState(primaryNav[0].label);
  const [statusMessage, setStatusMessage] = useState('Live telemetry stream active');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const activeAlerts = alerts.length;
  const healthyScore = useMemo(() => Math.max(60, 98 - activeAlerts * 2), [activeAlerts]);
  const targetScore = 95;
  const mtbf = useMemo(() => Math.max(480, 720 - activeAlerts * 6), [activeAlerts]);
  const warningCount = Math.min(25, activeAlerts * 3 + 2);
  const infoCard = useMemo(
    () => ({
      label: 'Fleet Health',
      value: `${healthyScore}%`,
      detail: `Target ${targetScore}%`
    }),
    [healthyScore, targetScore]
  );

  const handleNavClick = (label) => {
    setActiveControl(label);
    setStatusMessage(`${label} view activated`);
    setSidebarOpen(false); // Close menu on mobile after selection
  };

  const handleRaiseAlert = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: devices[0]?.id || 'system',
          message: 'MANUAL OVERRIDE: Emergency state triggered by operator',
          severity: 'critical'
        })
      });
      setStatusMessage('Manual override alert persisted to incident log');
    } catch (err) {
      console.error('Failed to raise alert', err);
    }
  };

  const handleViewNetworkMap = () => {
    setStatusMessage('Opening network mesh overlay');
    setActiveControl('Network Map');
  };

  const handleManualOverride = async () => {
    try {
      // Toggle the first device as an example or use a selected device
      const deviceId = devices[0]?.id || 'machine-001';
      const device = devices.find(d => d.id === deviceId);
      const newStatus = device?.status === 'maintenance' ? 'online' : 'maintenance';
      
      const res = await fetch(`${BACKEND_URL}/api/devices/${deviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        setStatusMessage(`Manual override engaged · ${deviceId} set to ${newStatus}`);
      }
    } catch (err) {
      console.error('Manual override failed', err);
      setStatusMessage('Error: Manual override failed. Check backend connection.');
    }
  };

  const handleArchive = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/alerts`, { method: 'DELETE' });
      if (res.ok) {
        setStatusMessage('Success: Incident logs archived and cleared');
      }
    } catch (err) {
      console.error('Archive failed', err);
      setStatusMessage('Error: Failed to archive logs.');
    }
  };

  return (
    <div className="dashboard-scaffold">
      {/* Mobile Top Bar */}
      <header className="mobile-header">
        <div className="mobile-brand">
          <div className="nav-icon">
            <Cloud size={18} />
          </div>
          <p className="nav-title">PREDICT.AI</p>
        </div>
        <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`nav-panel ${isSidebarOpen ? 'open' : ''}`}>
        <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
          <X size={24} />
        </button>
        
        <div className="nav-brand">
          <div className="nav-icon">
            <Cloud size={20} />
          </div>
          <div>
            <p className="nav-title">PREDICT.AI</p>
            <p className="nav-subtitle">v4.2 PRO</p>
          </div>
        </div>

        <div className="nav-group">
          <p className="nav-heading">Control</p>
          {primaryNav.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${activeControl === item.label ? 'active' : ''}`}
              onClick={() => handleNavClick(item.label)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="nav-group">
          <p className="nav-heading">System</p>
          {systemNav.map((item) => (
            <button
              key={item}
              className={`nav-item nav-item-ghost ${activeControl === item ? 'active' : ''}`}
              onClick={() => handleNavClick(item)}
            >
              <span>{item}</span>
            </button>
          ))}
        </div>

        <div className="nav-user">
          <p className="nav-user-name">Akhil_Control</p>
          <p className="nav-user-role">Chief Engineer · Fleet Command</p>
          <div className="nav-user-status">
            <span className={`status-badge ${isConnected ? 'status-nominal' : 'status-critical'}`} />
            <span>{isConnected ? 'Live telemetry' : 'Offline'}</span>
          </div>
        </div>
        <button className="manual-override" onClick={handleManualOverride}>
          Manual Override
        </button>
      </aside>

      <div className="content-area">
        <header className="hero-pane">
          <div>
            <p className="eyebrow-label">Factory Live Dashboard</p>
            <h1>Guard the factory floor in real time</h1>
            <p className="subtitle">
              Active module: {activeControl}. Streaming telemetry from MQTT → WebSocket feeds along with predictive maintenance insights.
            </p>
            <p className="status-bubble">{statusMessage}</p>
          </div>
          <div className="hero-actions">
            <button className="btn-kinetic" onClick={handleRaiseAlert}>
              Raise Alert
            </button>
            <button className="ghost-btn" onClick={handleViewNetworkMap}>
              View Network Map
            </button>
          </div>
        </header>

        {activeControl === 'Fleet Control' ? (
          <>
            <section className="status-grid">
              <article className="status-card">
                <p className="status-label">{infoCard.label}</p>
                <h2 className="status-value">{infoCard.value}</h2>
                <p className="status-detail">{infoCard.detail}</p>
              </article>
              <article className="status-card">
                <p className="status-label">Active Alerts</p>
                <h2 className="status-value">{activeAlerts}</h2>
                <p className="status-detail">{warningCount} warnings · {alerts.length} critical</p>
              </article>
              <article className="status-card">
                <p className="status-label">Mean Time Between Failures</p>
                <h2 className="status-value">{mtbf}h</h2>
                <p className="status-detail">Stability window</p>
              </article>
            </section>

            <section className="insights-grid">
              <SensorTrendChart data={stream} />
              <IncidentLogPanel alerts={alerts} onArchive={handleArchive} />
            </section>

            <section className="machine-grid">
              {devices.map((device) => (
                <MachineCard key={device.id} machine={device} data={metrics[device.id]} />
              ))}
            </section>
          </>
        ) : activeControl === 'Technical Logs' ? (
          <section className="layer-1 rounded-2xl p-8 min-h-[500px]">
             <IncidentLogPanel alerts={alerts} onArchive={handleArchive} />
          </section>
        ) : activeControl === 'Schedules' ? (
          <section className="p-8 layer-1 rounded-2xl min-h-[500px]">
            <h2 className="text-xl font-bold mb-4">Maintenance Schedules</h2>
            <div className="status-grid cursor-default">
              {maintenance.length > 0 ? maintenance.map(m => (
                <article key={m.id} className="status-card h-auto border-l-4 border-indigo-500">
                  <p className="status-label">{m.device_id}</p>
                  <p className="text-sm font-semibold my-2">{m.reason}</p>
                  <p className="status-detail">{new Date(m.scheduled_for).toLocaleDateString()} · {m.status}</p>
                </article>
              )) : <p className="opacity-50">No schedules found.</p>}
            </div>
          </section>
        ) : activeControl === 'Network Map' ? (
          <section className="flex flex-col items-center justify-center min-h-[500px] layer-1 rounded-2xl relative overflow-hidden">
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)]" />
             <svg width="600" height="400" viewBox="0 0 600 400" className="relative z-10 w-full max-w-2xl h-auto">
               <circle cx="300" cy="200" r="40" className="fill-blue-500/20 stroke-blue-500 stroke-2 animate-pulse" />
               <text x="300" y="260" textAnchor="middle" className="fill-white text-[10px] tracking-tighter uppercase">Gateway Core</text>
               {devices.map((d, i) => {
                 const x = 300 + 150 * Math.cos(i * (2 * Math.PI / devices.length));
                 const y = 200 + 120 * Math.sin(i * (2 * Math.PI / devices.length));
                 return (
                  <g key={d.id}>
                    <line x1="300" y1="200" x2={x} y2={y} className="stroke-white/10 stroke-1" />
                    <circle cx={x} cy={y} r="15" className="fill-white/5 stroke-white/20 stroke-1 hover:stroke-primary cursor-pointer transition-all" />
                    <text x={x} y={y + 30} textAnchor="middle" className="fill-white/40 text-[8px] uppercase">{d.id}</text>
                  </g>
                 )
               })}
             </svg>
             <div className="mt-8 text-center relative z-10">
               <h2 className="text-xl font-bold uppercase tracking-widest">Active Sensor Mesh</h2>
               <p className="text-sm text-on-surface-variant max-w-sm mx-auto">Visualizing real-time telemetry bridge between IoT edge nodes and Predict.AI cloud gateway.</p>
             </div>
          </section>
        ) : (
          <section className="flex flex-col items-center justify-center min-h-[400px] layer-1 rounded-2xl opacity-50">
             <Settings size={64} className="mb-4 text-primary"/>
             <h2 className="text-xl font-bold uppercase tracking-widest">{activeControl} View</h2>
             <p className="text-sm text-on-surface-variant">This system module is under development.</p>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
