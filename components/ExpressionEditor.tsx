
import React, { useState, useMemo, useEffect } from 'react';
import { X, Code, Terminal, ChevronRight, ChevronDown, Variable, Hash, Type, Braces, Layers } from 'lucide-react';
import { useWorkflowStore } from '../store';

interface ExpressionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue: string;
  onSave: (value: string) => void;
  label: string;
}

interface TreeItemProps {
  name: string;
  value: any;
  path: string;
  onSelect: (p: string) => void;
  depth?: number;
}

const TreeItem: React.FC<TreeItemProps> = ({ name, value, path, onSelect, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(depth < 1); // Auto-open first level
  const isObject = value !== null && typeof value === 'object';
  const displayPath = path ? `${path}.${name}` : name;

  const getIcon = () => {
    if (isObject) return <Braces className="w-3 h-3 text-sky-400/80" />;
    if (typeof value === 'number') return <Hash className="w-3 h-3 text-amber-400" />;
    if (typeof value === 'boolean') return <Zap className="w-3 h-3 text-emerald-400" />;
    return <Type className="w-3 h-3 text-slate-400" />;
  };

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg transition-all duration-200 hover:bg-white/5 cursor-pointer group ${depth > 0 ? 'ml-4' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (isObject) setIsOpen(!isOpen);
          else onSelect(`{{ ${displayPath} }}`);
        }}
      >
        <div className="w-4 h-4 flex items-center justify-center">
          {isObject ? (
            isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500/20 border border-sky-500/40" />
          )}
        </div>
        {getIcon()}
        <span className={`text-[11px] font-bold ${isObject ? 'text-slate-200' : 'text-slate-400'} group-hover:text-sky-400`}>
          {name}
        </span>
        {!isObject && (
          <span className="text-[9px] text-slate-600 truncate opacity-0 group-hover:opacity-100 ml-auto font-mono">
            {String(value)}
          </span>
        )}
      </div>
      {isObject && isOpen && (
        <div className="border-l border-white/5 ml-3.5">
          {Object.entries(value).map(([k, v]) => (
            <TreeItem 
              key={k} 
              name={k} 
              value={v} 
              path={displayPath} 
              onSelect={onSelect} 
              depth={depth + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Zap = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
);

const ExpressionEditor: React.FC<ExpressionEditorProps> = ({ isOpen, onClose, initialValue, onSave, label }) => {
  const [expression, setExpression] = useState(initialValue);
  const currentWorkflow = useWorkflowStore(s => s.currentWorkflow);
  const nodes = currentWorkflow?.nodes || [];

  const mockVariables = useMemo(() => {
    return nodes.map(n => ({
      name: n.data.label,
      id: n.id,
      json: {
        id: Math.floor(Math.random() * 9000) + 1000,
        email: "architect@openflow.io",
        status: "operational",
        profile: {
          firstName: "John",
          lastName: "Doe",
          roles: ["admin", "architect"]
        },
        system: {
          uptime: "99.98%",
          load: 0.45
        }
      }
    }));
  }, [nodes]);

  // Combined context for evaluation
  const context = useMemo(() => {
    const ctx: Record<string, any> = { $json: {} };
    mockVariables.forEach(v => {
      // Map $json to the first node's output by default, or provide node-specific access
      if (!ctx.$json.id) ctx.$json = v.json; 
      ctx[v.name.replace(/\s+/g, '_')] = v.json;
    });
    return ctx;
  }, [mockVariables]);

  const evaluationResult = useMemo(() => {
    if (!expression) return null;
    try {
      // Remove double braces for evaluation
      const codeToEval = expression.replace(/{{|}}/g, '').trim();
      
      // Safety: use new Function to scope evaluation to our context
      // This simulates a basic template engine evaluation
      const keys = Object.keys(context);
      const values = Object.values(context);
      const fn = new Function(...keys, `try { return ${codeToEval}; } catch(e) { return "Reference Error: " + e.message; }`);
      
      const result = fn(...values);
      return result === undefined ? "undefined" : result;
    } catch (e: any) {
      return `Evaluation Error: ${e.message}`;
    }
  }, [expression, context]);

  useEffect(() => {
    if (isOpen) setExpression(initialValue);
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-300">
      <div className="w-[1000px] h-[750px] glass-card rounded-[40px] border border-white/10 flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-500/15 rounded-2xl border border-sky-500/20 shadow-lg shadow-sky-500/10">
              <Code className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight uppercase">Expression Hub</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{label || 'General Config'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl text-slate-500 hover:text-white transition-all active:scale-90">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex flex-row h-full">
            {/* Recursive Variable Picker Sidebar */}
            <div className="w-80 border-r border-white/5 bg-black/30 overflow-y-auto p-6 scrollbar-hide">
              <div className="flex items-center gap-2 mb-6 px-1">
                <Layers className="w-4 h-4 text-sky-400" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Variable Schema</h4>
              </div>
              <div className="space-y-6">
                {mockVariables.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-[10px] text-slate-600 uppercase font-bold">
                    No active input nodes
                  </div>
                ) : (
                  mockVariables.map(v => (
                    <div key={v.id} className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-black text-sky-400/60 uppercase tracking-widest px-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-sky-500/40" />
                         {v.name}
                      </div>
                      <div className="bg-white/[0.02] rounded-2xl p-2 border border-white/5">
                        <TreeItem 
                          name="$json" 
                          value={v.json} 
                          path="" 
                          onSelect={(p) => setExpression(prev => prev + p)} 
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-slate-950/20">
              {/* Script Editor Area */}
              <div className="flex-1 p-8 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Script Editor</span>
                  </div>
                  <span className="text-[9px] font-black text-sky-400/40 uppercase tracking-widest">JavaScript ES6+</span>
                </div>
                <div className="relative flex-1 group">
                   <div className="absolute inset-0 bg-sky-500/5 blur-3xl rounded-[32px] opacity-0 group-focus-within:opacity-100 transition-opacity" />
                   <textarea
                    value={expression}
                    onChange={(e) => setExpression(e.target.value)}
                    placeholder="// Access data using {{ $json.field }} or build dynamic logic..."
                    className="relative w-full h-full bg-black/40 rounded-[32px] border border-white/5 p-8 text-sm font-mono text-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-500/30 resize-none shadow-2xl transition-all"
                  />
                </div>
              </div>

              {/* Real-time Evaluation Footer */}
              <div className="h-64 bg-black/40 border-t border-white/5 p-8 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Terminal className="w-5 h-5 text-emerald-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Evaluation Context Result</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[9px] font-black text-emerald-500/60 uppercase">Streaming active</span>
                  </div>
                </div>
                <div className="flex-1 rounded-[24px] bg-black/30 border border-white/5 p-6 font-mono text-xs overflow-auto text-emerald-400 shadow-inner scrollbar-hide">
                  {expression.trim() ? (
                     <div className="flex flex-col gap-2">
                        <div className="flex items-start gap-3">
                          <span className="text-slate-600 select-none">out:</span>
                          <span className="whitespace-pre-wrap leading-relaxed">
                            {typeof evaluationResult === 'object' ? JSON.stringify(evaluationResult, null, 2) : String(evaluationResult)}
                          </span>
                        </div>
                        {typeof evaluationResult !== 'string' && (
                           <div className="mt-4 pt-4 border-t border-white/5">
                              <span className="text-[9px] text-slate-500 uppercase font-black">Data Type: {typeof evaluationResult}</span>
                           </div>
                        )}
                     </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3">
                      <Zap className="w-8 h-8 text-slate-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Awaiting script input...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-white/5 flex justify-end gap-4 bg-black/30 backdrop-blur-xl">
          <button 
            onClick={onClose}
            className="px-8 py-4 rounded-[20px] hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all active:scale-95"
          >
            Cancel Draft
          </button>
          <button 
            onClick={() => { onSave(expression); onClose(); }}
            className="px-12 py-4 rounded-[20px] bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(14,165,233,0.4)] transition-all active:scale-95 hover:scale-[1.02]"
          >
            Commit Expression
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpressionEditor;
