import { Bubble } from '@ant-design/x';
import { CopilotChatAttachmentRenderer } from '@copilotkit/react-core/v2';
import type { CopilotChatUserMessageProps } from '@copilotkit/react-core/v2';
import { parseChatContent } from '@/lib/chatMessage';

export default function UserBubble({ message }: CopilotChatUserMessageProps) {
  const { text, attachments } = parseChatContent(message.content);

  return (
    <Bubble
      placement="end"
      variant="borderless"
      content={
        <div className="max-w-full rounded-[26px] bg-gradient-to-br from-[#1a1f1a] to-[#2d352d] px-5 py-4 text-[15px] leading-7 text-white shadow-xl shadow-[#1a1f1a]/20">
          {attachments.length ? (
            <div className="mb-4 flex flex-col gap-3">
              {attachments.map(attachment => (
                <div
                  key={attachment.id}
                  className="overflow-hidden rounded-[20px] bg-white/12 backdrop-blur-sm p-3 border border-white/10"
                >
                  <CopilotChatAttachmentRenderer
                    type={attachment.type}
                    source={attachment.source as any}
                    filename={attachment.filename}
                    className="max-w-full"
                  />
                </div>
              ))}
            </div>
          ) : null}
          {text ? (
            <div className="leading-7">{text}</div>
          ) : attachments.length ? (
            <div className="flex items-center gap-2 text-white/70">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              已发送附件
            </div>
          ) : null}
        </div>
      }
      classNames={{
        root: 'w-full mb-4',
        body: 'w-full justify-end',
        content: 'max-w-[85%] bg-transparent p-0',
      }}
    />
  );
}
