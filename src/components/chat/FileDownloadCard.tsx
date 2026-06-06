import { DownloadOutlined } from '@ant-design/icons';
import { getAccessToken } from '@/lib/auth';

const EXTENSION_ICONS: Record<string, string> = {
  '.docx': '📄', '.doc': '📄',
  '.pdf': '📕', '.xlsx': '📊', '.xls': '📊', '.csv': '📊',
  '.pptx': '📑', '.ppt': '📑',
  '.md': '📝', '.txt': '📝',
  '.png': '🖼️', '.jpg': '🖼️', '.jpeg': '🖼️',
  '.zip': '📦',
};

interface FileLink {
  path: string;
  name: string;
}

interface FileDownloadCardProps {
  files: FileLink[];
}

export default function FileDownloadCard({ files }: FileDownloadCardProps) {
  if (!files.length) return null;

  const handleDownload = async (filePath: string) => {
    const token = await getAccessToken();
    const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL || '/backend';
    const url = `${baseUrl}/files/download/${filePath}`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('下载失败');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filePath.split('/').pop() || 'file';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error('文件下载失败:', err);
    }
  };

  return (
    <div className="mt-4 space-y-2">
      {files.map((file, idx) => {
        const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
        const icon = EXTENSION_ICONS[ext] || '📎';
        return (
          <div
            key={idx}
            className="flex items-center gap-3 rounded-2xl border border-[var(--panel-border)] bg-white/90 px-4 py-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => handleDownload(file.path)}
          >
            <span className="text-xl shrink-0">{icon}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-medium text-[#1a1f1a] group-hover:text-[#2d5a4f] transition-colors">
                {file.name}
              </div>
              <div className="text-[12px] text-[var(--ink-tertiary)]">
                点击下载
              </div>
            </div>
            <DownloadOutlined className="text-[#2d5a4f] text-lg shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        );
      })}
    </div>
  );
}

/**
 * 从 markdown 文本中提取 Agent 生成的文件链接。
 * 支持格式：
 *   - [文件名](/backend/files/download/xxx.docx)
 *   - [下载 xxx.docx](/backend/files/download/xxx.docx)
 *   - 纯文本中的 /backend/files/download/xxx.docx
 */
export function extractFileLinks(content: string): FileLink[] {
  if (!content) return [];
  const links: FileLink[] = [];
  const seen = new Set<string>();

  // 匹配 markdown 链接格式: [label](/backend/files/download/path)
  const mdLinkRegex = /\[([^\]]*)\]\(([^)]*\/files\/download\/([^)]+))\)/g;
  let match;
  while ((match = mdLinkRegex.exec(content)) !== null) {
    const label = match[1];
    const filePath = match[3];
    if (!seen.has(filePath)) {
      seen.add(filePath);
      const name = label.replace(/^(下载|Download)\s+/i, '') || filePath.split('/').pop() || filePath;
      links.push({ path: filePath, name });
    }
  }

  // 匹配裸链接: /backend/files/download/path
  const bareRegex = /(?:^|[\s(])(\/backend\/files\/download\/([^\s)\]"'<>]+))/gm;
  while ((match = bareRegex.exec(content)) !== null) {
    const filePath = match[2];
    if (!seen.has(filePath)) {
      seen.add(filePath);
      links.push({ path: filePath, name: filePath.split('/').pop() || filePath });
    }
  }

  return links;
}
