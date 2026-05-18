import { DatabaseOutlined } from '@ant-design/icons';
import KnowledgePanel from '@/components/KnowledgePanel';

export default function KnowledgePage() {
  return (
    <div className="glass-panel-strong flex h-full min-h-0 flex-col rounded-[36px] p-6">
      <div className="mb-6 flex items-center gap-3 pb-5 border-b border-[var(--panel-border)]">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2d5a4f] to-[#4a7c59] text-white shadow-lg shadow-[#2d5a4f]/20">
          <DatabaseOutlined className="text-lg" />
        </div>
        <div>
          <div className="display-font text-[32px] font-semibold text-[#1a1f1a]">知识库</div>
          <div className="mt-1 text-sm text-[var(--ink-secondary)]">管理知识库、上传文件，并进行智能检索</div>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <KnowledgePanel />
      </div>
    </div>
  );
}
