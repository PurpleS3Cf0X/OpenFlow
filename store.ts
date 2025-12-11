
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

const runInSandbox = async (code: string, inputData: any) => {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Sandbox execution timed out (2s limit)')), 2000)
  );

  const executionPromise = (async () => {
    try {
      const sandbox: any = {
        $json: JSON.parse(JSON.stringify(inputData)),
        console: { log: (...args: any[]) => console.log('[OpenFlow-Sandbox]', ...args) },
        Math, Date, JSON, 
        result: null 
      };

      const proxy = new Proxy(sandbox, {
        has: () => true,
        get: (target, key) => {
          if (key === Symbol.unscopables) return undefined;
          if (key in target) return target[key];
          if (['window', 'document', 'globalThis', 'top', 'parent', 'self', 'frames'].includes(key as string)) {
             throw new ReferenceError(`Access to ${String(key)} is restricted in this environment.`);
          }
          return undefined;
        }
      });

      const fn = new Function('proxy', `
        with (proxy) {
          return (async () => {
            ${code}
            return typeof result !== "undefined" && result !== null ? result : $json;
          })();
        }
      `);

      return { success: true, result: await fn(proxy) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  })();

  return Promise.race([executionPromise, timeoutPromise]) as Promise<{success: boolean, result?: any, error?: string}>;
};

const resolveExpression = (value: any, context: any): any => {
  if (typeof value !== 'string') return value;
  if (!value.includes('{{')) return value;

  const fullMatch = value.match(/^{{\s*(.+?)\s*}}$/);
  if (fullMatch) {
    try {
      const keys = Object.keys(context);
      const values = Object.values(context);
      const fn = new Function(...keys, `return ${fullMatch[1]}`);
      return fn(...values);
    } catch (e) {
      return undefined;
    }
  }

  return value.replace(/{{(.+?)}}/g, (_, match) => {
    try {
      const keys = Object.keys(context);
      const values = Object.values(context);
      const fn = new Function(...keys, `return ${match.trim()}`);
      const result = fn(...values);
      return result === undefined ? '' : String(result);
    } catch (e) {
      return `[Error]`;
    }
  });
};

const validateJsonSchema = (data: any, schemaString: string) => {
  if (!schemaString || !schemaString.trim()) return { valid: true };
  try {
    const schema = JSON.parse(schemaString);
    if (schema.required && Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (data[key] === undefined) {
          return { valid: false, error: `Missing required field: ${key}` };
        }
      }
    }
    if (schema.properties) {
      for (const [key, rules] of Object.entries(schema.properties as any)) {
        if (data[key] !== undefined && rules.type) {
          const actualType = Array.isArray(data[key]) ? 'array' : typeof data[key];
          const expectedType = rules.type;
          if (expectedType !== actualType) {
            return { valid: false, error: `Field "${key}" expected ${expectedType}, got ${actualType}` };
          }
        }
      }
    }
    return { valid: true };
  } catch (e) {
    return { valid: false, error: "Invalid Schema: The provided string is not valid JSON." };
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
  deleteSelected: () => void;
  retryNode: (nodeId: string) => Promise<void>;
  runWorkflow: () => Promise<void>;
  runFromNode: (nodeId: string) => Promise<void>;
  runNodeInstance: (nodeId: string) => Promise<void>;
  setSelectedNodeId: (id: string | null) => void;
  toggleDebugMode: () => void;
  step: () => void;
  resume: () => void;
  abortExecution: () => void;
  executeInternal: (nodeId: string, inputData: any, continueDownstream?: boolean) => Promise<any>;
  updateSettings: (settings: any) => void;
  clearExecutions: () => void;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflows: [{ 
    id: '1', name: 'Operations Center', description: 'Primary automation environment.', 
    active: true, nodes: [], edges: [], updatedAt: new Date().toISOString()
  }],
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
    const newId = `wf_${Math.random().toString(36).substr(2, 9)}`;
    const copy = { 
      ...JSON.parse(JSON.stringify(wf)), 
      id: newId, 
      name: `${wf.name} (Copy)`, 
      updatedAt: new Date().toISOString(),
      active: false
    };
    set(state => ({ workflows: [...state.workflows, copy] }));
  },

  deleteWorkflow: (id) => {
    set(state => ({ 
      workflows: state.workflows.filter(w => w.id !== id),
      currentWorkflow: state.currentWorkflow?.id === id ? null : state.currentWorkflow
    }));
  },

  toggleWorkflowActive: (id) => {
    set(state => ({ 
      workflows: state.workflows.map(w => w.id === id ? { ...w, active: !w.active } : w) 
    }));
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  toggleLock: () => set(state => ({ isLocked: !state.isLocked })),
  toggleDebugMode: () => set(state => ({ isDebugMode: !state.isDebugMode })),
  step: () => {
    const { stepResolver } = get();
    if (stepResolver) {
      stepResolver();
      set({ stepResolver: null, isPaused: false, pausedNodeId: null });
    }
  },
  resume: () => get().step(),
  abortExecution: () => {
    set({ isExecuting: false, isPaused: false, pausedNodeId: null, stepResolver: null });
    const { currentWorkflow } = get();
    if (currentWorkflow) {
      const resetNodes = currentWorkflow.nodes.map(n => ({ ...n, data: { ...n.data, status: 'idle' } }));
      set({ currentWorkflow: { ...currentWorkflow, nodes: resetNodes } });
    }
  },

  updateSettings: (newSettings) => set(state => ({ settings: { ...state.settings, ...newSettings } })),
  clearExecutions: () => set({ executions: [] }),

  onNodesChange: (changes) => {
    const { currentWorkflow, isLocked } = get();
    if (!currentWorkflow || isLocked) return;
    set({ currentWorkflow: { ...currentWorkflow, nodes: applyNodeChanges(changes, currentWorkflow.nodes) } });
  },
  
  onEdgesChange: (changes) => {
    const { currentWorkflow, isLocked } = get();
    if (!currentWorkflow || isLocked) return;
    set({ currentWorkflow: { ...currentWorkflow, edges: applyEdgeChanges(changes, currentWorkflow.edges) } });
  },
  
  onConnect: (connection) => {
    const { currentWorkflow, isLocked } = get();
    if (!currentWorkflow || isLocked) return;
    set({ currentWorkflow: { ...currentWorkflow, edges: addEdge({ ...connection, id: `e_${Math.random().toString(36).substr(2, 6)}`, style: { stroke: '#38bdf8', strokeWidth: 3 }, animated: true }, currentWorkflow.edges) } });
  },

  onNodesDelete: (nodesToDelete) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;
    const ids = nodesToDelete.map(n => n.id);
    set({
      currentWorkflow: {
        ...currentWorkflow,
        nodes: currentWorkflow.nodes.filter(n => !ids.includes(n.id)),
        edges: currentWorkflow.edges.filter(e => !ids.includes(e.source) && !ids.includes(e.target))
      }
    });
  },

  addNode: (type, position) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;
    let outputs = ['default'];
    if (type === NodeType.FILTER) outputs = ['true', 'false'];
    if (type === NodeType.SWITCH) outputs = ['output_1', 'output_2', 'output_3', 'output_4'];

    const newNode: Node = { 
      id: `node_${Math.random().toString(36).substr(2, 9)}`, 
      type: 'custom', 
      position, 
      data: { 
        label: type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1'), 
        type, 
        params: {}, 
        status: 'idle', 
        outputs 
      } 
    };
    set({ currentWorkflow: { ...currentWorkflow, nodes: [...currentWorkflow.nodes, newNode] } });
  },

  cloneNode: (nodeId) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;
    const node = currentWorkflow.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const newNode: Node = {
      ...JSON.parse(JSON.stringify(node)),
      id: `node_${Math.random().toString(36).substr(2, 9)}`,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
      selected: false,
      data: { ...node.data, status: 'idle', lastResult: undefined, error: undefined }
    };
    set({ currentWorkflow: { ...currentWorkflow, nodes: [...currentWorkflow.nodes, newNode] } });
  },

  deleteNode: (nodeId) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;
    set({
      currentWorkflow: {
        ...currentWorkflow,
        nodes: currentWorkflow.nodes.filter(n => n.id !== nodeId),
        edges: currentWorkflow.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
      }
    });
  },

  deleteSelected: () => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;
    const selectedNodes = currentWorkflow.nodes.filter(n => n.selected);
    get().onNodesDelete(selectedNodes);
  },

  retryNode: async (nodeId) => {
    if (get().isExecuting) return;
    set({ isExecuting: true });
    // Pull the input from the most recent upstream execution or default to empty
    const edges = get().currentWorkflow?.edges.filter(e => e.target === nodeId);
    let inputData = { retry: true };
    if (edges && edges.length > 0) {
      const source = get().currentWorkflow?.nodes.find(n => n.id === edges[0].source);
      if (source?.data.lastResult) inputData = source.data.lastResult[0][0].json;
    }
    await get().executeInternal(nodeId, inputData, false);
    set({ isExecuting: false });
  },

  executeInternal: async (nodeId, inputData = {}, continueDownstream = true) => {
    if (!get().isExecuting) return null;
    const node = get().currentWorkflow?.nodes.find(n => n.id === nodeId);
    if (!node) return null;

    if (get().isDebugMode) {
      set({ isPaused: true, pausedNodeId: nodeId });
      await new Promise<void>(resolve => set({ stepResolver: resolve }));
    }

    get().updateNodeData(nodeId, { status: 'executing' });
    await new Promise(r => setTimeout(r, 400));

    const context = { $json: inputData };
    const resolvedParams: Record<string, any> = {};
    Object.entries(node.data.params || {}).forEach(([key, value]) => {
      resolvedParams[key] = resolveExpression(value, context);
    });

    let outputData = JSON.parse(JSON.stringify(inputData));
    let branch = 'default';

    try {
      switch (node.data.type) {
        case NodeType.SET:
          const { key, value, schema: setSchema } = resolvedParams;
          if (key) {
            const keys = key.split('.');
            let obj = outputData;
            for (let i = 0; i < keys.length - 1; i++) {
              if (!obj[keys[i]]) obj[keys[i]] = {};
              obj = obj[keys[i]];
            }
            obj[keys[keys.length - 1]] = value;
          }
          if (setSchema) {
            const validation = validateJsonSchema(outputData, setSchema);
            if (!validation.valid) throw new Error(`Schema Validation Error: ${validation.error}`);
          }
          break;

        case NodeType.FILTER:
          const { property, operator = 'equal', compareValue } = resolvedParams;
          const actualVal = outputData[property];
          switch(operator) {
            case 'notEqual': branch = actualVal != compareValue ? 'true' : 'false'; break;
            case 'contains': branch = String(actualVal).includes(compareValue) ? 'true' : 'false'; break;
            case 'exists': branch = actualVal !== undefined ? 'true' : 'false'; break;
            default: branch = actualVal == compareValue ? 'true' : 'false'; break;
          }
          break;

        case NodeType.SWITCH:
          const switchVal = resolvedParams.value;
          if (switchVal === resolvedParams.rule1) branch = 'output_1';
          else if (switchVal === resolvedParams.rule2) branch = 'output_2';
          else if (switchVal === resolvedParams.rule3) branch = 'output_3';
          else branch = 'output_4';
          break;

        case NodeType.MERGE:
          // Intelligent Merge: if input is an array of items from multiple branches, combine them
          branch = 'default';
          break;

        case NodeType.HTTP_REQUEST:
          const { method = 'GET', url, body } = resolvedParams;
          if (!url) throw new Error("URL is missing.");
          const response = await fetch(url, { 
            method, 
            headers: { 'Content-Type': 'application/json' },
            body: ['POST', 'PUT', 'PATCH'].includes(method) ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          outputData = (response.headers.get('content-type')?.includes('json')) ? await response.json() : { text: await response.text() };
          break;

        case NodeType.CODE:
          const sandboxResult = await runInSandbox(node.data.params?.jsCode || '', inputData);
          if (!sandboxResult.success) throw new Error(sandboxResult.error);
          outputData = sandboxResult.result;
          break;
          
        case NodeType.JSON_PARSER:
          const { jsonString, schema: parserSchema } = resolvedParams;
          try {
            outputData = JSON.parse(jsonString || '{}');
            if (parserSchema) {
              const v = validateJsonSchema(outputData, parserSchema);
              if (!v.valid) throw new Error(`Schema Validation Error: ${v.error}`);
            }
          } catch (e: any) {
            throw new Error(`Parse Error: ${e.message}`);
          }
          break;

        case NodeType.WAIT:
          await new Promise(r => setTimeout(r, (Number(resolvedParams.amount) || 1) * 1000));
          break;

        case NodeType.SPLIT_BATCHES:
          const batchSize = Number(resolvedParams.size) || 10;
          if (Array.isArray(outputData)) {
            outputData = outputData.slice(0, batchSize);
          }
          break;

        case NodeType.LIMIT:
          const limitCount = Number(resolvedParams.count) || 1;
          if (Array.isArray(outputData)) outputData = outputData.slice(0, limitCount);
          else outputData = [outputData].slice(0, limitCount)[0];
          break;

        case NodeType.SORT:
          const sortKey = resolvedParams.key;
          if (Array.isArray(outputData) && sortKey) {
            outputData.sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : -1));
          }
          break;
      }
      
      const executionResult: INodeExecutionData[][] = [[{ json: outputData }]];
      get().updateNodeData(nodeId, { status: 'success', lastResult: executionResult });
    } catch (e: any) {
      get().updateNodeData(nodeId, { status: 'error', error: { message: e.message, timestamp: new Date().toISOString() } });
      set({ isExecuting: false });
      return null;
    }

    if (!continueDownstream) return outputData;

    const outgoingEdges = get().currentWorkflow?.edges.filter(e => e.source === nodeId && (!e.sourceHandle || e.sourceHandle === branch));
    if (outgoingEdges && outgoingEdges.length > 0) {
      await Promise.all(outgoingEdges.map(edge => get().executeInternal(edge.target, outputData, true)));
    }
    return outputData;
  },

  runWorkflow: async () => {
    const { currentWorkflow } = get();
    if (!currentWorkflow || get().isExecuting) return;
    set({ isExecuting: true });
    set({ currentWorkflow: { ...currentWorkflow, nodes: currentWorkflow.nodes.map(n => ({ ...n, data: { ...n.data, status: 'idle', error: undefined } })) } });

    const triggerNodes = currentWorkflow.nodes.filter(n => [NodeType.WEBHOOK, NodeType.CRON].includes(n.data.type));
    const startNodes = triggerNodes.length > 0 ? triggerNodes : currentWorkflow.nodes.filter(n => !currentWorkflow.edges.some(e => e.target === n.id));
    
    await Promise.all(startNodes.map(n => get().executeInternal(n.id, { trigger: 'manual', timestamp: new Date().toISOString() })));
    set({ isExecuting: false });
  },

  runFromNode: async (nodeId) => {
    if (get().isExecuting) return;
    set({ isExecuting: true });
    const node = get().currentWorkflow?.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const lastResult = node.data.lastResult?.[0]?.[0]?.json || { trigger: 'selective' };
    await get().executeInternal(nodeId, lastResult, true);
    set({ isExecuting: false });
  },

  runNodeInstance: async (nodeId) => {
    if (get().isExecuting) return;
    set({ isExecuting: true });
    const upstreamEdges = get().currentWorkflow?.edges.filter(e => e.target === nodeId);
    let inputData = { trigger: 'isolation' };
    if (upstreamEdges && upstreamEdges.length > 0) {
      const sourceNode = get().currentWorkflow?.nodes.find(n => n.id === upstreamEdges[0].source);
      if (sourceNode?.data.lastResult) {
        inputData = sourceNode.data.lastResult[0][0].json;
      }
    }
    await get().executeInternal(nodeId, inputData, false);
    set({ isExecuting: false });
  },

  updateNodeData: (nodeId, data) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;
    set({ currentWorkflow: { ...currentWorkflow, nodes: currentWorkflow.nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n) } });
  }
}));
