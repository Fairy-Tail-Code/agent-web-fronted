import { Bubble } from '@ant-design/x';
import { CopilotChatAttachmentRenderer } from '@copilotkit/react-core/v2';
import type { CopilotChatUserMessageProps } from '@copilotkit/react-core/v2';
import { UserOutlined } from '@ant-design/icons';
import { parseChatContent } from '@/lib/chatMessage';

export default function UserBubble({ message }: CopilotChatUserMessageProps) {
  const { text, attachments } = parseChatContent(message.content);

  return (
    <div className="fade-in">
      <Bubble
        placement="end"
        variant="borderless"
        content={
          <div className="max-w-full rounded-[22px] bg-gradient-to-br from-[var(--accent-primary)] to-[#3d7a6f] px-5 py-4 text-[15px] leading-7 text-white shadow-lg shadow-[var(--accent-primary)]/20">
            {/* User avatar badge */}
            <div className="flex items-center justify-end gap-2 mb-2.5">
              <span className="text-[11px] font-semibold text-white/80">You</span>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20 text-white shrink-0">
                <UserOutlined className="text-[10px]" />
              </div>
            </div>

            {attachments.length ? (
              <div className="mb-3 flex flex-col gap-2.5">
                {attachments.map(attachment => (
                  <div
                    key={attachment.id}
                    className="overflow-hidden rounded-[16px] bg-white/12 backdrop-blur-sm p-2.5 border border-white/10"
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </div>
  );
}
