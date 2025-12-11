
export interface IBinaryData {
  data: string; // Base64 or URL
  mimeType: string;
  fileName: string;
}

export interface INodeExecutionData {
  json: Record<string, any>;
  binary?: Record<string, IBinaryData>;
  pairedItem?: { item: number };
}

export enum NodeType {
  // Core
  WEBHOOK = 'webhook',
  HTTP_REQUEST = 'httpRequest',
  CODE = 'code',
  CRON = 'cron',
  FILTER = 'filter',
  JSON_PARSER = 'jsonParser',
  WAIT = 'wait',
  SET = 'set',
  MERGE = 'merge',
  SWITCH = 'switch',
  SORT = 'sort',
  LIMIT = 'limit',
  SPLIT_BATCHES = 'splitInBatches',
  
  // AI Root Chains
  AI_AGENT = 'aiAgent',
  LLM_CHAIN = 'llmChain',
  QA_CHAIN = 'qaChain',
  SUMMARIZATION_CHAIN = 'summarizationChain',

  // Standalone Models
  OPENAI = 'openai',
  GEMINI = 'gemini',
  HF_INFERENCE = 'huggingFace',
  
  // LangChain Sub-Nodes
  MEMORY = 'memory',
  VECTOR_STORE = 'vectorStore',
  TOOL = 'tool',
  OUTPUT_PARSER = 'outputParser',
  EMBEDDINGS = 'embeddings'
}

export interface IParameterSchema {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'options' | 'dateTime' | 'json';
  default?: any;
  options?: { label: string; value: any }[];
  description?: string;
  required?: boolean;
}

export interface INodeData {
  label: string;
  type: NodeType;
  params: Record<string, any>;
  status?: 'idle' | 'executing' | 'success' | 'error' | 'waiting';
  lastResult?: INodeExecutionData[][];
  error?: {
    message: string;
    stack?: string;
    timestamp: string;
  };
  outputs?: string[];
}

export interface INode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: INodeData;
}

export interface IExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'success' | 'error' | 'running';
  startedAt: string;
  stoppedAt?: string;
  duration: string;
  dataSnapshot?: Record<string, INodeExecutionData[][]>;
}

export interface ICredential {
  id: string;
  name: string;
  type: string;
  updatedAt: string;
  status: 'valid' | 'invalid' | 'untested';
}
