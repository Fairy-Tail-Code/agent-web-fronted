import { Bubble } from '@ant-design/x';
import { CopilotChatAssistantMessage, type CopilotChatAssistantMessageProps } from '@copilotkit/react-core/v2';
import { ToolOutlined, CheckCircleOutlined, LoadingOutlined, RobotOutlined } from '@ant-design/icons';
import FileDownloadCard, { extractFileLinks } from './FileDownloadCard';

export default function AssistantBubble(props: CopilotChatAssistantMessageProps) {
  const { message, isRunning } = props;
  const hasText = typeof message.content === 'string' && message.content.trim().length > 0;
  const hasToolCalls = Array.isArray(message.toolCalls) && message.toolCalls.length > 0;

  // 提取文件下载链接
  const fileLinks = hasText ? extractFileLinks(message.content as string) : [];

  if (!hasText && !hasToolCalls && !isRunning) {
    return null;
  }

  return (
    <CopilotChatAssistantMessage {...props} toolbarVisible={false}>
      {({ markdownRenderer, messages }) => {
        const toolCallCards = hasToolCalls
          ? message.toolCalls!.map(toolCall => {
              const toolName = toolCall.function?.name || 'tool';
              const toolResult = messages?.find(item => item.role === 'tool' && (item as any).toolCallId === toolCall.id);
              const status = toolResult ? 'completed' : isRunning ? 'calling...' : 'waiting';
              const statusTone = toolResult ? 'text-[var(--accent-secondary)]' : isRunning ? 'text-[var(--accent-warm)]' : 'text-[var(--ink-tertiary)]';

              return (
                <div
                  key={toolCall.id || toolName}
                  className="rounded-[18px] border border-[var(--panel-border)] bg-white/75 px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-primary)]/8 text-[var(--accent-primary)] shrink-0">
                        {toolResult ? (
                          <CheckCircleOutlined className="text-xs" />
                        ) : isRunning ? (
                          <LoadingOutlined className="text-xs" />
                        ) : (
                          <ToolOutlined className="text-xs" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold tracking-[0.12em] text-[var(--ink-tertiary)] uppercase mb-0.5">
                          Tool
                        </div>
                        <div className="truncate text-[13px] font-medium text-[#1a1f1a]">{toolName}</div>
                      </div>
                    </div>
                    <div className={`shrink-0 text-[11px] font-medium ${statusTone}`}>{status}</div>
                  </div>
                </div>
              );
            })
          : null;

        return (
          <div className="w-full fade-in">
            <Bubble
              placement="start"
              variant="borderless"
              content={
                <div className="rounded-[22px] px-5 py-4 text-[15px] leading-7 text-[#1a1f1a] bg-white/80 border border-[var(--panel-border)] shadow-sm">
                  {/* AI avatar badge */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shrink-0">
                      <RobotOutlined className="text-[10px]" />
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--accent-primary)]">AI</span>
                    {isRunning && (
                      <span className="streaming-cursor text-[13px]" />
                    )}
                  </div>

                  {hasText ? (
                    <div className="leading-7 markdown-body">{markdownRenderer}</div>
                  ) : (
                    <div className="flex items-center gap-2 text-[var(--ink-secondary)]">
                      <LoadingOutlined className="text-[var(--accent-primary)]" />
                      正在处理...
                    </div>
                  )}
                  {fileLinks.length > 0 && (
                    <FileDownloadCard files={fileLinks} />
                  )}
                  {toolCallCards ? <div className="mt-3 space-y-2">{toolCallCards}</div> : null}
                </div>
              }
              classNames={{
                root: 'w-full mb-4',
                body: 'w-full',
                content: 'max-w-[88%] bg-transparent p-0',
              }}
            />
          </div>
        );
      }}
    </CopilotChatAssistantMessage>
  );
}
