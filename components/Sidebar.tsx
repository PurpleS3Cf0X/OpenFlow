
import React, { useState, useMemo } from 'react';
import { 
  Search, Globe, Filter, Box, X, Sparkles, Brain, Bot, 
  Terminal, Database, List, Code as CodeIcon, GitBranch, 
  Zap, Layers, MessageSquare, FileSearch, FileText, 
  Cpu, Archive, HardDrive, Wrench, Binary, Server, 
  Webhook as WebhookIcon, Clock, Pause, Merge, Split, ArrowRightLeft, FileJson
} from 'lucide-react';
import { useWorkflowStore } from '../store.ts';
import { NodeType } from '../types.ts';
import ExpressionEditor from './ExpressionEditor.tsx';
import ParameterField from './ParameterField.tsx';

const NODE_TEMPLATES = [
  { category: 'Triggers', nodes: [
    { type: NodeType.WEBHOOK, label: 'Webhook', icon: WebhookIcon, description: 'Start flow via HTTP POST/GET', schema: [
      { name: 'path', label: 'URL Path', type: 'string', default: 'webhook-id' },
      { name: 'method', label: 'HTTP Method', type: 'options', default: 'POST', options: [{label: 'POST', value: 'POST'}, {label: 'GET', value: 'GET'}] }
    ]},
    { type: NodeType.CRON, label: 'Cron Schedule', icon: Clock, description: 'Trigger on time intervals', schema: [
      { name: 'interval', label: 'Cron Expression', type: 'string', default: '0 * * * *', description: 'Standard cron format (* * * * *)' }
    ]},
  ]},
  { category: 'AI Orchestration', nodes: [
    { type: NodeType.AI_AGENT, label: 'AI Agent', icon: Bot, description: 'Autonomous agent with tool usage', schema: [
      { name: 'credentialId', label: 'Vault Secret', type: 'credential', credentialType: 'apiKey' },
      { name: 'prompt', label: 'System Instruction', type: 'string', description: 'Define the agents persona' },
      { name: 'model', label: 'Model', type: 'options', default: 'gemini-2.5-flash', options: [{label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash'}, {label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro'}] }
    ]},
    { type: NodeType.GEMINI, label: 'Google Gemini', icon: Sparkles, description: 'Multimodal Generative AI', schema: [
      { name: 'credentialId', label: 'API Key Source', type: 'credential', credentialType: 'apiKey' },
      { name: 'operation', label: 'Operation', type: 'options', default: 'message', options: [{label: 'Chat/Message', value: 'message'}, {label: 'Vision/Image', value: 'vision'}] },
      { name: 'prompt', label: 'Input Prompt', type: 'string' },
      { name: 'model', label: 'Model Name', type: 'options', default: 'gemini-2.5-flash', options: [{label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash'}, {label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro'}] }
    ]},
    { type: NodeType.LLM_CHAIN, label: 'LLM Chain', icon: Layers, description: 'Prompt-Response template', schema: [{ name: 'prompt', label: 'Prompt Template', type: 'string' }] },
    { type: NodeType.SUMMARIZATION_CHAIN, label: 'Summarizer', icon: FileText, description: 'Compress long data into summaries', schema: [{ name: 'type', label: 'Strategy', type: 'options', default: 'map_reduce', options: [{label: 'Stuff', value: 'stuff'}, {label: 'Map Reduce', value: 'map_reduce'}] }] },
  ]},
  { category: 'Infrastructure', nodes: [
    { type: NodeType.SSH, label: 'SSH Execution', icon: Terminal, description: 'Remote server shell commands', schema: [
      { name: 'credentialId', label: 'SSH Auth', type: 'credential', credentialType: 'ssh' },
      { name: 'host', label: 'Hostname', type: 'string', placeholder: 'server.domain.com' },
      { name: 'command', label: 'Bash Command', type: 'string', default: 'uptime' }
    ]},
    { type: NodeType.HTTP_REQUEST, label: 'HTTP Request', icon: Globe, description: 'API calls & External systems', schema: [
      { name: 'credentialId', label: 'Authentication', type: 'credential', credentialType: 'apiKey' },
      { name: 'url', label: 'Endpoint URL', type: 'string' },
      { name: 'method', label: 'Method', type: 'options', default: 'GET', options: [{label: 'GET', value: 'GET'}, {label: 'POST', value: 'POST'}, {label: 'PUT', value: 'PUT'}, {label: 'DELETE', value: 'DELETE'}] },
      { name: 'body', label: 'JSON Body', type: 'json' }
    ]},
  ]},
  { category: 'Data & Flow', nodes: [
    { type: NodeType.FILTER, label: 'Filter', icon: Filter, description: 'Conditional branching', schema: [{ name: 'property', label: 'Variable', type: 'string' }, { name: 'value', label: 'Comparison', type: 'string' }] },
    { type: NodeType.CODE, label: 'JS Code', icon: CodeIcon, description: 'Isolated JS Sandbox', schema: [{ name: 'jsCode', label: 'Function', type: 'string', default: 'return $json;' }] },
    { type: NodeType.JSON_PARSER, label: 'JSON Parser', icon: FileJson, description: 'Parse string to JSON object', schema: [
      { name: 'jsonString', label: 'JSON String', type: 'string', default: '{{ $json.body }}' },
      { name: 'jsonSchema', label: 'JSON Schema (Optional)', type: 'json', default: '{}', description: 'Validate the parsed object against this schema' }
    ]},
    { type: NodeType.SET, label: 'Set Data', icon: Database, description: 'Update flow variables', schema: [
      { name: 'json', label: 'Data Object', type: 'json', default: '{}' },
      { name: 'jsonSchema', label: 'JSON Schema (Optional)', type: 'json', default: '{}', description: 'Enforce structure on the output data' }
    ]},
    { type: NodeType.WAIT, label: 'Wait/Delay', icon: Pause, description: 'Pause execution', schema: [{ name: 'seconds', label: 'Seconds', type: 'number', default: 5 }] },
    { type: NodeType.SWITCH, label: 'Switch', icon: Zap, description: 'Multi-path routing', schema: [{ name: 'property', label: 'Switch Key', type: 'string' }] },
  ]},
  { category: 'RAG & Memory', nodes: [
    { type: NodeType.VECTOR_STORE, label: 'Vector Store', icon: HardDrive, description: 'Connect to Vector DBs', schema: [
      { name: 'credentialId', label: 'DB Secret', type: 'credential', credentialType: 'database' },
      { name: 'index', label: 'Index Name', type: 'string' }, 
      { name: 'action', label: 'Action', type: 'options', default: 'search', options: [{label: 'Search', value: 'search'}, {label: 'Upsert', value: 'upsert'}] }
    ]},
    { type: NodeType.QA_CHAIN, label: 'QA Chain (RAG)', icon: FileSearch, description: 'Document retrieval chain', schema: [{ name: 'query', label: 'User Query', type: 'string' }] },
  ]}
];

