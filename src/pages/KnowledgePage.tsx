import KnowledgePanel from '@/components/KnowledgePanel';

export default function KnowledgePage() {
  return (
    <div className="glass-panel flex h-full min-h-0 flex-col rounded-[30px] p-5">
      <div className="mb-5">
        <div className="heading-font text-[30px] font-semibold text-[#182126]">知识库</div>
        <div className="mt-1 text-sm text-[var(--ink-soft)]">管理知识库、上传文件，并针对当前资料做检索。</div>
      </div>
      <div className="min-h-0 flex-1">
        <KnowledgePanel />
      </div>
    </div>
  );
}
