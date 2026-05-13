import { useMemo, useState } from 'react';
import {
  DeleteOutlined,
  MenuFoldOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Empty, Input, Tag } from 'antd';
import classNames from 'classnames';
import type { CatalogAgent, StoredSession } from '@/types';

type SessionSidebarProps = {
  agents: CatalogAgent[];
  sessions: StoredSession[];
  currentSessionId: string;
  currentAgentId: string;
  currentUserEmail: string;
  currentView: 'workspace' | 'knowledge';
  onSelectAgent: (agentId: string) => void;
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, title: string) => void;
  onNavigateWorkspace: () => void;
  onNavigateKnowledge: () => void;
  onSignOut: () => void;
};

export default function SessionSidebar(props: SessionSidebarProps) {
  const {
    agents,
    sessions,
    currentSessionId,
    currentAgentId,
    currentUserEmail,
    currentView,
    onSelectAgent,
    onNewSession,
    onSelectSession,
    onDeleteSession,
    onRenameSession,
    onNavigateWorkspace,
    onNavigateKnowledge,
    onSignOut,
  } = props;
  const [editingSessionId, setEditingSessionId] = useState('');
  const [editingTitle, setEditingTitle] = useState('');

  const sortedSessions = useMemo(
    () => [...sessions].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [sessions]
  );

  return (
    <aside className="glass-panel flex h-full flex-col rounded-[30px] p-4">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="heading-font text-[22px] font-semibold text-[#182126]">Agent Workspace</div>
          <div className="mt-1 text-sm text-[var(--ink-soft)]">{currentUserEmail || '已登录'}</div>
        </div>
        <Button size="small" onClick={onSignOut}>
          退出
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto pr-1">
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-[24px] border border-black/8 bg-white/50 p-2">
          <Button type={currentView === 'workspace' ? 'primary' : 'text'} onClick={onNavigateWorkspace}>
            对话
          </Button>
          <Button type={currentView === 'knowledge' ? 'primary' : 'text'} onClick={onNavigateKnowledge}>
            知识库
          </Button>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs font-semibold tracking-[0.18em] text-[var(--ink-soft)] uppercase">Agent</div>
          <Button size="small" type="text" icon={<PlusOutlined />} onClick={onNewSession}>
            新会话
          </Button>
        </div>

        <div className="space-y-3">
          {agents.map(agent => (
            <button
              key={agent.id}
              type="button"
              onClick={() => onSelectAgent(agent.id)}
              className={classNames(
                'w-full rounded-[24px] border px-4 py-4 text-left transition',
                currentAgentId === agent.id
                  ? 'border-transparent bg-[#182126] text-white shadow-[0_18px_40px_rgba(24,33,38,0.22)]'
                  : 'border-black/8 bg-white/55 text-[#182126] hover:bg-white/80'
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="heading-font text-[18px] font-semibold">{agent.name}</div>
                <Tag color={agent.kind === 'team' ? 'geekblue' : 'cyan'}>{agent.kind}</Tag>
              </div>
              <div className={classNames('text-sm', currentAgentId === agent.id ? 'text-white/78' : 'text-[var(--ink-soft)]')}>
                {agent.subtitle}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {agent.capabilities.map(capability => (
                  <span
                    key={capability}
                    className={classNames(
                      'rounded-full px-2.5 py-1 text-xs',
                      currentAgentId === agent.id ? 'bg-white/12 text-white/86' : 'bg-black/5 text-[#182126]'
                    )}
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        <div className="mb-3 mt-6 flex items-center justify-between">
          <div className="text-xs font-semibold tracking-[0.18em] text-[var(--ink-soft)] uppercase">Sessions</div>
          <MenuFoldOutlined className="text-[var(--ink-soft)]" />
        </div>

        {sortedSessions.length ? (
          <div className="space-y-2 pb-2">
            {sortedSessions.map(session => {
              const selected = session.id === currentSessionId;
              const inEdit = editingSessionId === session.id;
              return (
                <div
                  key={session.id}
                  className={classNames(
                    'rounded-[22px] border p-3',
                    selected ? 'border-[#1f7a8c] bg-white/90' : 'border-black/8 bg-white/45'
                  )}
                >
                  {inEdit ? (
                    <Input
                      size="small"
                      autoFocus
                      value={editingTitle}
                      onChange={event => setEditingTitle(event.target.value)}
                      onPressEnter={() => {
                        onRenameSession(session.id, editingTitle.trim() || session.title);
                        setEditingSessionId('');
                      }}
                      onBlur={() => {
                        onRenameSession(session.id, editingTitle.trim() || session.title);
                        setEditingSessionId('');
                      }}
                    />
                  ) : (
                    <button type="button" className="w-full text-left" onClick={() => onSelectSession(session.id)}>
                      <div className="line-clamp-2 text-sm font-medium text-[#182126]">{session.title}</div>
                      <div className="mt-2 text-xs text-[var(--ink-soft)]">
                        {new Date(session.updatedAt).toLocaleString('zh-CN')}
                      </div>
                    </button>
                  )}
                  <div className="mt-3 flex items-center justify-end gap-1">
                    <Button
                      size="small"
                      type="text"
                      onClick={() => {
                        setEditingSessionId(session.id);
                        setEditingTitle(session.title);
                      }}
                    >
                      重命名
                    </Button>
                    <Button
                      size="small"
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => onDeleteSession(session.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[200px] items-center justify-center">
            <Empty description="还没有本地会话" />
          </div>
        )}
      </div>
    </aside>
  );
}
