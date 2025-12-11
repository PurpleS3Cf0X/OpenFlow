
import React from 'react';
import { Zap, Activity, CheckCircle2, AlertCircle, Clock, Workflow, ArrowUpRight, Database } from 'lucide-react';
import { useWorkflowStore } from '../store.ts';
import { Link } from 'react-router-dom';

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
  <div className="p-6 rounded-3xl glass-card border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
        <Icon className="w-6 h-6" />
      </div>
      <Activity className="w-4 h-4 text-slate-600" />
    </div>
    <div className="space-y-1">
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { workflows, executions } = useWorkflowStore();
  
  const successCount = executions.filter(e => e.status === 'success').length;
  const errorCount = executions.filter(e => e.status === 'error').length;

  return (
    <div className="flex-1 overflow-y-auto p-8 lg:p-12 scrollbar-hide relative z-10">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-sky-400 mb-2">
            <Zap className="w-5 h-5 fill-sky-400" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">OpenFlow Command Center</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Overview</h1>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Total Workflows" value={workflows.length} icon={Workflow} color="sky" />
          <StatCard label="Successful Runs" value={successCount} icon={CheckCircle2} color="emerald" />
          <StatCard label="Failed Runs" value={errorCount} icon={AlertCircle} color="rose" />
          <StatCard label="Total Nodes" value={workflows.reduce((acc, w) => acc + w.nodes.length, 0)} icon={Zap} color="indigo" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                <Clock className="w-5 h-5 text-sky-400" />
                Recent Activity
              </h3>
              <Link to="/history" className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors uppercase tracking-widest">View All History</Link>
            </div>
            
            <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
              {executions.length === 0 ? (
                <div className="p-12 text-center text-slate-600 italic">No executions recorded yet. Run a flow to see results here.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {executions.slice(0, 5).map(ex => (
                    <div key={ex.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${ex.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {ex.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">{ex.workflowName}</p>
                          <p className="text-[10px] text-slate-500 font-medium">Ran at {ex.startedAt}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-black/20 px-2 py-1 rounded border border-white/5">{ex.duration}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-400" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link to="/workflows" className="flex items-center justify-between p-4 rounded-2xl glass-button group">
                <span className="text-sm font-bold text-slate-300 group-hover:text-white">Design New Flow</span>
                <ArrowUpRight className="w-4 h-4 text-sky-500" />
              </Link>
              <Link to="/credentials" className="flex items-center justify-between p-4 rounded-2xl glass-button group">
                <span className="text-sm font-bold text-slate-300 group-hover:text-white">Configure Auth Vault</span>
                <Database className="w-4 h-4 text-sky-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
