
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Connection, 
  Edge, 
  EdgeChange, 
  Node, 
  NodeChange, 
  addEdge, 
  OnNodesChange, 
  OnEdgesChange, 
  OnConnect, 
  applyNodeChanges, 
  applyEdgeChanges,
  XYPosition
} from 'reactflow';
import { NodeType, INodeExecutionData, IExecution, IBinaryData, ICredential } from './types.ts';
import { GoogleGenAI } from "@google/genai";

const resolveExpression = (value: any, context: any): any => {
  if (typeof value !== 'string' || !value.includes('{{')) return value;
  try {
    const keys = Object.keys(context);
    const values = Object.values(context);
    const fn = new Function(...keys, `return ${value.replace(/{{(.+?)}}/g, (_, match) => match.trim())}`);
    const result = fn(...values);
    return result === undefined ? '' : result;
  } catch (e) { return '[Expression Error]'; }
};

interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  active: boolean;
  updatedAt: string;
  triggerType: 'manual' | 'schedule' | 'webhook';
  schedule?: string;
  environment: 'development' | 'staging' | 'production';
  priority: 'standard' | 'high' | 'critical';
}

interface LibraryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: string;
  color: string;
  nodes: any[];
  edges: any[];
}

interface WorkflowStore {
  workflows: Workflow[];
  libraryItems: LibraryItem[];
  executions: IExecution[];
  credentials: ICredential[];
  currentWorkflow: Workflow | null;
  activeJobId: string | null;
  isExecuting: boolean;
  isDebugMode: boolean;
  isPaused: boolean;
  pausedNodeId: string | null;
  selectedNodeId: string | null;
  isLocked: boolean;
  stepResolver: (() => void) | null;
  settings: any;
  memoryStore: Record<string, any[]>; // SessionID -> ChatHistory[]
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodesDelete: (nodes: Node[]) => void;
  loadWorkflow: (id: string) => void;
  createWorkflow: (params: {
    name: string;
    description: string;
    triggerType?: 'manual' | 'schedule' | 'webhook';
    schedule?: string;
    environment: 'development' | 'staging' | 'production';
    priority: 'standard' | 'high' | 'critical';
  }) => string;
  duplicateWorkflow: (id: string) => void;
  deleteWorkflow: (id: string) => void;
  toggleWorkflowActive: (id: string) => void;
  updateNodeData: (nodeId: string, data: any) => void;
  addNode: (type: NodeType, position: XYPosition) => void;
  cloneNode: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  runWorkflow: () => Promise<void>;
  runNodeInstance: (nodeId: string) => Promise<void>;
  setSelectedNodeId: (id: string | null) => void;
  toggleDebugMode: () => void;
  step: () => void;
  resume: () => void;
  abortExecution: () => void;
  executeInternal: (nodeId: string, inputItems: INodeExecutionData[], executionId: string) => Promise<INodeExecutionData[] | null>;
  clearExecutions: () => void;
  updateSettings: (settings: any) => void;
  toggleLock: () => void;
  applyTemplate: (template: any) => string;
  addLibraryItem: (item: Omit<LibraryItem, 'id'>) => void;
  deleteLibraryItem: (id: string) => void;
  addCredential: (cred: Omit<ICredential, 'id' | 'updatedAt' | 'status'>) => void;
  deleteCredential: (id: string) => void;
}

