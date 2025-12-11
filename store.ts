
import { create } from 'zustand';
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

const wrapInItems = (data: any): INodeExecutionData[] => {
  if (Array.isArray(data)) {
    return data.map((item, index) => ({ 
      json: typeof item === 'object' ? item : { value: item },
      pairedItem: { item: index }
    }));
  }
  return [{ json: data }];
};

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

const validateAgainstSchema = (data: any, schema: any): string | null => {
  if (!schema || typeof schema !== 'object' || Object.keys(schema).length === 0) return null;
  
  const check = (val: any, s: any, path: string = ''): string | null => {
    if (!s || typeof s !== 'object') return null;

    if (s.type) {
      const actualType = Array.isArray(val) ? 'array' : val === null ? 'null' : typeof val;
      const expectedType = s.type;
      
      if (expectedType === 'integer') {
        if (!Number.isInteger(val)) return `Path '${path || 'root'}' expected integer, got ${actualType}`;
      } else if (actualType !== expectedType) {
        return `Path '${path || 'root'}' expected ${expectedType}, got ${actualType}`;
      }
    }

    if (s.type === 'object' && s.properties && val && typeof val === 'object' && !Array.isArray(val)) {
      if (s.required && Array.isArray(s.required)) {
        for (const req of s.required) {
          if (!(req in val)) return `Path '${path || 'root'}' missing required property '${req}'`;
        }
      }
      for (const [key, propSchema] of Object.entries(s.properties)) {
        if (key in val) {
          const err = check(val[key], propSchema, path ? `${path}.${key}` : key);
          if (err) return err;
        }
      }
    }

    if (s.type === 'array' && s.items && Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        const err = check(val[i], s.items, `${path}[${i}]`);
        if (err) return err;
      }
    }

    return null;
  };

  try {
    const schemaObj = typeof schema === 'string' ? JSON.parse(schema) : schema;
    return check(data, schemaObj);
  } catch (e) {
    return "Invalid Schema Definition: Could not parse JSON";
  }
};

interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  active: boolean;
  updatedAt: string;
}

interface WorkflowStore {
  workflows: Workflow[];
  executions: IExecution[];
  credentials: ICredential[];
  currentWorkflow: Workflow | null;
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
  createWorkflow: (name: string, description: string) => string;
  duplicateWorkflow: (id: string) => void;
  deleteWorkflow: (id: string) => void;
  toggleWorkflowActive: (id: string) => void;
  updateNodeData: (nodeId: string, data: any) => void;
  addNode: (type: NodeType, position: XYPosition) => void;
  cloneNode: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  retryNode: (nodeId: string) => Promise<void>;
  runWorkflow: () => Promise<void>;
  runNodeInstance: (nodeId: string) => Promise<void>;
  setSelectedNodeId: (id: string | null) => void;
  toggleDebugMode: () => void;
  step: () => void;
  resume: () => void;
  abortExecution: () => void;
  executeInternal: (nodeId: string, inputItems: INodeExecutionData[]) => Promise<INodeExecutionData[] | null>;
  clearExecutions: () => void;
  updateSettings: (settings: any) => void;
  toggleLock: () => void;
  applyTemplate: (template: any) => string;
  addCredential: (cred: Omit<ICredential, 'id' | 'updatedAt' | 'status'>) => void;
  deleteCredential: (id: string) => void;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflows: [
    { 
      id: 'template_vision', 
      name: 'Multimodal Triage', 
      description: 'Analyze customer screenshots and route tickets via AI.', 
      active: true, 
      nodes: [
        { id: 'v1', type: 'custom', position: { x: 100, y: 100 }, data: { label: 'Customer Webhook', type: NodeType.WEBHOOK, params: {}, outputs: ['default'] } },
        { id: 'v2', type: 'custom', position: { x: 450, y: 100 }, data: { label: 'Analyze Issue', type: NodeType.GEMINI, params: { prompt: "Analyze the attached screenshot. What is the technical error shown?", model: 'gemini-2.5-flash' }, outputs: ['default'] } },
        { id: 'v3', type: 'custom', position: { x: 800, y: 100 }, data: { label: 'Zendesk Dispatch', type: NodeType.HTTP_REQUEST, params: { url: "https://api.zendesk.com/v2/tickets", method: "POST" }, outputs: ['default'] } }
      ], 
      edges: [
        { id: 'e1', source: 'v1', target: 'v2', animated: true, style: { stroke: '#38bdf8' } },
        { id: 'e2', source: 'v2', target: 'v3', animated: true, style: { stroke: '#38bdf8' } }
      ], 
      updatedAt: new Date().toISOString() 
    }
  ],
  executions: [],
  credentials: [
    { id: 'cred_1', name: 'OpenFlow Shared Key', type: 'apiKey', data: { key: process.env.API_KEY || '' }, status: 'valid', updatedAt: '2h ago' }
  ],
  currentWorkflow: null,
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

