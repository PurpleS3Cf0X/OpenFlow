
import React from 'react';
import { 
  Settings as SettingsIcon, Shield, Zap, Save, Monitor, 
  Palette, Database, Globe, Bell, Lock, Smartphone
} from 'lucide-react';
import { useWorkflowStore } from '../store.ts';

const SettingToggle = ({ label, description, icon: Icon, enabled, onToggle }: { label: string, description: string, icon: any, enabled: boolean, onToggle: () => void }) => (
  <div className="flex items-center justify-between p-6 rounded-3xl glass-card border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
    <div className="flex items-start gap-4">
      <div className={`p-3 rounded-2xl transition-all ${enabled ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-lg shadow-sky-500/5' : 'bg-slate-800/50 text-slate-500 border border-white/5'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{label}</p>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-sm">{description}</p>
      </div>
    </div>
    <button 
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${enabled ? 'bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.4)]' : 'bg-slate-800'}`}
    >
      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-0 shadow-md'}`} />
    </button>
  </div>
);

const Settings: React.FC = () => {
  const { settings, updateSettings } = useWorkflowStore();

  return (
    <div className="flex-1 overflow-y-auto p-8 lg:p-12 scrollbar-hide relative z-10">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-sky-400 mb-2">
            <SettingsIcon className="w-5 h-5 animate-spin-slow" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Platform Preferences</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">System Settings</h1>
          <p className="text-slate-400 font-medium text-sm">Configure your global execution parameters and UI experience.</p>
        </header>

        <section className="space-y-6">
          <div className="flex items-center gap-3 px-1 mb-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Security & Execution</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <SettingToggle 
              label="Isolated Execution Mode" 
              description="Run all node logic within a secure VM sandbox to prevent malicious script behavior."
              icon={Lock}
              enabled={settings.isolatedExecution}
              onToggle={() => updateSettings({ isolatedExecution: !settings.isolatedExecution })}
            />
            <SettingToggle 
              label="Real-time Autosave" 
              description="Automatically commit canvas changes to the cloud every 5 seconds. Highly recommended."
              icon={Save}
              enabled={settings.autoSave}
              onToggle={() => updateSettings({ autoSave: !settings.autoSave })}
            />
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 px-1 mb-2">
            <Palette className="w-4 h-4 text-sky-400" />
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Interface Customization</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between p-6 rounded-3xl glass-card border border-white/5 bg-white/[0.01]">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-200">Default Inspector Mode</p>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Choose how data results are displayed by default in the side inspector.</p>
                </div>
              </div>
              <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
                {(['json', 'table'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => updateSettings({ defaultView: view })}
                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${settings.defaultView === view ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>

            <SettingToggle 
              label="Neon Edge Animation" 
              description="Show glowing animated pulses along active workflow paths during execution."
              icon={Zap}
              enabled={true}
              onToggle={() => {}}
            />
          </div>
        </section>

        <section className="p-8 rounded-[32px] glass-card border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 relative">
               <Database className="w-8 h-8 text-sky-400" />
               <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0f172a] rounded-full animate-pulse" />
            </div>
            <div>
              <p className="text-lg font-black text-white">Advanced Database Analytics</p>
              <p className="text-sm text-slate-500 font-medium">Platform version: v1.0.4-enterprise</p>
            </div>
          </div>
          <button className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">
            Update Available
          </button>
        </section>
      </div>
    </div>
  );
};

export default Settings;