const Sidebar: React.FC = () => {
  const { selectedNodeId, currentWorkflow, updateNodeData } = useWorkflowStore();
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

  const filteredTemplates = useMemo(() => {
    if (!search) return NODE_TEMPLATES;
    return NODE_TEMPLATES.map(cat => ({
      ...cat,
      nodes: cat.nodes.filter(n => n.label.toLowerCase().includes(search.toLowerCase()) || n.description.toLowerCase().includes(search.toLowerCase()))
    })).filter(cat => cat.nodes.length > 0);
  }, [search]);

  return (
    <>
      <div className="flex flex-col h-full w-80 glass-card border-r border-white/5 z-20 flex-shrink-0">
        <div className="p-8 space-y-6">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Node Library</h2>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search components..." 
              className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500/30 transition-all" 
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-8 scrollbar-hide">
          {filteredTemplates.map(cat => (
            <div key={cat.category} className="space-y-4">
              <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2 flex items-center gap-2">
                 <div className="w-1 h-1 rounded-full bg-sky-500/40" />
                 {cat.category}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {cat.nodes.map(node => (
                  <div key={node.label} draggable onDragStart={(e) => onDragStart(e, node.type as NodeType)} className="p-4 rounded-2xl glass-button cursor-grab flex items-center gap-4 group hover:scale-[1.02] active:scale-95 transition-all">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-slate-400 group-hover:text-sky-400 transition-all">
                      <node.icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-200">{node.label}</span>
                      <span className="text-[9px] text-slate-500 truncate max-w-[140px]">{node.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedNode && (
        <div className="fixed right-6 w-[480px] glass-card border border-white/10 rounded-[40px] flex flex-col z-50 shadow-[0_48px_128px_rgba(0,0,0,0.8)] backdrop-blur-[64px]" style={{ top: '120px', height: 'calc(100vh - 144px)' }}>
          <div className="p-10 border-b border-white/5">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-400">
                   <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{selectedNode.data.label}</h3>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{selectedNode.data.type}</span>
                </div>
              </div>
              <button onClick={() => useWorkflowStore.getState().setSelectedNodeId(null)} className="p-3 hover:bg-white/10 rounded-2xl text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5">
              <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'settings' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:text-slate-300'}`}>Parameters</button>
              <button onClick={() => setActiveTab('data')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'data' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:text-slate-300'}`}>Bag of Items</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
            {activeTab === 'settings' ? (
              <div className="space-y-10">
                <ParameterField label="Identity" value={selectedNode.data.label} type="string" onChange={(v) => updateNodeData(selectedNode.id, { label: v })} onOpenExpression={() => { setActiveParam('label'); setIsExpressionOpen(true); }} />
                {nodeTemplate?.schema?.map(p => (
                   <ParameterField key={p.name} label={p.label} value={selectedNode.data.params?.[p.name] || p.default} type={p.type} options={p.options} credentialType={p.credentialType} description={p.description} onChange={(v) => updateNodeData(selectedNode.id, { params: { ...selectedNode.data.params, [p.name]: v } })} onOpenExpression={() => { setActiveParam(p.name); setIsExpressionOpen(true); }} />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                   <Binary className="w-4 h-4 text-emerald-400" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Node Output Snapshot</span>
                </div>
                <pre className="text-emerald-400 text-[11px] font-mono whitespace-pre-wrap bg-black/40 p-6 rounded-3xl border border-white/5 shadow-inner">
                  {JSON.stringify(selectedNode.data.lastResult?.[0]?.[0] || { status: 'Awaiting execution...' }, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <div className="p-10 border-t border-white/5 bg-black/20">
             <button onClick={() => useWorkflowStore.getState().setSelectedNodeId(null)} className="w-full py-5 rounded-[24px] bg-sky-500 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-sky-500/20 hover:scale-[1.02] active:scale-95 transition-all">Commit Changes</button>
          </div>
        </div>
      )}
      <ExpressionEditor isOpen={isExpressionOpen} onClose={() => setIsExpressionOpen(false)} label={activeParam || ''} initialValue={(activeParam === 'label' ? selectedNode?.data.label : selectedNode?.data.params?.[activeParam || '']) || ''} onSave={(val) => { if (activeParam === 'label') updateNodeData(selectedNode!.id, { label: val }); else if (activeParam) updateNodeData(selectedNode!.id, { params: { ...selectedNode!.data.params, [activeParam]: val } }); }} />
    </>
  );
};

export default Sidebar;
