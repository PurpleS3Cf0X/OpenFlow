
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

// --------------------------------------------------------------------------------
// 30 Blueprints using EXACT Node Library Specifications
// --------------------------------------------------------------------------------
const INITIAL_BLUEPRINTS: LibraryItem[] = Array.from({ length: 30 }).map((_, i) => {
  const titles = [
    'Document Triage AI', 'GitHub Issue Labeler', 'Multi-Cloud Auditor', 'Sentiment Analysis', 'Slack-DB Sync',
    'Docker Security Scan', 'Summarization Bot', 'K8s Auto-Healer', 'Salesforce Enricher', 'Volatility Monitor',
    'SEO Post Generator', 'Discord Mod Bot', 'S3 Glacier Archiver', '5XX Error Filter', 'Stripe Payment Sync',
    'SSH Fleet Patcher', 'Endpoint Health Monitor', 'CMS Alt-Text AI', 'Resume Ranker AI', 'i18n Translator',
    'Abandoned Cart Bot', 'CloudWatch Bridge', 'Onboarding Flow', 'KPI Aggregator', 'PII Data Redactor',
    'Service Mesh Monitor', 'Email A/B Splitter', 'Low Stock Alert', 'Brand Tracking AI', 'OCR Data Extraction'
  ];
  const cats = ['AI Ops', 'DevOps', 'Data Ops', 'Security', 'Infrastructure'];
  const colors = ['amber', 'emerald', 'indigo', 'sky', 'rose'];
  const category = cats[i % cats.length];

  // Map to correct labels/types from Sidebar.tsx
  const nodeConfig = (index: number) => {
    switch (index) {
      case 0: return { type: NodeType.WEBHOOK, label: 'Webhook', params: { method: 'POST', path: `api-${i}` } };
      case 1: 
        if (category === 'AI Ops') return { type: NodeType.GEMINI, label: 'Google Gemini', params: { prompt: 'Analyze this data...', model: 'gemini-2.5-flash' } };
        if (category === 'DevOps') return { type: NodeType.SSH, label: 'SSH Execution', params: { command: 'uptime', host: 'cluster-01' } };
        return { type: NodeType.CODE, label: 'JS Code', params: { jsCode: 'return $json;' } };
      case 2: return { type: NodeType.SET, label: 'Set Data', params: { json: '{"status": "completed"}' } };
      default: return { type: NodeType.SET, label: 'Set Data', params: { json: '{}' } };
    }
  };

  const nodes = [0, 1, 2].map(idx => {
    const cfg = nodeConfig(idx);
    return {
      id: `n${idx}`,
      type: 'custom',
      position: { x: idx * 350, y: 100 },
      data: { 
        ...cfg, 
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
    description: `Enterprise-ready ${category} orchestration flow using standard nodes.`,
    category,
    complexity: i % 3 === 0 ? 'High' : i % 3 === 1 ? 'Medium' : 'Low',
    color: colors[i % colors.length],
    nodes,
    edges
  };
});

// --------------------------------------------------------------------------------
// 10 Initial Workflows using EXACT Node Library Specifications
// --------------------------------------------------------------------------------
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
  },
  {
    id: 'wf_sec_scan',
    name: 'SSH Vulnerability Scan',
    description: 'Nightly fleet security audit.',
    active: true, updatedAt: new Date().toISOString(), triggerType: 'schedule', schedule: 'daily', environment: 'production', priority: 'high',
    nodes: [
      { id: 'cr1', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Cron Schedule', type: NodeType.CRON, params: { interval: '0 0 * * *' }, outputs: ['default'] } },
      { id: 'ss1', type: 'custom', position: { x: 350, y: 0 }, data: { label: 'SSH Execution', type: NodeType.SSH, params: { host: 'prod-01', command: 'check_vulns.sh' }, outputs: ['default'] } },
      { id: 'ht1', type: 'custom', position: { x: 700, y: 0 }, data: { label: 'HTTP Request', type: NodeType.HTTP_REQUEST, params: { url: 'https://security.webhook', method: 'POST' }, outputs: ['default'] } }
    ],
    edges: [
      { id: 'es1', source: 'cr1', target: 'ss1', animated: true },
      { id: 'es2', source: 'ss1', target: 'ht1', animated: true }
    ]
  },
  {
    id: 'wf_ai_categorizer',
    name: 'AI Support Desk',
    description: 'Autonomous triage using Gemini.',
    active: true, updatedAt: new Date().toISOString(), triggerType: 'webhook', environment: 'production', priority: 'standard',
    nodes: [
      { id: 'wh1', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Webhook', type: NodeType.WEBHOOK, params: { path: 'support', method: 'POST' }, outputs: ['default'] } },
      { id: 'gm1', type: 'custom', position: { x: 350, y: 0 }, data: { label: 'Google Gemini', type: NodeType.GEMINI, params: { prompt: 'Classify this ticket: {{ $json.body }}', model: 'gemini-2.5-flash' }, outputs: ['default'] } },
      { id: 'ft1', type: 'custom', position: { x: 700, y: 0 }, data: { label: 'Filter', type: NodeType.FILTER, params: { property: '{{ $json.category }}', value: 'critical' }, outputs: ['true', 'false'] } }
    ],
    edges: [
      { id: 'ea1', source: 'wh1', target: 'gm1', animated: true },
      { id: 'ea2', source: 'gm1', target: 'ft1', animated: true }
    ]
  },
  // Add 7 more initial deployments to reach 10
  ...Array.from({ length: 7 }).map((_, i) => ({
    id: `wf_auto_${i}`,
    name: `System Automation ${i + 4}`,
    description: 'Enterprise workflow monitoring system.',
    active: true, updatedAt: new Date().toISOString(), triggerType: 'schedule' as const, schedule: 'hourly', environment: 'staging' as const, priority: 'standard' as const,
    nodes: [
      { id: 'n1', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Cron Schedule', type: NodeType.CRON, params: { interval: '0 * * * *' }, outputs: ['default'] } },
      { id: 'n2', type: 'custom', position: { x: 350, y: 0 }, data: { label: 'JS Code', type: NodeType.CODE, params: { jsCode: 'return { heartbeat: true };' }, outputs: ['default'] } }
    ],
    edges: [{ id: `e_auto_${i}`, source: 'n1', target: 'n2', animated: true }]
  }))
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
        let label = type.charAt(0).toUpperCase() + type.slice(1);
        // Correct labels from Sidebar.tsx
        if (type === NodeType.GEMINI) label = 'Google Gemini';
        if (type === NodeType.SSH) label = 'SSH Execution';
        if (type === NodeType.CODE) label = 'JS Code';
        if (type === NodeType.HTTP_REQUEST) label = 'HTTP Request';
        if (type === NodeType.SET) label = 'Set Data';
        if (type === NodeType.CRON) label = 'Cron Schedule';
        if (type === NodeType.JSON_PARSER) label = 'JSON Parser';
        if (type === NodeType.SUMMARIZATION_CHAIN) label = 'Summarizer';

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
              const prompt = resolveExpression(node.data.params.prompt, ctx);
              const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
              const result = await ai.models.generateContent({ model: node.data.params.model || 'gemini-2.5-flash', contents: { parts: [{ text: prompt }] } });
              outputItems = [{ json: { text: result.text, jobId: executionId } }];
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
        await Promise.all(startNodes.map(n => get().executeInternal(n.id, [{ json: { value: 100, message: "System Initialized" } }], executionId)));
        const duration = `${Date.now() - startTime}ms`;
        const newExecution: IExecution = { id: executionId, workflowId: wf.id, workflowName: wf.name, status: 'success', startedAt, duration };
        set(s => ({ isExecuting: false, activeJobId: null, executions: [newExecution, ...s.executions].slice(0, 50) }));
      },

      runNodeInstance: async (id) => { 
        const executionId = `DEBUG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        set({ isExecuting: true, activeJobId: executionId }); 
        await get().executeInternal(id, [{ json: { value: 100, message: "Isolated test" } }], executionId); 
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
