
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Webhook, Globe, Code, Clock, Filter, FileJson, Pause, Database, 
  Play, Copy, Trash2, Zap, AlertTriangle, ShieldCheck, 
  Bot, Sparkles, Brain, Terminal, Box, Layers, FileSearch, 
  FileText, Archive, HardDrive, Wrench
} from 'lucide-react';
import { NodeType } from '../types.ts';
import { useWorkflowStore } from '../store.ts';

const IconMap: any = { 
  [NodeType.WEBHOOK]: Webhook, 
  [NodeType.HTTP_REQUEST]: Globe, 
  [NodeType.CODE]: Code, 
  [NodeType.CRON]: Clock, 
  [NodeType.FILTER]: Filter, 
  [NodeType.JSON_PARSER]: FileJson, 
  [NodeType.WAIT]: Pause,
  [NodeType.SET]: Database,
  [NodeType.SWITCH]: Zap,
  [NodeType.AI_AGENT]: Bot,
  [NodeType.GEMINI]: Sparkles,
  [NodeType.OPENAI]: Brain,
  [NodeType.HF_INFERENCE]: Terminal,
  [NodeType.LLM_CHAIN]: Layers,
  [NodeType.QA_CHAIN]: FileSearch,
  [NodeType.SUMMARIZATION_CHAIN]: FileText,
  [NodeType.MEMORY]: Archive,
  [NodeType.VECTOR_STORE]: HardDrive,
  [NodeType.TOOL]: Wrench,
  [NodeType.SSH]: Terminal
};

const CustomNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const Icon = IconMap[data.type as NodeType] || Box;
  const { runNodeInstance, cloneNode, deleteNode, isExecuting } = useWorkflowStore();
  const pausedNodeId = useWorkflowStore(state => state.pausedNodeId);
  const isPausedHere = pausedNodeId === id;
  const isValidationError = data.error?.message?.toLowerCase().includes('schema');

  const getStatusStyles = () => {
    if (isPausedHere) return { border: 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]', bg: 'bg-amber-400/[0.05]', text: 'text-amber-400' };
    switch (data.status) {
      case 'success': return { border: 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]', bg: 'bg-emerald-500/[0.05]', text: 'text-emerald-400' };
      case 'error': return { border: 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]', bg: 'bg-rose-500/[0.05]', text: 'text-rose-400' };
      case 'executing': return { border: 'border-sky-400 shadow-[0_0_30px_rgba(14,165,233,0.4)]', bg: 'bg-sky-500/[0.1]', text: 'text-sky-400' };
      default: return { border: selected ? 'border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.3)]' : 'border-white/10', bg: 'bg-white/[0.02]', text: 'text-slate-400' };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className="relative group p-4 -m-4"> 
      <div className={`
        absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 
        glass-card rounded-xl border border-white/10 z-[100] 
        transition-all duration-300 pointer-events-none 
        opacity-0 translate-y-2
        group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto
        after:content-[''] after:absolute after:top-full after:left-0 after:right-0 after:h-12
      `}>
        <button onClick={(e) => { e.stopPropagation(); runNodeInstance(id); }} disabled={isExecuting} className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all"><Play className="w-3.5 h-3.5 fill-current" /></button>
        <button onClick={(e) => { e.stopPropagation(); cloneNode(id); }} className="p-2 hover:bg-sky-500/20 text-sky-400 rounded-lg transition-all"><Copy className="w-3.5 h-3.5" /></button>
        <button onClick={(e) => { e.stopPropagation(); deleteNode(id); }} className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>

      <div className={`relative px-6 py-5 rounded-[22px] glass-card transition-all duration-500 min-w-[260px] border-2 ${styles.border} ${styles.bg} backdrop-blur-[24px]`}>
        <Handle type="target" position={Position.Left} className="!bg-sky-400 !border-slate-950" />
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-black/40 border border-white/5 ${data.status === 'executing' ? 'animate-pulse' : ''}`}>
            <Icon className={`w-5 h-5 ${styles.text}`} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-black text-white truncate tracking-tight">{data.label}</p>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{data.type}</p>
          </div>
        </div>
        {(data.outputs || ['default']).map((label, index) => (
          <Handle key={label} type="source" position={Position.Right} id={label} style={{ top: `${(index + 1) * (100 / ((data.outputs || ['default']).length + 1))}%` }} className="!bg-sky-400 !border-slate-950" />
        ))}
        {data.status && data.status !== 'idle' && (
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className={`text-[9px] font-black uppercase tracking-widest ${styles.text}`}>{data.status}</span>
            {data.status === 'success' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(CustomNode);
