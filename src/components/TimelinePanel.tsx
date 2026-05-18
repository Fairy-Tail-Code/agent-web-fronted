import { Card, Empty, Tag, Timeline } from 'antd';
import {
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ToolOutlined,
  MessageOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { RuntimeEventItem, SessionMessage } from '@/types';

type TimelinePanelProps = {
  messages: SessionMessage[];
  events: RuntimeEventItem[];
};

const eventConfig: Record<RuntimeEventItem['level'], { color: string; icon: React.ReactNode }> = {
  info: { color: '#2d5a4f', icon: <InfoCircleOutlined /> },
  success: { color: '#4a7c59', icon: <CheckCircleOutlined /> },
  warning: { color: '#c4783a', icon: <WarningOutlined /> },
  error: { color: '#c7554d', icon: <CloseCircleOutlined /> },
};

const eventTagColor: Record<RuntimeEventItem['level'], string> = {
  info: 'cyan',
  success: 'success',
  warning: 'orange',
  error: 'error',
};

export default function TimelinePanel({ messages, events }: TimelinePanelProps) {
  if (!events.length && !messages.length) {
    return (
      <div className="glass-panel flex h-full items-center justify-center rounded-[32px]">
        <Empty
          description={
            <span className="text-[var(--ink-tertiary)]">当前会话还没有时间线数据</span>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  const items =
    events.length > 0
      ? events.map(event => {
          const config = eventConfig[event.level];
          return {
            color: config.color,
            dot: <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f8f5eb] text-[14px] shadow-sm">{config.icon}</div>,
            children: (
              <Card
                className="!rounded-[22px] !border-[var(--panel-border)] !bg-white/75 !shadow-sm"
                bodyStyle={{ padding: '18px 20px' }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <Tag color={eventTagColor[event.level]} className="!rounded-lg !px-3 !py-1 !text-xs !font-medium">
                    {event.type}
                  </Tag>
                  <span className="text-[14px] font-semibold text-[#1a1f1a]">{event.title}</span>
                </div>
                {event.detail ? (
                  <div className="whitespace-pre-wrap break-words text-[14px] text-[var(--ink-secondary)] leading-relaxed bg-[#1a1f1a]/3 rounded-xl p-3 mt-2">
                    {event.detail}
                  </div>
                ) : null}
              </Card>
            ),
          };
        })
      : messages.map(message => {
          const isUser = message.role === 'user';
          const icon = isUser ? <MessageOutlined /> : <ToolOutlined />;
          const color = isUser ? '#c4783a' : '#2d5a4f';

          return {
            color,
            dot: <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f8f5eb] text-[14px] shadow-sm">{icon}</div>,
            children: (
              <Card
                className="!rounded-[22px] !border-[var(--panel-border)] !bg-white/75 !shadow-sm"
                bodyStyle={{ padding: '18px 20px' }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <Tag color={isUser ? 'orange' : 'cyan'} className="!rounded-lg !px-3 !py-1 !text-xs !font-medium">
                    {message.role}
                  </Tag>
                  {message.toolCalls?.map(toolCall => (
                    <Tag
                      key={toolCall.id}
                      className="!rounded-full !px-3 !py-1 !text-xs !bg-[#2d5a4f]/10 !text-[#2d5a4f] !border-[#2d5a4f]/20"
                    >
                      {toolCall.function?.name || 'tool'}
                    </Tag>
                  ))}
                  {message.timestamp && (
                    <span className="ml-auto text-xs text-[var(--ink-tertiary)] flex items-center gap-1">
                      <ClockCircleOutlined className="text-[10px]" />
                      {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="whitespace-pre-wrap break-words text-[14px] text-[var(--ink-secondary)] leading-relaxed bg-[#1a1f1a]/3 rounded-xl p-3">
                  {message.content || '无正文'}
                </div>
              </Card>
            ),
          };
        });

  return (
    <div className="glass-panel-strong h-full overflow-auto rounded-[32px] p-6">
      <div className="mb-5 flex items-center gap-2.5 pb-4 border-b border-[var(--panel-border)]">
        <ClockCircleOutlined className="text-[#2d5a4f] text-lg" />
        <span className="display-font text-[22px] font-semibold text-[#1a1f1a]">执行时间线</span>
      </div>
      <Timeline className="!mt-2" items={items} />
    </div>
  );
}
