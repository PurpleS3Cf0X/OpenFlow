
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Workflow, Zap, Trash2, Search, Copy, Power,
  ChevronDown, Activity, CheckCircle2, FileText, Sparkles, Terminal, Database,
  ArrowRight, BookOpen, Layers, Cpu, ShieldCheck, Eye, Bot, X, Clock, Calendar, 
  Settings2, ToggleRight, ToggleLeft, Fingerprint, Code, Layout, Shield, Server, Briefcase, Info,
  Check
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useWorkflowStore } from '../store.ts';
import { NodeType } from '../types.ts';

const CategoryIcon = ({ category }: { category: string }) => {
  if (category === 'AI Ops') return <Sparkles className="w-4 h-4 text-amber-400" />;
  if (category === 'DevOps') return <Terminal className="w-4 h-4 text-emerald-400" />;
  return <Database className="w-4 h-4 text-indigo-400" />;
};

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
  <div className="p-4 rounded-xl glass-card border border-white/5 flex items-center gap-3 bg-gradient-to-br from-white/[0.02] to-transparent shadow-lg">
    <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
      <Icon className="w-4 h-4" />
    </div>
    <div className="space-y-0">
      <p className="text-xl font-black text-white leading-none">{value}</p>
      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</p>
    </div>
  </div>
);