const getLabelForType = (type: NodeType): string => {
  switch (type) {
    case NodeType.WEBHOOK: return 'Webhook';
    case NodeType.CRON: return 'Cron Schedule';
    case NodeType.AI_AGENT: return 'AI Agent';
    case NodeType.GEMINI: return 'Google Gemini';
    case NodeType.LLM_CHAIN: return 'Basic LLM Chain';
    case NodeType.SUMMARIZATION_CHAIN: return 'Summarization Chain';
    case NodeType.QA_CHAIN: return 'Question and Answer Chain';
    case NodeType.SSH: return 'SSH Execution';
    case NodeType.HTTP_REQUEST: return 'HTTP Request';
    case NodeType.FILTER: return 'Filter';
    case NodeType.CODE: return 'JS Code';
    case NodeType.JSON_PARSER: return 'JSON Parser';
    case NodeType.SET: return 'Set Data';
    case NodeType.WAIT: return 'Wait/Delay';
    case NodeType.SWITCH: return 'Switch';
    case NodeType.VECTOR_STORE: return 'Vector Store';
    case NodeType.WINDOW_BUFFER_MEMORY: return 'Window Buffer Memory';
    case NodeType.POSTGRES_CHAT_MEMORY: return 'Postgres Chat Memory';
    case NodeType.REDIS_CHAT_MEMORY: return 'Redis Chat Memory';
    default: return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

const INITIAL_BLUEPRINTS: LibraryItem[] = Array.from({ length: 30 }).map((_, i) => {
  const titles = [
    'Document Triage AI', 'GitHub Issue Labeler', 'Multi-Cloud Auditor', 'Sentiment Analysis', 'Slack-DB Sync',
    'Docker Security Scan', 'Summarization Bot', 'K8s Auto-Healer', 'Salesforce Enricher', 'Volatility Monitor',
    'SEO Post Generator', 'Discord Mod Bot', 'S3 Glacier Archiver', '5XX Error Filter', 'Stripe Payment Sync',
    'SSH Fleet Patcher', 'Endpoint Health Monitor', 'CMS Alt-Text AI', 'Resume Ranker AI', 'i18n Translator',
    'Abandoned Cart Bot', 'CloudWatch Bridge', 'Onboarding Flow', 'KPI Aggregator', 'PII Data Redactor',
    'Service Mesh Monitor', 'Email A/B Splitter', 'Low Stock Alert', 'Brand Tracking AI', 'OCR Data Extraction'
  ];
  const cats = ['LangChain Framework', 'Infrastructure', 'Data Ops', 'Security', 'AI Ops'];
  const colors = ['amber', 'emerald', 'indigo', 'sky', 'rose'];
  const category = cats[i % cats.length];

  const nodeConfig = (index: number) => {
    switch (index) {
      case 0: return { type: NodeType.WEBHOOK, params: { method: 'POST', path: `api-${i}` } };
      case 1: 
        if (category === 'LangChain Framework') return { type: NodeType.LLM_CHAIN, params: { prompt: 'Analyze: {{ $json.input }}' } };
        if (category === 'AI Ops') return { type: NodeType.AI_AGENT, params: { prompt: 'You are an agent...', model: 'gemini-2.5-flash' } };
        if (category === 'Infrastructure') return { type: NodeType.SSH, params: { command: 'uptime', host: 'server-01' } };
        return { type: NodeType.CODE, params: { jsCode: 'return $json;' } };
      case 2: return { type: NodeType.SET, params: { json: '{"status": "completed"}' } };
      default: return { type: NodeType.SET, params: { json: '{}' } };
    }
  };

  const nodes = [0, 1, 2].map(idx => {
    const cfg = nodeConfig(idx);
    return {
      id: `n${idx}`,
      type: 'custom',
      position: { x: idx * 350, y: 100 },
      data: { 
        type: cfg.type,
        label: getLabelForType(cfg.type),
        params: cfg.params, 
        outputs: cfg.type === NodeType.FILTER ? ['true', 'false'] : ['default'] 
      }
    };
  });

  const edges = [
    { id: 'e1', source: 'n0', target: 'n1', animated: true, style: { stroke: '#38bdf8', strokeWidth: 3 } },
    { id: 'e2', source: 'n1', target: 'n2', animated: true, style: { stroke: '#38bdf8', strokeWidth: 3 } }
  ];

  return {
    id: `tpl_${i + 1}`,
    name: titles[i],
    description: `Enterprise-ready ${category} orchestration flow.`,
    category,
    complexity: i % 3 === 0 ? 'High' : i % 3 === 1 ? 'Medium' : 'Low',
    color: colors[i % colors.length],
    nodes,
    edges
  };
});

const INITIAL_WORKFLOWS: Workflow[] = [
  {
    id: 'wf_traffic_gate',
    name: 'Production Traffic Gateway',
    description: 'Routing core for edge node requests.',
    active: true, updatedAt: new Date().toISOString(), triggerType: 'webhook', environment: 'production', priority: 'critical',
    nodes: [
      { id: 'w1', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Webhook', type: NodeType.WEBHOOK, params: { path: 'gateway', method: 'POST' }, outputs: ['default'] } },
      { id: 'c1', type: 'custom', position: { x: 350, y: 0 }, data: { label: 'JS Code', type: NodeType.CODE, params: { jsCode: 'return { route: "us-east-1" };' }, outputs: ['default'] } },
      { id: 'h1', type: 'custom', position: { x: 700, y: 0 }, data: { label: 'HTTP Request', type: NodeType.HTTP_REQUEST, params: { url: 'https://internal.api', method: 'POST' }, outputs: ['default'] } }
    ],
    edges: [
      { id: 'eg1', source: 'w1', target: 'c1', animated: true },
      { id: 'eg2', source: 'c1', target: 'h1', animated: true }
    ]
  }
];

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => ({
      workflows: INITIAL_WORKFLOWS,
      libraryItems: INITIAL_BLUEPRINTS,
      executions: [],
      credentials: [],
      currentWorkflow: null,
      activeJobId: null,
      isExecuting: false,
      isDebugMode: false,
      isPaused: false,
      pausedNodeId: null,
      selectedNodeId: null,
      isLocked: false,
      stepResolver: null,
      memoryStore: {},
      settings: { isolatedExecution: true, autoSave: true, defaultView: 'json' },

      addCredential: (cred) => set(s => ({ credentials: [...s.credentials, { ...cred, id: `cred_${Math.random()}`, updatedAt: 'Just now', status: 'valid' } as ICredential] })),
      deleteCredential: (id) => set(s => ({ credentials: s.credentials.filter(c => c.id !== id) })),

      loadWorkflow: (id) => {
        const wf = get().workflows.find(w => w.id === id);
        if (wf) set({ currentWorkflow: wf });
      },

      createWorkflow: ({ name, description, triggerType = 'manual', schedule, environment, priority }) => {
        const id = `wf_${Math.random().toString(36).substr(2, 9)}`;
        const newWf: Workflow = { 
          id, name, description, active: false, nodes: [], edges: [], 
          updatedAt: new Date().toISOString(),
          triggerType: triggerType as 'manual' | 'schedule' | 'webhook',
          schedule, environment, priority
        };
        set(state => ({ workflows: [...state.workflows, newWf] }));
        return id;
      },

      applyTemplate: (template) => {
        const id = `wf_${Math.random().toString(36).substr(2, 9)}`;
        const newWf: Workflow = { 
          id, name: template.name + " (Instance)", description: template.description,
          nodes: JSON.parse(JSON.stringify(template.nodes)),
          edges: JSON.parse(JSON.stringify(template.edges)),
          active: false, updatedAt: new Date().toISOString(),
          triggerType: 'manual', environment: 'development', priority: 'standard'
        };
        set(state => ({ workflows: [...state.workflows, newWf] }));
        return id;
      },

      addLibraryItem: (item) => {
        const id = `tpl_${Math.random().toString(36).substr(2, 9)}`;
        set(s => ({ libraryItems: [...s.libraryItems, { ...item, id }] }));
      },

      deleteLibraryItem: (id) => set(s => ({ libraryItems: s.libraryItems.filter(i => i.id !== id) })),

      duplicateWorkflow: (id) => {
        const wf = get().workflows.find(w => w.id === id);
        if (!wf) return;
        const copy = { 
          ...JSON.parse(JSON.stringify(wf)), 
          id: `wf_${Math.random().toString(36).substr(2, 9)}`, 
          name: `${wf.name} (Copy)`, 
          updatedAt: new Date().toISOString(), 
          active: false 
        };
        set(state => ({ workflows: [...state.workflows, copy] }));
      },

      deleteWorkflow: (id) => set(state => ({ workflows: state.workflows.filter(w => w.id !== id), currentWorkflow: state.currentWorkflow?.id === id ? null : state.currentWorkflow })),
      toggleWorkflowActive: (id) => set(state => ({ workflows: state.workflows.map(w => w.id === id ? { ...w, active: !w.active } : w) })),
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
      toggleLock: () => set(state => ({ isLocked: !state.isLocked })),
      toggleDebugMode: () => set(state => ({ isDebugMode: !state.isDebugMode })),
      step: () => { const { stepResolver } = get(); if (stepResolver) { stepResolver(); set({ stepResolver: null, isPaused: false, pausedNodeId: null }); } },
      resume: () => get().step(),
      abortExecution: () => set({ isExecuting: false, isPaused: false, pausedNodeId: null, stepResolver: null, activeJobId: null }),

      onNodesChange: (changes) => { const { currentWorkflow, isLocked } = get(); if (!currentWorkflow || isLocked) return; set({ currentWorkflow: { ...currentWorkflow, nodes: applyNodeChanges(changes, currentWorkflow.nodes) } }); },
      onEdgesChange: (changes) => { const { currentWorkflow, isLocked } = get(); if (!currentWorkflow || isLocked) return; set({ currentWorkflow: { ...currentWorkflow, edges: applyEdgeChanges(changes, currentWorkflow.edges) } }); },
      onConnect: (connection) => { const { currentWorkflow, isLocked } = get(); if (!currentWorkflow || isLocked) return; set({ currentWorkflow: { ...currentWorkflow, edges: addEdge({ ...connection, id: `e_${Math.random().toString(36).substr(2, 6)}`, style: { stroke: '#38bdf8', strokeWidth: 3 }, animated: true }, currentWorkflow.edges) } }); },
      onNodesDelete: (nodes) => { const { currentWorkflow } = get(); if (!currentWorkflow) return; const ids = nodes.map(n => n.id); set({ currentWorkflow: { ...currentWorkflow, nodes: currentWorkflow.nodes.filter(n => !ids.includes(n.id)), edges: currentWorkflow.edges.filter(e => !ids.includes(e.source) && !ids.includes(e.target)) } }); },

      addNode: (type, position) => {
        const { currentWorkflow } = get();
        if (!currentWorkflow) return;
        const label = getLabelForType(type);
        let outputs = ['default'];
        if (type === NodeType.FILTER) outputs = ['true', 'false'];
        if (type === NodeType.SWITCH) outputs = ['Case 1', 'Case 2', 'Default'];
        
        const newNode: Node = { id: `node_${Math.random().toString(36).substr(2, 9)}`, type: 'custom', position, data: { label, type, params: {}, status: 'idle', outputs } };
        set({ currentWorkflow: { ...currentWorkflow, nodes: [...currentWorkflow.nodes, newNode] } });
      },

      cloneNode: (id) => {
        const { currentWorkflow } = get();
        const node = currentWorkflow?.nodes.find(n => n.id === id);
        if (!node) return;
        const newNode = { ...JSON.parse(JSON.stringify(node)), id: `node_${Math.random().toString(36).substr(2, 9)}`, position: { x: node.position.x + 40, y: node.position.y + 40 }, selected: false, data: { ...node.data, status: 'idle' } };
        set({ currentWorkflow: { ...currentWorkflow!, nodes: [...currentWorkflow!.nodes, newNode] } });
      },

      deleteNode: (id) => get().onNodesDelete([{ id } as any]),
      clearExecutions: () => set({ executions: [] }),
      updateSettings: (newSettings) => set(s => ({ settings: { ...s.settings, ...newSettings } })),

      executeInternal: async (nodeId, inputItems, executionId) => {
        if (!get().isExecuting) return null;
        const node = get().currentWorkflow?.nodes.find(n => n.id === nodeId);
        if (!node) return null;
        if (get().isDebugMode) { set({ isPaused: true, pausedNodeId: nodeId }); await new Promise<void>(res => set({ stepResolver: res })); }

        get().updateNodeData(nodeId, { status: 'executing' });
        let outputItems: INodeExecutionData[] = [];
        try {
          const firstItem = inputItems[0] || { json: {} };
          const ctx = { $json: firstItem.json, $execution: { id: executionId, timestamp: new Date().toISOString() } };
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          switch (node.data.type) {
            case NodeType.SET:
              const val = resolveExpression(node.data.params.json, ctx);
              outputItems = [{ json: typeof val === 'string' ? JSON.parse(val) : val }];
              break;
            case NodeType.CODE:
              const code = node.data.params.jsCode || 'return $json;';
              const executeCode = new Function('$json', '$execution', `try { ${code} } catch(e) { throw e; }`);
              const codeResult = executeCode(ctx.$json, ctx.$execution);
              outputItems = [{ json: codeResult || {} }];
              break;
            case NodeType.GEMINI:
            case NodeType.LLM_CHAIN:
            case NodeType.AI_AGENT:
              const prompt = resolveExpression(node.data.params.prompt || node.data.params.query, ctx);
              const sessionId = resolveExpression(node.data.params.sessionId || 'default', ctx);
              const history = get().memoryStore[sessionId] || [];
              
              const fullPrompt = history.length > 0 
                ? `Conversation History:\n${history.map(m => `${m.role}: ${m.text}`).join('\n')}\n\nUser: ${prompt}`
                : prompt;

              const result = await ai.models.generateContent({ 
                model: node.data.params.model || 'gemini-2.5-flash', 
                contents: { parts: [{ text: fullPrompt }] } 
              });
              
              outputItems = [{ json: { text: result.text, historyCount: history.length, sessionId } }];
              break;
            case NodeType.SUMMARIZATION_CHAIN:
              const strategy = node.data.params.type || 'map_reduce';
              const textToSummarize = resolveExpression(node.data.params.text || '{{ $json.text }}', ctx);
              const sumPrompt = `Perform a high-quality summarization of the following text using the "${strategy}" strategy. Ensure the summary is concise yet informative.\n\nTEXT:\n${textToSummarize}`;
              
              const sumResult = await ai.models.generateContent({ 
                model: 'gemini-2.5-flash', 
                contents: { parts: [{ text: sumPrompt }] } 
              });
              outputItems = [{ json: { summary: sumResult.text, strategy, inputLength: textToSummarize.length } }];
              break;
            case NodeType.QA_CHAIN:
              const qaQuery = resolveExpression(node.data.params.query || '{{ $json.query }}', ctx);
              const qaContext = resolveExpression(node.data.params.context || '{{ $json.text }}', ctx);
              const qaPrompt = `Answer the user query based ONLY on the provided context. If the answer is not in the context, say you don't know.\n\nCONTEXT:\n${qaContext}\n\nQUERY: ${qaQuery}`;
              
              const qaResult = await ai.models.generateContent({ 
                model: 'gemini-2.5-flash', 
                contents: { parts: [{ text: qaPrompt }] } 
              });
              outputItems = [{ json: { answer: qaResult.text, query: qaQuery } }];
              break;
            case NodeType.WINDOW_BUFFER_MEMORY:
            case NodeType.POSTGRES_CHAT_MEMORY:
            case NodeType.REDIS_CHAT_MEMORY:
              const sId = resolveExpression(node.data.params.sessionId || 'default', ctx);
              const k = node.data.params.windowSize || 10;
              const currentMsg = ctx.$json.text || ctx.$json.message || '';
              
              const existingHist = get().memoryStore[sId] || [];
              const newHist = [...existingHist, { role: 'human', text: currentMsg }].slice(-k);
              
              set(s => ({ memoryStore: { ...s.memoryStore, [sId]: newHist } }));
              outputItems = [{ json: { sessionId: sId, bufferCount: newHist.length, state: 'persisted' } }];
              break;
            case NodeType.HTTP_REQUEST:
              const url = resolveExpression(node.data.params.url, ctx);
              await new Promise(r => setTimeout(r, 600));
              outputItems = [{ json: { status: 200, url, body: { success: true, meta: { executionId } } } }];
              break;
            default:
              await new Promise(r => setTimeout(r, 300));
              outputItems = inputItems;
          }
          
          get().updateNodeData(nodeId, { status: 'success', lastResult: [outputItems] });
          const nextEdges = get().currentWorkflow?.edges.filter(e => e.source === nodeId);
          if (nextEdges?.length) { await Promise.all(nextEdges.map(e => get().executeInternal(e.target, outputItems, executionId))); }
          return outputItems;
        } catch (e: any) {
          get().updateNodeData(nodeId, { status: 'error', error: { message: e.message, timestamp: new Date().toISOString() } });
          set({ isExecuting: false, activeJobId: null });
          return null;
        }
      },

      runWorkflow: async () => {
        const wf = get().currentWorkflow;
        if (!wf || get().isExecuting) return;
        const envCode = wf.environment.slice(0, 4).toUpperCase();
        const priCode = wf.priority.slice(0, 4).toUpperCase();
        const wfSlug = wf.name.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
        const timestamp = Date.now().toString(36).toUpperCase();
        const nonce = Math.random().toString(36).substr(2, 4).toUpperCase();
        const executionId = `${envCode}-${priCode}-${wfSlug}-${timestamp}-${nonce}`;
        set({ isExecuting: true, activeJobId: executionId });
        const startedAt = new Date().toLocaleString();
        const startNodes = wf.nodes.filter(n => !wf.edges.some(e => e.target === n.id));
        const startTime = Date.now();
        await Promise.all(startNodes.map(n => get().executeInternal(n.id, [{ json: { text: "Starting signal", value: 100 } }], executionId)));
        const duration = `${Date.now() - startTime}ms`;
        const newExecution: IExecution = { id: executionId, workflowId: wf.id, workflowName: wf.name, status: 'success', startedAt, duration };
        set(s => ({ isExecuting: false, activeJobId: null, executions: [newExecution, ...s.executions].slice(0, 50) }));
      },

      runNodeInstance: async (id) => { 
        const executionId = `DEBUG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        set({ isExecuting: true, activeJobId: executionId }); 
        await get().executeInternal(id, [{ json: { text: "Manual trigger signal", value: 100 } }], executionId); 
        set({ isExecuting: false, activeJobId: null }); 
      },
      updateNodeData: (id, data) => set(s => ({ currentWorkflow: { ...s.currentWorkflow!, nodes: s.currentWorkflow!.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n) } }))
    }),
    {
      name: 'openflow-storage',
      partialize: (state) => ({ workflows: state.workflows, libraryItems: state.libraryItems, credentials: state.credentials, settings: state.settings }),
    }
  )
);
