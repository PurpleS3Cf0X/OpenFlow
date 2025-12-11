
import React, { useState, useMemo } from 'react';
import { 
  Plus, Workflow, Clock, MoreVertical, ArrowUpRight, 
  Zap, Trash2, Search, Filter, Copy, Power,
  ChevronDown, Activity, CheckCircle2, AlertCircle, Info, X, FileText
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorkflowStore } from '../store.ts';

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

const CreateWorkflowModal = ({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (name: string, description: string) => void }) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="w-[500px] glass-card rounded-[32px] border border-white/10 shadow-2xl p-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-500/10 rounded-2xl border border-sky-500/20">
              <Plus className="w-6 h-6 text-sky-400" />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight uppercase">New Flow</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-slate-500"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity</label>
            <input 
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Stripe Data Sync"
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500/50 font-bold transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
            <textarea 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe the operational scope..."
              rows={3}
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500/50 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-10">
          <button 
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button 
            disabled={!name.trim()}
            onClick={() => onSubmit(name, desc)}
            className="flex-1 py-4 rounded-2xl bg-sky-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20"
          >
            Initialize Canvas
          </button>
        </div>
      </div>
    </div>
  );
};

const Automations: React.FC = () => {
  const navigate = useNavigate();
  
  const workflows = useWorkflowStore(state => state.workflows);
  const executions = useWorkflowStore(state => state.executions);
  const createWorkflow = useWorkflowStore(state => state.createWorkflow);
  const duplicateWorkflow = useWorkflowStore(state => state.duplicateWorkflow);
  const deleteWorkflow = useWorkflowStore(state => state.deleteWorkflow);
  const toggleWorkflowActive = useWorkflowStore(state => state.toggleWorkflowActive);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredWorkflows = useMemo(() => {
    return (workflows || []).filter(wf => {
      const nameMatch = (wf.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const descMatch = (wf.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || descMatch;
      
      const matchesStatus = statusFilter === "all" ? true : 
                            statusFilter === "active" ? wf.active : !wf.active;
      return matchesSearch && matchesStatus;
    });
  }, [workflows, searchTerm, statusFilter]);

  const activeCount = (workflows || []).filter(w => w.active).length;
  const successRate = executions.length > 0 
    ? ((executions.filter(e => e.status === 'success').length / executions.length) * 100).toFixed(0) + '%'
    : '100%';

  const handleModalSubmit = (name: string, description: string) => {
    const id = createWorkflow(name, description);
    setIsModalOpen(false);
    navigate(`/editor/${id}`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 lg:p-12 scrollbar-hide relative z-10 h-full">
      <CreateWorkflowModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleModalSubmit} 
      />

      <div className="max-w-7xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sky-400 mb-1">
              <Zap className="w-4 h-4 fill-sky-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Automations Hub</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Deployments</h1>
            <p className="text-slate-400 max-w-lg font-medium text-sm">Design, monitor, and scale your visual workflows across the global infrastructure.</p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-sky-500/20 hover:shadow-sky-500/40 transition-all hover:-translate-y-1 active:scale-95 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Create Workflow
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Total Deployments" value={workflows.length} icon={Workflow} color="sky" />
          <StatCard label="Active Instances" value={activeCount} icon={Activity} color="emerald" />
          <StatCard label="Idle / Paused" value={workflows.length - activeCount} icon={Clock} color="amber" />
          <StatCard label="Reliability Score" value={successRate} icon={CheckCircle2} color="indigo" />
        </section>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-2 px-4 rounded-[20px] glass-card border border-white/5 bg-black/20">
          <div className="flex items-center gap-3 w-full md:w-96 relative group">
            <Search className={`absolute left-4 w-4 h-4 transition-colors ${searchTerm ? 'text-sky-400' : 'text-slate-500 group-focus-within:text-sky-400'}`} />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or description..."
              className="w-full bg-transparent border-none rounded-xl pl-12 pr-10 py-3 text-xs text-slate-300 focus:outline-none placeholder:text-slate-600 font-medium"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 p-1 rounded-md hover:bg-white/10 text-slate-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
              {(["all", "active", "paused"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl glass-card border border-white/5 overflow-hidden shadow-2xl bg-black/10 backdrop-blur-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Deployment</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Infrastructure</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Last Sync</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredWorkflows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-600">
                      <Workflow className="w-12 h-12 opacity-10 animate-pulse" />
                      <p className="text-sm font-bold uppercase tracking-widest italic opacity-40">No matching automations found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWorkflows.map((wf) => (
                  <tr key={wf.id} className="group hover:bg-white/[0.03] transition-colors duration-300">
                    <td className="px-8 py-6">
                      <Link to={`/editor/${wf.id}`} className="flex items-center gap-4 group/item">
                        <div className={`p-3 rounded-2xl border transition-all duration-300 ${wf.active ? 'bg-sky-500/10 border-sky-500/20 text-sky-400 group-hover/item:shadow-[0_0_15px_rgba(14,165,233,0.2)]' : 'bg-slate-800/50 border-white/5 text-slate-500'}`}>
                          <Workflow className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-200 group-hover/item:text-sky-400 transition-colors flex items-center gap-2">
                            {wf.name}
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-1 max-w-[300px]">{wf.description}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                          wf.active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800/20 border-white/5 text-slate-500'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${wf.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                          {wf.active ? 'Operational' : 'Paused'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <code className="text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-1 rounded border border-white/5 uppercase tracking-tighter">
                          {(wf.nodes || []).length} Nodes
                        </code>
                        <div className="h-4 w-px bg-white/5" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{(wf.edges || []).length} Edges</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-300">{new Date(wf.updatedAt).toLocaleDateString()}</span>
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                          {new Date(wf.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => { e.preventDefault(); toggleWorkflowActive(wf.id); }}
                          className={`p-2 rounded-xl border transition-all ${wf.active ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'}`}
                          title={wf.active ? "Pause Execution" : "Activate Flow"}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.preventDefault(); duplicateWorkflow(wf.id); }}
                          className="p-2 bg-black/40 border border-white/5 rounded-xl text-slate-500 hover:text-sky-400 transition-all"
                          title="Duplicate Automation"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.preventDefault(); if(confirm(`Confirm permanent deletion of ${wf.name}?`)) deleteWorkflow(wf.id); }}
                          className="p-2 bg-black/40 border border-white/5 rounded-xl text-slate-500 hover:text-rose-400 transition-all"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Automations;
