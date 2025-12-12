
import React, { useState, useMemo } from 'react';
import { 
  Search, Globe, Filter, Box, X, Sparkles, Brain, Bot, 
  Terminal, Database, List, Code as CodeIcon, GitBranch, 
  Zap, Layers, MessageSquare, FileSearch, FileText, 
  Cpu, Archive, HardDrive, Wrench, Binary, Server, 
  Webhook as WebhookIcon, Clock, Pause, Merge, Split, ArrowRightLeft, FileJson,
  Pin, PinOff, ChevronRight, ChevronLeft, BrainCircuit, History
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
  { category: 'LangChain Framework', nodes: [
    { type: NodeType.AI_AGENT, label: 'AI Agent', icon: Bot, description: 'Autonomous agent with tool usage', schema: [
      { name: 'prompt', label: 'System Instruction', type: 'string', description: 'Define the agents persona' },
      { name: 'model', label: 'Model', type: 'options', default: 'gemini-2.5-flash', options: [{label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash'}, {label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro'}] }
    ]},
    { type: NodeType.LLM_CHAIN, label: 'Basic LLM Chain', icon: Layers, description: 'Prompt-Response orchestration template', schema: [{ name: 'prompt', label: 'Prompt Template', type: 'string' }] },
    { type: NodeType.QA_CHAIN, label: 'Question and Answer Chain', icon: FileSearch, description: 'Retrieval-augmented generation (RAG)', schema: [
      { name: 'context', label: 'Context', type: 'string', default: '{{ $json.text }}', description: 'The knowledge base for answering' },
      { name: 'query', label: 'User Query', type: 'string', default: '{{ $json.query }}', description: 'The question to be answered' }
    ] },
    { type: NodeType.SUMMARIZATION_CHAIN, label: 'Summarization Chain', icon: FileText, description: 'Compress long data using LC strategies', schema: [
      { name: 'text', label: 'Input Text', type: 'string', default: '{{ $json.text }}', description: 'The text block to summarize' },
      { name: 'type', label: 'Strategy', type: 'options', default: 'map_reduce', options: [{label: 'Stuffing (Single-Pass)', value: 'stuff'}, {label: 'Map Reduce (Chunked)', value: 'map_reduce'}, {label: 'Refine (Iterative)', value: 'refine'}] }
    ] },
  ]},
  { category: 'AI Orchestration', nodes: [
    { type: NodeType.GEMINI, label: 'Google Gemini', icon: Sparkles, description: 'Multimodal Generative AI', schema: [
      { name: 'operation', label: 'Operation', type: 'options', default: 'message', options: [{label: 'Chat/Message', value: 'message'}, {label: 'Vision/Image', value: 'vision'}] },
      { name: 'prompt', label: 'Input Prompt', type: 'string' },
      { name: 'model', label: 'Model Name', type: 'options', default: 'gemini-2.5-flash', options: [{label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash'}, {label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro'}] }
    ]},
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
    { type: NodeType.WINDOW_BUFFER_MEMORY, label: 'Window Buffer Memory', icon: History, description: 'Store sliding window of chat history', schema: [
      { name: 'windowSize', label: 'Window Size (K)', type: 'number', default: 5, description: 'Number of messages to retain' },
      { name: 'memoryKey', label: 'Memory Key', type: 'string', default: 'chat_history' }
    ]},
    { type: NodeType.POSTGRES_CHAT_MEMORY, label: 'Postgres Chat Memory', icon: Database, description: 'Persistent chat history via Postgres', schema: [
      { name: 'credentialId', label: 'Database Auth', type: 'credential', credentialType: 'database' },
      { name: 'tableName', label: 'Table Name', type: 'string', default: 'chat_history' },
      { name: 'sessionId', label: 'Session ID', type: 'string', default: '{{ $json.sessionId }}' }
    ]},
    { type: NodeType.REDIS_CHAT_MEMORY, label: 'Redis Chat Memory', icon: BrainCircuit, description: 'Fast cache-based chat history via Redis', schema: [
      { name: 'credentialId', label: 'Redis Auth', type: 'credential', credentialType: 'database' },
      { name: 'sessionId', label: 'Session ID', type: 'string', default: '{{ $json.sessionId }}' },
      { name: 'ttl', label: 'Expiration (Seconds)', type: 'number', default: 3600 }
    ]},
  ]}
];

