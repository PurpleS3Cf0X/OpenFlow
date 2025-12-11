
import React from 'react';
import { FunctionSquare, Info, Zap, ChevronDown, Layers, ShieldCheck, Key } from 'lucide-react';
import { useWorkflowStore } from '../store.ts';

interface ParameterFieldProps {
  label: string;
  value: any;
  type: string;
  onChange: (value: any) => void;
  onOpenExpression: () => void;
  onFocus?: () => void;
  description?: string;
  options?: { label: string; value: any }[];
  credentialType?: string;
}

const ParameterField: React.FC<ParameterFieldProps> = ({ 
  label, value, type, onChange, onOpenExpression, onFocus, description, options, credentialType 
}) => {
  const isExpression = typeof value === 'string' && value.startsWith('{{');
  const isLarge = label.toLowerCase().includes('body') || label.toLowerCase().includes('code') || label.toLowerCase().includes('schema') || label.toLowerCase().includes('json');
  
  const credentials = useWorkflowStore(s => s.credentials);
  const filteredCredentials = credentials.filter(c => !credentialType || c.type === credentialType);

  return (
    <div className="space-y-2 group/field">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
          {label}
          {description && (
            <div className="relative group/info">
              <Info className="w-3 h-3 cursor-help text-slate-600 hover:text-sky-400 transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-4 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl text-[10px] font-medium text-slate-300 opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-[60] backdrop-blur-2xl">
                {description}
              </div>
            </div>
          )}
        </label>
        <div className="flex items-center gap-2">
          {isExpression && (
            <div className="text-[8px] font-black text-sky-400 uppercase tracking-widest bg-sky-400/10 px-2 py-0.5 rounded-md flex items-center gap-1.5 border border-sky-400/20 shadow-sm shadow-sky-400/10">
              <div className="w-1 h-1 rounded-full bg-sky-400 animate-pulse" />
              Dynamic
            </div>
          )}
          {type !== 'credential' && (
            <button 
              type="button"
              onClick={onOpenExpression}
              className={`p-1.5 rounded-lg transition-all border flex items-center gap-2 px-2.5 ${isExpression ? 'bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/20' : 'border-white/5 text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/20'}`}
              title="Open Full Expression Hub"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="text-[8px] font-black uppercase tracking-widest">Hub</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative group/input">
        {type === 'options' ? (
          <div className="relative">
            <select 
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={onFocus}
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500/50 appearance-none font-bold transition-all cursor-pointer"
            >
              {options ? (
                options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
              ) : (
                <>
                  <option value="GET">HTTP GET</option>
                  <option value="POST">HTTP POST</option>
                  <option value="PUT">HTTP PUT</option>
                  <option value="DELETE">HTTP DELETE</option>
                </>
              )}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        ) : type === 'credential' ? (
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400">
               <ShieldCheck className="w-4 h-4" />
            </div>
            <select 
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={onFocus}
              className="w-full bg-sky-500/5 border border-sky-500/20 rounded-2xl pl-12 pr-10 py-3.5 text-xs text-sky-200 focus:outline-none focus:ring-1 focus:ring-sky-500/50 appearance-none font-black transition-all cursor-pointer shadow-inner"
            >
              <option value="">- Select From Vault -</option>
              {filteredCredentials.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown className="w-4 h-4 text-sky-400" />
            </div>
          </div>
        ) : isLarge ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            rows={5}
            placeholder={description || `Enter ${label.toLowerCase()}...`}
            className={`w-full bg-black/40 border rounded-2xl px-5 py-4 text-xs transition-all focus:outline-none focus:ring-1 focus:ring-sky-500/30 font-mono scrollbar-hide ${isExpression ? 'text-sky-400 border-sky-500/30 bg-sky-500/[0.03]' : 'text-slate-200 border-white/5 placeholder:text-slate-700'}`}
          />
        ) : (
          <div className="relative">
            <input 
              type={type === 'number' ? 'number' : 'text'}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={onFocus}
              className={`w-full bg-black/40 border rounded-2xl px-5 py-3.5 text-xs transition-all focus:outline-none focus:ring-1 focus:ring-sky-500/30 font-bold ${isExpression ? 'text-sky-400 font-mono italic border-sky-500/30 bg-sky-500/[0.03]' : 'text-slate-200 border-white/5 placeholder:text-slate-700'}`}
              placeholder={description || `Enter ${label.toLowerCase()}...`}
            />
            {isExpression && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParameterField;
