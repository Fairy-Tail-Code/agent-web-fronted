import type { SessionMessage, StoredSession } from '@/types';
import { extractChatText } from '@/lib/chatMessage';

function sliceTitle(content: string) {
  const text = content.replace(/\s+/g, ' ').trim();
  if (!text) {
    return '未命名会话';
  }
  return text.length > 36 ? `${text.slice(0, 36)}...` : text;
}

export function serializeMessages(messages: any[]): SessionMessage[] {
  return (messages || [])
    .filter(message => message?.role && typeof message?.content !== 'undefined')
    .map(message => ({
      id: String(message.id ?? crypto.randomUUID()),
      role: message.role,
      content: extractChatText(message.content),
      name: message.name ? String(message.name) : undefined,
      toolCalls: Array.isArray(message.toolCalls)
        ? message.toolCalls.map((toolCall: any) => ({
            id: toolCall?.id ? String(toolCall.id) : undefined,
            function: {
              name: toolCall?.function?.name ? String(toolCall.function.name) : undefined,
              arguments: toolCall?.function?.arguments ? String(toolCall.function.arguments) : undefined,
            },
          }))
        : undefined,
    }));
}

export function buildSessionTitle(messages: SessionMessage[], fallback: string) {
  const firstUserMessage = messages.find(message => message.role === 'user' && message.content.trim());
  return firstUserMessage ? sliceTitle(firstUserMessage.content) : fallback;
}

export function upsertSessionRecord(session: StoredSession, messages: SessionMessage[]) {
  const title = buildSessionTitle(messages, session.title);
  return {
    ...session,
    title,
    updatedAt: new Date().toISOString(),
    messages,
  };
}
