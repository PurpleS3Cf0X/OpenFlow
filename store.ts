
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
import { NodeType, INodeExecutionData, IExecution, IBinaryData } from './types.ts';
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
  toggleLock: () => void;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflows: [{ id: '1', name: 'AI Core Operations', description: 'Enterprise AI orchestration workflow.', active: true, nodes: [], edges: [], updatedAt: new Date().toISOString() }],
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

      switch (node.data.type) {
        case NodeType.GEMINI: {
          // Initialize AI client using environment variable API key directly
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = resolveExpression(node.data.params.prompt, ctx);
          const modelName = node.data.params.model || 'gemini-2.5-flash';
          const parts: any[] = [{ text: prompt }];
          if (firstItem?.binary) {
             // Cast values to IBinaryData[] to resolve TS errors regarding unknown properties
             (Object.values(firstItem.binary) as IBinaryData[]).forEach(b => parts.push({ inlineData: { data: b.data, mimeType: b.mimeType } }));
          }
          const response = await ai.models.generateContent({ model: modelName, contents: { parts } });
          outputItems = [{ json: { text: response.text, usage: response.usageMetadata }, pairedItem: firstItem?.pairedItem }];
          break;
        }

        case NodeType.OPENAI: {
          const op = node.data.params.operation || 'chat';
          const prompt = resolveExpression(node.data.params.prompt, ctx);
          await new Promise(r => setTimeout(r, 1200));
          if (op === 'image') {
            outputItems = [{ 
              json: { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe' }, 
              binary: { 'img': { data: 'base64_data_here', mimeType: 'image/png', fileName: 'dalle.png' } }
            }];
          } else {
            outputItems = [{ json: { text: `OpenAI response for "${prompt}" using ${op}` }, pairedItem: firstItem?.pairedItem }];
          }
          break;
        }

        case NodeType.AI_AGENT:
        case NodeType.LLM_CHAIN:
        case NodeType.SUMMARIZATION_CHAIN: {
          await new Promise(r => setTimeout(r, 2000));
          outputItems = [{ json: { 
            result: `LangChain ${node.data.type} processed the request.`,
            agent_thought_process: ["Analyzing input", "Querying Vector Store", "Generating summary"],
            tokens_used: 450
          }}];
          break;
        }

        case NodeType.HTTP_REQUEST: {
          const url = resolveExpression(node.data.params.url, ctx);
          const res = await fetch(url || 'https://api.github.com/repos/google/genai');
          const json = await res.json();
          outputItems = wrapInItems(json);
          break;
        }

        case NodeType.FILTER: {
          const prop = resolveExpression(node.data.params.property, ctx);
          const val = firstItem?.json[prop];
          const target = resolveExpression(node.data.params.value, ctx);
          branch = val == target ? 'true' : 'false';
          outputItems = inputItems;
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
  // Removed duplicate setSelectedNodeId property here to fix TS error
  updateNodeData: (id, data) => set(s => ({ currentWorkflow: { ...s.currentWorkflow!, nodes: s.currentWorkflow!.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n) } }))
}));
