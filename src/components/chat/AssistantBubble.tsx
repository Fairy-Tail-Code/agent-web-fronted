import { Bubble } from '@ant-design/x';
import { CopilotChatAssistantMessage, type CopilotChatAssistantMessageProps } from '@copilotkit/react-core/v2';
import { ToolOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';

export default function AssistantBubble(props: CopilotChatAssistantMessageProps) {
  const { message, isRunning } = props;
  const hasText = typeof message.content === 'string' && message.content.trim().length > 0;
  const hasToolCalls = Array.isArray(message.toolCalls) && message.toolCalls.length > 0;

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
              const statusTone = toolResult ? 'text-[#4a7c59]' : isRunning ? 'text-[#c4783a]' : 'text-[var(--ink-tertiary)]';

              return (
                <div
                  key={toolCall.id || toolName}
                  className="rounded-[20px] border border-[var(--panel-border)] bg-white/75 px-4 py-3.5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2d5a4f]/10 text-[#2d5a4f] shrink-0">
                        {toolResult ? (
                          <CheckCircleOutlined className="text-sm" />
                        ) : isRunning ? (
                          <LoadingOutlined className="text-sm" />
                        ) : (
                          <ToolOutlined className="text-sm" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold tracking-[0.14em] text-[var(--ink-tertiary)] uppercase mb-0.5">
                          Tool
                        </div>
                        <div className="truncate text-[14px] font-medium text-[#1a1f1a]">{toolName}</div>
                      </div>
                    </div>
                    <div className={`shrink-0 text-[12px] font-medium ${statusTone}`}>{status}</div>
                  </div>
                </div>
              );
            })
          : null;

        return (
          <div className="w-full">
            <Bubble
              placement="start"
              variant="borderless"
              content={
                <div className="glass-panel-strong rounded-[26px] px-5 py-4 text-[15px] leading-7 text-[#1a1f1a] shadow-md">
                  {hasText ? (
                    <div className="leading-7">{markdownRenderer}</div>
                  ) : (
                    <div className="flex items-center gap-2 text-[var(--ink-secondary)]">
                      <LoadingOutlined className="text-[#2d5a4f]" />
                      正在处理...
                    </div>
                  )}
                  {toolCallCards ? <div className="mt-4 space-y-3">{toolCallCards}</div> : null}
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