  createWorkflow: (name, description) => {
    const id = `wf_${Math.random().toString(36).substr(2, 9)}`;
    const newWf = { id, name, description, active: false, nodes: [], edges: [], updatedAt: new Date().toISOString() };
    set(state => ({ workflows: [...state.workflows, newWf] }));
    return id;
  },

  applyTemplate: (template) => {
    const id = `wf_${Math.random().toString(36).substr(2, 9)}`;
    const newWf = { 
      id, 
      name: template.name, 
      description: template.description,
      nodes: JSON.parse(JSON.stringify(template.nodes)),
      edges: JSON.parse(JSON.stringify(template.edges)),
      active: false, 
      updatedAt: new Date().toISOString() 
    };
    set(state => ({ workflows: [...state.workflows, newWf] }));
    return id;
  },

  duplicateWorkflow: (id) => {
    const wf = get().workflows.find(w => w.id === id);
    if (!wf) return;
    const copy = { ...JSON.parse(JSON.stringify(wf)), id: `wf_${Math.random().toString(36).substr(2, 9)}`, name: `${wf.name} (Copy)`, updatedAt: new Date().toISOString(), active: false };
    set(state => ({ workflows: [...state.workflows, copy] }));
  },

  deleteWorkflow: (id) => set(state => ({ workflows: state.workflows.filter(w => w.id !== id), currentWorkflow: state.currentWorkflow?.id === id ? null : state.currentWorkflow })),
  toggleWorkflowActive: (id) => set(state => ({ workflows: state.workflows.map(w => w.id === id ? { ...w, active: !w.active } : w) })),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  toggleLock: () => set(state => ({ isLocked: !state.isLocked })),
  toggleDebugMode: () => set(state => ({ isDebugMode: !state.isDebugMode })),
  step: () => { const { stepResolver } = get(); if (stepResolver) { stepResolver(); set({ stepResolver: null, isPaused: false, pausedNodeId: null }); } },
  resume: () => get().step(),
  abortExecution: () => set({ isExecuting: false, isPaused: false, pausedNodeId: null, stepResolver: null }),

  onNodesChange: (changes) => { const { currentWorkflow, isLocked } = get(); if (!currentWorkflow || isLocked) return; set({ currentWorkflow: { ...currentWorkflow, nodes: applyNodeChanges(changes, currentWorkflow.nodes) } }); },
  onEdgesChange: (changes) => { const { currentWorkflow, isLocked } = get(); if (!currentWorkflow || isLocked) return; set({ currentWorkflow: { ...currentWorkflow, edges: applyEdgeChanges(changes, currentWorkflow.edges) } }); },
  onConnect: (connection) => { const { currentWorkflow, isLocked } = get(); if (!currentWorkflow || isLocked) return; set({ currentWorkflow: { ...currentWorkflow, edges: addEdge({ ...connection, id: `e_${Math.random().toString(36).substr(2, 6)}`, style: { stroke: '#38bdf8', strokeWidth: 3 }, animated: true }, currentWorkflow.edges) } }); },
  onNodesDelete: (nodes) => { const { currentWorkflow } = get(); if (!currentWorkflow) return; const ids = nodes.map(n => n.id); set({ currentWorkflow: { ...currentWorkflow, nodes: currentWorkflow.nodes.filter(n => !ids.includes(n.id)), edges: currentWorkflow.edges.filter(e => !ids.includes(e.source) && !ids.includes(e.target)) } }); },

  addNode: (type, position) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;
    let outputs = ['default'];
    if (type === NodeType.FILTER) outputs = ['true', 'false'];
    if (type === NodeType.SWITCH) outputs = ['Case 1', 'Case 2', 'Default'];
    const newNode: Node = { id: `node_${Math.random().toString(36).substr(2, 9)}`, type: 'custom', position, data: { label: type.charAt(0).toUpperCase() + type.slice(1), type, params: {}, status: 'idle', outputs } };
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
  retryNode: async (id) => { set({ isExecuting: true }); await get().executeInternal(id, [{ json: { retry: true } }]); set({ isExecuting: false }); },
  clearExecutions: () => set({ executions: [] }),
  updateSettings: (newSettings) => set(s => ({ settings: { ...s.settings, ...newSettings } })),

