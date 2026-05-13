import type { RuntimeEventItem } from '@/types';

function preview(value: unknown, limit = 140) {
  if (value == null) {
    return '';
  }

  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

export function summarizeAguiEvent(event: any): RuntimeEventItem | null {
  const type = String(event?.type || '');
  const createdAt = Date.now();
  const id = `${type}-${event?.toolCallId || event?.messageId || event?.runId || createdAt}-${Math.random().toString(36).slice(2, 8)}`;
  const textDelta = preview(event?.delta || event?.content || event?.text || '');
  const reasoningDelta = preview(event?.delta || event?.content || event?.text || '');
  const toolResult = preview(event?.content || event?.result || event?.value || '');

  switch (type) {
    case 'RUN_STARTED':
      return {
        id,
        type,
        level: 'info',
        title: '运行开始',
        createdAt,
      };
    case 'TOOL_CALL_START':
      return {
        id,
        type,
        level: 'info',
        title: `工具调用: ${event?.toolCallName || 'tool'}`,
        detail: '正在调用工具',
        createdAt,
      };
    case 'TOOL_CALL_ARGS':
      return {
        id,
        type,
        level: 'warning',
        title: `工具参数: ${event?.toolCallName || 'tool'}`,
        detail: preview(event?.delta || ''),
        createdAt,
      };
    case 'TOOL_CALL_RESULT':
      return {
        id,
        type,
        level: 'success',
        title: '工具结果返回',
        detail: toolResult,
        createdAt,
      };
    case 'TOOL_CALL_END':
      return {
        id,
        type,
        level: 'success',
        title: '工具调用结束',
        detail: '工具调用已完成',
        createdAt,
      };
    case 'TEXT_MESSAGE_START':
      return {
        id,
        type,
        level: 'info',
        title: '开始生成回复',
        createdAt,
      };
    case 'TEXT_MESSAGE_CONTENT':
      return {
        id,
        type,
        level: 'info',
        title: '回复内容',
        detail: textDelta,
        createdAt,
      };
    case 'TEXT_MESSAGE_END':
      return {
        id,
        type,
        level: 'success',
        title: '回复生成完成',
        createdAt,
      };
    case 'REASONING_MESSAGE_START':
      return {
        id,
        type,
        level: 'info',
        title: '开始推理',
        createdAt,
      };
    case 'REASONING_MESSAGE_CONTENT':
      return {
        id,
        type,
        level: 'warning',
        title: '推理内容',
        detail: reasoningDelta,
        createdAt,
      };
    case 'REASONING_MESSAGE_END':
      return {
        id,
        type,
        level: 'success',
        title: '推理结束',
        createdAt,
      };
    case 'CUSTOM':
      return {
        id,
        type,
        level: 'warning',
        title: `自定义事件: ${event?.name || 'custom'}`,
        detail: preview(event?.value || ''),
        createdAt,
      };
    case 'RUN_FINISHED':
      return {
        id,
        type,
        level: 'success',
        title: '运行完成',
        detail: preview(event?.result || ''),
        createdAt,
      };
    case 'RUN_ERROR':
      return {
        id,
        type,
        level: 'error',
        title: '运行报错',
        detail: preview(event?.message || event?.content || ''),
        createdAt,
      };
    default:
      return null;
  }
}
