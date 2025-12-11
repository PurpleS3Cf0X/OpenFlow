
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
import { NodeType, INodeExecutionData, IExecution } from './types.ts';

/**
 * Protocol A: Data Transport Standard
 * Data moves as an array of INodeExecutionData objects.
 */
const wrapInItems = (data: any): INodeExecutionData[] => {
  if (Array.isArray(data)) {
    return data.map((item, index) => ({ 
      json: typeof item === 'object' ? item : { value: item },
      pairedItem: { item: index }
    }));
  }
  return [{ json: data }];
};

const runInSandbox = async (code: string, inputItems: INodeExecutionData[]) => {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Sandbox execution timed out')), 2000)
  );

  const executionPromise = (async () => {
    try {
      const results: INodeExecutionData[] = [];
      for (const item of inputItems) {
        const sandbox: any = {
          $json: JSON.parse(JSON.stringify(item.json)),
          Math, Date, JSON, result: null 
        };
        const proxy = new Proxy(sandbox, { has: () => true, get: (t, k) => k === Symbol.unscopables ? undefined : t[k as any] });
        const fn = new Function('proxy', `with (proxy) { return (async () => { ${code}; return result || $json; })(); }`);
        const output = await fn(proxy);
        results.push({ json: output, pairedItem: item.pairedItem });
      }
      return { success: true, result: results };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  })();

  return Promise.race([executionPromise, timeoutPromise]) as Promise<{success: boolean, result?: INodeExecutionData[], error?: string}>;
};

const resolveExpression = (value: any, context: any): any => {
  if (typeof value !== 'string' || !value.includes('{{')) return value;
  try {
    const keys = Object.keys(context);
    const values = Object.values(context);
    return value.replace(/{{(.+?)}}/g, (_, match) => {
      const fn = new Function(...keys, `return ${match.trim()}`);
      const result = fn(...values);
      return result === undefined ? '' : String(result);
    });
  } catch (e) { return '[Error]'; }
};

