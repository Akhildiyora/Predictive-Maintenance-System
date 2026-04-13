import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar, Plus, Clock, Wrench, CheckCircle2, AlertCircle,
  XCircle, Cpu, Zap, X, Activity, ChevronRight
} from 'lucide-react';
import { BACKEND_URL } from '../config';

const STATUS_CONFIG = {
  pending:    { label: 'Scheduled',   color: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10', dot: 'bg-yellow-400' },
  in_progress:{ label: 'In Progress', color: 'text-blue-400   border-blue-500/20   bg-blue-500/10',   dot: 'bg-blue-400'   },
  completed:  { label: 'Completed',   color: 'text-green-400  border-green-500/20  bg-green-500/10',  dot: 'bg-green-400'  },
  cancelled:  { label: 'Cancelled',   color: 'text-slate-400  border-slate-500/20  bg-slate-500/10',  dot: 'bg-slate-400'  },
};

const REASON_PRESETS = [
  { label: 'Routine Inspection',    value: 'Routine Inspection',                     icon: <Wrench size={14} />      },
  { label: 'Sensor Calibration',    value: 'Sensor Calibration',                     icon: <Activity size={14} />    },
  { label: 'Part Replacement',      value: 'Bearing / Component Replacement',        icon: <Cpu size={14} />         },
  { label: 'Vibration Alert Fix',   value: 'Vibration Threshold Alert – Corrective', icon: <Zap size={14} />         },
  { label: 'Software Update',       value: 'Firmware / Software Update',             icon: <CheckCircle2 size={14} />},
  { label: 'Emergency Shutdown',    value: 'Emergency Shutdown Procedure',           icon: <AlertCircle size={14} /> },
];

export function SchedulesView({ maintenance, devices, authToken, onScheduleCreated }) {
  const [showForm,    setShowForm]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [form, setForm] = useState({ deviceId: '', scheduledFor: '', reason: '', customReason: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!form.deviceId || !form.scheduledFor || (!form.reason && !form.customReason)) {
      setFormError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ deviceId: form.deviceId, scheduledFor: form.scheduledFor, reason: form.customReason || form.reason }),
      });
      if (res.ok) {
        setFormSuccess(true);
        setForm({ deviceId: '', scheduledFor: '', reason: '', customReason: '' });
        setTimeout(() => { setFormSuccess(false); setShowForm(false); onScheduleCreated?.(); }, 1800);
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to create schedule. Please try again.');
      }
    } catch {
      setFormError('Could not connect to the server. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const sorted   = [...maintenance].sort((a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for));
  const upcoming = sorted.filter(m => ['pending', 'in_progress'].includes(m.status));
  const past     = sorted.filter(m => ['completed', 'cancelled'].includes(m.status));

  // Modal rendered via portal to escape any stacking context
  const modal = showForm && createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={() => setShowForm(false)}
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-3xl shadow-2xl overflow-y-auto"
        style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-7">
          {/* Header */}
          <div className="flex items-center gap-4 mb-7">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Calendar size={18} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-widest text-white">Schedule Maintenance</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Book a maintenance window for a device</p>
            </div>
            <button onClick={() => setShowForm(false)}
              className="ml-auto p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/5 transition-all">
              <X size={18} />
            </button>
          </div>

          {formSuccess ? (
            <div className="flex flex-col items-center justify-center gap-5 py-12">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-green-400" />
              </div>
              <div className="text-center">
                <p className="font-black text-base text-white uppercase tracking-widest">Schedule Confirmed!</p>
                <p className="text-xs text-slate-500 font-bold mt-2">Your maintenance job has been added.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Device */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-blue-400/70">Device to Maintain</label>
                <select
                  value={form.deviceId}
                  onChange={e => setForm(f => ({ ...f, deviceId: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-xs font-bold text-white outline-none transition-all cursor-pointer [&>option]:text-white"
                  style={{ background: '#0f192e', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
                  required
                >
                  <option value="" disabled style={{ color: '#64748b', background: '#0d1117' }}>Select a device...</option>
                  {devices.map(d => (
                    <option key={d.id} value={d.id} style={{ background: '#0d1117', color: '#fff' }}>
                      {d.name || d.id} {d.location ? `— ${d.location}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date / Time */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-blue-400/70">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.scheduledFor}
                  onChange={e => setForm(f => ({ ...f, scheduledFor: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-3 rounded-xl text-xs font-bold text-white outline-none transition-all cursor-pointer"
                  style={{ background: '#0f192e', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
                  required
                />
              </div>

              {/* Reason Presets */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-blue-400/70">Reason for Maintenance</label>
                <div className="grid grid-cols-2 gap-2">
                  {REASON_PRESETS.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, reason: p.value, customReason: '' }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wide text-left transition-all ${
                        form.reason === p.value && !form.customReason
                          ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                          : 'border-white/8 text-slate-400 hover:text-white hover:border-white/15'
                      }`}
                      style={{ background: form.reason === p.value && !form.customReason ? undefined : '#0f192e' }}
                    >
                      <span className={form.reason === p.value && !form.customReason ? 'text-blue-400' : 'text-slate-600'}>{p.icon}</span>
                      <span className="truncate">{p.label}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or describe a custom reason..."
                  value={form.customReason}
                  onChange={e => setForm(f => ({ ...f, customReason: e.target.value, reason: '' }))}
                  className="w-full px-4 py-3 rounded-xl text-xs font-bold text-white outline-none transition-all"
                  style={{ background: '#0f192e', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-wide">
                  <AlertCircle size={14} /> {formError}
                </div>
              )}

              <button
                type="submit" disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white font-black text-xs uppercase tracking-widest shadow-lg active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {submitting ? <Activity size={16} className="animate-spin" /> : <Calendar size={16} />}
                {submitting ? 'Saving...' : 'Confirm Schedule'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <div className="flex flex-col gap-8">
      {modal}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <Calendar size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-[0.2em] text-white">Maintenance Schedule</h2>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              {upcoming.length} Active &middot; {past.length} Completed
            </p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormError(null); setFormSuccess(false); }}
          className="flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/20 hover:brightness-110 active:scale-95 transition-all self-start md:self-auto"
        >
          <Plus size={15} /> Schedule Maintenance
        </button>
      </div>

      {/* Empty State */}
      {maintenance.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-white/5 gap-7">
          <div className="p-5 rounded-3xl bg-blue-500/5 border border-blue-500/10">
            <Calendar size={40} className="text-blue-400/40" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-black uppercase tracking-[0.3em] text-white/40">No Maintenance Jobs Yet</p>
            <p className="text-sm font-bold text-slate-600 max-w-sm">Click "Schedule Maintenance" above to create your first maintenance job.</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2.5 px-6 py-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 text-blue-400 font-black uppercase tracking-widest text-xs hover:bg-blue-500/10 transition-all">
            <Plus size={14} /> Create First Job
          </button>
        </div>
      )}

      {/* Upcoming / Active */}
      {upcoming.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-1">
            <Clock size={15} className="text-blue-400" />
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/60">Upcoming & Active</h3>
            <span className="ml-auto text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">{upcoming.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcoming.map(m => <ScheduleCard key={m.id} m={m} authToken={authToken} onRefresh={onScheduleCreated} />)}
          </div>
        </div>
      )}

      {/* History */}
      {past.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-1">
            <CheckCircle2 size={15} className="text-slate-500" />
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">History</h3>
            <span className="ml-auto text-[10px] font-black text-slate-600 bg-white/3 border border-white/5 px-3 py-1 rounded-full">{past.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-60">
            {past.map(m => <ScheduleCard key={m.id} m={m} authToken={authToken} onRefresh={onScheduleCreated} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleCard({ m, authToken, onRefresh }) {
  const status    = STATUS_CONFIG[m.status] || STATUS_CONFIG.pending;
  const date      = new Date(m.scheduled_for);
  const isOverdue = date < new Date() && m.status === 'pending';
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await fetch(`${BACKEND_URL}/api/maintenance/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ status: newStatus }),
      });
      onRefresh?.();
    } catch { /* silent */ }
    finally { setUpdating(false); }
  };

  const actions = [];
  if (m.status === 'pending') {
    actions.push({ label: 'Start',    icon: <Activity size={13} />,    status: 'in_progress', color: 'text-blue-400 border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20' });
    actions.push({ label: 'Cancel',   icon: <XCircle  size={13} />,    status: 'cancelled',   color: 'text-slate-500 border-white/5 bg-white/2 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20' });
  } else if (m.status === 'in_progress') {
    actions.push({ label: 'Complete', icon: <CheckCircle2 size={13} />, status: 'completed',  color: 'text-green-400 border-green-500/20 bg-green-500/10 hover:bg-green-500/20' });
    actions.push({ label: 'Cancel',   icon: <XCircle size={13} />,      status: 'cancelled',  color: 'text-slate-500 border-white/5 bg-white/2 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20' });
  }

  const borderColor = isOverdue ? 'border-red-500/30' : m.status === 'in_progress' ? 'border-blue-500/20' : m.status === 'completed' ? 'border-green-500/10' : 'border-white/5';

  return (
    <article className={`flex flex-col p-5 rounded-2xl bg-[#111111]/60 backdrop-blur-xl border transition-all hover:-translate-y-0.5 hover:shadow-xl relative overflow-hidden ${borderColor}`}>
      <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full blur-[50px] opacity-20 pointer-events-none ${m.status === 'in_progress' ? 'bg-blue-500' : m.status === 'completed' ? 'bg-green-500' : isOverdue ? 'bg-red-500' : 'bg-transparent'}`} />

      {isOverdue && <div className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg animate-pulse">Overdue</div>}

      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-0.5">Device</p>
          <p className="text-sm font-black text-white uppercase tracking-wide">{m.device_id}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${status.color}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${status.dot} ${m.status === 'in_progress' ? 'animate-pulse' : ''}`} />
          {status.label}
        </div>
      </div>

      <p className="text-sm font-bold text-white/70 leading-relaxed mb-4 flex-1 line-clamp-2">{m.reason}</p>

      <div className="flex items-center gap-2.5 py-3 border-t border-white/5 mb-4">
        <Clock size={12} className="text-slate-600 shrink-0" />
        <div>
          <p className="text-xs font-black text-slate-300">{date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
          <p className="text-[10px] font-bold text-slate-600">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {actions.length > 0 && (
        <div className="flex gap-2">
          {actions.map(a => (
            <button key={a.status} onClick={() => updateStatus(a.status)} disabled={updating}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-black uppercase tracking-wide transition-all active:scale-95 disabled:opacity-40 ${a.color}`}>
              {updating ? <Activity size={12} className="animate-spin" /> : a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}

      {(m.status === 'completed' || m.status === 'cancelled') && (
        <div className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest ${m.status === 'completed' ? 'text-green-400/50 border-green-500/10 bg-green-500/5' : 'text-slate-600 border-white/5 bg-white/2'}`}>
          {m.status === 'completed' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {m.status === 'completed' ? 'Job Completed' : 'Cancelled'}
        </div>
      )}
    </article>
  );
}
