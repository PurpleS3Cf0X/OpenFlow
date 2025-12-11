
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
  addLibraryItem: (item: Omit<LibraryItem, 'id'>) => void;
  deleteLibraryItem: (id: string) => void;
  addCredential: (cred: Omit<ICredential, 'id' | 'updatedAt' | 'status'>) => void;
  deleteCredential: (id: string) => void;
}

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => ({
      workflows: [],
      libraryItems: [
        { 
          id: 'tpl_vision',
          name: 'Vision Triage Engine',
          description: 'Analyze screenshots with Gemini 2.5 and route to helpdesk.',
          category: 'AI Ops',
          complexity: 'Medium',
          color: 'sky',
          nodes: [
            { id: 'v1', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Support Webhook', type: NodeType.WEBHOOK, params: {}, outputs: ['default'] } },
            { id: 'v2', type: 'custom', position: { x: 300, y: 0 }, data: { label: 'AI Image Analysis', type: NodeType.GEMINI, params: { prompt: "Analyze screenshot for technical errors.", model: 'gemini-2.5-flash' }, outputs: ['default'] } },
            { id: 'v3', type: 'custom', position: { x: 600, y: 0 }, data: { label: 'HTTP Dispatch', type: NodeType.HTTP_REQUEST, params: { method: 'POST', url: 'https://api.example.com/tickets' }, outputs: ['default'] } }
          ],
          edges: [{ id: 'e1', source: 'v1', target: 'v2', animated: true }, { id: 'e2', source: 'v2', target: 'v3', animated: true }]
        }
      ],
      executions: [],
      credentials: [],
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
          name: template.name + " (Instance)", 
          description: template.description,
          nodes: JSON.parse(JSON.stringify(template.nodes)),
          edges: JSON.parse(JSON.stringify(template.edges)),
          active: false, 
          updatedAt: new Date().toISOString() 
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
      clearExecutions: () => set({ executions: [] }),
      updateSettings: (newSettings) => set(s => ({ settings: { ...s.settings, ...newSettings } })),

      executeInternal: async (nodeId, inputItems) => {
        if (!get().isExecuting) return null;
        const node = get().currentWorkflow?.nodes.find(n => n.id === nodeId);
        if (!node) return null;

        if (get().isDebugMode) { set({ isPaused: true, pausedNodeId: nodeId }); await new Promise<void>(res => set({ stepResolver: res })); }

        get().updateNodeData(nodeId, { status: 'executing' });
        let outputItems: INodeExecutionData[] = [];
        
        try {
          const firstItem = inputItems[0] || { json: {} };
          const ctx = { $json: firstItem.json };
          
          switch (node.data.type) {
            case NodeType.SET:
              const val = resolveExpression(node.data.params.json, ctx);
              outputItems = [{ json: typeof val === 'string' ? JSON.parse(val) : val }];
              break;
            case NodeType.GEMINI:
              const prompt = resolveExpression(node.data.params.prompt, ctx);
              const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
              const result = await ai.models.generateContent({
                model: node.data.params.model || 'gemini-2.5-flash',
                contents: { parts: [{ text: prompt }] }
              });
              outputItems = [{ json: { text: result.text } }];
              break;
            case NodeType.HTTP_REQUEST:
              const url = resolveExpression(node.data.params.url, ctx);
              await new Promise(r => setTimeout(r, 600));
              outputItems = [{ json: { status: 200, url, body: { success: true } } }];
              break;
            default:
              await new Promise(r => setTimeout(r, 300));
              outputItems = inputItems;
          }
          
          get().updateNodeData(nodeId, { status: 'success', lastResult: [outputItems] });
          
          const nextEdges = get().currentWorkflow?.edges.filter(e => e.source === nodeId);
          if (nextEdges?.length) {
            await Promise.all(nextEdges.map(e => get().executeInternal(e.target, outputItems)));
          }
          return outputItems;
        } catch (e: any) {
          get().updateNodeData(nodeId, { status: 'error', error: { message: e.message, timestamp: new Date().toISOString() } });
          set({ isExecuting: false });
          return null;
        }
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
    }),
    {
      name: 'openflow-storage',
      partialize: (state) => ({
        workflows: state.workflows,
        libraryItems: state.libraryItems,
        credentials: state.credentials,
        settings: state.settings
      }),
    }
  )
);
