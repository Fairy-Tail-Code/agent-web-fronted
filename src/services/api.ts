import type { CatalogAgent, KnowledgeBase, KnowledgeFile, KnowledgeSearchResult, StoredSession } from '@/types';
import { requestForm, requestJson } from './http';

const adapterBaseUrl = import.meta.env.VITE_ADAPTER_BASE_URL || '';
const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL || '/backend';

function withAdapter(path: string) {
  return `${adapterBaseUrl}${path}`;
}

function withBackend(path: string) {
  return `${backendBaseUrl}${path}`;
}

export const appApi = {
  async getConfig() {
    return requestJson<{ appName: string; agents: CatalogAgent[] }>(withAdapter('/api/config'));
  },
  async listSessions() {
    return requestJson<StoredSession[]>(withAdapter('/api/sessions'));
  },
  async prepareSession(payload: { threadId: string; agentId: string; agentKind: string; title?: string }) {
    return requestJson<StoredSession>(withAdapter('/api/sessions/prepare'), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async renameSession(threadId: string, title: string) {
    return requestJson<StoredSession>(withAdapter(`/api/sessions/${threadId}`), {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  },
  async deleteSession(threadId: string) {
    return requestJson<void>(
      withAdapter(`/api/sessions/${threadId}`),
      {
        method: 'DELETE',
      }
    );
  },
};

export const knowledgeApi = {
  async listBases(token: string) {
    return requestJson<KnowledgeBase[]>(
      withBackend('/knowledge/bases?include_official=true&include_public=true&active_only=true'),
      undefined,
      token
    );
  },
  async createBase(payload: { name: string; description: string }, token: string) {
    return requestJson<KnowledgeBase>(
      withBackend('/knowledge/bases'),
      {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name,
          description: payload.description,
          max_results: 10,
          is_public: false,
        }),
      },
      token
    );
  },
  async deleteBase(kbId: string, token: string) {
    await requestJson<void>(
      withBackend(`/knowledge/bases/${kbId}`),
      {
        method: 'DELETE',
      },
      token
    );
  },
  async listFiles(kbId: string, token: string) {
    return requestJson<KnowledgeFile[]>(withBackend(`/knowledge/bases/${kbId}/files`), undefined, token);
  },
  async uploadFile(kbId: string, file: File, token: string) {
    const formData = new FormData();
    formData.append('file', file);
    return requestForm(withBackend(`/knowledge/bases/${kbId}/files`), formData, token);
  },
  async search(payload: { kbId: string; query: string }, token: string) {
    return requestJson<KnowledgeSearchResult[]>(
      withBackend('/knowledge/search'),
      {
        method: 'POST',
        body: JSON.stringify({
          kb_id: payload.kbId,
          query: payload.query,
          max_results: 8,
        }),
      },
      token
    );
  },
};
