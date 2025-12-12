
import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, Plus, Search, Key, Globe, Database, 
  MoreVertical, RefreshCw, Trash2, CheckCircle2, AlertTriangle,
  X, Terminal, Lock, Server, Link2, Eye, EyeOff, ShieldAlert, Check
} from 'lucide-react';
import { useWorkflowStore } from '../store.ts';
import { ICredential } from '../types.ts';

const CredentialIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'apiKey': return <Key className="w-4 h-4 text-amber-400" />;
    case 'ssh': return <Terminal className="w-4 h-4 text-emerald-400" />;
    case 'oauth2': return <Link2 className="w-4 h-4 text-sky-400" />;
    case 'database': return <Database className="w-4 h-4 text-indigo-400" />;
    default: return <ShieldCheck className="w-4 h-4 text-slate-400" />;
  }
};

const CredentialsVault: React.FC = () => {
  const { credentials, addCredential, deleteCredential } = useWorkflowStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  
  // Form State
  const [newCredType, setNewCredType] = useState<ICredential['type']>('apiKey');
  const [formData, setFormData] = useState<Record<string, string>>({ name: "" });
  const [showSecret, setShowSecret] = useState(false);

  const filtered = useMemo(() => {
    return credentials.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [credentials, searchTerm]);

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    // Simulate API verification delay
    await new Promise(r => setTimeout(r, 1500));
    setTestingId(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, ...data } = formData;
    if (!name) return;

    addCredential({
      name,
      type: newCredType,
      data
    });

    // Reset and Close
    setFormData({ name: "" });
    setIsModalOpen(false);
  };

  const renderFormFields = () => {
    switch (newCredType) {
      case 'apiKey':
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">API Key / Secret</label>
              <input 
                type="password"
                required
                value={formData.key || ''} 
                onChange={e => setFormData({...formData, key: e.target.value})}
                placeholder="sk_live_..."
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500/50"
              />
            </div>
          </div>
        );
      case 'ssh':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Host / IP</label>
                <input 
                  required
                  value={formData.host || ''} 
                  onChange={e => setFormData({...formData, host: e.target.value})}
                  placeholder="192.168.1.1"
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Username</label>
                <input 
                  required
                  value={formData.user || ''} 
                  onChange={e => setFormData({...formData, user: e.target.value})}
                  placeholder="root"
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Private Key (RSA/Ed25519)</label>
              <textarea 
                required
                rows={5}
                value={formData.privateKey || ''} 
                onChange={e => setFormData({...formData, privateKey: e.target.value})}
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[10px] font-mono text-emerald-400 focus:outline-none resize-none"
              />
            </div>
          </div>
        );
      case 'database':
        return (
          <div className="space-y-4">
             <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Host</label>
                <input required value={formData.host || ''} onChange={e => setFormData({...formData, host: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Port</label>
                <input required value={formData.port || ''} onChange={e => setFormData({...formData, port: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">User</label>
                <input required value={formData.dbUser || ''} onChange={e => setFormData({...formData, dbUser: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Password</label>
                <input type="password" required value={formData.dbPass || ''} onChange={e => setFormData({...formData, dbPass: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" />
              </div>
            </div>
          </div>
        );
      case 'oauth2':
        return (
          <div className="space-y-4">
             <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Client ID</label>
              <input required value={formData.clientId || ''} onChange={e => setFormData({...formData, clientId: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Client Secret</label>
              <input type="password" required value={formData.clientSecret || ''} onChange={e => setFormData({...formData, clientSecret: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 lg:p-12 scrollbar-hide relative z-10">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sky-400 mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Secure Auth Infrastructure</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Vault</h1>
            <p className="text-slate-400 font-medium text-sm">Hardware-level encryption for your integration secrets.</p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-sky-500/20 transition-all hover:-translate-y-1 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add Secret
          </button>
        </header>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-2 px-4 rounded-[24px] glass-card border border-white/5 bg-black/20">
          <div className="flex items-center gap-3 w-full md:w-96 relative group">
            <Search className="absolute left-3 w-4 h-4 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or protocol..."
              className="w-full bg-transparent border-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-300 focus:outline-none placeholder:text-slate-600 font-medium"
            />
          </div>
          <div className="flex items-center gap-6 px-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{credentials.length} Entities Stored</span>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-center gap-2">
               <Lock className="w-3.5 h-3.5 text-emerald-500/60" />
               <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">AES-256 Active</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl glass-card border border-white/5 overflow-hidden shadow-2xl bg-black/10 backdrop-blur-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Entity Name</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Protocol</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Health</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Last Updated</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-600">
                      <ShieldAlert className="w-16 h-16 opacity-10" />
                      <div className="space-y-1">
                        <p className="text-sm font-black uppercase tracking-widest italic opacity-40">The vault is currently empty</p>
                        <p className="text-[10px] font-bold uppercase text-slate-700">Initialize your first secure credential to start orchestrating</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((cred) => (
                  <tr key={cred.id} className="group hover:bg-white/[0.03] transition-colors duration-300">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                          <CredentialIcon type={cred.type} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-200 group-hover:text-sky-400 transition-colors">{cred.name}</p>
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">ID: {cred.id.split('_')[1]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {cred.type}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {cred.status === 'valid' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                        )}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${cred.status === 'valid' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {cred.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-xs text-slate-500 font-medium">{cred.updatedAt}</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleTestConnection(cred.id)}
                          disabled={testingId === cred.id}
                          className="p-3 bg-white/5 hover:bg-sky-500/20 rounded-xl text-sky-400 border border-white/5 transition-all" 
                          title="Verify Logic"
                        >
                          {testingId === cred.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => { if(confirm("Permanently destroy these credentials?")) deleteCredential(cred.id); }}
                          className="p-3 bg-white/5 hover:bg-rose-500/20 rounded-xl text-rose-400 border border-white/5 transition-all" 
                          title="Revoke Access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 border border-white/5">
                          <MoreVertical className="w-4 h-4" />
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

      {/* Dynamic Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-xl glass-card border border-white/10 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <header className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-500/15 rounded-2xl border border-sky-500/20">
                  <ShieldCheck className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight uppercase">Provision Credential</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Encrypted Entity Ingestion</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl text-slate-500 transition-all"><X className="w-6 h-6" /></button>
            </header>
            
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Friendly Name</label>
                  <input 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. Production GitHub Token"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500/50" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Credential Protocol</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['apiKey', 'ssh', 'database', 'oauth2'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewCredType(type)}
                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${newCredType === type ? 'bg-sky-500/20 border-sky-500/40 text-sky-400 shadow-lg' : 'bg-white/5 border-white/5 text-slate-600 hover:text-slate-400'}`}
                      >
                        <CredentialIcon type={type} />
                        <span className="text-[8px] font-black uppercase">{type === 'apiKey' ? 'API Key' : type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                   {renderFormFields()}
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
                 <Lock className="w-5 h-5 text-amber-500/40 flex-shrink-0" />
                 <p className="text-[10px] text-amber-500/60 font-medium leading-relaxed uppercase tracking-wide">
                   Secrets are strictly handled via the isolated vault core. Values are never logged or exposed in client-side trace metadata.
                 </p>
              </div>
            </form>

            <footer className="p-8 border-t border-white/5 bg-black/30 backdrop-blur-xl flex justify-end gap-4">
               <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-4 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-white/5 transition-all"
               >
                 Cancel
               </button>
               <button 
                type="submit" 
                onClick={handleCreateSubmit}
                className="px-12 py-4 rounded-2xl bg-sky-500 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-sky-500/20 hover:scale-[1.02] active:scale-95 transition-all"
               >
                 Inject Secret
               </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default CredentialsVault;
