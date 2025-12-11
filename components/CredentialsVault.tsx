
import React from 'react';
import { 
  ShieldCheck, Plus, Search, Key, Globe, Database, 
  MoreVertical, RefreshCw, Trash2, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { ICredential } from '../types';

const MOCK_CREDS: ICredential[] = [
  { id: '1', name: 'GitHub OAuth', type: 'OAuth2', updatedAt: '2h ago', status: 'valid' },
  { id: '2', name: 'Stripe Live Key', type: 'Header Auth', updatedAt: '1d ago', status: 'valid' },
  { id: '3', name: 'Postgres Production', type: 'Database', updatedAt: '5m ago', status: 'invalid' },
  { id: '4', name: 'OpenAI API Key', type: 'API Key', updatedAt: '3d ago', status: 'untested' },
];

const CredentialsVault: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-sky-400" />
              Vault
            </h1>
            <p className="text-slate-400 text-sm">Securely manage your API keys and authentication secrets.</p>
          </div>
          
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-sky-500/20 hover:shadow-sky-500/40 transition-all hover:-translate-y-1">
            <Plus className="w-5 h-5" />
            New Credentials
          </button>
        </header>

        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                placeholder="Search vault..."
                className="w-full bg-black/20 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1 rounded-full bg-black/20">
                {MOCK_CREDS.length} Total
              </span>
            </div>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/20">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Check</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {MOCK_CREDS.map((cred) => (
                <tr key={cred.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-sky-500/10">
                        <Key className="w-4 h-4 text-sky-400" />
                      </div>
                      <span className="text-sm font-semibold text-slate-200">{cred.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold text-slate-400 uppercase">{cred.type}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      {cred.status === 'valid' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {cred.status === 'invalid' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                      <span className={`text-xs font-medium ${
                        cred.status === 'valid' ? 'text-emerald-400' : 
                        cred.status === 'invalid' ? 'text-rose-400' : 'text-slate-500'
                      }`}>
                        {cred.status.charAt(0).toUpperCase() + cred.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs text-slate-500">{cred.updatedAt}</td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-sky-500/20 rounded-lg text-sky-400" title="Re-test"><RefreshCw className="w-4 h-4" /></button>
                      <button className="p-2 hover:bg-rose-500/20 rounded-lg text-rose-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      <button className="p-2 hover:bg-white/10 rounded-lg text-slate-500"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CredentialsVault;
