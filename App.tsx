
import React from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  Workflow, 
  History, 
  Database, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Bell, 
  User
} from 'lucide-react';
import Dashboard from './components/Dashboard.tsx';
import Automations from './components/Automations.tsx';
import WorkflowCanvas from './components/WorkflowCanvas.tsx';
import CredentialsVault from './components/CredentialsVault.tsx';
import ExecutionHistory from './components/ExecutionHistory.tsx';
import Settings from './components/Settings.tsx';

const SidebarLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) => 
      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group border ${
        isActive 
        ? 'bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-lg shadow-sky-500/5' 
        : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'
      }`
    }
  >
    <Icon className="w-5 h-5 flex-shrink-0" />
    <span className="font-semibold text-sm whitespace-nowrap">{label}</span>
  </NavLink>
);

const MainLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="flex w-full h-screen bg-transparent overflow-hidden">
      <nav className="w-64 glass-card border-r border-white/5 flex flex-col p-6 z-30 flex-shrink-0 shadow-2xl">
        <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-xl font-black text-white tracking-tight">OpenFlow</h2>
            <p className="text-[10px] text-sky-400 font-bold uppercase tracking-[0.2em] animate-pulse">Enterprise</p>
          </div>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto scrollbar-hide py-2">
          <SidebarLink to="/" icon={LayoutGrid} label="Dashboard" />
          <SidebarLink to="/workflows" icon={Workflow} label="Automations" />
          <SidebarLink to="/history" icon={History} label="Executions" />
          <SidebarLink to="/credentials" icon={Database} label="Vault" />
        </div>

        <div className="pt-6 border-t border-white/5 space-y-2 flex-shrink-0 mt-auto">
          <SidebarLink to="/settings" icon={SettingsIcon} label="Settings" />
          <div className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all text-slate-400 group mt-4 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden">
                  <User className="w-5 h-5 group-hover:text-white transition-colors" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0f172a] rounded-full" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">Architect</span>
                <span className="text-[10px] text-slate-500 font-medium">Pro Plan</span>
              </div>
            </div>
            <Bell className="w-4 h-4 group-hover:text-sky-400 transition-colors" />
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
