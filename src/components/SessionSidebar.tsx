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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <aside className="glass-panel flex h-full flex-col rounded-[34px] p-5">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="display-font text-[26px] font-semibold text-[#1a1f1a]">Agent Studio</div>
          <div className="mt-1.5 text-sm text-[var(--ink-secondary)] truncate max-w-[200px]">
            {currentUserEmail || '已登录'}
          </div>
        </div>
        <Tooltip title="退出登录">
          <Button
            size="small"
            type="text"
            icon={<LogoutOutlined />}
            onClick={onSignOut}
            className="hover:!text-[#c7554d] hover:!bg-[#c7554d]/8 !rounded-xl transition-colors"
          />
        </Tooltip>
      </div>

      <div className="min-h-0 flex-1 overflow-auto pr-2">
        <div className="mb-6 flex p-1.5 rounded-[22px] bg-white/50 border border-[var(--panel-border)]">
          <button
            type="button"
            onClick={onNavigateWorkspace}
            className={classNames(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200',
              currentView === 'workspace'
                ? 'bg-[#2d5a4f] text-white shadow-md shadow-[#2d5a4f]/20'
                : 'text-[var(--ink-secondary)] hover:text-[#1a1f1a] hover:bg-white/60'
            )}
          >
            <MessageOutlined className="text-base" />
            对话
          </button>
          <button
            type="button"
            onClick={onNavigateKnowledge}
            className={classNames(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200',
              currentView === 'knowledge'
                ? 'bg-[#2d5a4f] text-white shadow-md shadow-[#2d5a4f]/20'
                : 'text-[var(--ink-secondary)] hover:text-[#1a1f1a] hover:bg-white/60'
            )}
          >
            <DatabaseOutlined className="text-base" />
            知识库
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs font-semibold tracking-[0.16em] text-[var(--ink-tertiary)] uppercase">
            Agents
          </div>
          <Tooltip title="新建会话">
            <Button
              size="small"
              type="text"
              icon={<PlusOutlined />}
              onClick={onNewSession}
              className="hover:!text-[#2d5a4f] hover:!bg-[#2d5a4f]/8 !rounded-xl transition-colors"
            />
          </Tooltip>
        </div>

        <div className="space-y-3 mb-8">
          {agents.map((agent, index) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => onSelectAgent(agent.id)}
              className={classNames(
                'w-full rounded-[26px] border px-5 py-4.5 text-left transition-all duration-300 group relative overflow-hidden',
                currentAgentId === agent.id
                  ? 'border-transparent bg-gradient-to-br from-[#2d5a4f] to-[#3d7a6f] text-white shadow-xl shadow-[#2d5a4f]/25 scale-[1.02]'
                  : 'border-[var(--panel-border)] bg-white/70 text-[#1a1f1a] hover:bg-white/90 hover:border-[#2d5a4f]/20 hover:shadow-lg'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="display-font text-[20px] font-semibold">{agent.name}</div>
                  <Tag
                    color={agent.kind === 'team' ? 'geekblue' : 'cyan'}
                    className={classNames(
                      '!rounded-lg !px-2.5 !py-1 !text-xs !font-medium',
                      currentAgentId === agent.id ? '!bg-white/20 !text-white !border-white/30' : ''
                    )}
                  >
                    {agent.kind}
                  </Tag>
                </div>
                <div className={classNames(
                  'text-sm leading-relaxed',
                  currentAgentId === agent.id ? 'text-white/80' : 'text-[var(--ink-secondary)]'
                )}>
                  {agent.subtitle}
                </div>
                {agent.capabilities.length > 0 && (
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    {agent.capabilities.slice(0, 3).map(capability => (
                      <span
                        key={capability}
                        className={classNames(
                          'rounded-full px-3 py-1 text-xs font-medium',
                          currentAgentId === agent.id
                            ? 'bg-white/15 text-white/90'
                            : 'bg-[#2d5a4f]/8 text-[#2d5a4f]'
                        )}
                      >
                        {capability}
                      </span>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <span className={classNames(
                        'rounded-full px-3 py-1 text-xs font-medium',
                        currentAgentId === agent.id
                          ? 'bg-white/15 text-white/90'
                          : 'bg-[#2d5a4f]/8 text-[#2d5a4f]'
                      )}>
                        +{agent.capabilities.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs font-semibold tracking-[0.16em] text-[var(--ink-tertiary)] uppercase">
            Recent Sessions
          </div>
          <ClockCircleOutlined className="text-[var(--ink-tertiary)]" />
        </div>

        {sortedSessions.length ? (
          <div className="space-y-2.5 pb-3">
            {sortedSessions.map((session, index) => {
              const selected = session.id === currentSessionId;
              const inEdit = editingSessionId === session.id;
              return (
                <div
                  key={session.id}
                  className={classNames(
                    'rounded-[24px] border p-4 transition-all duration-200 group',
                    selected
                      ? 'border-[#2d5a4f] bg-white/95 shadow-md'
                      : 'border-[var(--panel-border)] bg-white/55 hover:bg-white/75 hover:border-[#2d5a4f]/15'
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
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
                      <div className="line-clamp-2 text-sm font-medium text-[#1a1f1a] leading-relaxed">
                        {session.title}
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--ink-tertiary)]">
                        <ClockCircleOutlined className="text-[10px]" />
                        {formatDate(session.updatedAt)}
                      </div>
                    </button>
                  )}
                  <div
                    className={classNames(
                      'mt-3 flex items-center justify-end gap-1 transition-opacity duration-200',
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
                        className="!rounded-lg hover:!text-[#2d5a4f] hover:!bg-[#2d5a4f]/8"
                      />
                    </Tooltip>
                    <Tooltip title="删除">
                      <Button
                        size="small"
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => onDeleteSession(session.id)}
                        className="!rounded-lg"
                      />
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[180px] items-center justify-center">
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
