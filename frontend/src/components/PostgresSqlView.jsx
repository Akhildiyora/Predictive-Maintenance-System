import React, { useState, useEffect } from 'react';
import {
  Database, Terminal, Play, Save, Trash2, Table, LayoutGrid,
  AlertTriangle, Shield, Cpu, Activity, Braces, Layers,
  ChevronRight, ChevronDown, Download, Lock, Unlock, Filter,
  Plus, X, ArrowUpDown, Zap, SlidersHorizontal, Code2, ChevronUp
} from 'lucide-react';
import { BACKEND_URL } from '../config';

// ─── Static Preset Queries ───────────────────────────────────────────────────
const PRESETS = [
  {
    id: 'critical_alerts',
    label: 'Critical Alerts',
    icon: AlertTriangle,
    color: 'text-red-400 border-red-500/20 bg-red-500/10 hover:bg-red-500/20',
    sql: "SELECT * FROM alerts WHERE severity = 'critical' ORDER BY created_at DESC LIMIT 50;"
  },
  {
    id: 'warning_alerts',
    label: 'Active Warnings',
    icon: Shield,
    color: 'text-orange-400 border-orange-500/20 bg-orange-500/10 hover:bg-orange-500/20',
    sql: "SELECT * FROM alerts WHERE severity = 'warning' ORDER BY created_at DESC LIMIT 50;"
  },
  {
    id: 'offline_devices',
    label: 'Offline Devices',
    icon: Zap,
    color: 'text-slate-400 border-slate-500/20 bg-slate-500/10 hover:bg-slate-500/20',
    sql: "SELECT * FROM devices WHERE status = 'offline' ORDER BY id;"
  },
  {
    id: 'all_devices',
    label: 'All Devices',
    icon: Database,
    color: 'text-blue-400 border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20',
    sql: "SELECT * FROM devices ORDER BY id LIMIT 50;"
  },
  {
    id: 'maintenance',
    label: 'Scheduled Jobs',
    icon: Cpu,
    color: 'text-purple-400 border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20',
    sql: "SELECT * FROM maintenance_schedules ORDER BY scheduled_for ASC LIMIT 50;"
  },
  {
    id: 'recent_logs',
    label: 'Recent Logs',
    icon: Activity,
    color: 'text-green-400 border-green-500/20 bg-green-500/10 hover:bg-green-500/20',
    sql: "SELECT * FROM alerts ORDER BY created_at DESC LIMIT 20;"
  },
];

// ─── Table & Column Config ───────────────────────────────────────────────────
const KNOWN_TABLES = {
  devices:               ['id', 'name', 'type', 'location', 'status'],
  alerts:                ['id', 'device_id', 'alert_type', 'message', 'severity', 'created_at'],
  maintenance_schedules: ['id', 'device_id', 'scheduled_for', 'reason', 'status'],
  users:                 ['id', 'email', 'full_name', 'role', 'created_at'],
};

const OPERATORS = [
  { label: 'equals',          value: '='     },
  { label: 'not equals',      value: '!='    },
  { label: 'contains',        value: 'LIKE'  },
  { label: 'greater than',    value: '>'     },
  { label: 'less than',       value: '<'     },
  { label: 'is empty',        value: 'IS NULL' },
  { label: 'is not empty',    value: 'IS NOT NULL' },
];