const Sidebar: React.FC = () => {
  const { selectedNodeId, currentWorkflow, updateNodeData } = useWorkflowStore();
  const [activeTab, setActiveTab] = useState<'settings' | 'data'>('settings');
  const [search, setSearch] = useState('');
  const [isExpressionOpen, setIsExpressionOpen] = useState(false);
  const [activeParam, setActiveParam] = useState<string | null>(null);

  // Collapsible Sidebar States
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isPinned || isHovered;

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
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex flex-col h-full glass-card border-r border-white/5 z-[70] flex-shrink-0 transition-all duration-500 ease-out relative shadow-2xl overflow-hidden ${isExpanded ? 'w-[320px]' : 'w-[72px]'}`}
      >
        {/* Toggle Pin Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); setIsPinned(!isPinned); }}
          className={`absolute top-8 right-6 p-2 rounded-xl transition-all z-[80] ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'} hover:bg-white/10 text-slate-500 hover:text-sky-400`}
        >
          {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
        </button>

        {!isExpanded && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 p-2 text-sky-500/40 animate-pulse">
            <ChevronRight className="w-5 h-5" />
          </div>
        )}

        {/* Header/Search Section */}
        <div className={`p-8 space-y-6 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 translate-x-[-20px]'}`}>
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Node Library</h2>
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

        {/* Nodes Grid */}
        <div className={`flex-1 overflow-y-auto px-4 pb-8 space-y-8 scrollbar-hide transition-all duration-300 ${isExpanded ? 'px-6' : 'px-2'}`}>
          {filteredTemplates.map(cat => (
            <div key={cat.category} className="space-y-4">
              {isExpanded ? (
                <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2 flex items-center gap-2 whitespace-nowrap">
                   <div className="w-1 h-1 rounded-full bg-sky-500/40" />
                   {cat.category}
                </h3>
              ) : (
                <div className="w-full border-t border-white/5 my-8 opacity-20" />
              )}
              <div className="grid grid-cols-1 gap-3">
                {cat.nodes.map(node => (
                  <div 
                    key={node.label} 
                    draggable 
                    onDragStart={(e) => onDragStart(e, node.type as NodeType)} 
                    className={`rounded-2xl glass-button cursor-grab flex items-center group relative hover:scale-[1.02] active:scale-95 transition-all ${isExpanded ? 'p-4 gap-4' : 'p-3 justify-center aspect-square'}`}
                  >
                    <div className={`rounded-xl bg-black/40 border border-white/5 text-slate-400 group-hover:text-sky-400 transition-all ${isExpanded ? 'p-2.5' : 'p-2.5'}`}>
                      <node.icon className="w-5 h-5" />
                    </div>
                    
                    {isExpanded && (
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-bold text-slate-200 truncate">{node.label}</span>
                        <span className="text-[9px] text-slate-500 truncate max-w-[140px]">{node.description}</span>
                      </div>
                    )}

                    {!isExpanded && (
                       <div className="absolute left-full ml-6 px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 shadow-2xl z-[100]">
                          {node.label}
                       </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Settings Panel */}
      {selectedNode && (
        <div className="fixed right-6 w-[480px] glass-card border border-white/10 rounded-[40px] flex flex-col z-50 shadow-[0_48px_128px_rgba(0,0,0,0.8)] backdrop-blur-[64px] animate-in slide-in-from-right duration-500" style={{ top: '120px', height: 'calc(100vh - 144px)' }}>
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
