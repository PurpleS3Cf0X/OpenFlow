
import React, { useState, useMemo } from 'react';
import { 
  Plus, Workflow, Zap, Trash2, Search, Copy, Power,
  ChevronDown, Activity, CheckCircle2, FileText, Sparkles, Terminal, Database,
  ArrowRight, BookOpen, Layers, Cpu, ShieldCheck, Eye, Bot, X
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
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

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
    const id = createWorkflow(formName, formDescription);
    setIsCreateModalOpen(false);
    navigate(`/editor/${id}`);
  };

  const categories = ["All Categories", ...Array.from(new Set(libraryItems.map(i => i.category)))];

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
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg hover:shadow-sky-500/20 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Create Workflow
          </button>
        </header>

        <div className="flex p-1 bg-black/40 rounded-xl border border-white/10 w-fit">
          <button 
            onClick={() => setActiveTab('deployments')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'deployments' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Deployments
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'library' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Library
          </button>
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
            {activeTab === 'deployments' ? (
              <div className="flex p-0.5 bg-black/40 rounded-lg border border-white/5">
                {(["all", "active", "paused"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 focus:outline-none appearance-none hover:text-white transition-all cursor-pointer"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="rounded-2xl glass-card border border-white/10 overflow-hidden shadow-xl bg-black/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-6 py-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Name</th>
                <th className="px-6 py-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Context</th>
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
                          <p className="text-xs font-black text-white group-hover:text-sky-400">{wf.name}</p>
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{wf.id.split('_')[1]}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${wf.active ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-slate-500 border-white/5'}`}>
                        <div className={`w-1 h-1 rounded-full ${wf.active ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                        {wf.active ? 'Running' : 'Paused'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[9px] font-mono text-slate-400 bg-black/40 px-2 py-1 rounded-md">{(wf.nodes || []).length}N</span>
                    </td>
                    <td className="px-6 py-4 text-[10px] text-slate-500 font-medium">
                      {new Date(wf.updatedAt).toLocaleDateString()}
                    </td>
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
                        <div className={`p-2.5 rounded-xl border bg-${tpl.color}-500/10 border-${tpl.color}-500/20 text-${tpl.color}-400`}>
                          <CategoryIcon category={tpl.category} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white group-hover:text-sky-400">{tpl.name}</p>
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{tpl.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[8px] font-black uppercase text-slate-400">{tpl.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-[8px] font-black uppercase tracking-widest ${tpl.complexity === 'High' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {tpl.complexity}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[9px] font-mono text-slate-500">v1.2.0</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { const id = applyTemplate(tpl); navigate(`/editor/${id}`); }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-500 text-white font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all"
                        >
                          Use Blueprint
                        </button>
                        <button 
                          onClick={() => { if(confirm("Remove from library?")) deleteLibraryItem(tpl.id); }}
                          className="p-2 bg-black/40 border border-white/10 rounded-lg text-slate-500 hover:text-rose-400 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-md glass-card border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-8 animate-in zoom-in-95">
            <header className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-white">New Workflow</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
            </header>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Name</label>
                <input required value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500/50" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Description</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500/50 resize-none" rows={3} />
              </div>
              <button type="submit" className="w-full py-3.5 rounded-xl bg-sky-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                Initialize Architecture
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Automations;