const validateSchema = (item: INodeExecutionData, schemaStr: string) => {
  if (!schemaStr) return { valid: true };
  try {
    const schema = JSON.parse(schemaStr);
    const data = item.json;
    if (schema.required) {
      for (const req of schema.required) {
        if (data[req] === undefined) return { valid: false, error: `Required property "${req}" is missing.` };
      }
    }
    if (schema.properties) {
      // Fix: Cast 'rules' to 'any' to resolve "Property 'type' does not exist on type 'unknown'" errors.
      for (const [key, rules] of Object.entries(schema.properties as any)) {
        if (data[key] !== undefined && (rules as any).type) {
          const type = Array.isArray(data[key]) ? 'array' : typeof data[key];
          if (type !== (rules as any).type) return { valid: false, error: `Property "${key}" expected ${(rules as any).type}, got ${type}.` };
        }
      }
    }
    return { valid: true };
  } catch (e) { return { valid: false, error: 'Invalid JSON Schema definition.' }; }
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
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflows: [{ id: '1', name: 'Operations Center', description: 'Primary automation environment.', active: true, nodes: [], edges: [], updatedAt: new Date().toISOString() }],
  executions: [],
  currentWorkflow: null,
  isExecuting: false,
  isDebugMode: false,
  isPaused: false,
  pausedNodeId: null,
  selectedNodeId: null,
  isLocked: false,
  stepResolver: null,
  settings: { isolatedExecution: true, autoSave: true, defaultView: 'json' },

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
  abortExecution: () => {
    set({ isExecuting: false, isPaused: false, pausedNodeId: null, stepResolver: null });
    const { currentWorkflow } = get();
    if (currentWorkflow) set({ currentWorkflow: { ...currentWorkflow, nodes: currentWorkflow.nodes.map(n => ({ ...n, data: { ...n.data, status: 'idle' } })) } });
  },

  onNodesChange: (changes) => { const { currentWorkflow, isLocked } = get(); if (!currentWorkflow || isLocked) return; set({ currentWorkflow: { ...currentWorkflow, nodes: applyNodeChanges(changes, currentWorkflow.nodes) } }); },
  onEdgesChange: (changes) => { const { currentWorkflow, isLocked } = get(); if (!currentWorkflow || isLocked) return; set({ currentWorkflow: { ...currentWorkflow, edges: applyEdgeChanges(changes, currentWorkflow.edges) } }); },
  onConnect: (connection) => { const { currentWorkflow, isLocked } = get(); if (!currentWorkflow || isLocked) return; set({ currentWorkflow: { ...currentWorkflow, edges: addEdge({ ...connection, id: `e_${Math.random().toString(36).substr(2, 6)}`, style: { stroke: '#38bdf8', strokeWidth: 3 }, animated: true }, currentWorkflow.edges) } }); },
  onNodesDelete: (nodes) => { const { currentWorkflow } = get(); if (!currentWorkflow) return; const ids = nodes.map(n => n.id); set({ currentWorkflow: { ...currentWorkflow, nodes: currentWorkflow.nodes.filter(n => !ids.includes(n.id)), edges: currentWorkflow.edges.filter(e => !ids.includes(e.source) && !ids.includes(e.target)) } }); },

  addNode: (type, position) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;
    let outputs = ['default'];
    if (type === NodeType.FILTER) outputs = ['true', 'false'];
    if (type === NodeType.SWITCH) outputs = ['output_1', 'output_2', 'output_3', 'output_4'];
    
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
    await new Promise(r => setTimeout(r, 400));

    let outputItems: INodeExecutionData[] = [];
    let branch = 'default';

    try {
      const contextItems = { $json: inputItems[0]?.json || {} };

      switch (node.data.type) {
        case NodeType.SET:
          outputItems = inputItems.map(item => {
            const ctx = { $json: item.json };
            const k = resolveExpression(node.data.params.key, ctx);
            const v = resolveExpression(node.data.params.value, ctx);
            const newJson = { ...item.json };
            if (k) newJson[k] = v;
            const val = validateSchema({ json: newJson }, node.data.params.schema);
            if (!val.valid) throw new Error(`Schema Violation: ${val.error}`);
            return { json: newJson, pairedItem: item.pairedItem };
          });
          break;

        case NodeType.FILTER:
          const prop = resolveExpression(node.data.params.property, contextItems);
          const op = node.data.params.operator || 'equal';
          const comp = resolveExpression(node.data.params.compareValue, contextItems);
          const firstVal = inputItems[0]?.json[prop];
          let pass = false;
          if (op === 'equal') pass = firstVal == comp;
          else if (op === 'notEqual') pass = firstVal != comp;
          else if (op === 'contains') pass = String(firstVal).includes(comp);
          else if (op === 'exists') pass = firstVal !== undefined;
          branch = pass ? 'true' : 'false';
          outputItems = inputItems;
          break;

        case NodeType.SWITCH:
          const sVal = resolveExpression(node.data.params.value, contextItems);
          if (sVal === resolveExpression(node.data.params.rule1, contextItems)) branch = 'output_1';
          else if (sVal === resolveExpression(node.data.params.rule2, contextItems)) branch = 'output_2';
          else if (sVal === resolveExpression(node.data.params.rule3, contextItems)) branch = 'output_3';
          else branch = 'output_4';
          outputItems = inputItems;
          break;

        case NodeType.WAIT:
          const sec = Number(resolveExpression(node.data.params.amount, contextItems)) || 1;
          await new Promise(r => setTimeout(r, sec * 1000));
          outputItems = inputItems;
          break;

        case NodeType.JSON_PARSER:
          outputItems = inputItems.map(item => {
            const ctx = { $json: item.json };
            const raw = resolveExpression(node.data.params.jsonString, ctx);
            try {
              const parsed = JSON.parse(raw || '{}');
              const val = validateSchema({ json: parsed }, node.data.params.schema);
              if (!val.valid) throw new Error(`Schema Violation: ${val.error}`);
              return { json: parsed, pairedItem: item.pairedItem };
            } catch (e: any) { throw new Error(`JSON Parse Error: ${e.message}`); }
          });
          break;

        case NodeType.HTTP_REQUEST:
          const url = resolveExpression(node.data.params.url, contextItems);
          if (!url) throw new Error("URL is required");
          const resp = await fetch(url, { method: node.data.params.method || 'GET' });
          const json = await resp.json();
          outputItems = wrapInItems(json);
          break;

        case NodeType.CODE:
          const res = await runInSandbox(node.data.params.jsCode || '', inputItems);
          if (!res.success) throw new Error(res.error);
          outputItems = res.result!;
          break;

        case NodeType.LIMIT:
          const count = Number(resolveExpression(node.data.params.count, contextItems)) || 1;
          outputItems = inputItems.slice(0, count);
          break;

        default:
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

  runNodeInstance: async (id) => { set({ isExecuting: true }); await get().executeInternal(id, [{ json: { trigger: 'isolation' } }]); set({ isExecuting: false }); },
  updateNodeData: (id, data) => set(s => ({ currentWorkflow: { ...s.currentWorkflow!, nodes: s.currentWorkflow!.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n) } }))
  // Removed duplicate setSelectedNodeId property that caused "multiple properties with the same name" error.
}));
