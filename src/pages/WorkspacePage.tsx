import { useState } from 'react';
import { CopilotChat } from '@copilotkit/react-core/v2';
import { App, Button, Segmented, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ChatComposer from '@/components/chat/ChatComposer';
import AssistantBubble from '@/components/chat/AssistantBubble';
import UserBubble from '@/components/chat/UserBubble';
import TimelinePanel from '@/components/TimelinePanel';
import { useWorkbenchContext } from '@/layout/WorkbenchLayout';

export default function WorkspacePage() {
  const { message } = App.useApp();
  const { currentAgent, currentMessages, runtimeEvents, createNewSession } = useWorkbenchContext();
  const [tab, setTab] = useState<'chat' | 'timeline'>('chat');

  return (
    <div className="glass-panel flex h-full min-h-0 flex-col rounded-[30px] p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography.Title level={2} className="heading-font !mb-1 !text-[30px] !text-[#182126]">
            {currentAgent?.name || 'Agent Workspace'}
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-[15px] !text-[var(--ink-soft)]">
            {currentAgent?.description || ''}
          </Typography.Paragraph>
        </div>
        <div className="flex items-center gap-3">
          <Segmented
            value={tab}
            options={[
              { label: '对话', value: 'chat' },
              { label: '时间线', value: 'timeline' },
            ]}
            onChange={value => setTab(value as 'chat' | 'timeline')}
          />
          <Button icon={<PlusOutlined />} onClick={createNewSession}>
            新会话
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === 'chat' ? (
          <CopilotChat
            Input={ChatComposer}
            AssistantMessage={AssistantBubble}
            UserMessage={UserBubble}
            attachments={{
              enabled: true,
              accept: 'image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx,.json',
              maxSize: 20 * 1024 * 1024,
              onUploadFailed: error => {
                message.error(error.message);
              },
            }}
            className="h-full"
          />
        ) : (
          <TimelinePanel messages={currentMessages} events={runtimeEvents} />
        )}
      </div>
    </div>
  );
}
