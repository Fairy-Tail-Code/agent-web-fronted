import { Card, Empty, Tag, Timeline } from 'antd';
import type { RuntimeEventItem, SessionMessage } from '@/types';

type TimelinePanelProps = {
  messages: SessionMessage[];
  events: RuntimeEventItem[];
};

const eventColorMap: Record<RuntimeEventItem['level'], string> = {
  info: '#1f7a8c',
  success: '#5b8c00',
  warning: '#c56a2d',
  error: '#cf1322',
};

export default function TimelinePanel({ messages, events }: TimelinePanelProps) {
  if (!events.length && !messages.length) {
    return (
      <div className="glass-panel flex h-full items-center justify-center rounded-[28px]">
        <Empty description="当前会话还没有时间线数据" />
      </div>
    );
  }

  const items =
    events.length > 0
      ? events.map(event => ({
          color: eventColorMap[event.level],
          children: (
            <Card className="!border-none !bg-white/65">
              <div className="mb-2 flex items-center gap-2">
                <Tag color={event.level === 'error' ? 'error' : event.level === 'warning' ? 'orange' : 'cyan'}>{event.type}</Tag>
                <span className="text-[13px] font-medium text-[#182126]">{event.title}</span>
              </div>
              {event.detail ? <div className="whitespace-pre-wrap break-words text-[14px] text-[#182126]">{event.detail}</div> : null}
            </Card>
          ),
        }))
      : messages.map(message => ({
          color: message.role === 'user' ? '#c56a2d' : '#1f7a8c',
          children: (
            <Card className="!border-none !bg-white/65">
              <div className="mb-2 flex items-center gap-2">
                <Tag color={message.role === 'user' ? 'orange' : 'cyan'}>{message.role}</Tag>
                {message.toolCalls?.map(toolCall => (
                  <Tag key={toolCall.id} className="rounded-full">
                    {toolCall.function?.name || 'tool'}
                  </Tag>
                ))}
              </div>
              <div className="whitespace-pre-wrap break-words text-[14px] text-[#182126]">{message.content || '无正文'}</div>
            </Card>
          ),
        }));

  return (
    <div className="glass-panel h-full overflow-auto rounded-[28px] p-5">
      <Timeline items={items} />
    </div>
  );
}
