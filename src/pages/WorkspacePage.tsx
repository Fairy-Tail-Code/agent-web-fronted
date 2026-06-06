import { useState } from 'react';
import { CopilotChat } from '@copilotkit/react-core/v2';
import { App, Button, Segmented, Typography, Tooltip } from 'antd';
import {
  PlusOutlined,
  MessageOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  FileTextOutlined,
  SearchOutlined,
  GlobalOutlined,
  BulbOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import ChatComposer from '@/components/chat/ChatComposer';
import AssistantBubble from '@/components/chat/AssistantBubble';
import UserBubble from '@/components/chat/UserBubble';
import TimelinePanel from '@/components/TimelinePanel';
import { useWorkbenchContext } from '@/layout/WorkbenchLayout';

/* ---- Prompt suggestion cards config ---- */
const PROMPT_SUGGESTIONS = [
  { icon: <BarChartOutlined />, label: '分析数据报告', prompt: '帮我分析以下数据，生成可视化报告和关键洞察', color: 'var(--accent-blue)', bg: 'rgba(91,127,181,0.08)' },
  { icon: <FileTextOutlined />, label: '生成营销文案', prompt: '为我撰写一篇产品推广文案，目标受众是年轻用户', color: 'var(--accent-warm)', bg: 'rgba(196,120,58,0.08)' },
  { icon: <SearchOutlined />, label: '检索知识库', prompt: '在知识库中查找关于产品路线图的相关文档', color: 'var(--accent-mint)', bg: 'rgba(91,168,142,0.08)' },
  { icon: <GlobalOutlined />, label: '多语言翻译', prompt: '将以下内容翻译成英文和日文，保持专业术语准确', color: 'var(--accent-purple)', bg: 'rgba(155,107,142,0.08)' },
  { icon: <BulbOutlined />, label: '总结文档摘要', prompt: '请帮我总结以下长文档的核心要点和行动建议', color: 'var(--accent-secondary)', bg: 'rgba(74,124,89,0.08)' },
  { icon: <CodeOutlined />, label: '代码生成', prompt: '根据以下需求描述，生成完整的代码实现', color: 'var(--accent-rose)', bg: 'rgba(181,107,127,0.08)' },
];

export default function WorkspacePage() {
  const { message } = App.useApp();
  const { currentAgent, currentMessages, runtimeEvents, createNewSession } = useWorkbenchContext();
  const [tab, setTab] = useState<'chat' | 'timeline'>('chat');

  return (
    <div className="glass-panel-strong flex h-full min-h-0 flex-col rounded-[36px] p-6 page-enter">
      {/* ---- Compact header ---- */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--panel-border)]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2d5a4f] to-[#4a7c59] text-white shadow-lg shadow-[#2d5a4f]/20">
            <ThunderboltOutlined className="text-base" />
          </div>
          <div>
            <Typography.Title level={4} className="display-font !mb-0 !text-[20px] !text-[#1a1f1a]">
              {currentAgent?.name || 'Agent Workspace'}
            </Typography.Title>
            {currentAgent?.description && (
              <div className="text-[13px] text-[var(--ink-secondary)] leading-snug mt-0.5">
                {currentAgent.description}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
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
              className="btn-ripple !rounded-xl !h-9 !px-4 font-medium shadow-md shadow-[#2d5a4f]/10 hover:shadow-lg hover:shadow-[#2d5a4f]/15"
            >
              新会话
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* ---- Content area ---- */}
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
              /* ---- New rich empty state ---- */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-[620px] mx-auto px-4">
                  {/* Hero icon */}
                  <div className="mb-6 stagger-child" style={{ animationDelay: '0ms' }}>
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2d5a4f]/12 to-[#4a7c59]/12">
                      <MessageOutlined className="text-3xl text-[#2d5a4f]" />
                    </div>
                  </div>
                  {/* Title */}
                  <div className="display-font text-[24px] font-semibold text-[#1a1f1a] mb-2 stagger-child" style={{ animationDelay: '60ms' }}>
                    开始新的对话
                  </div>
                  <div className="text-[15px] text-[var(--ink-secondary)] mb-8 stagger-child" style={{ animationDelay: '120ms' }}>
                    选择一个场景快速开始，或直接输入您的任务描述
                  </div>
                  {/* Prompt cards grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PROMPT_SUGGESTIONS.map((item, i) => (
                      <button
                        key={item.label}
                        type="button"
                        className="stagger-child group text-left rounded-[20px] border border-[var(--panel-border)] bg-white/60 p-4 transition-all duration-300 hover:scale-[1.04] hover:shadow-lg hover:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                        style={{
                          animationDelay: `${180 + i * 60}ms`,
                          // @ts-expect-error CSS custom property
                          '--card-accent': item.color,
                        }}
                        onClick={() => {
                          /* The prompt card click fills nothing directly since
                             CopilotChat instructions prop is just JSX. The user
                             can copy the prompt text into the input. */
                        }}
                      >
                        <div
                          className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                          style={{ background: item.bg, color: item.color }}
                        >
                          {item.icon}
                        </div>
                        <div className="text-[14px] font-semibold text-[#1a1f1a] mb-1.5 leading-snug">
                          {item.label}
                        </div>
                        <div className="text-[12px] text-[var(--ink-tertiary)] leading-relaxed line-clamp-2">
                          {item.prompt}
                        </div>
                      </button>
                    ))}
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
