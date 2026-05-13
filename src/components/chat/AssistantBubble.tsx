import { Bubble } from '@ant-design/x';
import { CopilotChatAssistantMessage, type CopilotChatAssistantMessageProps } from '@copilotkit/react-core/v2';

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
              const statusTone = toolResult ? 'text-[#17643a]' : 'text-[#8a5b21]';

              return (
                <div
                  key={toolCall.id || toolName}
                  className="rounded-[18px] border border-black/8 bg-black/[0.04] px-3.5 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold tracking-[0.12em] text-[var(--ink-soft)] uppercase">
                        Tool
                      </div>
                      <div className="truncate text-[15px] font-medium text-[#182126]">{toolName}</div>
                    </div>
                    <div className={`shrink-0 text-[13px] font-medium ${statusTone}`}>{status}</div>
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
                <div className="glass-panel-strong rounded-[22px] px-4 py-3 text-[15px] leading-7 text-[#182126]">
                  {hasText ? markdownRenderer : <div className="text-[var(--ink-soft)]">正在处理...</div>}
                  {toolCallCards ? <div className="mt-4 space-y-3">{toolCallCards}</div> : null}
                </div>
              }
              classNames={{
                root: 'w-full',
                body: 'w-full',
                content: 'max-w-[86%] bg-transparent p-0',
              }}
            />
          </div>
        );
      }}
    </CopilotChatAssistantMessage>
  );
}
