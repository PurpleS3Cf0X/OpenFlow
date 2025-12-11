
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, Settings2, Play, ChevronRight, Database, 
  Code as CodeIcon, Globe, Clock, Filter, Table, Braces, 
  Download, ChevronLeft, FileText, ImageIcon,
  Layers, GitBranch, DatabaseZap, Hourglass, Box, Zap, X, 
  AlertCircle, History, ChevronLeftSquare, ChevronRightSquare,
  FileCode, FileDown, Hash, Type, Sparkles, Terminal, CheckCircle, RefreshCw, 
  List, ArrowDownUp, Scissors, LayoutGrid
} from 'lucide-react';
import { useWorkflowStore } from '../store.ts';
import { NodeType, INodeExecutionData, IParameterSchema } from '../types.ts';
import ExpressionEditor from './ExpressionEditor.tsx';
import ParameterField from './ParameterField.tsx';

const NODE_TEMPLATES = [
  { category: 'Triggers', nodes: [
    { type: NodeType.WEBHOOK, label: 'Webhook', icon: Globe, description: 'Trigger via URL', schema: [{ name: 'path', label: 'HTTP Path', type: 'string', default: 'webhook' }] },
    { type: NodeType.CRON, label: 'Cron', icon: Clock, description: 'Schedule executions', schema: [{ name: 'cronExpression', label: 'Cron Expression', type: 'string', default: '* * * * *' }] }
  ]},
  { category: 'Flow & Logic', nodes: [
    { type: NodeType.MERGE, label: 'Merge', icon: GitBranch, description: 'Join branches', schema: [{ name: 'mode', label: 'Mode', type: 'options', default: 'append', options: [{ label: 'Append', value: 'append' }] }] },
    { type: NodeType.SWITCH, label: 'Switch', icon: LayoutGrid, description: 'Multi-path routing', schema: [
      { name: 'value', label: 'Check Value', type: 'string' },
      { name: 'rule1', label: 'Path 1 if equals', type: 'string' },
      { name: 'rule2', label: 'Path 2 if equals', type: 'string' },
      { name: 'rule3', label: 'Path 3 if equals', type: 'string' }
    ] },
    { type: NodeType.FILTER, label: 'Filter', icon: Filter, description: 'Conditional logic', schema: [
      { name: 'property', label: 'Property', type: 'string' },
      { name: 'operator', label: 'Operator', type: 'options', default: 'equal', options: [
        { label: 'Equal', value: 'equal' },
        { label: 'Not Equal', value: 'notEqual' },
        { label: 'Contains', value: 'contains' },
        { label: 'Exists', value: 'exists' }
      ]},
      { name: 'compareValue', label: 'Compare Value', type: 'string' }
    ] },
    { type: NodeType.WAIT, label: 'Wait', icon: Hourglass, description: 'Pause workflow', schema: [{ name: 'amount', label: 'Seconds', type: 'number', default: 5 }] },
    { type: NodeType.SPLIT_BATCHES, label: 'Split Batches', icon: Scissors, description: 'Loop through data', schema: [{ name: 'size', label: 'Batch Size', type: 'number', default: 10 }] }
  ]},
  { category: 'Data & Actions', nodes: [
    { type: NodeType.HTTP_REQUEST, label: 'HTTP Request', icon: Globe, description: 'Send API calls', schema: [
      { name: 'method', label: 'Method', type: 'options', default: 'GET' }, 
      { name: 'url', label: 'URL', type: 'string' },
      { name: 'body', label: 'Body', type: 'string', default: '{}' }
    ] },
    { type: NodeType.SET, label: 'Set', icon: List, description: 'Set variables', schema: [
      { name: 'key', label: 'Key Path', type: 'string', description: 'Supports nesting, e.g. user.profile.id' },
      { name: 'value', label: 'Value', type: 'string' },
      { name: 'schema', label: 'Validation Schema', type: 'string', description: 'Optional JSON schema to validate output' }
    ] },
    { type: NodeType.CODE, label: 'Code', icon: CodeIcon, description: 'Execute JavaScript', schema: [{ name: 'jsCode', label: 'JavaScript Code', type: 'string', default: '// result = $json;' }] },
    { type: NodeType.JSON_PARSER, label: 'JSON Parser', icon: Braces, description: 'Parse JSON strings', schema: [
      { name: 'jsonString', label: 'JSON String', type: 'string' },
      { name: 'schema', label: 'Validation Schema', type: 'string', description: 'Optional JSON schema to validate result' }
    ] },
    { type: NodeType.SORT, label: 'Sort', icon: ArrowDownUp, description: 'Reorder items', schema: [{ name: 'key', label: 'Property Key', type: 'string' }] },
    { type: NodeType.LIMIT, label: 'Limit', icon: Scissors, description: 'Truncate items', schema: [{ name: 'count', label: 'Max Items', type: 'number', default: 1 }] }
  ]}
];

