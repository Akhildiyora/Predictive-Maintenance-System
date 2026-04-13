import React, { useState, useEffect, useMemo } from 'react';
import { Brain, Cpu, Activity, Zap, Shield, Search, Terminal, BarChart3, Binary, Layers, Play, Info, Thermometer, Waves, Gauge } from 'lucide-react';
import { predictFailure } from '../utils/api';

const MODELS = [
  { 
    id: 'lstm-v1', 
    name: 'LSTM Neural RUL', 
    task: 'RUL Prediction', 
    accuracy: '94.2%', 
    latency: '12ms', 
    status: 'active', 
    color: 'pod-info',
    desc: 'Deep recurrent network specializing in time-series degradation analysis for rotating machinery.'
  },
  { 
    id: 'xgb-v4', 
    name: 'XGBoost Monitor', 
    task: 'Anomaly Detection', 
    accuracy: '98.5%', 
    latency: '5ms', 
    status: 'standby', 
    color: 'pod-alt',
    desc: 'Gradient boosted trees optimized for ultra-low latency anomaly identification in static pressure loops.'
  },
  { 
    id: 'rf-v2', 
    name: 'RF Classifier', 
    task: 'Fault Classification', 
    accuracy: '91.8%', 
    latency: '8ms', 
    status: 'ready', 
    color: 'pod-warn',
    desc: 'Ensemble method for classifying root-cause failure types (Bearing vs Electrical vs Mechanical).'
  }
];

