import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { Session } from '@supabase/supabase-js';
import type { CatalogAgent, StoredSession } from '@/types';

export const catalogAtom = atom<CatalogAgent[]>([]);

export const selectedAgentIdAtom = atomWithStorage<string>('agent-workbench:selected-agent', 'data_agent');

export const currentSessionIdAtom = atomWithStorage<string>('agent-workbench:current-session', '');

export const sessionsAtom = atom<StoredSession[]>([]);

export const selectedKnowledgeBaseIdAtom = atom<string>('');

export const supabaseSessionAtom = atom<Session | null>(null);

export const authInitializedAtom = atom<boolean>(false);

export const isLoggedInAtom = atom(get => get(supabaseSessionAtom) !== null);

export const accessTokenAtom = atom(get => get(supabaseSessionAtom)?.access_token ?? '');

export const currentUserEmailAtom = atom(get => get(supabaseSessionAtom)?.user?.email ?? '');

export const currentAgentAtom = atom(get => {
  const catalog = get(catalogAtom);
  const selectedAgentId = get(selectedAgentIdAtom);
  const currentSession = get(currentSessionAtom);

  if (currentSession) {
    const sessionAgent = catalog.find(item => item.id === currentSession.agentId && item.kind === currentSession.agentKind);
    if (sessionAgent) {
      return sessionAgent;
    }
  }

  return catalog.find(item => item.id === selectedAgentId) || catalog[0];
});

export const currentSessionAtom = atom(get => {
  const sessions = get(sessionsAtom);
  const currentSessionId = get(currentSessionIdAtom);
  return sessions.find(session => session.id === currentSessionId) || null;
});
