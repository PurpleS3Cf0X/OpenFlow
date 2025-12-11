
import React from 'react';
import { Zap, Activity, CheckCircle2, AlertCircle, Clock, Workflow, ArrowUpRight, Database } from 'lucide-react';
import { useWorkflowStore } from '../store.ts';
import { Link } from 'react-router-dom';

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
  <div className="p-4 rounded-2xl glass-card border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent shadow-md">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-xl bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
        <Icon className="w-5 h-5" />
      </div>
      <Activity className="w-3.5 h-3.5 text-slate-600" />
    </div>
    <div className="space-y-0">
      <p className="text-2xl font-black text-white leading-none">{value}</p>
      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</p>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { workflows, executions } = useWorkflowStore();
  const successCount = executions.filter(e => e.status === 'success').length;
  const errorCount = executions.filter(e => e.status === 'error').length;

  return (
    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide relative z-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-1">
          <div className="flex items-center gap-2 text-sky-400">
            <Zap className="w-4 h-4 fill-sky-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">OpenFlow Control</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">System Overview</h1>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Flows" value={workflows.length} icon={Workflow} color="sky" />
          <StatCard label="Successful" value={successCount} icon={CheckCircle2} color="emerald" />
          <StatCard label="Errors" value={errorCount} icon={AlertCircle} color="rose" />
          <StatCard label="Nodes Active" value={workflows.reduce((acc, w) => acc + w.nodes.length, 0)} icon={Zap} color="indigo" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                Recent Activity
              </h3>
              <Link to="/history" className="text-[9px] font-bold text-sky-400 hover:underline uppercase tracking-widest">Full History</Link>
            </div>
            
            <div className="glass-card rounded-2xl border border-white/5 overflow-hidden shadow-lg bg-black/10">
              {executions.length === 0 ? (
                <div className="p-10 text-center text-[10px] text-slate-600 italic uppercase font-bold tracking-widest opacity-40">No records found</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {executions.slice(0, 5).map(ex => (
                    <div key={ex.id} className="p-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${ex.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {ex.status === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-200">{ex.workflowName}</p>
                          <p className="text-[8px] text-slate-500 font-medium uppercase">{ex.startedAt}</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 bg-black/40 px-2 py-0.5 rounded border border-white/5">{ex.duration}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link to="/workflows" className="flex items-center justify-between p-3.5 rounded-xl glass-button group hover:border-sky-500/20">
                <span className="text-[10px] font-bold text-slate-300 group-hover:text-white uppercase tracking-widest">New Deployment</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-sky-500" />
              </Link>
              <Link to="/credentials" className="flex items-center justify-between p-3.5 rounded-xl glass-button group hover:border-sky-500/20">
                <span className="text-[10px] font-bold text-slate-300 group-hover:text-white uppercase tracking-widest">Manage Vault</span>
                <Database className="w-3.5 h-3.5 text-sky-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
