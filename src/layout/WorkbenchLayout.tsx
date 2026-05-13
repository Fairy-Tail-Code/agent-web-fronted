import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { App } from 'antd';
import { useAgent } from '@copilotkit/react-core/v2';
import { useAtom, useAtomValue } from 'jotai';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import SessionSidebar from '@/components/SessionSidebar';
import { summarizeAguiEvent } from '@/lib/aguiEvent';
import { signOut } from '@/lib/auth';
import { serializeMessages } from '@/lib/session';
import AppShell from '@/layout/AppShell';
import { appApi } from '@/services/api';
import {
  catalogAtom,
  currentSessionAtom,
  currentSessionIdAtom,
  currentUserEmailAtom,
  currentAgentAtom,
  selectedAgentIdAtom,
  sessionsAtom,
} from '@/store/atoms';
import type { CatalogAgent, RuntimeEventItem } from '@/types';

type WorkbenchLayoutProps = {
  children: ReactNode;
};

type WorkbenchContextValue = {
  currentAgent: CatalogAgent;
  currentMessages: ReturnType<typeof serializeMessages>;
  runtimeEvents: RuntimeEventItem[];
  createNewSession: () => void;
  prepareSessionForSend: () => Promise<string | null>;
};

const WorkbenchContext = createContext<WorkbenchContextValue | null>(null);

export function useWorkbenchContext() {
  const context = useContext(WorkbenchContext);
  if (!context) {
    throw new Error('useWorkbenchContext must be used within WorkbenchLayout');
  }
  return context;
}

export default function WorkbenchLayout({ children }: WorkbenchLayoutProps) {
  const { message } = App.useApp();
  const { agent } = useAgent({ agentId: 'agno_agent' });
  const navigate = useNavigate();
  const location = useLocation();
  const [catalog, setCatalog] = useAtom(catalogAtom);
  const [sessions, setSessions] = useAtom(sessionsAtom);
  const [currentSessionId, setCurrentSessionId] = useAtom(currentSessionIdAtom);
  const [selectedAgentId, setSelectedAgentId] = useAtom(selectedAgentIdAtom);
  const currentSession = useAtomValue(currentSessionAtom);
  const currentUserEmail = useAtomValue(currentUserEmailAtom);
  const currentAgent = useAtomValue(currentAgentAtom);
  const [runtimeEvents, setRuntimeEvents] = useState<RuntimeEventItem[]>([]);
  const currentMessages = useMemo(() => serializeMessages((agent?.messages || []) as any[]), [agent?.messages]);

  const loadSessions = async () => {
    const nextSessions = await appApi.listSessions();
    setSessions(nextSessions);
    if (currentSessionId && !nextSessions.some(session => session.id === currentSessionId)) {
      setCurrentSessionId('');
    }
    return nextSessions;
  };

  useEffect(() => {
    if (catalog.length) {
      return;
    }

    appApi
      .getConfig()
      .then(config => {
        setCatalog(config.agents);
      })
      .catch(error => {
        message.error(error instanceof Error ? error.message : '配置加载失败');
      });
  }, [catalog.length, message, setCatalog]);

  useEffect(() => {
    loadSessions().catch(error => {
      message.error(error instanceof Error ? error.message : '会话列表加载失败');
    });
  }, [message]);

  useEffect(() => {
    if (!currentSession) {
      return;
    }

    if (selectedAgentId !== currentSession.agentId) {
      setSelectedAgentId(currentSession.agentId);
    }
  }, [currentSession, selectedAgentId, setSelectedAgentId]);

  useEffect(() => {
    if (!agent?.subscribe) {
      return;
    }

    const subscription = agent.subscribe({
      onRunStartedEvent: () => {
        setRuntimeEvents([]);
      },
      onEvent: ({ event }) => {
        const summary = summarizeAguiEvent(event);
        if (summary) {
          setRuntimeEvents(previous => [...previous, summary]);
        }

        const type = String(event?.type || '');
        if (type === 'RUN_FINISHED' || type === 'RUN_ERROR') {
          void loadSessions();
        }
      },
    });

    return () => subscription.unsubscribe();
  }, [agent, currentSessionId]);

  const createSessionRecord = async (agentInfo: CatalogAgent) => {
    const threadId = crypto.randomUUID();
    await appApi.prepareSession({
      threadId,
      agentId: agentInfo.id,
      agentKind: agentInfo.kind,
      title: `${agentInfo.name} 会话`,
    });
    await loadSessions();
    return threadId;
  };

  const handleNewSession = () => {
    if (!currentAgent) {
      return;
    }

    void (async () => {
      const threadId = await createSessionRecord(currentAgent);
      agent?.setMessages?.([]);
      setRuntimeEvents([]);
      setCurrentSessionId(threadId);
    })().catch(error => {
      message.error(error instanceof Error ? error.message : '新建会话失败');
    });
  };

  const prepareSessionForSend = async () => {
    if (!currentAgent) {
      return null;
    }

    if (currentSessionId) {
      return currentSessionId;
    }

    const threadId = await createSessionRecord(currentAgent);
    setCurrentSessionId(threadId);
    return threadId;
  };

  const handleSelectAgent = (agentId: string) => {
    const nextAgent = catalog.find(item => item.id === agentId);
    if (!nextAgent) {
      return;
    }

    setSelectedAgentId(agentId);
    agent?.setMessages?.([]);
    setRuntimeEvents([]);
    setCurrentSessionId('');
  };

  const handleDeleteSession = async (sessionId: string) => {
    await appApi.deleteSession(sessionId);
    if (currentSessionId === sessionId) {
      agent?.setMessages?.([]);
      setRuntimeEvents([]);
      setCurrentSessionId('');
    }
    await loadSessions();
  };

  const handleRenameSession = async (sessionId: string, title: string) => {
    await appApi.renameSession(sessionId, title);
    await loadSessions();
  };

  if (!currentAgent) {
    return <div className="flex min-h-screen items-center justify-center p-6">正在载入工作台...</div>;
  }

  return (
    <WorkbenchContext.Provider
      value={{
        currentAgent,
        currentMessages,
        runtimeEvents,
        createNewSession: handleNewSession,
        prepareSessionForSend,
      }}
    >
      <AppShell
        sidebar={
          <SessionSidebar
            agents={catalog}
            sessions={sessions}
            currentAgentId={currentAgent.id}
            currentSessionId={currentSessionId}
            currentUserEmail={currentUserEmail}
            currentView={location.pathname.startsWith('/knowledge') ? 'knowledge' : 'workspace'}
            onSelectAgent={handleSelectAgent}
            onNewSession={handleNewSession}
            onSelectSession={sessionId => {
              agent?.setMessages?.([]);
              setRuntimeEvents([]);
              setCurrentSessionId(sessionId);
              const selectedSession = sessions.find(session => session.id === sessionId);
              if (selectedSession) {
                setSelectedAgentId(selectedSession.agentId);
              }
              navigate('/workspace');
            }}
            onDeleteSession={sessionId => {
              void handleDeleteSession(sessionId).catch(error => {
                message.error(error instanceof Error ? error.message : '删除会话失败');
              });
            }}
            onRenameSession={(sessionId, title) => {
              void handleRenameSession(sessionId, title).catch(error => {
                message.error(error instanceof Error ? error.message : '重命名会话失败');
              });
            }}
            onNavigateWorkspace={() => navigate('/workspace')}
            onNavigateKnowledge={() => navigate('/knowledge')}
            onSignOut={async () => {
              await signOut();
              navigate('/login', { replace: true });
            }}
          />
        }
        main={children}
      />
    </WorkbenchContext.Provider>
  );
}