export function MlEngineView({ stream, authToken }) {
  const [activeModel, setActiveModel] = useState(MODELS[0]);
  const [inferenceData, setInferenceData] = useState({
    temperature: 65,
    vibration: 8,
    pressure: 110,
    runtime_hours: 750,
    load_factor: 0.7
  });
  const [prediction, setPrediction] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [inferenceLogs, setInferenceLogs] = useState([]);

  // Auto-run inference on live stream (last element)
  const latestMetric = useMemo(() => stream[stream.length - 1], [stream]);
  
  useEffect(() => {
    if (latestMetric) {
      const runAutoInference = async () => {
        try {
          const metrics = latestMetric.metrics || latestMetric;
          const res = await predictFailure(metrics);
          setInferenceLogs(prev => [
            { id: Date.now(), timestamp: new Date(), machine_id: latestMetric.device_id || 'AUTO', ...res },
            ...prev.slice(0, 49)
          ]);
        } catch (e) {
          // Fallback to local heuristic if backend fails
        }
      };
      runAutoInference();
    }
  }, [latestMetric]);

  const handleManualInference = async (e) => {
    e.preventDefault();
    setIsPredicting(true);
    try {
      const res = await predictFailure(inferenceData);
      setPrediction(res);
      setInferenceLogs(prev => [
        { id: Date.now(), timestamp: new Date(), machine_id: 'MANUAL_DIAG', ...res },
        ...prev
      ]);
    } catch (err) {
      console.error('Manual inference failed');
    } finally {
      setIsPredicting(false);
    }
  };

  const updateInferenceInput = (key, val) => {
    setInferenceData(prev => ({ ...prev, [key]: Number(val) }));
  };

  return (
    <div className="flex flex-col gap-10 animate-reveal">
      {/* 1. ML Global Status Matrix */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="relative p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-blue-500/20 flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 shadow-[0_0_30px_-5px_rgba(59,130,246,0.1)]">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
             <Brain size={20} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Neural Master</p>
            <p className="text-base font-black text-white truncate uppercase tracking-widest">{activeModel.name}</p>
          </div>
        </div>

        <div className="relative p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-purple-500/20 flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 shadow-[0_0_30px_-5px_rgba(168,85,247,0.1)]">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
             <Zap size={20} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Mean Latency</p>
            <p className="text-base font-black text-white tracking-widest">{activeModel.latency}</p>
          </div>
        </div>

        <div className="relative p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-green-500/20 flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 shadow-[0_0_30px_-5px_rgba(34,197,94,0.1)]">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
             <Shield size={20} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Network Precision</p>
            <p className="text-base font-black text-white tracking-widest">{activeModel.accuracy}</p>
          </div>
        </div>

        <div className="relative p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-orange-500/20 flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 shadow-[0_0_30px_-5px_rgba(249,115,22,0.1)]">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
             <Layers size={20} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Active Weights</p>
            <p className="text-base font-black text-white tracking-widest">12.4M <span className="text-[11px] opacity-40">PARAMS</span></p>
          </div>
        </div>
      </section>

      {/* 2. Tactical Model Matrix */}
      <section className="relative p-8 rounded-[32px] bg-[#111111]/80 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden group mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 px-2">
          <div className="flex items-center gap-5">
             <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              <Binary size={22} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-black text-sm md:text-base tracking-[0.25em] uppercase text-white/90">Model Selection Matrix</h3>
              <p className="text-[10px] md:text-[11px] font-bold opacity-30 uppercase tracking-[0.3em] mt-1">Neural Architecture v4.2 PRO</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-black uppercase text-blue-400 tracking-widest shadow-inner">
            <Activity size={16} className="animate-pulse" />
            Core Processor: Active
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          {MODELS.map(m => (
            <button 
              key={m.id} 
              className={`flex-1 cursor-pointer text-left p-8 rounded-3xl hover:scale-[1.03] flex flex-col gap-5 relative overflow-hidden border-2 transition-all duration-300 ${m.id === activeModel.id ? 'border-blue-500 bg-blue-500/15 shadow-[0_0_50px_-10px_rgba(59,130,246,0.3)]' : 'border-white/5 bg-white/[0.03] hover:border-white/20'}`}
              onClick={() => setActiveModel(m)}
            >
              <div className="flex items-center justify-between w-full relative z-10">
                 <div className="flex items-center gap-5">
                    <div className={`w-1 h-12 rounded-full ${m.id === activeModel.id ? 'bg-blue-400 shadow-[0_0_15px_#3b82f6]' : 'bg-white/20'}`} />
                    <div>
                      <p className={`text-[11px] font-black uppercase tracking-[0.25em] mb-2 ${m.id === activeModel.id ? 'text-blue-400' : 'text-white/30'}`}>{m.task}</p>
                      <p className="text-base font-black text-white tracking-widest">{m.name}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] uppercase font-black text-white opacity-20 tracking-widest mb-1.5">Precision</p>
                    <p className={`text-base font-black tracking-tighter ${m.id === activeModel.id ? 'text-blue-400' : 'text-white/60'}`}>{m.accuracy}</p>
                 </div>
              </div>
              
              {m.id === activeModel.id && (
                <div className="mt-2 pt-6 border-t border-white/10 animate-reveal">
                  <p className="text-[12px] leading-relaxed text-white/50 font-bold uppercase tracking-tight">
                    {m.desc}
                  </p>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-10">
          {/* 3. Manual Inference Suite */}
          <section className="relative p-8 rounded-[32px] bg-[#111111]/80 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden group">
             <div className="flex items-center gap-5 mb-10">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                  <Search size={22} className="text-purple-400" />
                </div>
                <div>
                  <h4 className="font-black text-sm md:text-base tracking-[0.25em] uppercase text-white/90">Manual Inference Suite</h4>
                  <p className="text-[10px] md:text-[11px] font-bold opacity-30 uppercase tracking-[0.3em] mt-1">Tactical Neural Override</p>
                </div>
             </div>
             <form onSubmit={handleManualInference} className="space-y-6">
                <div className="grid grid-cols-2 gap-6 pb-2">
                   {[
                     { label: 'Temperature', icon: Thermometer, key: 'temperature' },
                     { label: 'Vibration', icon: Waves, key: 'vibration' },
                     { label: 'Pressure', icon: Gauge, key: 'pressure' },
                     { label: 'Load Factor', icon: Activity, key: 'load_factor', step: '0.1' }
                   ].map(field => (
                     <div key={field.key} className="flex items-center gap-4 p-5 rounded-2xl bg-[#0f172a]/40 border border-white/5 transition-all hover:bg-[#0f172a]/60 active:scale-[0.98]">
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-purple-400 shrink-0"><field.icon size={18} /></div>
                        <div className="flex-1 min-w-0">
                          <label className="block text-[8px] font-black uppercase tracking-widest text-white/20 mb-1.5 ml-1">{field.label}</label>
                          <input 
                            type="number" 
                            step={field.step || "1"}
                            value={inferenceData[field.key]} 
                            onChange={(e) => updateInferenceInput(field.key, e.target.value)} 
                            className="w-full bg-transparent border-none text-white font-mono text-sm font-black outline-none"
                          />
                        </div>
                     </div>
                   ))}
                </div>
                <div className="pt-4">
                  <button 
                    disabled={isPredicting} 
                    className="w-full flex items-center justify-center gap-4 py-5 rounded-2xl bg-gradient-to-br from-[#0070eb] to-[#85adff] text-[#002c65] font-black uppercase tracking-[0.25em] text-xs shadow-[0_15px_40px_-10px_rgba(59,130,246,0.3)] hover:brightness-110 active:scale-[0.97] transition-all disabled:opacity-50"
                  >
                    {isPredicting ? <Activity size={20} className="animate-spin" /> : <Play size={20} />}
                    <span>Execute Prediction Mesh</span>
                  </button>
                </div>
             </form>

             {prediction && (
               <div className="mt-10 p-8 rounded-[24px] bg-blue-500/5 border border-blue-500/10 animate-reveal relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                    <Shield size={120} className="text-blue-400" />
                  </div>
                  <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]" />
                        <span className="text-[10px] uppercase font-black tracking-[0.3em] text-blue-400">Intelligence Report v4.2</span>
                     </div>
                     <span className="text-[10px] font-mono font-bold opacity-20">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-10 mb-8">
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase opacity-30 font-black tracking-[0.2em]">Failure Risk</p>
                        <p className={`text-4xl font-black tracking-tighter ${prediction.probability > 0.7 ? 'text-red-500' : 'text-white'}`}>
                          {(prediction.probability * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[9px] uppercase opacity-30 font-black tracking-[0.2em]">Predicted RUL</p>
                        <p className="text-4xl font-black text-blue-400 tracking-tighter">
                          {prediction.remainingUsefulLifeHours}<span className="text-sm ml-1 opacity-40">HRS</span>
                        </p>
                      </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/5 flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-blue-500/10"><Info size={16} className="text-blue-400" /></div>
                    <div>
                      <p className="text-[9px] uppercase font-black tracking-[0.2em] opacity-30 mb-1.5">Command Recommendation</p>
                      <p className="text-[11px] font-black text-white/70 leading-relaxed uppercase tracking-wide">
                        {prediction.recommendedAction}
                      </p>
                    </div>
                  </div>
               </div>
             )}
          </section>
        </div>

        {/* 4. Global Inference Ledger */}
        <div className="lg:col-span-7 flex flex-col gap-10">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
              <div className="flex items-center gap-5">
                 <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                   <Terminal size={22} className="text-purple-400" />
                 </div>
                 <div>
                   <h3 className="font-black text-xs tracking-[0.25em] uppercase text-white/90">Global Inference Ledger</h3>
                   <p className="text-[9px] font-bold opacity-30 uppercase tracking-[0.3em] mt-1">Real-time Neural Sync</p>
                 </div>
              </div>
              <div className="flex items-center gap-4 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white tracking-[0.2em] shadow-inner">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                Neural Sync: Active
              </div>
           </div>
           
           <div className="relative rounded-[40px] h-[750px] bg-[#040608]/95 border border-white/10 shadow-2xl overflow-hidden flex flex-col">
              <div className="flex-1 p-10 font-mono text-[11px] overflow-y-auto relative scrollbar-thin">
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.01),rgba(0,0,255,0.01))] bg-[length:100%_2px,3px_100%] pointer-events-none z-10" />
                 <div className="space-y-6">
                    {inferenceLogs.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center opacity-10 py-48 px-10 text-center gap-8">
                        <Cpu size={80} className="animate-spin-slow text-blue-400" />
                        <div className="space-y-3">
                          <p className="uppercase tracking-[0.8em] font-black text-2xl">Initializing</p>
                          <p className="text-[10px] font-black opacity-30 tracking-widest">{`Awaiting model-bridge intake for [${activeModel.id}]`}</p>
                        </div>
                      </div>
                    )}
                    {inferenceLogs.map(log => (
                      <div key={log.id} className="relative p-7 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-300 animate-reveal group">
                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-5">
                               <div className={`p-2 rounded-lg bg-white/5 ${log.machine_id === 'MANUAL_DIAG' ? 'text-purple-400' : 'text-blue-400'}`}>
                                  {log.machine_id === 'MANUAL_DIAG' ? <Search size={16} /> : <Cpu size={16} />}
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-[10px] font-mono font-black text-white/30 tracking-widest">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                 <span className="text-[9px] font-black uppercase text-white/10 tracking-[0.3em]">{log.machine_id}::NODE_{activeModel.id}</span>
                               </div>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${log.probability > 0.7 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                              {log.probability > 0.7 ? 'Critical Risk' : 'Cycle Nominal'}
                            </span>
                         </div>
                         <div className="grid grid-cols-3 gap-8 mb-4 px-2">
                            <div className="space-y-1">
                               <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Confidence</p>
                               <p className="text-lg font-black text-white">{(log.probability * 100).toFixed(2)}%</p>
                            </div>
                            <div className="space-y-1 border-x border-white/5 px-8">
                               <p className="text-[9px] font-black uppercase tracking-widest text-white/20">RUL Target</p>
                               <p className="text-lg font-black text-blue-400">{log.remainingUsefulLifeHours}H</p>
                            </div>
                            <div className="text-right space-y-1">
                               <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Entropy</p>
                               <p className="text-[11px] font-mono font-black text-white/40">{log.anomalyScore?.toFixed(6) || '0.000000'}</p>
                            </div>
                         </div>
                         <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4 opacity-30 group-hover:opacity-100 transition-all">
                            <Zap size={12} className="text-blue-400" />
                            <p className="text-[10px] font-black uppercase tracking-wider text-white truncate">
                              {`CMD_EXEC: ${log.recommendedAction}`}
                            </p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
