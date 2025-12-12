
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  Workflow, 
  History, 
  Database, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Bell, 
  User,
  Pin,
  PinOff,
  ChevronRight
} from 'lucide-react';
import Dashboard from './components/Dashboard.tsx';
import Automations from './components/Automations.tsx';
import WorkflowCanvas from './components/WorkflowCanvas.tsx';
import CredentialsVault from './components/CredentialsVault.tsx';
import ExecutionHistory from './components/ExecutionHistory.tsx';
import Settings from './components/Settings.tsx';

const SidebarLink = ({ to, icon: Icon, label, isExpanded }: { to: string, icon: any, label: string, isExpanded: boolean }) => (
  <NavLink
    to={to}
    className={({ isActive }) => 
      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group border relative ${
        isActive 
        ? 'bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-lg shadow-sky-500/5' 
        : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'
      } ${!isExpanded ? 'justify-center px-0' : ''}`
    }
  >
    <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${!isExpanded ? 'scale-110' : ''}`} />
    <span className={`font-semibold text-sm whitespace-nowrap transition-all duration-300 origin-left ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-0 w-0'}`}>
      {label}
    </span>
    {!isExpanded && (
      <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 shadow-2xl z-[100]">
        {label}
      </div>
    )}
  </NavLink>
);

const MainLayout = ({ children }: { children?: React.ReactNode }) => {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isPinned || isHovered;

  return (
    <div className="flex w-full h-screen bg-transparent overflow-hidden">
      <nav 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`glass-card border-r border-white/5 flex flex-col p-6 z-[80] flex-shrink-0 shadow-2xl transition-all duration-500 ease-out relative overflow-hidden ${isExpanded ? 'w-64' : 'w-20'}`}
      >
        {/* Toggle Pin Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); setIsPinned(!isPinned); }}
          className={`absolute top-8 right-5 p-2 rounded-xl transition-all z-[90] ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'} hover:bg-white/10 text-slate-500 hover:text-sky-400`}
        >
          {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </button>

        <div className={`flex items-center gap-3 mb-10 group cursor-pointer transition-all duration-300 ${!isExpanded ? 'justify-center px-0' : 'px-2'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className={`overflow-hidden transition-all duration-300 origin-left ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
            <h2 className="text-xl font-black text-white tracking-tight">OpenFlow</h2>
            <p className="text-[10px] text-sky-400 font-bold uppercase tracking-[0.2em] animate-pulse">Enterprise</p>
          </div>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto scrollbar-hide py-2">
          <SidebarLink to="/" icon={LayoutGrid} label="Dashboard" isExpanded={isExpanded} />
          <SidebarLink to="/workflows" icon={Workflow} label="Automations" isExpanded={isExpanded} />
          <SidebarLink to="/history" icon={History} label="Executions" isExpanded={isExpanded} />
          <SidebarLink to="/credentials" icon={Database} label="Vault" isExpanded={isExpanded} />
        </div>

        {!isExpanded && (
          <div className="absolute top-1/2 right-2 -translate-y-1/2 text-sky-500/20">
            <ChevronRight className="w-4 h-4 animate-pulse" />
          </div>
        )}

        <div className="pt-6 border-t border-white/5 space-y-2 flex-shrink-0 mt-auto">
          <SidebarLink to="/settings" icon={SettingsIcon} label="Settings" isExpanded={isExpanded} />
          <div className={`w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all text-slate-400 group mt-4 cursor-pointer overflow-hidden ${!isExpanded ? 'justify-center px-0' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden">
                  <User className="w-5 h-5 group-hover:text-white transition-colors" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0f172a] rounded-full" />
              </div>
              <div className={`flex flex-col transition-all duration-300 origin-left ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">Architect</span>
                <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">Pro Plan</span>
              </div>
            </div>
            {isExpanded && <Bell className="w-4 h-4 group-hover:text-sky-400 transition-colors" />}
          </div>
        </div>
      </nav>

      <main className="flex-1 relative flex flex-col h-full overflow-hidden bg-black/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.05),transparent_40%)]" />
        {children}
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <div className="w-screen h-screen overflow-hidden bg-transparent">
        <Routes>
          <Route path="/editor/:id" element={<div className="h-screen w-screen"><WorkflowCanvas /></div>} />
          <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/workflows" element={<MainLayout><Automations /></MainLayout>} />
          <Route path="/credentials" element={<MainLayout><CredentialsVault /></MainLayout>} />
          <Route path="/history" element={<MainLayout><ExecutionHistory /></MainLayout>} />
          <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
