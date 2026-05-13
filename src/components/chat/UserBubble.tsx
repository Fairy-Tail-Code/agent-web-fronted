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
        <div className="max-w-full rounded-[22px] bg-[#182126] px-4 py-3 text-[15px] leading-7 text-white">
          {attachments.length ? (
            <div className="mb-3 flex flex-col gap-2">
              {attachments.map(attachment => (
                <div key={attachment.id} className="overflow-hidden rounded-[16px] bg-white/10 p-2">
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
          {text ? <div>{text}</div> : attachments.length ? <div className="text-white/70">已发送附件</div> : null}
        </div>
      }
      classNames={{
        root: 'w-full',
        body: 'w-full justify-end',
        content: 'max-w-[80%] bg-transparent p-0',
      }}
    />
  );
}
