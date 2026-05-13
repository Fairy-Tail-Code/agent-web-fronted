type ParsedAttachment = {
  id: string;
  type: 'image' | 'audio' | 'video' | 'document';
  source: unknown;
  filename?: string;
  size?: number;
  metadata?: Record<string, unknown>;
};

type ParsedChatContent = {
  text: string;
  attachments: ParsedAttachment[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseLegacyStringMessage(content: string): ParsedChatContent | null {
  try {
    const parsed = JSON.parse(content);
    if (!isRecord(parsed)) {
      return null;
    }

    const text = typeof parsed.content === 'string' ? parsed.content : content;
    const files = Array.isArray(parsed.files)
      ? parsed.files
          .filter(isRecord)
          .map((file, index) => ({
            id: String(file.id || file.url || `legacy-file-${index}`),
            type: file.type === 'image' ? 'image' : 'document',
            source: { type: 'url', value: String(file.url || '') },
            filename: typeof file.name === 'string' ? file.name : undefined,
            metadata: typeof file.url === 'string' ? { legacyUrl: file.url } : undefined,
          }))
          .filter(file => {
            if (!isRecord(file.source)) {
              return false;
            }
            return typeof file.source.value === 'string' && file.source.value.length > 0;
          })
      : [];

    return {
      text,
      attachments: files,
    };
  } catch {
    return null;
  }
}

function parseContentParts(content: unknown[]): ParsedChatContent {
  const textParts: string[] = [];
  const attachments: ParsedAttachment[] = [];

  content.forEach((part, index) => {
    if (!isRecord(part)) {
      return;
    }

    if (part.type === 'text' && typeof part.text === 'string') {
      textParts.push(part.text);
      return;
    }

    if (!['image', 'audio', 'video', 'document'].includes(String(part.type || ''))) {
      return;
    }

    const metadata = isRecord(part.metadata) ? (part.metadata as Record<string, unknown>) : undefined;

    attachments.push({
      id: String(metadata?.id || metadata?.filename || `attachment-${index}`),
      type: part.type as ParsedAttachment['type'],
      source: part.source,
      filename: typeof metadata?.filename === 'string' ? metadata.filename : undefined,
      size: typeof metadata?.size === 'number' ? metadata.size : undefined,
      metadata,
    });
  });

  return {
    text: textParts.join('\n').trim(),
    attachments,
  };
}

export function parseChatContent(content: unknown): ParsedChatContent {
  if (typeof content === 'string') {
    return parseLegacyStringMessage(content) || { text: content, attachments: [] };
  }

  if (Array.isArray(content)) {
    return parseContentParts(content);
  }

  if (isRecord(content) && typeof content.content === 'string') {
    return {
      text: content.content,
      attachments: [],
    };
  }

  return {
    text: '',
    attachments: [],
  };
}

export function extractChatText(content: unknown) {
  return parseChatContent(content).text;
}
