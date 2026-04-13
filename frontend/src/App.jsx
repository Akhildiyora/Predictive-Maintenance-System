import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMetrics } from './hooks/useMetrics';
import { BACKEND_URL } from './config';
import { MachineCard } from './components/MachineCard';
import SensorTrendChart from './components/SensorTrendChart';
import IncidentLogPanel from './components/IncidentLogPanel';
import { MqttGatewayView } from './components/MqttGatewayView';
import { MlEngineView } from './components/MlEngineView';
import { PostgresSqlView } from './components/PostgresSqlView';
import { SchedulesView } from './components/SchedulesView';
import Login from './pages/Login';
import {
  LayoutDashboard, Network, Calendar, FileText, Settings,
  Cloud, Menu, X, LogOut, Activity, AlertTriangle, ChevronDown
} from 'lucide-react';
import './App.css';

const primaryNav = [
  { label: 'Fleet Control',   icon: <LayoutDashboard size={18} /> },
  { label: 'Device Map',      icon: <Network size={18} /> },
  { label: 'Schedules',       icon: <Calendar size={18} /> },
  { label: 'Event History',   icon: <FileText size={18} /> },
];

const systemNav = [
  { id: 'MQTT Gateway', label: 'Live Data Stream' },
  { id: 'ML Engine',    label: 'AI Diagnostics'   },
  { id: 'Postgres SQL', label: 'Database'          },
];