const Automations: React.FC = () => {
  const navigate = useNavigate();
  const { 
    workflows, executions, libraryItems, 
    applyTemplate, createWorkflow, duplicateWorkflow, deleteWorkflow, 
    toggleWorkflowActive, deleteLibraryItem 
  } = useWorkflowStore();

  const [activeTab, setActiveTab] = useState<"deployments" | "library">("deployments");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Form State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [environment, setEnvironment] = useState<'development' | 'staging' | 'production'>('development');
  const [priority, setPriority] = useState<'standard' | 'high' | 'critical'>('standard');
  const [triggerType, setTriggerType] = useState<'manual' | 'schedule'>('manual');
  const [schedule, setSchedule] = useState('hourly');
  const [customCron, setCustomCron] = useState('*/5 * * * *');
  
  const projectedJobPattern = useMemo(() => {
    const envCode = environment.slice(0, 4).toUpperCase();
    const priCode = priority.slice(0, 4).toUpperCase();
    const cleanName = (formName || "ID").toUpperCase().replace(/[^A-Z]/g, '');
    const wfCode = cleanName.length > 0 ? cleanName.slice(0, 4) : "ARCH";
    return `${envCode}-${priCode}-${wfCode}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }, [formName, environment, priority]);

  const filteredWorkflows = useMemo(() => {
    return (workflows || []).filter(wf => {
      const matchesSearch = (wf.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : 
                            statusFilter === "active" ? wf.active : !wf.active;
      return matchesSearch && matchesStatus;
    });
  }, [workflows, searchTerm, statusFilter]);

  const filteredLibrary = useMemo(() => {
    return (libraryItems || []).filter(tpl => {
      const matchesSearch = tpl.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            tpl.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "All Categories" ? true : tpl.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [libraryItems, searchTerm, categoryFilter]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    
    const scheduleValue = triggerType === 'schedule' 
      ? (schedule === 'custom' ? customCron : schedule) 
      : undefined;

    const id = createWorkflow({
      name: formName,
      description: formDescription,
      triggerType,
      schedule: scheduleValue,
      environment,
      priority
    });
    
    setFormName("");
    setFormDescription("");
    setEnvironment('development');
    setPriority('standard');
    setIsCreateModalOpen(false);
    navigate(`/editor/${id}`);
  };

  const FREQUENCIES = [
    { id: 'hourly', label: 'Hourly', icon: Clock },
    { id: 'daily', label: 'Daily', icon: Calendar },
    { id: 'custom', label: 'Custom', icon: Settings2 },
  ];

  const ENVIRONMENTS = [
    { id: 'development', label: 'Dev', code: 'DEV', color: 'emerald', icon: Code },
    { id: 'staging', label: 'Staging', code: 'STG', color: 'indigo', icon: Server },
    { id: 'production', label: 'Prod', code: 'PRD', color: 'rose', icon: Shield },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide relative z-10 h-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sky-400">
              <Zap className="w-3 h-3 fill-sky-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">OpenFlow Orchestrator</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">
              {activeTab === 'deployments' ? 'Automations' : 'Workflow Library'}
            </h1>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-950 font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Create Workflow
          </button>
        </header>

        <div className="flex p-1 bg-black/40 rounded-xl border border-white/10 w-fit">
          <button onClick={() => setActiveTab('deployments')} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'deployments' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Deployments</button>
          <button onClick={() => setActiveTab('library')} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'library' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Library</button>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeTab === 'deployments' ? (
            <>
              <StatCard label="Live Flows" value={workflows.length} icon={Workflow} color="sky" />
              <StatCard label="Active" value={workflows.filter(w => w.active).length} icon={Activity} color="emerald" />
              <StatCard label="Uptime" value="99.9%" icon={CheckCircle2} color="indigo" />
              <StatCard label="Logs" value={executions.length} icon={FileText} color="amber" />
            </>
          ) : (
            <>
              <StatCard label="Total Blueprints" value={libraryItems.length} icon={Layers} color="sky" />
              <StatCard label="AI Flows" value={libraryItems.filter(i => i.category === 'AI Ops').length} icon={Sparkles} color="amber" />
              <StatCard label="Infrastructure" value={libraryItems.filter(i => i.category === 'DevOps').length} icon={Terminal} color="emerald" />
              <StatCard label="Quality" value="Stable" icon={Cpu} color="indigo" />
            </>
          )}
        </section>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3 rounded-xl glass-card border border-white/10 bg-black/20">
          <div className="flex items-center gap-3 w-full md:w-80 relative group">
            <Search className="absolute left-3 w-3.5 h-3.5 text-slate-500" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent border-none rounded-lg pl-10 pr-4 py-1.5 text-[11px] text-slate-300 focus:outline-none placeholder:text-slate-600 font-medium"
            />
          </div>
          <div className="flex items-center gap-4">
            {activeTab === 'deployments' && (
              <div className="flex p-0.5 bg-black/40 rounded-lg border border-white/5">
                {(["all", "active", "paused"] as const).map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{s}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl glass-card border border-white/10 overflow-hidden shadow-xl bg-black/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-6 py-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Name</th>
                <th className="px-6 py-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Env / Context</th>
                <th className="px-6 py-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Stats</th>
                <th className="px-6 py-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Updated</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeTab === 'deployments' ? (
                filteredWorkflows.map((wf) => (
                  <tr key={wf.id} className="group hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/editor/${wf.id}`} className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${wf.active ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-slate-800/50 border-white/10 text-slate-500'}`}>
                          <Workflow className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <p className="text-xs font-black text-white group-hover:text-sky-400">{wf.name}</p>
                             {wf.triggerType === 'schedule' && (
                               <div className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[7px] font-black uppercase tracking-widest">Auto</div>
                             )}
                          </div>
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{wf.id.split('_')[1]}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border ${wf.environment === 'production' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : wf.environment === 'staging' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                          {wf.environment}
                        </span>
                        <div className={`inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest ${wf.active ? 'text-emerald-400' : 'text-slate-500'}`}>
                          <div className={`w-1 h-1 rounded-full ${wf.active ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                          {wf.active ? 'Running' : 'Paused'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[9px] font-mono text-slate-400 bg-black/40 px-2 py-1 rounded-md">{(wf.nodes || []).length}N</span>
                    </td>
                    <td className="px-6 py-4 text-[10px] text-slate-500 font-medium">{new Date(wf.updatedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => toggleWorkflowActive(wf.id)} className={`p-2 rounded-lg border transition-all ${wf.active ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}><Power className="w-3.5 h-3.5" /></button>
                        <button onClick={() => duplicateWorkflow(wf.id)} className="p-2 bg-black/40 border border-white/10 rounded-lg text-slate-500 hover:text-sky-400"><Copy className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { if(confirm("Archive deployment?")) deleteWorkflow(wf.id); }} className="p-2 bg-black/40 border border-white/10 rounded-lg text-slate-500 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredLibrary.map((tpl) => (
                  <tr key={tpl.id} className="group hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border bg-${tpl.color}-500/10 border-${tpl.color}-500/20 text-${tpl.color}-400`}><CategoryIcon category={tpl.category} /></div>
                        <div>
                          <p className="text-xs font-black text-white group-hover:text-sky-400">{tpl.name}</p>
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{tpl.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-[8px] font-black uppercase text-slate-400">{tpl.category}</span></td>
                    <td className="px-6 py-4"><div className={`text-[8px] font-black uppercase tracking-widest ${tpl.complexity === 'High' ? 'text-rose-400' : 'text-emerald-400'}`}>{tpl.complexity}</div></td>
                    <td className="px-6 py-4"><span className="text-[9px] font-mono text-slate-500">v1.2.0</span></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { const id = applyTemplate(tpl); navigate(`/editor/${id}`); }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-500 text-white font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all">Use Blueprint</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl glass-card border border-white/10 rounded-[32px] shadow-[0_32px_96px_-16px_rgba(0,0,0,0.9)] overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]">
            <header className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-500/20 rounded-2xl border border-sky-500/30">
                  <Fingerprint className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight uppercase leading-none">Initialize Architecture</h2>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-500/60" /> 
                    Governance Framework Active
                  </p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all">
                <X className="w-6 h-6" />
              </button>
            </header>
            
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-5 gap-8 scrollbar-hide bg-black/10">
              {/* Primary Configuration */}
              <div className="md:col-span-3 space-y-6">
                <section className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Briefcase className="w-3 h-3" /> Metadata
                  </label>
                  <input 
                    required 
                    autoFocus 
                    value={formName} 
                    onChange={(e) => setFormName(e.target.value)} 
                    placeholder="Workflow Label..." 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500/50 shadow-inner placeholder:text-slate-700 font-bold transition-all" 
                  />
                  <textarea 
                    value={formDescription} 
                    onChange={(e) => setFormDescription(e.target.value)} 
                    placeholder="Technical scope & objectives..." 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500/50 resize-none shadow-inner h-24 placeholder:text-slate-700 transition-all leading-relaxed" 
                  />
                </section>

                <section className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Layout className="w-3 h-3" /> Environment
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                     {ENVIRONMENTS.map(env => (
                       <button
                         key={env.id}
                         type="button"
                         onClick={() => setEnvironment(env.id as any)}
                         className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all group relative overflow-hidden ${environment === env.id ? `bg-${env.color}-500/10 border-${env.color}-500/30 text-${env.color}-400 shadow-lg` : 'bg-black/20 border-white/5 text-slate-600 hover:text-slate-400'}`}
                       >
                         <env.icon className="w-4 h-4" />
                         <span className="text-[9px] font-black uppercase tracking-widest">{env.label}</span>
                         {environment === env.id && <div className={`absolute bottom-0 left-0 w-full h-1 bg-${env.color}-500`} />}
                       </button>
                     ))}
                  </div>
                </section>
              </div>

              {/* Control Parameters */}
              <div className="md:col-span-2 space-y-6">
                <div className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-6">
                  <section className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                       <Zap className="w-3 h-3 text-amber-500" /> Priority
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {(['standard', 'high', 'critical'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${priority === p ? 'bg-sky-500 border-sky-400 text-white shadow-md' : 'bg-black/30 border-white/5 text-slate-500 hover:bg-white/5'}`}
                        >
                           <div className="flex items-center gap-3">
                              <div className={`w-1.5 h-1.5 rounded-full ${p === 'critical' ? 'bg-rose-500' : p === 'high' ? 'bg-amber-500' : 'bg-sky-500'}`} />
                              {p}
                           </div>
                           {priority === p && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3 h-3 text-indigo-400" /> Trigger
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setTriggerType(triggerType === 'manual' ? 'schedule' : 'manual')}
                        className={`flex items-center gap-2 px-2 py-0.5 rounded-full border transition-all ${triggerType === 'schedule' ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-slate-800/40 border-white/5 text-slate-600'}`}
                      >
                         <span className="text-[7px] font-black uppercase">{triggerType === 'schedule' ? 'Auto' : 'Manual'}</span>
                         {triggerType === 'schedule' ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5 opacity-40" />}
                      </button>
                    </div>

                    <div className="bg-black/30 rounded-2xl border border-white/5 overflow-hidden">
                      {triggerType === 'schedule' ? (
                        <div className="p-2 grid grid-cols-3 gap-2">
                           {FREQUENCIES.map(freq => (
                             <button 
                               key={freq.id} 
                               type="button" 
                               onClick={() => setSchedule(freq.id)} 
                               className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all ${schedule === freq.id ? 'bg-sky-500/20 border-sky-500/40 text-sky-400' : 'bg-transparent border-transparent text-slate-600 hover:text-slate-400'}`}
                             >
                               <freq.icon className="w-3.5 h-3.5" /> 
                               <span className="hidden lg:block">{freq.label}</span>
                             </button>
                           ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center opacity-40">
                           <Activity className="w-5 h-5 text-slate-700 mx-auto mb-1" />
                           <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Manual Start</p>
                        </div>
                      )}
                    </div>
                  </section>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">
                       <Shield className="w-3 h-3" /> Hash
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 shadow-inner">
                       <p className="text-[10px] font-mono text-emerald-500/70 tracking-tighter truncate font-bold">{projectedJobPattern}</p>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            <footer className="px-8 py-5 border-t border-white/5 bg-black/40 backdrop-blur-2xl flex items-center justify-between">
               <div className="hidden sm:flex items-center gap-2 text-slate-600">
                  <Cpu className="w-3.5 h-3.5" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Isolated Runtime Instance Ready</span>
               </div>
               <div className="flex items-center gap-4">
                 <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)} 
                  className="px-6 py-2.5 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest hover:bg-white/5 transition-all"
                 >
                   Discard
                 </button>
                 <button 
                  type="submit" 
                  onClick={handleCreateSubmit} 
                  className="px-8 py-3 rounded-2xl bg-white text-slate-950 font-black text-[9px] uppercase tracking-[0.3em] shadow-xl hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-3 group"
                 >
                   Provision Flow 
                   <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </button>
               </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Automations;
