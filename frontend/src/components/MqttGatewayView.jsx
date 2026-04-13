import React, { useState, useMemo, useEffect } from 'react';
import { Shield, Zap, Terminal, Send, Activity, Info, AlertTriangle, CheckCircle2, Cpu, Globe, ArrowRight, Trash2, Plus, X, List, Code, Database, Key, LayoutGrid, Eye, Layers, Binary } from 'lucide-react';
import { BACKEND_URL } from '../config';

const PRESETS = [
  { label: 'Nominal Heartbeat', topic: 'factory/machine-001/sensor/data', payload: { machine_id: 'machine-001', temperature: 45.2, vibration: 0.02, pressure: 101.3, status: 'online' } },
  { label: 'Critical Overheat', topic: 'factory/machine-002/sensor/data', payload: { machine_id: 'machine-002', temperature: 98.5, vibration: 0.15, pressure: 145.2, status: 'critical' } },
  { label: 'Emergency Alert', topic: 'factory/manual/alert', payload: { msg: 'Manual Override Triggered', code: 99, urgency: 'high' } }
];

function JsonHighlighter({ jsonString }) {
  try {
    const obj = JSON.parse(jsonString);
    const format = (val) => {
      if (typeof val === 'string') return <span className="syntax-string">"{val}"</span>;
      if (typeof val === 'number') return <span className="syntax-num">{val}</span>;
      if (typeof val === 'boolean') return <span className="syntax-bool">{val.toString()}</span>;
      return <span>{JSON.stringify(val)}</span>;
    };

    return (
      <div className="pl-4 border-l border-white/5 mt-1 leading-relaxed">
        <span className="syntax-bracket">{"{"}</span>
        <div className="grid grid-cols-1 gap-x-4">
          {Object.entries(obj).map(([key, val], i, arr) => (
            <div key={key} className="pl-4">
              <span className="syntax-key">"{key}"</span>
              <span className="syntax-bracket">: </span>
              {format(val)}
              {i < arr.length - 1 && <span className="syntax-bracket">,</span>}
            </div>
          ))}
        </div>
        <span className="syntax-bracket">{"}"}</span>
      </div>
    );
  } catch (e) {
    return <code className="text-white/60 block whitespace-pre-wrap">{jsonString}</code>;
  }
}