const SORT_DIRECTIONS = [
  { label: 'Newest First (DESC)', value: 'DESC' },
  { label: 'Oldest First (ASC)',  value: 'ASC'  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

function buildSql({ selectedTable, filters, sort, limitRows }) {
  if (!selectedTable) return '';
  const validFilters = filters.filter(f => f.field && f.operator && (f.value || f.operator.includes('NULL')));
  let sql = `SELECT * FROM ${selectedTable}`;
  if (validFilters.length) {
    const clauses = validFilters.map(f => {
      if (f.operator === 'LIKE')          return `${f.field} ILIKE '%${f.value}%'`;
      if (f.operator.includes('NULL'))    return `${f.field} ${f.operator}`;
      const numericLike = !isNaN(f.value) && f.value !== '';
      const val = numericLike ? f.value : `'${f.value}'`;
      return `${f.field} ${f.operator} ${val}`;
    });
    sql += `\n  WHERE ${clauses.join('\n    AND ')}`;
  }
  if (sort.field) sql += `\n  ORDER BY ${sort.field} ${sort.direction}`;
  sql += `\n  LIMIT ${limitRows};`;
  return sql;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function PostgresSqlView({ authToken }) {
  const [schema,          setSchema]         = useState([]);
  const [metrics,         setMetrics]        = useState(null);
  const [query,           setQuery]          = useState('SELECT * FROM devices ORDER BY id LIMIT 50;');
  const [results,         setResults]        = useState(null);
  const [isLoading,       setIsLoading]      = useState(false);
  const [error,           setError]          = useState(null);
  const [expandedTables,  setExpandedTables] = useState({});
  const [safetyLock,      setSafetyLock]     = useState(true);
  // 'query' | 'builder' | 'performance'
  const [activeTab,       setActiveTab]      = useState('builder');
  const [showSqlPreview,  setShowSqlPreview] = useState(false);

  // ── Builder state ──
  const [selectedTable,   setSelectedTable]  = useState('devices');
  const [filters,         setFilters]        = useState([]);
  const [sort,            setSort]           = useState({ field: 'id', direction: 'DESC' });
  const [limitRows,       setLimitRows]      = useState(50);

  // ── History ──
  const [history, setHistory] = useState([
    "SELECT * FROM alerts WHERE severity = 'critical' ORDER BY created_at DESC;",
    "SELECT device_id, count(*) FROM alerts GROUP BY device_id;",
  ]);

  // ── Derived SQL from builder ──
  const builderSql = buildSql({ selectedTable, filters, sort, limitRows });
  const columns    = KNOWN_TABLES[selectedTable] || (schema.find(t => t.name === selectedTable)?.columns.map(c => c.name) || []);

  useEffect(() => { fetchSchema(); fetchMetrics(); const iv = setInterval(fetchMetrics, 30000); return () => clearInterval(iv); }, []);

  const fetchSchema = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/db/schema`, { headers: { Authorization: `Bearer ${authToken}` } });
      if (res.ok) setSchema(await res.json());
    } catch { /* silent */ }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/db/metrics`, { headers: { Authorization: `Bearer ${authToken}` } });
      if (res.ok) setMetrics(await res.json());
    } catch { /* silent */ }
  };

  const runQuery = async (sqlOverride) => {
    const sqlToRun = sqlOverride || query;
    setError(null);
    setIsLoading(true);
    if (safetyLock && /\b(DELETE|DROP|TRUNCATE)\b/i.test(sqlToRun)) {
      setError('SAFETY_LOCK_VIOLATION: Destructive operations prohibited in protected mode.');
      setIsLoading(false);
      return;
    }
    try {
      const res  = await fetch(`${BACKEND_URL}/api/db/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ sql: sqlToRun }),
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data);
        if (!history.includes(sqlToRun)) setHistory(prev => [sqlToRun, ...prev].slice(0, 10));
      } else {
        setError(data.error);
        setResults(null);
      }
    } catch { setError('COMM_LINK_FAILURE: Could not reach the neural database core.'); }
    finally  { setIsLoading(false); }
  };

  // ── Builder helpers ──
  const addFilter   = () => setFilters(prev => [...prev, { id: uid(), field: columns[0] || '', operator: '=', value: '' }]);
  const removeFilter = (id) => setFilters(prev => prev.filter(f => f.id !== id));
  const updateFilter = (id, key, val) => setFilters(prev => prev.map(f => f.id === id ? { ...f, [key]: val } : f));

  const applyBuilder = () => {
    setQuery(builderSql);
    runQuery(builderSql);
  };

  const applyPreset = (preset) => {
    setQuery(preset.sql);
    setActiveTab('query');
    runQuery(preset.sql);
  };

  const exportCSV = () => {
    if (!results) return;
    const csv = [results.fields.join(','), ...results.rows.map(r => results.fields.map(f => `"${r[f]}"`).join(','))].join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `export_${Date.now()}.csv` });
    a.click();
  };

  const toggleTable = (name) => setExpandedTables(p => ({ ...p, [name]: !p[name] }));

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8 animate-reveal">

      {/* ──────── 1. Status Strip ──────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Core Engine',        value: 'PostgreSQL 15.2',                       color: 'border-blue-500/20   bg-blue-500/5',   icon: <span className="font-mono text-xs text-blue-400">PSQL</span> },
          { label: 'Active Sessions',    value: `${metrics?.activeConnections ?? 0} Links`, color: 'border-purple-500/20 bg-purple-500/5', icon: <Activity size={18} className="text-purple-400" /> },
          { label: 'Neural Load',        value: '32.4 MB Stored',                        color: 'border-green-500/20  bg-green-500/5',  icon: <Layers   size={18} className="text-green-400"  /> },
          { label: 'Security Integrity', value: 'ENCRYPTED_RSA',                         color: 'border-orange-500/20 bg-orange-500/5', icon: <Shield   size={18} className="text-orange-400" /> },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-4 p-5 rounded-2xl border backdrop-blur-md hover:-translate-y-0.5 transition-all ${s.color}`}>
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5">{s.icon}</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-0.5">{s.label}</p>
              <p className="text-sm font-black text-white tracking-wide">{s.value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ──────── 2. Command Presets ──────── */}
      <section className="p-6 rounded-3xl bg-[#111111]/60 border border-white/5">
        <div className="flex items-center gap-3 mb-5">
          <Zap size={16} className="text-yellow-400" />
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-white/70">Command Presets</h3>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-black uppercase tracking-widest">Quick Access</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {PRESETS.map(p => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl border text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${p.color}`}
              >
                <Icon size={14} />
                {p.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ──────── 3. Main IDE ──────── */}
      <section className="relative rounded-[32px] bg-[#111111]/80 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col xl:flex-row min-h-[850px]">

        {/* ── Left: Schema Explorer ── */}
        <div className="w-full xl:w-64 flex flex-col gap-4 shrink-0 border-b xl:border-b-0 xl:border-r border-white/5 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20"><Database size={16} className="text-blue-400" /></div>
            <h3 className="font-black text-xs tracking-widest uppercase text-white/80">Schema</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin max-h-[400px] xl:max-h-none">
            {schema.length > 0 ? schema.map(table => (
              <div key={table.name}>
                <button onClick={() => toggleTable(table.name)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${expandedTables[table.name] ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' : 'text-slate-500 hover:text-white hover:bg-white/3'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Table size={13} className={expandedTables[table.name] ? 'text-blue-400' : 'text-slate-600'} />
                    <span className="text-[11px] font-black uppercase tracking-widest">{table.name}</span>
                  </div>
                  {expandedTables[table.name] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                {expandedTables[table.name] && (
                  <div className="ml-4 pl-3 border-l border-white/5 py-2 space-y-2">
                    {table.columns.map(col => (
                      <div key={col.name} className="flex justify-between items-center animate-reveal">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">{col.name}</span>
                        <span className="text-[9px] font-bold text-slate-600 uppercase">{col.type?.split(' ')[0]}</span>
                      </div>
                    ))}
                    <button onClick={() => { setSelectedTable(table.name); setActiveTab('builder'); }}
                      className="mt-2 text-[10px] font-black uppercase tracking-widest text-blue-500/60 hover:text-blue-400 transition-colors flex items-center gap-1.5">
                      <Filter size={10} /> Filter Table
                    </button>
                  </div>
                )}
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-32 opacity-10 gap-3">
                <Activity size={28} className="animate-pulse" />
                <p className="text-[10px] uppercase font-black tracking-widest">Syncing...</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Center: Tabs + Editor/Builder/Performance ── */}
        <div className="flex-1 flex flex-col min-w-0 p-6 gap-6">

          {/* Tab bar + controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 self-start">
              {[
                { id: 'builder',     label: 'Visual Builder', icon: <SlidersHorizontal size={13} /> },
                { id: 'query',       label: 'SQL Terminal',   icon: <Terminal size={13} />           },
                { id: 'performance', label: 'Diagnostics',    icon: <Activity size={13} />           },
              ].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-white/30 hover:text-white/70'}`}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setSafetyLock(!safetyLock)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${safetyLock ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}
              >
                {safetyLock ? <Lock size={13} /> : <Unlock size={13} />}
                {safetyLock ? 'Protected' : 'Override'}
              </button>
              <button onClick={() => activeTab === 'builder' ? applyBuilder() : runQuery()}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoading ? <Activity size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                Execute
              </button>
            </div>
          </div>

          {/* ── BUILDER TAB ── */}
          {activeTab === 'builder' && (
            <div className="flex flex-col gap-6 animate-reveal flex-1">
              {/* Table selector */}
              <div className="p-5 rounded-2xl bg-white/3 border border-white/5 flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20"><Table size={16} className="text-blue-400" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-0.5">Data Source</p>
                    <p className="text-[11px] font-black uppercase text-white/60">Select Table</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(KNOWN_TABLES).map(t => (
                    <button key={t} onClick={() => { setSelectedTable(t); setFilters([]); setSort({ field: KNOWN_TABLES[t][0], direction: 'DESC' }); }}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${selectedTable === t ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'bg-white/2 border-white/5 text-slate-500 hover:text-white hover:border-white/10'}`}
                    >
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter rules */}
              <div className="p-5 rounded-2xl bg-white/3 border border-white/5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20"><Filter size={16} className="text-purple-400" /></div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-white/80">Filter Rules</p>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Add conditions to narrow your results</p>
                    </div>
                  </div>
                  <button onClick={addFilter}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 text-[11px] font-black uppercase tracking-widest hover:bg-purple-600/20 transition-all">
                    <Plus size={13} /> Add Rule
                  </button>
                </div>

                {filters.length === 0 ? (
                  <div className="flex items-center justify-center py-8 border border-dashed border-white/5 rounded-2xl opacity-30 gap-3">
                    <Filter size={18} />
                    <p className="text-xs font-black uppercase tracking-widest">No filters active — showing all rows</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {filters.map((f, idx) => (
                      <div key={f.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-xl bg-white/3 border border-white/5 animate-reveal">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/20 shrink-0 pt-2 sm:pt-0 w-8">{idx === 0 ? 'WHERE' : 'AND'}</span>
                        {/* Field */}
                        <select value={f.field} onChange={e => updateFilter(f.id, 'field', e.target.value)}
                          className="flex-1 bg-[#0f172a] border border-white/10 text-blue-300 text-xs font-bold font-mono px-3 py-2.5 rounded-xl outline-none focus:border-blue-500/40 transition-colors cursor-pointer">
                          {columns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {/* Operator */}
                        <select value={f.operator} onChange={e => updateFilter(f.id, 'operator', e.target.value)}
                          className="flex-1 bg-[#0f172a] border border-white/10 text-slate-300 text-xs font-bold px-3 py-2.5 rounded-xl outline-none focus:border-blue-500/40 transition-colors cursor-pointer">
                          {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        {/* Value */}
                        {!f.operator.includes('NULL') && (
                          <input value={f.value} onChange={e => updateFilter(f.id, 'value', e.target.value)}
                            placeholder="Value..."
                            className="flex-1 bg-[#0f172a] border border-white/10 text-green-300 text-xs font-mono px-3 py-2.5 rounded-xl outline-none focus:border-blue-500/40 transition-colors placeholder:text-white/10 placeholder:font-sans" />
                        )}
                        <button onClick={() => removeFilter(f.id)}
                          className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort + Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/3 border border-white/5 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20"><ArrowUpDown size={15} className="text-yellow-400" /></div>
                    <p className="text-xs font-black uppercase tracking-widest text-white/80">Sort Configuration</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Order by</label>
                      <select value={sort.field} onChange={e => setSort(s => ({ ...s, field: e.target.value }))}
                        className="bg-[#0f172a] border border-white/10 text-blue-300 text-xs font-bold font-mono px-3 py-2.5 rounded-xl outline-none focus:border-blue-500/40 transition-colors cursor-pointer">
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Direction</label>
                      <select value={sort.direction} onChange={e => setSort(s => ({ ...s, direction: e.target.value }))}
                        className="bg-[#0f172a] border border-white/10 text-slate-300 text-xs font-bold px-3 py-2.5 rounded-xl outline-none focus:border-blue-500/40 transition-colors cursor-pointer">
                        {SORT_DIRECTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/3 border border-white/5 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20"><Layers size={15} className="text-green-400" /></div>
                    <p className="text-xs font-black uppercase tracking-widest text-white/80">Row Limit</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[10, 25, 50, 100, 500].map(n => (
                      <button key={n} onClick={() => setLimitRows(n)}
                        className={`px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${limitRows === n ? 'bg-green-600/20 border-green-500/40 text-green-400' : 'bg-white/2 border-white/5 text-slate-500 hover:text-white hover:border-white/10'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live SQL Preview toggle */}
              <div className="rounded-2xl border border-white/5 overflow-hidden">
                <button onClick={() => setShowSqlPreview(!showSqlPreview)}
                  className="w-full flex items-center justify-between px-5 py-3 bg-white/3 hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-3">
                    <Code2 size={15} className="text-slate-500" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-white/40">Generated SQL Preview</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black uppercase tracking-widest">Live</span>
                  </div>
                  {showSqlPreview ? <ChevronUp size={14} className="text-white/20" /> : <ChevronDown size={14} className="text-white/20" />}
                </button>
                {showSqlPreview && (
                  <div className="bg-[#050608]/90 px-6 py-5 animate-reveal">
                    <pre className="text-sm font-mono text-blue-300 leading-relaxed whitespace-pre-wrap break-all">{builderSql || '-- Select a table to preview SQL'}</pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SQL TERMINAL TAB ── */}
          {activeTab === 'query' && (
            <div className="flex-1 flex flex-col gap-5 animate-reveal">
              <div className="relative flex-1 min-h-[240px] rounded-2xl bg-[#050608]/90 border border-white/10 overflow-hidden flex flex-col">
                <div className="px-4 py-3 bg-white/4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">SQL_TERMINAL_V4</span>
                </div>
                <textarea value={query} onChange={e => setQuery(e.target.value)}
                  className="flex-1 w-full bg-transparent p-6 text-sm font-mono text-blue-300 outline-none resize-none leading-relaxed"
                  spellCheck="false"
                />
              </div>
              {/* recall history */}
              {history.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20 flex items-center gap-2"><Save size={11} /> Recall History</p>
                  <div className="flex flex-col gap-2">
                    {history.map((h, i) => (
                      <button key={i} onClick={() => setQuery(h)}
                        className="w-full text-left px-4 py-3 rounded-xl bg-white/2 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all group">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[11px] font-mono text-slate-400 line-clamp-1 group-hover:text-blue-300 transition-colors flex-1">{h}</p>
                          <ChevronRight size={11} className="text-white/20 group-hover:text-white/50 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PERFORMANCE TAB ── */}
          {activeTab === 'performance' && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 animate-reveal">
              <div className="p-8 rounded-3xl bg-white/2 border border-white/5 flex flex-col gap-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-500/3 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20"><Activity size={18} className="text-blue-400" /></div>
                  <div>
                    <h4 className="font-black text-xs tracking-widest uppercase text-white">Connection Throughput</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Real-time IO Scaling</p>
                  </div>
                </div>
                <div className="flex items-end gap-1 h-32">
                  {[40, 60, 45, 90, 65, 30, 85, 40, 55, 75, 40, 95, 60, 40, 70, 50, 80].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-blue-600/10 to-blue-500/40 rounded-t-sm" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="flex justify-between pt-5 border-t border-white/5">
                  <div><p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Burst Capacity</p><p className="text-base font-black text-white">1.2 GB/s</p></div>
                  <div className="text-right"><p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">IO Latency</p><p className="text-base font-black text-green-400">2.4ms</p></div>
                </div>
              </div>
              <div className="p-8 rounded-3xl bg-white/2 border border-white/5 flex flex-col gap-8">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20"><Cpu size={18} className="text-purple-400" /></div>
                  <div>
                    <h4 className="font-black text-xs tracking-widest uppercase text-white">Cache Hit Ratio</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Shared Buffer Optimization</p>
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-40 h-40 rounded-full border-[10px] border-white/5 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-[10px] border-t-purple-500 border-r-purple-500/30 border-b-transparent border-l-transparent rotate-[45deg]" />
                    <div className="text-center">
                      <p className="text-3xl font-black text-white">99.2%</p>
                      <p className="text-[9px] font-black text-slate-500 tracking-widest uppercase mt-1">Optimal</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-5 border-t border-white/5">
                  {[{ label: 'WAL Buffers', pct: 80, color: 'bg-blue-500' }, { label: 'Temp Files', pct: 45, color: 'bg-purple-500' }].map(b => (
                    <div key={b.label} className="space-y-1.5">
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div className={`h-full ${b.color}`} style={{ width: `${b.pct}%` }} /></div>
                      <div className="flex justify-between text-[8px] font-black tracking-widest uppercase opacity-40"><span>{b.label}</span><span>{b.pct}%</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-4 items-center animate-reveal">
              <AlertTriangle size={20} className="text-red-500 shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-0.5">Execution Error</p>
                <p className="text-xs font-bold text-red-200/70 font-mono">{error}</p>
              </div>
            </div>
          )}

          {/* ── Results Matrix ── */}
          {(activeTab === 'builder' || activeTab === 'query') && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <LayoutGrid size={15} className="text-white/30" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-white/40">Result Matrix</h4>
                </div>
                {results && (
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{results.rowCount} rows · {results.duration}</span>
                    <button onClick={exportCSV} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">
                      <Download size={13} /> Export CSV
                    </button>
                  </div>
                )}
              </div>
              <div className="rounded-2xl bg-[#08090b]/60 border border-white/5 overflow-hidden shadow-xl" style={{ minHeight: '240px' }}>
                {!results ? (
                  <div className="flex flex-col items-center justify-center h-60 opacity-10 gap-4">
                    <Braces size={40} />
                    <p className="text-sm uppercase tracking-[0.4em] font-black">Awaiting Result Set...</p>
                  </div>
                ) : (
                  <div className="overflow-auto max-h-[500px] scrollbar-thin">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-slate-900 border-b border-white/10">
                        <tr>
                          {results.fields.map(f => (
                            <th key={f} className="px-5 py-4 text-[10px] font-black tracking-widest text-slate-400 border-r border-white/5 uppercase whitespace-nowrap">{f}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.rows.map((row, i) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/2 transition-colors group">
                            {results.fields.map(f => (
                              <td key={`${i}-${f}`} className="px-5 py-3.5 text-xs font-bold text-slate-400 font-mono border-r border-white/5 max-w-[280px] truncate group-hover:text-white whitespace-nowrap">
                                {String(row[f])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
