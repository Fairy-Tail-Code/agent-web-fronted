import { useMemo, useState } from 'react';
import {
  DeleteOutlined,
  LogoutOutlined,
  PlusOutlined,
  MessageOutlined,
  DatabaseOutlined,
  ClockCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { Button, Empty, Input, Tag, Tooltip } from 'antd';
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

/* ---- Date grouping helper ---- */
function groupSessionsByDate(sessions: StoredSession[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; sessions: StoredSession[] }[] = [
    { label: '今天', sessions: [] },
    { label: '昨天', sessions: [] },
    { label: '最近 7 天', sessions: [] },
    { label: '更早', sessions: [] },
  ];

  for (const session of sessions) {
    const d = new Date(session.updatedAt);
    if (d >= today) groups[0].sessions.push(session);
    else if (d >= yesterday) groups[1].sessions.push(session);
    else if (d >= weekAgo) groups[2].sessions.push(session);
    else groups[3].sessions.push(session);
  }

  return groups.filter(g => g.sessions.length > 0);
}

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

  const sessionGroups = useMemo(() => groupSessionsByDate(sortedSessions), [sortedSessions]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <aside className="glass-panel flex h-full flex-col rounded-[34px] p-4">
      {/* ---- App header ---- */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="display-font text-[22px] font-semibold text-[#1a1f1a]">Agent Studio</div>
          <div className="mt-1 text-[12px] text-[var(--ink-secondary)] truncate max-w-[200px]">
            {currentUserEmail || '已登录'}
          </div>
        </div>
        <Tooltip title="退出登录">
          <Button
            size="small"
            type="text"
            icon={<LogoutOutlined />}
            onClick={onSignOut}
            className="hover:!text-[var(--accent-error)] hover:!bg-[var(--accent-error)]/8 !rounded-xl transition-colors"
          />
        </Tooltip>
      </div>

      {/* ---- Scrollable content ---- */}
      <div className="min-h-0 flex-1 overflow-auto pr-1">
        {/* View switcher */}
        <div className="mb-5 flex p-1 rounded-[20px] bg-white/50 border border-[var(--panel-border)]">
          <button
            type="button"
            onClick={onNavigateWorkspace}
            className={classNames(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[16px] text-[13px] font-medium transition-all duration-200',
              currentView === 'workspace'
                ? 'bg-[var(--accent-primary)] text-white shadow-md shadow-[var(--accent-primary)]/20'
                : 'text-[var(--ink-secondary)] hover:text-[#1a1f1a] hover:bg-white/60'
            )}
          >
            <MessageOutlined className="text-sm" />
            对话
          </button>
          <button
            type="button"
            onClick={onNavigateKnowledge}
            className={classNames(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[16px] text-[13px] font-medium transition-all duration-200',
              currentView === 'knowledge'
                ? 'bg-[var(--accent-primary)] text-white shadow-md shadow-[var(--accent-primary)]/20'
                : 'text-[var(--ink-secondary)] hover:text-[#1a1f1a] hover:bg-white/60'
            )}
          >
            <DatabaseOutlined className="text-sm" />
            知识库
          </button>
        </div>

        {/* ---- Agent list (compact) ---- */}
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] font-semibold tracking-[0.14em] text-[var(--ink-tertiary)] uppercase">
            Agents
          </div>
          <Tooltip title="新建会话">
            <Button
              size="small"
              type="text"
              icon={<PlusOutlined />}
              onClick={onNewSession}
              className="hover:!text-[var(--accent-primary)] hover:!bg-[var(--accent-primary)]/8 !rounded-xl transition-colors !h-6 !w-6 !p-0 flex items-center justify-center"
            />
          </Tooltip>
        </div>

        <div className="space-y-1.5 mb-6">
          {agents.map((agent, index) => {
            const active = currentAgentId === agent.id;
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => onSelectAgent(agent.id)}
                className={classNames(
                  'stagger-child w-full rounded-[16px] px-3.5 py-3 text-left transition-all duration-200 group flex items-center gap-3',
                  active
                    ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[#3d7a6f] text-white shadow-lg shadow-[var(--accent-primary)]/20'
                    : 'bg-white/55 border border-transparent hover:bg-white/80 hover:border-[var(--panel-border)]'
                )}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {/* Avatar dot */}
                <div className={classNames(
                  'h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-semibold',
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--accent-primary)]/8 text-[var(--accent-primary)]'
                )}>
                  {agent.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={classNames(
                    'text-[13px] font-semibold truncate',
                    active ? 'text-white' : 'text-[#1a1f1a]'
                  )}>
                    {agent.name}
                  </div>
                  <div className={classNames(
                    'text-[11px] truncate mt-0.5',
                    active ? 'text-white/75' : 'text-[var(--ink-tertiary)]'
                  )}>
                    {agent.subtitle}
                  </div>
                </div>
                <Tag
                  color={agent.kind === 'team' ? 'geekblue' : 'cyan'}
                  className={classNames(
                    '!rounded-md !px-1.5 !py-0 !text-[10px] !font-medium !m-0 shrink-0 leading-[18px]',
                    active ? '!bg-white/20 !text-white !border-white/30' : ''
                  )}
                >
                  {agent.kind}
                </Tag>
              </button>
            );
          })}
        </div>

        {/* ---- Session list with date grouping ---- */}
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] font-semibold tracking-[0.14em] text-[var(--ink-tertiary)] uppercase">
            会话记录
          </div>
          <ClockCircleOutlined className="text-[var(--ink-tertiary)] text-xs" />
        </div>

        {sessionGroups.length ? (
          <div className="space-y-3 pb-3">
            {sessionGroups.map(group => (
              <div key={group.label}>
                {/* Date group label */}
                <div className="text-[11px] font-medium text-[var(--ink-tertiary)] mb-2 px-1">
                  {group.label}
                </div>
                {/* Sessions in this group */}
                <div className="space-y-1.5">
                  {group.sessions.map(session => {
                    const selected = session.id === currentSessionId;
                    const inEdit = editingSessionId === session.id;
                    return (
                      <div
                        key={session.id}
                        className={classNames(
                          'rounded-[16px] border p-3 transition-all duration-200 group',
                          selected
                            ? 'border-[var(--accent-primary)]/40 bg-white/90 shadow-sm'
                            : 'border-transparent bg-white/45 hover:bg-white/70'
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
                            className="!rounded-lg"
                          />
                        ) : (
                          <button
                            type="button"
                            className="w-full text-left"
                            onClick={() => onSelectSession(session.id)}
                          >
                            <div className="line-clamp-1 text-[13px] font-medium text-[#1a1f1a] leading-snug">
                              {session.title}
                            </div>
                            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[var(--ink-tertiary)]">
                              <ClockCircleOutlined className="text-[9px]" />
                              {formatDate(session.updatedAt)}
                            </div>
                          </button>
                        )}
                        <div
                          className={classNames(
                            'mt-2 flex items-center justify-end gap-0.5 transition-opacity duration-200',
                            inEdit ? 'opacity-0' : selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          )}
                        >
                          <Tooltip title="重命名">
                            <Button
                              size="small"
                              type="text"
                              icon={<EditOutlined />}
                              onClick={() => {
                                setEditingSessionId(session.id);
                                setEditingTitle(session.title);
                              }}
                              className="!rounded-lg hover:!text-[var(--accent-primary)] hover:!bg-[var(--accent-primary)]/8 !h-6 !w-6 !p-0"
                            />
                          </Tooltip>
                          <Tooltip title="删除">
                            <Button
                              size="small"
                              danger
                              type="text"
                              icon={<DeleteOutlined />}
                              onClick={() => onDeleteSession(session.id)}
                              className="!rounded-lg !h-6 !w-6 !p-0"
                            />
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[160px] items-center justify-center">
            <Empty
              description={
                <span className="text-[var(--ink-tertiary)] text-sm">暂无会话记录</span>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
