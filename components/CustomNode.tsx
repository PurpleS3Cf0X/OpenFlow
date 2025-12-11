
import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Webhook, Globe, Code, Clock, Filter, FileJson, Pause, Database, 
  Play, Copy, Trash2, MoreHorizontal, Zap
} from 'lucide-react';
import { NodeType } from '../types.ts';
import { useWorkflowStore } from '../store.ts';

const IconMap = { 
  [NodeType.WEBHOOK]: Webhook, 
  [NodeType.HTTP_REQUEST]: Globe, 
  [NodeType.CODE]: Code, 
  [NodeType.CRON]: Clock, 
  [NodeType.FILTER]: Filter, 
  [NodeType.JSON_PARSER]: FileJson, 
  [NodeType.WAIT]: Pause,
  [NodeType.SET]: Database,
  [NodeType.SWITCH]: Zap
};

const CustomNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const Icon = IconMap[data.type as NodeType] || Webhook;
  const isTrigger = [NodeType.WEBHOOK, NodeType.CRON].includes(data.type as NodeType);
  const { runNodeInstance, cloneNode, deleteNode, isExecuting } = useWorkflowStore();
  const pausedNodeId = useWorkflowStore(state => state.pausedNodeId);
  const isPausedHere = pausedNodeId === id;
  
  const [isHovered, setIsHovered] = useState(false);

  const getStatusStyles = () => {
    if (isPausedHere) return { border: 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]', bg: 'bg-amber-400/[0.05]', text: 'text-amber-400', bar: 'bg-amber-400 animate-pulse' };
    switch (data.status) {
      case 'success': return { border: 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]', bg: 'bg-emerald-500/[0.05]', text: 'text-emerald-400', bar: 'bg-emerald-400 animate-pulse' };
      case 'error': return { border: 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]', bg: 'bg-rose-500/[0.05]', text: 'text-rose-400', bar: 'bg-rose-400' };
      case 'executing': return { border: 'border-sky-400 shadow-[0_0_30px_rgba(14,165,233,0.4)]', bg: 'bg-sky-500/[0.1]', text: 'text-sky-400', bar: 'bg-sky-400 animate-pulse' };
      case 'waiting': return { border: 'border-amber-400', bg: 'bg-amber-400/[0.05]', text: 'text-amber-400', bar: 'bg-amber-400' };
      default: return { border: selected ? 'border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.4)] scale-[1.02]' : 'border-white/10 shadow-lg', bg: 'bg-white/[0.01]', text: 'text-slate-400', bar: 'bg-transparent' };
    }
  };

  const styles = getStatusStyles();

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Action Toolbar */}
      <div className={`absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 glass-card rounded-2xl border border-white/10 z-50 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); runNodeInstance(id); }}
          disabled={isExecuting}
          className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-all"
          title="Run isolated instance"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); cloneNode(id); }}
          className="p-2 hover:bg-sky-500/20 text-sky-400 rounded-xl transition-all"
          title="Clone node"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button 
          onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
          className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all"
          title="Delete node"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className={`relative px-6 py-5 rounded-[24px] glass-card transition-all duration-500 min-w-[280px] border-2 ${styles.border} ${styles.bg} backdrop-blur-[20px]`}>
        <div className={`absolute -top-1 left-8 right-8 h-[3px] rounded-full transition-all duration-500 ${styles.bar}`} />
        
        {!isTrigger && <Handle type="target" position={Position.Left} className="!bg-sky-400 !border-slate-900" />}
        
        <div className="flex items-center gap-5">
          <div className={`p-3 rounded-xl bg-black/40 border border-white/5 ${data.status === 'executing' ? 'animate-pulse' : ''}`}>
            <Icon className={`w-6 h-6 ${styles.text}`} />
          </div>
          
          <div className="flex-1 overflow-hidden">
            <p className="text-lg font-bold text-white truncate tracking-tight leading-none">{data.label}</p>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1.5">{data.type}</p>
          </div>
        </div>

        {(data.outputs || ['default']).map((label, index) => (
          <Handle 
            key={label} 
            type="source" 
            position={Position.Right} 
            id={label} 
            style={{ top: `${(index + 1) * (100 / ((data.outputs || ['default']).length + 1))}%` }} 
            className="!bg-sky-400 !border-slate-900" 
          />
        ))}

        {data.status && data.status !== 'idle' && (
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${styles.bar}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${styles.text}`}>
              {isPausedHere ? 'Paused' : data.status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(CustomNode);
