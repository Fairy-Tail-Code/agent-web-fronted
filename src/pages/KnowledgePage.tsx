import { DatabaseOutlined, PlusOutlined } from '@ant-design/icons';
import KnowledgePanel from '@/components/KnowledgePanel';

export default function KnowledgePage() {
  return (
    <div className="glass-panel-strong flex h-full min-h-0 flex-col rounded-[36px] p-6 page-enter">
      {/* ---- Compact header ---- */}
      <div className="mb-4 flex items-center gap-3 pb-4 border-b border-[var(--panel-border)]">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-warm)] to-[#d4925a] text-white shadow-lg shadow-[var(--accent-warm)]/20">
          <DatabaseOutlined className="text-base" />
        </div>
        <div>
          <div className="display-font text-[20px] font-semibold text-[#1a1f1a]">知识库</div>
          <div className="text-[13px] text-[var(--ink-secondary)] leading-snug">管理知识库、上传文件，并进行智能检索</div>
        </div>
      </div>

      {/* ---- Content ---- */}
      <div className="min-h-0 flex-1">
        <KnowledgePanel />
      </div>
    </div>
  );
}
