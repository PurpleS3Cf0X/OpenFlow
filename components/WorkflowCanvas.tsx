
import React, { useCallback, useEffect, useRef } from 'react';
import ReactFlow, { Background, Controls, MiniMap, Panel, ReactFlowProvider, useReactFlow } from 'reactflow';
import { useParams, Link } from 'react-router-dom';
import { useWorkflowStore } from '../store.ts';
import CustomNode from './CustomNode.tsx';
import Sidebar from './Sidebar.tsx';
import { 
  Play, ChevronLeft, Maximize, Activity, Plus, Minus, Lock, Unlock, Bug, StepForward, SkipForward, XCircle, Zap, Fingerprint
} from 'lucide-react';
import { NodeType } from '../types.ts';

const nodeTypes = { custom: CustomNode };

const WorkflowCanvasInternal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const { 
    currentWorkflow, loadWorkflow, onNodesChange, onEdgesChange, onConnect, onNodesDelete,
    isExecuting, setSelectedNodeId, selectedNodeId, runWorkflow, runNodeInstance, isLocked, toggleLock,
    isDebugMode, toggleDebugMode, isPaused, step, resume, abortExecution,
    addNode, activeJobId
  } = useWorkflowStore();
  
  const { fitView, zoomIn, zoomOut, project } = useReactFlow();

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.4, duration: 600, maxZoom: 0.85 });
  }, [fitView]);

  useEffect(() => {
    if (id) {
      loadWorkflow(id);
      setTimeout(handleFitView, 100);
    }
  }, [id, loadWorkflow, handleFitView]);

  const onNodeClick = useCallback((_: any, node: any) => setSelectedNodeId(node.id), [setSelectedNodeId]);
  const onPaneClick = useCallback(() => setSelectedNodeId(null), [setSelectedNodeId]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow') as NodeType;
      if (!type || !reactFlowBounds) return;

      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      addNode(type, position);
    },
    [project, addNode]
  );

  if (!currentWorkflow) return <div className="flex-1 h-full flex items-center justify-center"><Activity className="w-12 h-12 text-sky-500/20 animate-pulse" /></div>;

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 relative h-full w-full bg-slate-950/20" ref={reactFlowWrapper}>
        <header className="absolute top-6 left-8 right-8 h-20 glass-card border border-white/10 rounded-[28px] flex items-center justify-between px-8 z-[60] shadow-2xl">
          <div className="flex items-center gap-6">
            <Link to="/workflows" className="p-3 hover:bg-white/5 rounded-xl text-slate-500"><ChevronLeft className="w-6 h-6" /></Link>
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-lg font-black text-white uppercase tracking-tight leading-none">{currentWorkflow.name}</h1>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Operational Canvas</p>
              </div>
              {activeJobId && (
                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl animate-in fade-in slide-in-from-left-4">
                  <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[9px] font-mono text-emerald-400/80 uppercase tracking-widest">Active Job: {activeJobId}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {selectedNodeId && (
              <button 
                onClick={() => runNodeInstance(selectedNodeId)}
                disabled={isExecuting}
                className="flex items-center gap-2.5 p-3.5 px-5 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all animate-in fade-in slide-in-from-right-4"
              >
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Run Selection</span>
              </button>
            )}

            <button onClick={toggleDebugMode} className={`flex items-center gap-2.5 p-3.5 px-5 rounded-2xl border transition-all ${isDebugMode ? 'bg-amber-400/10 border-amber-400/30 text-amber-400 shadow-lg shadow-amber-400/10' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'}`}>
              <Bug className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">{isDebugMode ? 'Debug Active' : 'Debug'}</span>
            </button>

            <button onClick={runWorkflow} disabled={isExecuting} className={`flex items-center gap-4 px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl ${isExecuting ? 'bg-slate-800 text-slate-500' : 'bg-white text-slate-900 hover:scale-[1.02] active:scale-95'}`}>
               {isExecuting ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
               {isExecuting ? 'Running' : 'Execute Flow'}
            </button>
          </div>
        </header>

        {isExecuting && isDebugMode && (
          <Panel position="top-center" className="mt-32">
             <div className="p-4 glass-card rounded-3xl border border-amber-400/20 bg-black/40 backdrop-blur-3xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-top-4">
                <div className="flex items-center gap-3 px-2">
                   <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400 animate-pulse' : 'bg-sky-400'}`} />
                   <span className="text-[9px] font-black text-white uppercase tracking-widest">{isPaused ? 'Step Required' : 'Executing'}</span>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={step} disabled={!isPaused} className="p-3 bg-white/5 hover:bg-sky-500/20 rounded-xl text-sky-400 disabled:opacity-20 transition-all"><StepForward className="w-5 h-5" /></button>
                   <button onClick={resume} disabled={!isPaused} className="p-3 bg-sky-500/10 hover:bg-sky-500/20 rounded-xl text-sky-400 disabled:opacity-20 transition-all"><SkipForward className="w-5 h-5" /></button>
                   <div className="w-px h-8 bg-white/5 mx-1" />
                   <button onClick={abortExecution} className="p-3 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl text-rose-400 transition-all"><XCircle className="w-5 h-5" /></button>
                </div>
             </div>
          </Panel>
        )}

        <div className="w-full h-full">
          <ReactFlow 
            nodes={currentWorkflow.nodes} 
            edges={currentWorkflow.edges} 
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange} 
            onConnect={onConnect} 
            onNodesDelete={onNodesDelete}
            nodeTypes={nodeTypes} 
            onNodeClick={onNodeClick} 
            onPaneClick={onPaneClick} 
            onDrop={onDrop}
            onDragOver={onDragOver}
            minZoom={0.1}
            maxZoom={1.5}
            fitView 
            fitViewOptions={{ padding: 0.4 }}
            nodesDraggable={!isLocked} 
            className="bg-transparent"
            deleteKeyCode={["Backspace", "Delete"]}
          >
            <Background variant="dots" gap={32} size={1} color="#334155" className="opacity-20" />
            <MiniMap className="!bg-slate-900/80 !border-white/10 !rounded-3xl !shadow-2xl !bottom-28 !right-8" />
            <Panel position="bottom-center" className="mb-10">
              <div className="flex items-center gap-4 p-3 glass-card rounded-[24px] border border-white/10 shadow-2xl bg-black/60">
                <button onClick={() => zoomIn()} className="p-3 text-slate-500 hover:text-sky-400 rounded-xl transition-all"><Plus className="w-5 h-5" /></button>
                <button onClick={() => zoomOut()} className="p-3 text-slate-500 hover:text-sky-400 rounded-xl transition-all"><Minus className="w-5 h-5" /></button>
                <div className="w-px h-8 bg-white/5" />
                <button onClick={handleFitView} className="p-3 text-slate-500 hover:text-sky-400 rounded-xl transition-all"><Maximize className="w-5 h-5" /></button>
                <button onClick={toggleLock} className={`p-3 rounded-xl transition-all ${isLocked ? 'text-rose-400 bg-rose-400/10 border border-rose-400/20' : 'text-slate-500 hover:text-sky-400'}`}>{isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}</button>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

const WorkflowCanvas: React.FC = () => (
  <ReactFlowProvider><WorkflowCanvasInternal /></ReactFlowProvider>
);

export default WorkflowCanvas;