  executeInternal: async (nodeId, inputItems) => {
    if (!get().isExecuting) return null;
    const node = get().currentWorkflow?.nodes.find(n => n.id === nodeId);
    if (!node) return null;

    if (get().isDebugMode) { set({ isPaused: true, pausedNodeId: nodeId }); await new Promise<void>(res => set({ stepResolver: res })); }

    get().updateNodeData(nodeId, { status: 'executing' });
    let outputItems: INodeExecutionData[] = [];
    let branch = 'default';

    try {
      const firstItem = inputItems[0];
      const ctx = { $json: firstItem?.json || {} };
      
      // Resolve Credential if present
      const credentialId = node.data.params.credentialId;
      const credential = get().credentials.find(c => c.id === credentialId);

      switch (node.data.type) {
        case NodeType.SET: {
          const rawJson = resolveExpression(node.data.params.json, ctx);
          const schema = resolveExpression(node.data.params.jsonSchema, ctx);
          let parsedData = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
          
          const validationError = validateAgainstSchema(parsedData, schema);
          if (validationError) throw new Error(`Schema Validation Failed: ${validationError}`);
          
          outputItems = [{ json: parsedData, pairedItem: firstItem?.pairedItem }];
          break;
        }

        case NodeType.HTTP_REQUEST: {
          const url = resolveExpression(node.data.params.url, ctx);
          const method = node.data.params.method || 'GET';
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          
          if (credential?.type === 'apiKey') {
            headers['Authorization'] = `Bearer ${credential.data.key}`;
          }

          // Mock simulation for browser environment
          await new Promise(r => setTimeout(r, 800));
          outputItems = [{ json: { url, method, headers, status: 200, body: { success: true } }, pairedItem: firstItem?.pairedItem }];
          break;
        }

        case NodeType.GEMINI: {
          const prompt = resolveExpression(node.data.params.prompt, ctx);
          const modelName = node.data.params.model || 'gemini-2.5-flash';
          
          // Use vault key if available, otherwise fallback to process.env
          const apiKey = credential?.data.key || process.env.API_KEY;
          const ai = new GoogleGenAI({ apiKey });
          
          const parts: any[] = [{ text: prompt }];
          if (firstItem?.binary) {
             (Object.values(firstItem.binary) as IBinaryData[]).forEach(b => parts.push({ inlineData: { data: b.data, mimeType: b.mimeType } }));
          }
          const response = await ai.models.generateContent({ model: modelName, contents: { parts } });
          outputItems = [{ json: { text: response.text, usage: response.usageMetadata }, pairedItem: firstItem?.pairedItem }];
          break;
        }

        case NodeType.SSH: {
          const host = resolveExpression(node.data.params.host, ctx);
          const command = resolveExpression(node.data.params.command, ctx);
          const user = credential?.data.user || 'root';
          
          if (!host || !command) throw new Error("Host and Command are mandatory.");
          await new Promise(r => setTimeout(r, 1500));
          outputItems = [{ json: { stdout: `[SSH ${user}@${host}] Executed: ${command}`, exitCode: 0 }, pairedItem: firstItem?.pairedItem }];
          break;
        }

        default:
          await new Promise(r => setTimeout(r, 300));
          outputItems = inputItems;
      }
      
      get().updateNodeData(nodeId, { status: 'success', lastResult: [outputItems] });
    } catch (e: any) {
      get().updateNodeData(nodeId, { status: 'error', error: { message: e.message, timestamp: new Date().toISOString() } });
      set({ isExecuting: false });
      return null;
    }

    const nextEdges = get().currentWorkflow?.edges.filter(e => e.source === nodeId && (!e.sourceHandle || e.sourceHandle === branch));
    if (nextEdges?.length) await Promise.all(nextEdges.map(e => get().executeInternal(e.target, outputItems)));
    return outputItems;
  },

  runWorkflow: async () => {
    const wf = get().currentWorkflow;
    if (!wf || get().isExecuting) return;
    set({ isExecuting: true });
    const startNodes = wf.nodes.filter(n => !wf.edges.some(e => e.target === n.id));
    await Promise.all(startNodes.map(n => get().executeInternal(n.id, [{ json: { trigger: 'manual' } }])));
    set({ isExecuting: false });
  },

  runNodeInstance: async (id) => { set({ isExecuting: true }); await get().executeInternal(id, [{ json: { isolation: true } }]); set({ isExecuting: false }); },
  updateNodeData: (id, data) => set(s => ({ currentWorkflow: { ...s.currentWorkflow!, nodes: s.currentWorkflow!.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n) } }))
}));
