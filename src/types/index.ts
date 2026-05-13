export type AgentKind = 'agent' | 'team';

export type CatalogAgent = {
  id: string;
  kind: AgentKind;
  name: string;
  subtitle: string;
  description: string;
  accent: string;
  promptHint: string;
  capabilities: string[];
};

export type ToolCallSnapshot = {
  id?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
};

export type SessionMessage = {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  name?: string;
  toolCalls?: ToolCallSnapshot[];
};

export type RuntimeEventItem = {
  id: string;
  type: string;
  level: 'info' | 'success' | 'warning' | 'error';
  title: string;
  detail?: string;
  createdAt: number;
};

export type StoredSession = {
  id: string;
  title: string;
  agentId: string;
  agentKind: AgentKind;
  createdAt: string;
  updatedAt: string;
  messages: SessionMessage[];
};

export type KnowledgeBase = {
  kb_id: string;
  name: string;
  description: string;
  owner_id: string;
  is_official: boolean;
  is_public: boolean;
  max_results: number;
  file_count: number;
  total_chunks: number;
  is_active: boolean;
  indexing_status: string;
  created_at: string;
  updated_at: string;
};

export type KnowledgeFile = {
  file_id: string;
  kb_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  processing_status: string;
  chunk_count: number;
  error_message?: string | null;
  uploaded_at: string;
  processed_at?: string | null;
};

export type KnowledgeSearchResult = {
  content: string;
  metadata: Record<string, unknown>;
  score: number;
  source_file?: string | null;
};
