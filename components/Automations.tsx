
import React, { useState, useMemo } from 'react';
import { 
  Plus, Workflow, Clock, MoreVertical, ArrowUpRight, 
  Zap, Trash2, Search, Filter, Copy, Power,
  ChevronDown, Activity, CheckCircle2, AlertCircle, Info, X, FileText, Sparkles, Terminal, HardDrive, Shield, ShoppingCart, GitBranch, Briefcase, Languages, Database,
  ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorkflowStore } from '../store.ts';
import { NodeType } from '../types.ts';

const SAMPLE_TEMPLATES = [
  { 
    id: 'tpl_vision',
    name: 'Vision Triage',
    description: 'Analyze screenshots with Gemini and create helpdesk tickets.',
    icon: Sparkles,
    color: 'sky',
    category: 'AI Ops',
    nodes: [
      { id: 'v1', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Support Webhook', type: NodeType.WEBHOOK, params: {}, outputs: ['default'] } },
      { id: 'v2', type: 'custom', position: { x: 300, y: 0 }, data: { label: 'AI Image Analysis', type: NodeType.GEMINI, params: { prompt: "Analyze the attached screenshot for technical errors.", model: 'gemini-2.5-flash' }, outputs: ['default'] } },
      { id: 'v3', type: 'custom', position: { x: 600, y: 0 }, data: { label: 'Zendesk Dispatch', type: NodeType.HTTP_REQUEST, params: { method: 'POST', url: 'https://api.zendesk.com/v2/tickets' }, outputs: ['default'] } }
    ],
    edges: [{ id: 'e1', source: 'v1', target: 'v2', animated: true }, { id: 'e2', source: 'v2', target: 'v3', animated: true }]
  },
  { 
    id: 'tpl_healing',
    name: 'Auto-Healing Infra',
    description: 'Monitor logs via SSH and apply AI-suggested fixes.',
    icon: Terminal,
    color: 'indigo',
    category: 'DevOps',
    nodes: [
      { id: 'h1', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Hourly Health Check', type: NodeType.CRON, params: { interval: '0 * * * *' }, outputs: ['default'] } },
      { id: 'h2', type: 'custom', position: { x: 300, y: 0 }, data: { label: 'Read Syslogs', type: NodeType.SSH, params: { command: 'tail -n 50 /var/log/syslog' }, outputs: ['default'] } },
      { id: 'h3', type: 'custom', position: { x: 600, y: 0 }, data: { label: 'Diagnose Issue', type: NodeType.GEMINI, params: { prompt: "Explain these logs and provide a bash command to fix it." }, outputs: ['default'] } },
      { id: 'h4', type: 'custom', position: { x: 900, y: 0 }, data: { label: 'Apply Hotfix', type: NodeType.SSH, params: { command: '{{ $json.suggested_command }}' }, outputs: ['default'] } }
    ],
    edges: [{ id: 'e1', source: 'h1', target: 'h2', animated: true }, { id: 'e2', source: 'h2', target: 'h3', animated: true }, { id: 'e3', source: 'h3', target: 'h4', animated: true }]
  },
];

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
  <div className="p-5 rounded-2xl glass-card border border-white/5 flex items-center gap-4 bg-gradient-to-br from-white/[0.02] to-transparent">
    <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-400 border border-${color}-500/20 shadow-lg shadow-${color}-500/5`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="space-y-0.5">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
  </div>
);

const Automations: React.FC = () => {
  const navigate = useNavigate();
  const { workflows, executions, applyTemplate, createWorkflow, duplicateWorkflow, deleteWorkflow, toggleWorkflowActive } = useWorkflowStore();

  const [activeTab, setActiveTab] = useState<"deployments" | "templates">("deployments");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");
  
  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const filteredWorkflows = useMemo(() => {
    return (workflows || []).filter(wf => {
      const nameMatch = (wf.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch;
      const matchesStatus = statusFilter === "all" ? true : 
                            statusFilter === "active" ? wf.active : !wf.active;
      return matchesSearch && matchesStatus;
    });
  }, [workflows, searchTerm, statusFilter]);

  const activeCount = (workflows || []).filter(w => w.active).length;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    
    const id = createWorkflow(formName, formDescription || "Strategic automation architecture");
    setIsCreateModalOpen(false);
    setFormName("");
    setFormDescription("");
    navigate(`/editor/${id}`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 lg:p-12 scrollbar-hide relative z-10 h-full">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sky-400 mb-1">
              <Zap className="w-4 h-4 fill-sky-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">OpenFlow Orchestrator</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Automations</h1>
            <p className="text-slate-400 max-w-lg font-medium text-sm">Monitor live deployments or accelerate development using specialized blueprints.</p>
          </div>
          
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-sky-500/20 hover:shadow-sky-500/40 transition-all hover:-translate-y-1 active:scale-95 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Create Workflow
          </button>
        </header>

        {/* Primary Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex p-1 bg-black/40 rounded-[20px] border border-white/10 backdrop-blur-3xl shadow-2xl">
            <button 
              onClick={() => setActiveTab('deployments')}
              className={`flex items-center gap-3 px-10 py-4 rounded-[16px] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'deployments' ? 'bg-sky-500 text-white shadow-xl shadow-sky-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Workflow className="w-4 h-4" />
              My Deployments
            </button>
            <button 
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-3 px-10 py-4 rounded-[16px] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'templates' ? 'bg-sky-500 text-white shadow-xl shadow-sky-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Sparkles className="w-4 h-4" />
              Template Library
            </button>
          </div>
        </div>

        {activeTab === 'deployments' ? (
          <div className="space-y-10 animate-in fade-in duration-500">
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Live Deployments" value={workflows.length} icon={Workflow} color="sky" />
              <StatCard label="Active Instances" value={activeCount} icon={Activity} color="emerald" />
              <StatCard label="Uptime Reliability" value="99.9%" icon={CheckCircle2} color="indigo" />
              <StatCard label="Audit Pipeline" value={executions.length} icon={FileText} color="amber" />
            </section>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-2 px-4 rounded-[20px] glass-card border border-white/10 bg-black/20">
              <div className="flex items-center gap-3 w-full md:w-96 relative group">
                <Search className={`absolute left-4 w-4 h-4 transition-colors ${searchTerm ? 'text-sky-400' : 'text-slate-500 group-focus-within:text-sky-400'}`} />
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter deployments..."
                  className="w-full bg-transparent border-none rounded-xl pl-12 pr-10 py-3 text-xs text-slate-300 focus:outline-none placeholder:text-slate-600 font-medium"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
                  {(["all", "active", "paused"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[40px] glass-card border border-white/10 overflow-hidden shadow-2xl bg-black/10 backdrop-blur-3xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Deployment</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Nodes</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Last Sync</th>
                    <th className="px-10 py-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredWorkflows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-10 py-32 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-600">
                          <Workflow className="w-12 h-12 opacity-10" />
                          <p className="text-sm font-bold uppercase tracking-widest italic opacity-40">Zero active deployments found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredWorkflows.map((wf) => (
                      <tr key={wf.id} className="group hover:bg-white/[0.03] transition-colors duration-300">
                        <td className="px-10 py-8">
                          <Link to={`/editor/${wf.id}`} className="flex items-center gap-5 group/item">
                            <div className={`p-4 rounded-3xl border transition-all duration-300 ${wf.active ? 'bg-sky-500/10 border-sky-500/20 text-sky-400 shadow-xl shadow-sky-500/5' : 'bg-slate-800/50 border-white/10 text-slate-500'}`}>
                              <Workflow className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-base font-black text-white group-hover/item:text-sky-400 transition-colors">{wf.name}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{wf.description}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-10 py-8">
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                            wf.active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800/20 border-white/5 text-slate-500'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${wf.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                            {wf.active ? 'Operational' : 'Paused'}
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className="text-[11px] font-mono text-slate-400 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">{(wf.nodes || []).length} Nodes</span>
                        </td>
                        <td className="px-10 py-8 text-xs font-bold text-slate-300">
                          {new Date(wf.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => toggleWorkflowActive(wf.id)} className={`p-3 rounded-2xl border transition-all ${wf.active ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'}`}><Power className="w-5 h-5" /></button>
                            <button onClick={() => duplicateWorkflow(wf.id)} className="p-3 bg-black/40 border border-white/10 rounded-2xl text-slate-500 hover:text-sky-400 transition-all"><Copy className="w-5 h-5" /></button>
                            <button onClick={() => { if(confirm("Confirm deletion?")) deleteWorkflow(wf.id); }} className="p-3 bg-black/40 border border-white/10 rounded-2xl text-slate-500 hover:text-rose-400 transition-all"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {SAMPLE_TEMPLATES.map(tpl => (
                <div 
                  key={tpl.id} 
                  onClick={() => { const id = applyTemplate(tpl); navigate(`/editor/${id}`); }}
                  className="group relative p-8 rounded-[32px] glass-card border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent hover:bg-white/[0.08] transition-all cursor-pointer overflow-hidden hover:border-sky-500/40 shadow-2xl"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-${tpl.color}-500/5 blur-[56px] rounded-full group-hover:bg-${tpl.color}-500/15 transition-all`} />
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-${tpl.color}-500/10 border border-${tpl.color}-500/20 text-${tpl.color}-400 flex items-center justify-center shadow-inner`}>
                      <tpl.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md border border-white/5">
                      {tpl.category}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white mb-2 group-hover:text-sky-400 transition-colors">{tpl.name}</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-8 line-clamp-3 h-12">{tpl.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CREATE WORKFLOW MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg glass-card border border-white/10 rounded-[40px] shadow-[0_48px_128px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-indigo-600 to-sky-500 animate-pulse" />
            
            <form onSubmit={handleCreateSubmit} className="p-12 space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white tracking-tight">New Automation</h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Define Deployment Scope</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)} 
                  className="p-3 hover:bg-white/10 rounded-2xl text-slate-500 transition-all active:scale-90"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Workflow Identity</label>
                  <input 
                    autoFocus
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Multimodal Threat Detection"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500/50 transition-all font-bold placeholder:text-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Scope Description</label>
                  <textarea 
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe the architectural intent..."
                    rows={3}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500/50 transition-all font-medium placeholder:text-slate-700 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancel Draft
                </button>
                <button 
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl bg-sky-500 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-sky-500/20 hover:scale-[1.02] active:scale-95 transition-all group"
                >
                  Initialize Flow
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Automations;
