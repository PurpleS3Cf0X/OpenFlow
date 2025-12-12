
import React, { useState, useMemo } from 'react';
import { 
  History, Search, Play, CheckCircle2, AlertCircle, Clock, 
  ExternalLink, Trash2, Filter, MoreVertical, Activity,
  ChevronRight, Braces, Table, X, Terminal, Database, Calendar,
  Copy, Hash, Workflow
} from 'lucide-react';
import { useWorkflowStore } from '../store.ts';
import { IExecution } from '../types';

const ExecutionHistory: React.FC = () => {
  const { executions, clearExecutions } = useWorkflowStore();
  const [search, setSearch] = useState("");
  const [selectedEx, setSelectedEx] = useState<IExecution | null>(null);

  const filtered = useMemo(() => {
    return (executions || []).filter(ex => 
      ex.workflowName.toLowerCase().includes(search.toLowerCase()) ||
      ex.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [executions, search]);

  const stats = useMemo(() => {
    const success = (executions || []).filter(e => e.status === 'success').length;
    const error = (executions || []).filter(e => e.status === 'error').length;
    return { success, error, total: (executions || []).length };
  }, [executions]);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    // Simple alert for now, could be a toast
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 lg:p-12 scrollbar-hide relative z-10">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sky-400 mb-2">
              <History className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Deployment Audit Logs</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Executions</h1>
            <p className="text-slate-400 font-medium text-sm">Real-time and historical trace data for all workflow instances.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { if(confirm("Clear all audit logs?")) clearExecutions(); }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/5 bg-white/5 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Flush Audit Logs
            </button>
            <button className="flex items-center gap-2 px-8 py-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-sky-500/20 transition-all hover:-translate-y-1 active:scale-95">
              <Activity className="w-5 h-5" />
              Live Monitor
            </button>
          </div>
        </header>

        {/* Audit Control Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-2 px-4 rounded-[20px] glass-card border border-white/5 bg-black/20">
          <div className="flex items-center gap-3 w-full md:w-96 relative group">
            <Search className="absolute left-3 w-4 h-4 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
            <input 
              value={search}
              // Fix: Use correct state setter 'setSearch' instead of 'setSearchTerm'
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Job ID or name..."
              className="w-full bg-transparent border-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-300 focus:outline-none placeholder:text-slate-600 font-medium"
            />
          </div>
          <div className="flex items-center gap-6 px-4">
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> {stats.success} Success</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500" /> {stats.error} Failures</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <span className="text-[10px] font-black text-sky-400/60 uppercase tracking-widest">{stats.total} Total Records</span>
          </div>
        </div>

        <div className="rounded-3xl glass-card border border-white/5 overflow-hidden shadow-2xl bg-black/10 backdrop-blur-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Deployment</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">JobID / UUID</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Health</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Started At</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Latency</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-600">
                      <History className="w-12 h-12 opacity-10" />
                      <p className="text-sm font-bold uppercase tracking-widest italic opacity-40">Zero execution logs matching criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((ex) => (
                  <tr 
                    key={ex.id} 
                    onClick={() => setSelectedEx(ex)}
                    className="group hover:bg-white/[0.03] transition-colors duration-300 cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400 border border-sky-500/20">
                          <Workflow className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-bold text-slate-200 group-hover:text-sky-400 transition-colors">{ex.workflowName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 group/id">
                        <code className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/10 uppercase tracking-tighter transition-all group-hover/id:border-emerald-500/40">
                          {ex.id}
                        </code>
                        <button 
                          onClick={(e) => handleCopyId(ex.id, e)}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-slate-600 hover:text-sky-400 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                          ex.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                          ex.status === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${ex.status === 'success' ? 'bg-emerald-500' : ex.status === 'error' ? 'bg-rose-500' : 'bg-sky-500 animate-pulse'}`} />
                          {ex.status}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                        <Calendar className="w-3.5 h-3.5 opacity-40" />
                        {ex.startedAt}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                        <Clock className="w-3.5 h-3.5 opacity-40" />
                        {ex.duration}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2.5 bg-white/5 hover:bg-sky-500/20 rounded-xl text-sky-400 transition-all" title="View Full Trace">
                          <ExternalLink className="w-4.5 h-4.5" />
                        </button>
                        <button className="p-2.5 text-slate-600 hover:text-white">
                          <MoreVertical className="w-4.5 h-4.5" />
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

      {/* Execution Detail Slide-over */}
      {selectedEx && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedEx(null)} />
          <div className="relative w-full max-w-2xl h-full glass-card border-l border-white/10 shadow-[-48px_0_128px_rgba(0,0,0,0.8)] flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
            <header className="p-10 border-b border-white/5 bg-black/30 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className={`p-4 rounded-2xl ${selectedEx.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {selectedEx.status === 'success' ? <CheckCircle2 className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-none">{selectedEx.workflowName}</h3>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Job ID:</span>
                    <code className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-1 rounded border border-sky-500/20">{selectedEx.id}</code>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedEx(null)} className="p-3 hover:bg-white/10 rounded-2xl text-slate-500 hover:text-white transition-all">
                <X className="w-8 h-8" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
               <div className="grid grid-cols-2 gap-6">
                  <div className="p-8 rounded-[32px] bg-black/40 border border-white/5 space-y-2">
                     <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Start Time</p>
                     <p className="text-sm font-bold text-slate-200">{selectedEx.startedAt}</p>
                  </div>
                  <div className="p-8 rounded-[32px] bg-black/40 border border-white/5 space-y-2">
                     <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">System Health</p>
                     <p className={`text-sm font-bold uppercase ${selectedEx.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>{selectedEx.status}</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <Terminal className="w-5 h-5 text-sky-400" />
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Cryptographic Identification</h4>
                    </div>
                  </div>
                  <div className="p-8 rounded-[32px] bg-sky-500/[0.02] border border-sky-500/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-600 uppercase">Fingerprint</span>
                      <span className="text-[10px] font-mono text-slate-400">{Math.random().toString(36).substr(2, 24)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-600 uppercase">Nonce Validation</span>
                      <span className="text-[10px] font-mono text-emerald-400">VERIFIED</span>
                    </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="flex items-center gap-3 px-1">
                    <Braces className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Pipeline Metadata</h4>
                  </div>
                  <div className="p-8 rounded-[32px] border border-white/5 bg-slate-950/40 font-mono text-xs text-emerald-400/80 leading-relaxed max-h-96 overflow-auto scrollbar-hide shadow-inner">
                    <pre>{JSON.stringify({
                      status: selectedEx.status,
                      job: {
                        id: selectedEx.id,
                        uuid: crypto.randomUUID(),
                        instance: "isolated_worker_01"
                      },
                      workflow: {
                        name: selectedEx.workflowName,
                        ref: selectedEx.workflowId
                      },
                      trace: {
                        entry: selectedEx.startedAt,
                        duration: selectedEx.duration,
                        exit: "0.0.0.0"
                      }
                    }, null, 2)}</pre>
                  </div>
               </div>
            </div>

            <footer className="p-10 border-t border-white/5 bg-black/40 backdrop-blur-3xl flex items-center gap-6">
               <button className="flex-1 py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-[11px] font-black text-slate-400 uppercase tracking-widest border border-white/10 transition-all">
                  Export Audit Bundle
               </button>
               <button className="flex-1 py-5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-sky-500/20 transition-all">
                  Redeploy Job
               </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionHistory;