// ─── Raise Alert Modal ───────────────────────────────────────────────────────
function RaiseAlertModal({ devices, authToken, onClose, onSuccess }) {
  const [form, setForm]         = useState({ deviceId: devices[0]?.id || '', message: '', severity: 'warning' });
  const [submitting, setSubmit] = useState(false);
  const [error, setError]       = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) { setError('Please describe the issue.'); return; }
    setSubmit(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ device_id: form.deviceId || 'system', message: form.message, severity: form.severity }),
      });
      if (res.ok) { onSuccess?.(); onClose(); }
      else { const d = await res.json(); setError(d.error || 'Failed to submit. Try again.'); }
    } catch { setError('Could not connect. Check your network.'); }
    finally { setSubmit(false); }
  };

  const severityOptions = [
    { value: 'info',     label: 'General Info',  color: 'text-blue-400' },
    { value: 'warning',  label: 'Warning',        color: 'text-yellow-400' },
    { value: 'critical', label: 'Critical Issue', color: 'text-red-400' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div className="relative w-full max-w-md mx-4 rounded-3xl shadow-2xl overflow-hidden"
        style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-7">
          <div className="flex items-center gap-4 mb-7">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <AlertTriangle size={18} className="text-orange-400" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-widest text-white">Report an Issue</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                Create an alert for the operations team
              </p>
            </div>
            <button onClick={onClose} className="ml-auto p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/5 transition-all">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-5">
            {/* Device */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-orange-400/70">Affected Device</label>
              <select value={form.deviceId} onChange={e => setForm(f => ({ ...f, deviceId: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-xs font-bold text-white outline-none cursor-pointer"
                style={{ background: '#0f192e', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
              >
                <option value="system" style={{ background: '#0d1117' }}>General / System-wide</option>
                {devices.map(d => <option key={d.id} value={d.id} style={{ background: '#0d1117' }}>{d.name || d.id}</option>)}
              </select>
            </div>

            {/* Severity */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-orange-400/70">Issue Severity</label>
              <div className="flex gap-2">
                {severityOptions.map(s => (
                  <button key={s.value} type="button"
                    onClick={() => setForm(f => ({ ...f, severity: s.value }))}
                    className={`flex-1 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wide transition-all ${
                      form.severity === s.value
                        ? s.value === 'critical' ? 'bg-red-500/20 border-red-500/40 text-red-400'
                          : s.value === 'warning' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                          : 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                        : 'border-white/5 text-slate-500 hover:text-white hover:border-white/10'
                    }`}
                    style={{ background: form.severity === s.value ? undefined : '#0f192e' }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-orange-400/70">Describe the Issue</label>
              <textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Describe what you've observed or what needs attention..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-xs font-bold text-white outline-none resize-none"
                style={{ background: '#0f192e', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black">
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-black text-xs uppercase tracking-widest shadow-lg active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Activity size={15} className="animate-spin" /> : <AlertTriangle size={15} />}
              {submitting ? 'Submitting...' : 'Submit Alert'}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem('predict_auth_token'));
  const [user, setUser]           = useState(JSON.parse(localStorage.getItem('predict_user') || 'null'));
  const { metrics, alerts, devices, maintenance, isConnected, stream, mqttStatus, mqttRawLogs, clearMqttLogs } = useMetrics();
  const [activeControl, setActiveControl]   = useState(primaryNav[0].label);
  const [statusMessage, setStatusMessage]   = useState('All systems monitoring active');
  const [isSidebarOpen, setSidebarOpen]     = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);

  const handleLogin = (token, userRecord) => {
    setAuthToken(token);
    setUser(userRecord);
    localStorage.setItem('predict_auth_token', token);
    localStorage.setItem('predict_user', JSON.stringify(userRecord));
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem('predict_auth_token');
    localStorage.removeItem('predict_user');
  };

  const activeAlerts = alerts.length;
  const healthyScore = useMemo(() => Math.max(60, 98 - activeAlerts * 2), [activeAlerts]);
  const targetScore  = 95;
  const mtbf         = useMemo(() => Math.max(480, 720 - activeAlerts * 6), [activeAlerts]);
  const warningCount = Math.min(25, activeAlerts * 3 + 2);

  const handleNavClick = (label) => {
    setActiveControl(label);
    setStatusMessage(`${label} view is active`);
    setSidebarOpen(false);
  };

  const handleArchive = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/alerts`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (res.ok) setStatusMessage('All events have been cleared');
    } catch { setStatusMessage('Could not clear events. Try again.'); }
  };

  const handleManualOverride = async () => {
    try {
      const deviceId = devices[0]?.id || 'machine-001';
      const device   = devices.find(d => d.id === deviceId);
      const newStatus = device?.status === 'maintenance' ? 'online' : 'maintenance';
      const res = await fetch(`${BACKEND_URL}/api/devices/${deviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) setStatusMessage(`${deviceId} status changed to ${newStatus}`);
    } catch { setStatusMessage('Status change failed. Check your connection.'); }
  };

  const pageTitle = {
    'Fleet Control': 'Machine Overview',
    'Device Map':    'Device Network Map',
    'Schedules':     'Maintenance Schedule',
    'Event History': 'Event History',
    'MQTT Gateway':  'Live Data Stream',
    'ML Engine':     'AI Diagnostics',
    'Postgres SQL':  'Database',
  };

  const pageDesc = {
    'Fleet Control': 'Monitor all machines, sensor readings, and live performance data in real time.',
    'Device Map':    'Visualize all connected devices and their network connections.',
    'Schedules':     'Manage and track scheduled maintenance jobs across all devices.',
    'Event History': 'Browse all recorded alerts, warnings, and system events.',
    'MQTT Gateway':  'View the live stream of raw sensor data coming in from all devices.',
    'ML Engine':     'Run AI-powered failure predictions on machine telemetry data.',
    'Postgres SQL':  'Query and explore your operational database directly.',
  };

  if (!authToken) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#050608] text-slate-50 relative overflow-hidden font-sans">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Raise Alert Modal */}
      {showAlertModal && (
        <RaiseAlertModal
          devices={devices}
          authToken={authToken}
          onClose={() => setShowAlertModal(false)}
          onSuccess={() => setStatusMessage('Alert submitted to the operations team')}
        />
      )}

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-5 bg-[#0a0b0d]/90 backdrop-blur-xl border-b border-white/5 sticky top-0 z-[100]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-600/40 flex items-center justify-center">
            <Cloud size={20} className="text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-black tracking-[0.25em] uppercase text-white">PREDICT.AI</p>
            <p className="text-[9px] font-bold text-blue-400/50 uppercase tracking-widest mt-0.5">Industrial</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all" onClick={handleLogout}>
            <LogOut size={18} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <div className={`fixed inset-0 bg-black/80 backdrop-blur-md z-[120] transition-opacity duration-500 md:hidden ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 bottom-0 w-72 md:w-80 bg-[#0a0b0d]/98 md:bg-[#0a0b0d]/60 backdrop-blur-2xl border-r border-white/5 p-8 flex flex-col gap-10 z-[150] transition-transform duration-500 ease-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} h-screen`}>
        <button className="md:hidden absolute top-8 right-8 text-slate-500 hover:text-white transition-all" onClick={() => setSidebarOpen(false)}>
          <X size={24} />
        </button>

        <div className="flex items-center gap-5 px-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-600/30 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.15)]">
            <Cloud size={28} className="text-blue-400" />
          </div>
          <div>
            <p className="font-black text-base tracking-[0.3em] uppercase text-white">PREDICT.AI</p>
            <p className="text-[11px] font-bold text-blue-500/40 uppercase tracking-[0.4em] mt-1">Industrial</p>
          </div>
        </div>

        <nav className="flex flex-col gap-8 flex-1 overflow-y-auto">
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/20 px-3">Management</p>
            <div className="flex flex-col gap-2">
              {primaryNav.map(item => (
                <button key={item.label}
                  className={`group flex items-center gap-4 px-5 py-3.5 rounded-2xl border transition-all duration-300 ${activeControl === item.label ? 'bg-blue-600/15 border-blue-600/40 text-blue-400 shadow-[0_0_25px_-5px_rgba(59,130,246,0.2)]' : 'bg-white/2 border-white/5 text-slate-400 hover:bg-white/5 hover:border-white/10 hover:text-slate-200'}`}
                  onClick={() => handleNavClick(item.label)}
                >
                  <span className={`transition-transform group-hover:scale-110 ${activeControl === item.label ? 'text-blue-400' : 'text-slate-500 opacity-60'}`}>{item.icon}</span>
                  <span className="text-[13px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/20 px-3">Advanced Tools</p>
            <div className="flex flex-col gap-2">
              {systemNav.map(item => (
                <button key={item.id}
                  className={`group flex items-center gap-4 px-5 py-3.5 rounded-2xl border transition-all duration-300 ${activeControl === item.id ? 'bg-purple-600/15 border-purple-600/40 text-purple-400' : 'bg-transparent border-transparent text-slate-500 hover:bg-white/5 hover:border-white/5 hover:text-slate-300'}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <div className={`w-2 h-2 rounded-full transition-all ${activeControl === item.id ? 'bg-purple-400 scale-125 shadow-[0_0_8px_#a855f7]' : 'bg-slate-700 opacity-40'}`} />
                  <span className="text-xs font-black uppercase tracking-[0.25em]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="space-y-4 pb-2">
          <div className="p-5 rounded-2xl bg-white/2 border border-white/5 backdrop-blur-xl relative overflow-hidden group hover:border-white/10 transition-all">
            <p className="text-sm font-black text-white mb-0.5">{user?.full_name || 'Operator'}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">{user?.role || 'Field Engineer'}</p>
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`} />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <button className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest hover:bg-red-500 transition-all hover:text-white active:scale-95"
              onClick={handleLogout}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
          <button className="w-full py-4 rounded-2xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 text-slate-300 text-xs font-black uppercase tracking-[0.4em] hover:brightness-125 transition-all shadow-xl active:scale-[0.98]"
            onClick={handleManualOverride}>
            Emergency Override
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-80 p-6 md:p-8 lg:p-10 flex flex-col gap-8 overflow-y-auto relative z-10 transition-all">
        {/* Page Header */}
        <header className="flex flex-col xl:flex-row xl:items-start justify-between gap-8 border-b border-white/5 pb-8">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
              <p className="text-xs font-black uppercase tracking-[0.4em] text-green-500">Live System</p>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
              {pageTitle[activeControl] || activeControl}
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl font-medium leading-relaxed">
              {pageDesc[activeControl] || 'System module loading...'}
            </p>
            <div className="inline-flex mt-2 px-5 py-2.5 rounded-xl bg-blue-600/10 border border-blue-600/20 text-[11px] font-black uppercase tracking-widest text-blue-400">
              {statusMessage}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-[0_10px_30px_-5px_rgba(249,115,22,0.4)] hover:brightness-110 active:scale-95 transition-all"
              onClick={() => setShowAlertModal(true)}
            >
              <AlertTriangle size={16} /> Report Issue
            </button>
            <button
              className="flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-white/10 transition-all"
              onClick={() => handleNavClick('Device Map')}
            >
              <Network size={16} /> Device Map
            </button>
          </div>
        </header>

        {/* Page Content */}
        <section className="flex-1 scrollbar-thin">
          {activeControl === 'Fleet Control' ? (
            <div className="flex flex-col gap-10 pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { label: 'Fleet Health',   value: `${healthyScore}%`,    detail: `Target ${targetScore}%`, color: 'text-blue-400' },
                  { label: 'Active Alerts',  value: activeAlerts,           detail: `${warningCount} Warnings`, color: 'text-orange-400' },
                  { label: 'Avg. Uptime',    value: `${mtbf}H`,             detail: 'Operating Normally',     color: 'text-green-400' },
                ].map((stat, i) => (
                  <article key={i} className="relative p-10 rounded-3xl bg-[#111111]/60 backdrop-blur-xl border border-white/5 shadow-2xl transition-all hover:bg-[#111111]/80 hover:-translate-y-1 group overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform duration-700">
                      <Activity size={64} className="text-white" />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 mb-6 px-1 border-l-2 border-blue-500/40 pl-4">{stat.label}</p>
                    <h2 className={`text-4xl font-black tracking-tighter mb-3 ${stat.color}`}>{stat.value}</h2>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">{stat.detail}</p>
                  </article>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                  <SensorTrendChart data={stream} />
                </div>
                <div className="lg:col-span-4 max-h-[700px] overflow-hidden">
                  <IncidentLogPanel alerts={alerts} onArchive={handleArchive} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-8">
                {devices.map(device => (
                  <MachineCard key={device.id} machine={device} data={metrics[device.id]} />
                ))}
              </div>
            </div>
          ) : activeControl === 'Event History' ? (
            <div className="pb-10">
              <div className="p-8 rounded-3xl bg-[#111111]/80 backdrop-blur-2xl border border-white/10 shadow-xl">
                <IncidentLogPanel alerts={alerts} onArchive={handleArchive} />
              </div>
            </div>
          ) : activeControl === 'Schedules' ? (
            <div className="pb-10">
              <SchedulesView
                maintenance={maintenance}
                devices={devices}
                authToken={authToken}
                onScheduleCreated={() => setStatusMessage('Maintenance job has been scheduled')}
              />
            </div>
          ) : activeControl === 'Device Map' ? (
            <div className="flex flex-col items-center justify-center min-h-[600px] bg-[#111111]/40 rounded-3xl border border-white/5 relative overflow-hidden p-10">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#3b82f6_0%,_transparent_70%)] animate-pulse" />
              <svg width="600" height="400" viewBox="0 0 600 400" className="relative z-10 w-full max-w-4xl h-auto">
                <circle cx="300" cy="200" r="50" className="fill-blue-500/10 stroke-blue-500 stroke-[3] animate-pulse" />
                <text x="300" y="270" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="900" letterSpacing="0.4em">Central Hub</text>
                {devices.map((d, i) => {
                  const x = 300 + 180 * Math.cos(i * (2 * Math.PI / devices.length));
                  const y = 200 + 140 * Math.sin(i * (2 * Math.PI / devices.length));
                  return (
                    <g key={d.id}>
                      <line x1="300" y1="200" x2={x} y2={y} stroke="rgba(59,130,246,0.2)" strokeWidth="2" />
                      <circle cx={x} cy={y} r="20" fill="#050608" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                      <text x={x} y={y + 40} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="900">{d.id}</text>
                    </g>
                  );
                })}
              </svg>
              <div className="mt-10 text-center relative z-10 space-y-3">
                <h2 className="text-xl font-black uppercase tracking-[0.4em] text-white">Connected Devices</h2>
                <p className="text-sm text-slate-500 max-w-lg mx-auto font-medium leading-relaxed">
                  Showing all {devices.length} devices connected and streaming data to the platform.
                </p>
              </div>
            </div>
          ) : activeControl === 'MQTT Gateway' ? (
            <MqttGatewayView status={mqttStatus} logs={mqttRawLogs} authToken={authToken} clearLogs={clearMqttLogs} />
          ) : activeControl === 'ML Engine' ? (
            <MlEngineView stream={stream} authToken={authToken} />
          ) : activeControl === 'Postgres SQL' ? (
            <PostgresSqlView authToken={authToken} />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[500px] bg-[#111111]/40 rounded-3xl border border-white/5 opacity-50 gap-8">
              <div className="p-7 rounded-3xl bg-blue-600/10 border border-blue-600/20">
                <Settings size={60} className="text-blue-500" />
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-black uppercase tracking-[0.4em] text-white">{activeControl}</h2>
                <p className="text-sm font-bold text-slate-500">This section is coming soon.</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