const Sidebar: React.FC = () => {
  const { selectedNodeId, currentWorkflow, updateNodeData, retryNode, isExecuting } = useWorkflowStore();
  const [activeTab, setActiveTab] = useState<'settings' | 'data'>('settings');
  const [search, setSearch] = useState('');
  const [isExpressionOpen, setIsExpressionOpen] = useState(false);
  const [activeParam, setActiveParam] = useState<string | null>(null);

  const nodes = currentWorkflow?.nodes || [];
  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const nodeTemplate = NODE_TEMPLATES.flatMap(c => c.nodes).find(t => t.type === selectedNode?.data.type);

  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  useEffect(() => { if (selectedNode?.data.status === 'error') setActiveTab('data'); }, [selectedNodeId]);

  const filteredTemplates = useMemo(() => {
    if (!search) return NODE_TEMPLATES;
    return NODE_TEMPLATES.map(cat => ({
      ...cat,
      nodes: cat.nodes.filter(n => 
        n.label.toLowerCase().includes(search.toLowerCase()) || 
        n.description.toLowerCase().includes(search.toLowerCase())
      )
    })).filter(cat => cat.nodes.length > 0);
  }, [search]);

  return (
    <>
      <div className="flex flex-col h-full w-80 glass-card border-r border-white/5 z-20 flex-shrink-0">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Node Library</h2>
            <div className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search components..." 
              className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-all" 
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-8 scrollbar-hide">
          {filteredTemplates.map(cat => (
            <div key={cat.category} className="space-y-4">
              <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2">{cat.category}</h3>
              <div className="grid grid-cols-1 gap-3">
                {cat.nodes.map(node => (
                  <div 
                    key={node.type} 
                    draggable
                    onDragStart={(e) => onDragStart(e, node.type as NodeType)}
                    className="p-4 rounded-2xl glass-button cursor-grab active:cursor-grabbing flex items-center gap-4 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 to-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-slate-400 group-hover:text-sky-400 group-hover:border-sky-500/20 transition-all">
                      <node.icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{node.label}</span>
                      <span className="text-[9px] text-slate-500 font-medium truncate max-w-[140px]">{node.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedNode && (
        <div className="fixed right-6 w-[480px] glass-card border border-white/10 rounded-[40px] flex flex-col z-50 shadow-[0_48px_128px_rgba(0,0,0,0.8)] animate-in slide-in-from-right duration-500 backdrop-blur-[64px]" style={{ top: '120px', height: 'calc(100vh - 144px)' }}>
          <div className="p-10 border-b border-white/5 bg-black/30">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-5">
                <div className={`p-4 rounded-2xl bg-sky-500/20 border border-sky-500/30 ${selectedNode.data.status === 'error' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'text-sky-400'}`}>
                   {selectedNode.data.status === 'error' ? <AlertCircle className="w-6 h-6" /> : <Box className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{selectedNode.data.label}</h3>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{selectedNode.data.type}</span>
                </div>
              </div>
              <button onClick={() => useWorkflowStore.getState().setSelectedNodeId(null)} className="p-3 hover:bg-white/10 rounded-2xl text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5">
              <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'settings' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500'}`}>Parameters</button>
              <button onClick={() => setActiveTab('data')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'data' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500'}`}>Results</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
            {activeTab === 'settings' && (
              <div className="space-y-10">
                <ParameterField label="Node Name" value={selectedNode.data.label} type="string" onChange={(v) => updateNodeData(selectedNode.id, { label: v })} onOpenExpression={() => { setActiveParam('label'); setIsExpressionOpen(true); }} />
                {nodeTemplate?.schema?.map(p => (
                   <ParameterField key={p.name} label={p.label} value={selectedNode.data.params?.[p.name] || p.default} type={p.type} options={(p as any).options} description={p.description} onChange={(v) => updateNodeData(selectedNode.id, { params: { ...selectedNode.data.params, [p.name]: v } })} onOpenExpression={() => { setActiveParam(p.name); setIsExpressionOpen(true); }} />
                ))}
              </div>
            )}
            {activeTab === 'data' && (
               <div className="space-y-6">
                  {selectedNode.data.status === 'error' && (
                    <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 space-y-4">
                      <div className="flex items-center gap-3 text-rose-400">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">Execution Failed</span>
                      </div>
                      <p className="text-xs text-rose-200/80 font-mono bg-black/40 p-4 rounded-2xl leading-relaxed">{selectedNode.data.error?.message}</p>
                      <button 
                        onClick={() => retryNode(selectedNode.id)}
                        disabled={isExecuting}
                        className="w-full py-4 rounded-2xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-rose-500/20"
                      >
                        <RefreshCw className={`w-4 h-4 ${isExecuting ? 'animate-spin' : ''}`} />
                        Retry Node Instance
                      </button>
                    </div>
                  )}
                  <div className="rounded-3xl bg-black/40 border border-white/5 p-6 overflow-hidden">
                    <div className="flex items-center gap-3 mb-4 text-emerald-400">
                      <Database className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Output Snapshot</span>
                    </div>
                    <pre className="text-emerald-400/80 text-[11px] font-mono whitespace-pre-wrap">{JSON.stringify(selectedNode.data.lastResult?.[0]?.[0]?.json || { empty: true }, null, 2)}</pre>
                  </div>
               </div>
            )}
          </div>
          <div className="p-10 border-t border-white/5 bg-black/40">
             <button onClick={() => useWorkflowStore.getState().setSelectedNodeId(null)} className="w-full py-5 rounded-[24px] bg-sky-500 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl">Confirm Logic Changes</button>
          </div>
        </div>
      )}
      <ExpressionEditor isOpen={isExpressionOpen} onClose={() => setIsExpressionOpen(false)} label={activeParam || ''} initialValue={(activeParam === 'label' ? selectedNode?.data.label : selectedNode?.data.params?.[activeParam || '']) || ''} onSave={(val) => { if (activeParam === 'label') updateNodeData(selectedNode!.id, { label: val }); else if (activeParam) updateNodeData(selectedNode!.id, { params: { ...selectedNode!.data.params, [activeParam]: val } }); }} />
    </>
  );
};

export default Sidebar;