function PacketCard({ log }) {
  let parsed = {};
  try {
    parsed = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
  } catch (e) {
    parsed = { raw: log.payload };
  }

  const renderValue = (val) => {
    if (typeof val === 'boolean') return <span className="packet-value boolean">{val ? 'TRUE' : 'FALSE'}</span>;
    if (typeof val === 'number') return <span className="packet-value number">{val.toLocaleString()}</span>;
    if (typeof val === 'string') return <span className="packet-value string">{val}</span>;
    return <span className="packet-value">{JSON.stringify(val)}</span>;
  };

  return (
    <div className="packet-card group">
      <div className="packet-card-header">
        <div className="packet-topic" title={log.topic}>
          <span className="opacity-20 mr-2">#</span>
          {log.topic.split('/').pop()}
        </div>
        <div className="packet-time">{new Date(log.timestamp).toLocaleTimeString()}</div>
      </div>
      <div className="packet-body">
        {Object.entries(parsed).slice(0, 6).map(([key, val]) => (
          <div key={key} className="packet-metric">
            <span className="packet-label">{key}</span>
            {renderValue(val)}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 border-2 border-blue-500/0 group-hover:border-blue-500/10 rounded-2xl pointer-events-none transition-all" />
    </div>
  );
}

export function MqttGatewayView({ status, logs, authToken, clearLogs }) {
  const [topic, setTopic] = useState('factory/manual/test');
  const [payload, setPayload] = useState('{\n  "status": "testing",\n  "command": "reboot"\n}');
  const [inputMode, setInputMode] = useState('form'); // 'json' | 'form'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'terminal'
  
  const [formFields, setFormFields] = useState([
    { key: 'status', value: 'testing', type: 'string' },
    { key: 'command', value: 'reboot', type: 'string' }
  ]);
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);

  // Sync Form -> JSON
  useEffect(() => {
    if (inputMode === 'form') {
      const obj = {};
      formFields.forEach(f => {
        if (!f.key) return;
        let val = f.value;
        if (f.type === 'number') val = Number(f.value);
        if (f.type === 'boolean') val = f.value === 'true';
        obj[f.key] = val;
      });
      setPayload(JSON.stringify(obj, null, 2));
    }
  }, [formFields, inputMode]);

  const handlePublish = async (e) => {
    if (e) e.preventDefault();
    setIsPublishing(true);
    setPublishResult(null);

    try {
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(payload);
      } catch (e) {
        parsedPayload = payload;
      }

      const res = await fetch(`${BACKEND_URL}/api/mqtt/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ topic, payload: parsedPayload })
      });

      if (res.ok) {
        setPublishResult({ success: true, message: 'Broadcast Successful' });
      } else {
        const errorData = await res.json();
        setPublishResult({ success: false, message: 'Broadcast Failed' });
      }
    } catch (err) {
      setPublishResult({ success: false, message: 'Network Error' });
    } finally {
      setIsPublishing(false);
    }
  };

  const applyPreset = (preset) => {
    setTopic(preset.topic);
    setPayload(JSON.stringify(preset.payload, null, 2));
    const fields = Object.entries(preset.payload).map(([k, v]) => ({
      key: k,
      value: String(v),
      type: typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'string'
    }));
    setFormFields(fields);
  };

  const addFormField = () => setFormFields([...formFields, { key: '', value: '', type: 'string' }]);
  const removeFormField = (index) => setFormFields(formFields.filter((_, i) => i !== index));
  const updateFormField = (index, field, val) => {
    const next = [...formFields];
    next[index][field] = val;
    setFormFields(next);
  };

  const isConnected = status.status === 'connected';

  return (
    <div className="flex flex-col gap-10 animate-reveal">
      {/* 1. Tactical Status Matrix */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`relative p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 ${isConnected ? 'border-green-500/20 shadow-[0_0_30px_-5px_rgba(34,197,94,0.1)]' : 'border-red-500/20'}`}>
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-blue-400">
             <Globe size={20} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Node Integrity</p>
            <p className="text-base font-black text-white tracking-widest">{isConnected ? 'STABLE_NODE' : 'DISCONNECTED'}</p>
          </div>
          <div className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`} />
        </div>

        <div className="relative p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-blue-500/20 border-white/5 flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 shadow-[0_0_30px_-5px_rgba(59,130,246,0.1)]">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
             <Terminal size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Broker Link</p>
            <p className="text-base font-black text-white truncate tracking-wider">{status.details?.url || 'localhost:1883'}</p>
          </div>
        </div>

        <div className="relative p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-white/5 flex items-center gap-5 transition-all duration-300 hover:-translate-y-1">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
             <Database size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Active Matrix</p>
            <p className="text-base font-black text-white truncate tracking-wider">{status.details?.topic || 'factory/#'}</p>
          </div>
        </div>

        <div className="relative p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-white/5 flex items-center gap-5 transition-all duration-300 hover:-translate-y-1">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
             <Activity size={20} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Live Throughput</p>
            <p className="text-base font-black text-white tracking-widest uppercase">{logs.length} <span className="text-[11px] opacity-40">pkts</span></p>
          </div>
        </div>
      </section>

      {/* 2. Packet Injector Station */}
      <section className="relative p-8 rounded-[32px] bg-[#111111]/80 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden group">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-5">
             <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              <Zap size={22} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-[0.25em] uppercase text-white/90">Packet Injector Station</h3>
              <p className="text-[11px] font-bold opacity-30 uppercase tracking-[0.3em] mt-1">Manual Neural Overdrive</p>
            </div>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 shadow-inner scale-95 md:scale-100 origin-right">
             <button 
              onClick={() => setInputMode('form')} 
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 ${inputMode === 'form' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/40 hover:text-white/70'}`}
             >
              <List size={14} />
              <span>Form View</span>
            </button>
            <button 
              onClick={() => setInputMode('json')} 
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 ${inputMode === 'json' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/40 hover:text-white/70'}`}
            >
              <Code size={14} />
              <span>JSON View</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           <div className="lg:col-span-8">
              <form onSubmit={handlePublish} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5 px-1">
                        <Globe size={13} className="text-blue-400/40" />
                        <label className="text-[11px] uppercase tracking-[0.25em] text-white/30 font-black">Target Route</label>
                      </div>
                      <input 
                        type="text" 
                        value={topic} 
                        onChange={(e) => setTopic(e.target.value)} 
                        className="w-full bg-[#0f172a]/80 border border-white/10 rounded-xl px-5 py-4 font-mono text-xs text-white outline-none focus:border-blue-500/40 transition-all placeholder:text-white/10" 
                        placeholder="factory/sensor/mesh/..."
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5 px-1">
                        <Layers size={13} className="text-blue-400/40" />
                        <label className="text-[11px] uppercase tracking-[0.25em] text-white/30 font-black">Execution Presets</label>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {PRESETS.map(p => (
                          <button 
                            key={p.label} 
                            type="button" 
                            onClick={() => applyPreset(p)} 
                            className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/5 text-[11px] font-black uppercase tracking-widest text-[#85adff] hover:bg-blue-500/10 hover:border-blue-500/30 transition-all"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2.5">
                        <Binary size={13} className="text-blue-400/40" />
                        <label className="text-[11px] uppercase tracking-[0.25em] text-white/30 font-black">Message Matrix</label>
                      </div>
                      {inputMode === 'form' && (
                        <span className="text-[11px] font-black opacity-20 uppercase tracking-[0.15em]">{formFields.length} Attributes Active</span>
                      )}
                   </div>

                   {inputMode === 'json' ? (
                      <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#040608]/90">
                        <textarea rows={8} value={payload} onChange={(e) => setPayload(e.target.value)} className="w-full font-mono text-xs resize-none bg-transparent border-none p-6 text-white outline-none scrollbar-thin" />
                      </div>
                   ) : (
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 scrollbar-thin">
                        {formFields.map((field, i) => (
                           <div key={i} className="flex flex-col md:flex-row gap-4 p-5 bg-[#0f172a]/40 border border-white/5 rounded-2xl transition-all hover:bg-[#0f172a]/60 animate-reveal">
                              <div className="flex-1 space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Key Ident</label>
                                <input placeholder="status_id" value={field.key} onChange={(e) => updateFormField(i, 'key', e.target.value)} className="w-full bg-transparent border-none text-white font-mono text-sm outline-none" />
                              </div>
                              <div className="flex-1 space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Assigned Value</label>
                                <input placeholder="nominal" value={field.value} onChange={(e) => updateFormField(i, 'value', e.target.value)} className="w-full bg-transparent border-none text-white font-mono text-sm outline-none" />
                              </div>
                              <div className="w-full md:w-40 space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Type Def</label>
                                <select value={field.type} onChange={(e) => updateFormField(i, 'type', e.target.value)} className="w-full bg-transparent border-none text-white font-black text-xs outline-none cursor-pointer">
                                  <option value="string" className="bg-[#0f172a]">STRING_01</option>
                                  <option value="number" className="bg-[#0f172a]">NUMBER_VAR</option>
                                  <option value="boolean" className="bg-[#0f172a]">BOOLEAN_BOOL</option>
                                </select>
                              </div>
                              <button type="button" onClick={() => removeFormField(i)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all self-end"><X size={16} /></button>
                           </div>
                        ))}
                        <button type="button" onClick={addFormField} className="w-full py-5 rounded-xl border border-dashed border-white/10 bg-white/2 hover:bg-white/5 text-xs font-black uppercase tracking-[0.2em] text-white/40 flex items-center justify-center gap-3 transition-all">
                          <Plus size={16} /> <span>Initialize New Attribute</span>
                        </button>
                      </div>
                   )}
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 pt-6">
                  <button 
                    disabled={isPublishing} 
                    className="w-full md:w-auto flex items-center justify-center gap-4 px-12 py-5 rounded-2xl bg-gradient-to-br from-[#0070eb] to-[#85adff] text-[#002c65] font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_35px_rgba(133,173,255,0.25)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isPublishing ? <Activity size={20} className="animate-spin" /> : <Send size={20} />}
                    <span>Broadcast Packet</span>
                  </button>
                  {publishResult && (
                    <div className={`px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-4 animate-reveal ${publishResult.success ? 'text-green-400' : 'text-red-500'}`}>
                      {publishResult.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                      {publishResult.message}
                    </div>
                  )}
                </div>
              </form>
           </div>

           <div className="lg:col-span-4 border-l border-white/5 pl-12 hidden lg:flex flex-col justify-center relative">
              <div className="absolute left-0 top-1/4 bottom-1/4 w-[1px] bg-gradient-to-b from-transparent via-blue-500/30 to-transparent" />
              <div className="flex items-center gap-4 mb-8">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20"><Shield size={20} className="text-blue-400" /></div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/90">Protocol Guard</h4>
              </div>
              <p className="text-[11px] leading-relaxed opacity-40 font-bold uppercase tracking-[0.05em] text-justify space-y-4">
                Manual override active. Packets transmitted via this console are logged with X.509 signatures and subject to heuristic SIEM analysis. 
                <br /><br />
                Unauthorized packet injection will result in immediate neural session termination and hardware lockout.
              </p>
           </div>
        </div>
      </section>

      {/* 3. Live Telemetry Feed */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
           <div className="flex items-center gap-5">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                <Activity size={22} className="text-purple-400" />
              </div>
              <div>
                <h3 className="font-black text-xs tracking-[0.25em] uppercase text-white/90">Live Telemetry Feed</h3>
                <p className="text-[9px] font-bold opacity-30 uppercase tracking-[0.3em] mt-1">Real-time Data Stream</p>
              </div>
           </div>
           <div className="flex items-center gap-5">
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 shadow-inner hidden md:flex">
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`flex items-center gap-2.5 px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${viewMode === 'grid' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-white/40 hover:text-white/70'}`}
                >
                  <LayoutGrid size={14} />
                  <span>Grid</span>
                </button>
                <button 
                  onClick={() => setViewMode('terminal')} 
                  className={`flex items-center gap-2.5 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 ${viewMode === 'terminal' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-white/40 hover:text-white/70'}`}
                >
                   <Terminal size={14} />
                  <span>Terminal</span>
                </button>
              </div>
              <button onClick={clearLogs} className="flex items-center gap-2.5 px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-white/40 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-xs font-black uppercase tracking-widest transition-all">
                <X size={14} /> <span>Flush Buffer</span>
              </button>
           </div>
        </div>

        {viewMode === 'terminal' ? (
           <div className="relative rounded-3xl h-[600px] bg-[#050608]/90 border border-white/10 shadow-2xl overflow-hidden flex flex-col">
              <div className="p-5 bg-white/5 border-b border-white/10 flex items-center">
                 <div className="flex gap-2 mr-6">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Factory Intelligence Bridge v4.2 PRO</span>
              </div>
              <div className="flex-1 p-8 font-mono text-[11px] overflow-y-auto relative scrollbar-thin">
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] pointer-events-none z-10" />
                 <div className="flex flex-col gap-5">
                    {logs.length > 0 ? logs.map(log => (
                       <div key={log.id} className="animate-reveal border-l-2 border-blue-500/20 pl-5 py-2">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="text-blue-400 font-bold opacity-60">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                            <span className="text-white/40 font-black tracking-widest uppercase text-[10px]">{log.topic}</span>
                          </div>
                          <JsonHighlighter jsonString={log.payload} />
                       </div>
                    )) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-10 gap-4 mt-20">
                        <Terminal size={48} />
                        <p className="text-xs uppercase tracking-[0.5em]">Awaiting Data Cycle...</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
              {logs.length > 0 ? (
                 logs.slice(0, 50).map(log => {
                    let parsed = {};
                    try { parsed = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload; } catch (e) { parsed = { raw: log.payload }; }
                    return (
                      <div key={log.id} className="relative group bg-[#0f172a]/40 backdrop-blur-xl border border-white/10 rounded-3xl p-7 transition-all duration-300 hover:bg-[#0f172a]/70 hover:-translate-y-2 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)]">
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400">
                            <span className="opacity-20 mr-2">#</span>
                            {log.topic.split('/').pop()}
                          </div>
                          <div className="text-xs font-bold text-white/30 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</div>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {Object.entries(parsed).slice(0, 5).map(([key, val]) => (
                            <div key={key} className="flex justify-between items-center py-3 px-5 bg-white/2 rounded-xl border border-white/5">
                              <span className="text-[10px] uppercase tracking-widest text-white/30 font-black">{key}</span>
                              <span className={`text-xs font-black font-mono ${typeof val === 'number' ? 'text-yellow-400' : typeof val === 'boolean' ? 'text-orange-400' : 'text-green-400'}`}>
                                {String(val).toUpperCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                 })
              ) : (
                 <div className="col-span-full h-[500px] flex flex-col items-center justify-center opacity-10 uppercase tracking-[0.5em] gap-8 border-2 border-dashed border-white/5 rounded-[40px]">
                    <Activity size={80} className="animate-pulse" />
                    <p className="text-sm">Initiating Uplink with Neural Mesh...</p>
                 </div>
              )}
           </div>
        )}
      </section>
    </div>
  );
}
