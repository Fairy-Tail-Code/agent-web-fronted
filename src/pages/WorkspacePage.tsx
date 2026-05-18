import { useState } from 'react';
import { CopilotChat } from '@copilotkit/react-core/v2';
import { App, Button, Segmented, Typography, Tooltip } from 'antd';
import {
  PlusOutlined,
  MessageOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
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
    <div className="glass-panel-strong flex h-full min-h-0 flex-col rounded-[36px] p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[var(--panel-border)]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2d5a4f] to-[#4a7c59] text-white shadow-lg shadow-[#2d5a4f]/20">
              <ThunderboltOutlined className="text-lg" />
            </div>
            <Typography.Title level={2} className="display-font !mb-0 !text-[32px] !text-[#1a1f1a]">
              {currentAgent?.name || 'Agent Workspace'}
            </Typography.Title>
          </div>
          <Typography.Paragraph className="!mb-0 !text-[15px] !text-[var(--ink-secondary)] !max-w-[600px] leading-relaxed">
            {currentAgent?.description || '与 AI Agent 进行智能对话，完成复杂任务。'}
          </Typography.Paragraph>
        </div>
        <div className="flex items-center gap-3">
          <Segmented
            value={tab}
            options={[
              { label: <span className="flex items-center gap-1.5"><MessageOutlined /> 对话</span>, value: 'chat' },
              { label: <span className="flex items-center gap-1.5"><HistoryOutlined /> 时间线</span>, value: 'timeline' },
            ]}
            onChange={value => setTab(value as 'chat' | 'timeline')}
            className="!rounded-xl"
          />
          <Tooltip title="新建会话">
            <Button
              icon={<PlusOutlined />}
              onClick={createNewSession}
              className="!rounded-xl !h-10 !px-5 font-medium shadow-md shadow-[#2d5a4f]/10 hover:shadow-lg hover:shadow-[#2d5a4f]/15"
            >
              新会话
            </Button>
          </Tooltip>
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
            instructions={!currentMessages.length ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="flex justify-center mb-5">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#2d5a4f]/10 to-[#4a7c59]/10 flex items-center justify-center">
                      <MessageOutlined className="text-3xl text-[#2d5a4f]" />
                    </div>
                  </div>
                  <div className="display-font text-[22px] font-semibold text-[#1a1f1a] mb-3">
                    开始新的对话
                  </div>
                  <div className="text-[15px] text-[var(--ink-tertiary)] max-w-[400px] mx-auto leading-relaxed">
                    输入您的问题或任务描述，AI Agent 将为您提供帮助。
                  </div>
                </div>
              </div>
            ) : undefined}
          />
        ) : (
          <TimelinePanel messages={currentMessages} events={runtimeEvents} />
        )}
      </div>
    </div>
  );
}
