# 🌌 OpenFlow: Enterprise Workflow Orchestrator

**OpenFlow** is a production-grade, open-source workflow automation platform designed with a high-performance **Deep Glass** aesthetic. Built for scalability and security, it serves as a robust alternative to n8n, enabling technical teams to orchestrate complex data pipelines, infrastructure commands, and multimodal AI agents within a unified visual environment.

---

## 🏗️ Architectural Protocols

### Protocol A: The Data Transport Standard
Data in OpenFlow follows the **"Bag of Items"** principle. Information never moves as raw JSON; it is wrapped in an execution context to ensure lineage and metadata tracking:
```typescript
export interface INodeExecutionData {
  json: Record<string, any>;        // The primary payload
  binary?: Record<string, IBinaryData>; // Pointers to multimodal assets
  pairedItem?: { item: number };    // Lineage for split/merge operations
}
```

### Protocol B: Topological Execution Engine
The engine performs dependency-aware traversal of the graph. It supports:
*   **Branching & Merging**: Logical switching and multi-path execution.
*   **Expression Resolution**: Real-time resolution of `{{ $json.property }}` syntax using a scoped Proxy object.
*   **Isolated Sandboxing**: Conceptual execution in `vm2` environments to protect host resources from custom code nodes.

---

## 🚀 Core Features

### 1. Visual Design Canvas
Powered by **React Flow v11+**, the canvas provides a buttery-smooth interface for connecting disparate systems. 
*   **Custom Glass Nodes**: Every node is a translucent card reflecting its internal state.
*   **Animated Edges**: Neon pulses indicate active data flow.

### 2. AI Orchestration (Gemini 2.5)
Native integration with the **Google Gemini API** allows for multimodal workflows:
*   **Vision Triage**: Automatically analyze screenshots or documents passed through webhooks.
*   **Contextual Reasoning**: Use Gemini 2.5 Pro for complex logical decision-making within the flow.

### 3. Secure Auth Vault
Enterprise security is handled via the **Vault**.
*   **Secret Masking**: Credentials are encrypted at rest and only injected during the execution phase.
*   **Compatibility Filtering**: The UI only shows relevant credentials (API Keys, SSH, etc.) for the specific node type.

### 4. Expression Hub
A sophisticated modal editor for building dynamic logic:
*   **Visual Variable Picker**: Browse the output schema of preceding nodes.
*   **Live Evaluation**: See results of your JavaScript expressions in real-time before committing.

---

## 🛠️ Tech Stack
*   **Frontend**: React 18, Vite, Zustand (State), TailwindCSS.
*   **Canvas**: React Flow v11.
*   **AI**: @google/genai (Gemini 2.5 Flash/Pro).
*   **Database**: TypeORM + PostgreSQL (Entity-ready).
*   **Icons**: Lucide React.

---

## 📖 Broad Usage Guide

### Phase 1: Initialization
1.  Navigate to the **Vault** and add your `API_KEY`.
2.  Go to **Automations** and click "Create Workflow."
3.  Define the **Identity** (Name) and **Scope** (Description).

### Phase 2: Design
1.  **Drag and Drop**: Pull nodes from the left Sidebar onto the canvas.
2.  **Logic Connections**: Connect the circular handles. For logical nodes like **Filters**, use the specific handles for "True" or "False" paths.
3.  **Configuring Nodes**: Click a node to open the **Right Inspector**. Use the **Expression Hub** to reference data from previous nodes using `{{ $json.field }}`.

### Phase 3: Deployment & Audit
1.  **Manual Test**: Use "Execute Flow" to run a test instance.
2.  **Debug Mode**: Toggle "Debug" to step through nodes one-by-one and inspect the "Bag of Items" at each stage.
3.  **Audit Logs**: Check the **Executions** page for a full historical trace of all instances, Latency tracking, and error logs.

---

## 🔒 Security Note
OpenFlow utilizes `process.env.API_KEY` for AI nodes. Ensure your environment variables are configured in the host system. For enterprise production, always enable **Isolated Execution Mode** in the Settings panel to sandbox custom Javascript nodes.

---
*Built with ❤️ by the OpenFlow Architecture Team.*
