import React from 'react';
import { 
  Cloud, 
  LayoutDashboard, 
  Network, 
  Settings, 
  FileText, 
  Calendar, 
  ChevronRight,
  User
} from 'lucide-react';

export function Sidebar({ isConnected }) {
  return (
    <aside className="w-20 lg:w-64 layer-1 border-r border-white/[0.03] flex flex-col transition-all duration-300">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 gap-3 border-b border-white/[0.03]">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Cloud className="text-primary" size={24}/>
        </div>
        <div className="hidden lg:block overflow-hidden">
          <h1 className="text-sm font-bold tracking-tight whitespace-nowrap">PREDICT<span className="text-primary italic">.AI</span></h1>
          <p className="text-[10px] text-on-surface-variant font-bold technical-label">v4.2 PRO</p>
        </div>
      </div>

      {/* Nav Section */}
      <div className="flex-1 py-10 flex flex-col gap-2">
        <NavBtn icon={<LayoutDashboard size={20}/>} label="Fleet Control" active />
        <NavBtn icon={<Network size={20}/>} label="Network Map" />
        <NavBtn icon={<Calendar size={20}/>} label="Schedules" />
        <NavBtn icon={<FileText size={20}/>} label="Technical Logs" count={3} />
        
        <div className="mt-10 px-6 hidden lg:block">
           <p className="text-[10px] technical-label text-on-surface-variant uppercase font-bold tracking-[0.2em] mb-4">System</p>
           <div className="space-y-4">
              <StatusCheck label="MQTT Gateway" active={isConnected} />
              <StatusCheck label="ML Engine" active />
              <StatusCheck label="Postgres SQL" active />
           </div>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-6 border-t border-white/[0.03] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full layer-3 flex items-center justify-center border border-white/5">
          <User size={16} className="text-on-surface-variant" />
        </div>
        <div className="hidden lg:block">
          <p className="text-xs font-bold">Akhil_Control</p>
          <p className="text-[10px] text-primary">Chief Engineer</p>
        </div>
      </div>
    </aside>
  );
}

function NavBtn({ icon, label, active = false, count }) {
  return (
    <div className={`px-4 lg:px-6 py-2 cursor-pointer flex items-center justify-between transition-all group ${
      active ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg transition-colors ${active ? 'bg-primary/10' : 'group-hover:bg-white/5'}`}>
          {icon}
        </div>
        <span className="hidden lg:block text-sm font-semibold tracking-tight">{label}</span>
      </div>
      {count && <span className="hidden lg:block text-[10px] font-bold px-2 py-0.5 layer-3 rounded-full text-white">{count}</span>}
      {active && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
    </div>
  );
}

function StatusCheck({ label, active }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-on-surface-variant font-medium">{label}</span>
      <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-primary shadow-[0_0_8px_rgba(133,173,255,0.4)]' : 'bg-white/10'}`} />
    </div>
  );
}
