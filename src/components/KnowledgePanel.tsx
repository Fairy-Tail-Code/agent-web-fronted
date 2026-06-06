import { useEffect, useState } from 'react';
import { useRequest } from 'ahooks';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Empty,
  Input,
  List,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
  message,
  Tooltip,
} from 'antd';
import {
  DeleteOutlined,
  InboxOutlined,
  SearchOutlined,
  PlusOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  TrophyOutlined,
  CloudUploadOutlined,
  FolderOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  FileUnknownOutlined,
} from '@ant-design/icons';
import { useAtom, useAtomValue } from 'jotai';
import { knowledgeApi } from '@/services/api';
import { accessTokenAtom, selectedKnowledgeBaseIdAtom } from '@/store/atoms';

/* ---- Status icon helper ---- */
function StatusIcon({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? '';
  if (s === 'completed' || s === 'done' || s === 'ready') return <CheckCircleOutlined className="text-[var(--accent-secondary)]" />;
  if (s === 'processing' || s === 'indexing') return <LoadingOutlined className="text-[var(--accent-warm)]" />;
  return <FileUnknownOutlined className="text-[var(--ink-tertiary)]" />;
}

export default function KnowledgePanel() {
  const token = useAtomValue(accessTokenAtom);
  const [selectedKbId, setSelectedKbId] = useAtom(selectedKnowledgeBaseIdAtom);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [apiMessage, contextHolder] = message.useMessage();

  const basesRequest = useRequest(() => knowledgeApi.listBases(token), {
    ready: Boolean(token),
  });

  const filesRequest = useRequest(() => knowledgeApi.listFiles(selectedKbId, token), {
    ready: Boolean(token && selectedKbId),
    refreshDeps: [selectedKbId, token],
  });

  const searchRequest = useRequest(() => knowledgeApi.search({ kbId: selectedKbId, query: searchQuery }, token), {
    manual: true,
  });

  useEffect(() => {
    if (!selectedKbId && basesRequest.data?.length) {
      setSelectedKbId(basesRequest.data[0].kb_id);
    }
  }, [basesRequest.data, selectedKbId, setSelectedKbId]);

  const selectedBase = basesRequest.data?.find(b => b.kb_id === selectedKbId);

  if (!token) {
    return (
      <div className="glass-panel flex h-full items-center justify-center rounded-[32px] p-8">
        <Alert
          type="info"
          showIcon
          message="请先登录后再访问知识库。"
          className="!rounded-xl !bg-[#2d5a4f]/8 !border-[#2d5a4f]/20"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 gap-4">
      {contextHolder}

      {/* ============================================================
          LEFT COLUMN — Knowledge Base List (narrow)
          ============================================================ */}
      <div className="w-[260px] shrink-0 flex flex-col glass-panel rounded-[28px] p-4">
        {/* List header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs font-semibold tracking-[0.14em] text-[var(--ink-tertiary)] uppercase flex items-center gap-1.5">
            <FolderOutlined className="text-sm" />
            知识库
          </div>
          <Tooltip title="新建知识库">
            <Button
              size="small"
              type="text"
              icon={<PlusOutlined />}
              onClick={() => setDrawerOpen(true)}
              className="hover:!text-[var(--accent-primary)] hover:!bg-[var(--accent-primary)]/8 !rounded-xl transition-colors"
            />
          </Tooltip>
        </div>

        {/* Bases list */}
        <div className="min-h-0 flex-1 overflow-auto pr-1 space-y-2">
          {basesRequest.loading ? (
            <div className="flex flex-col gap-3 py-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="skeleton-shimmer h-[72px] w-full" />
              ))}
            </div>
          ) : basesRequest.data?.length ? (
            basesRequest.data.map((item, index) => {
              const active = item.kb_id === selectedKbId;
              return (
                <button
                  key={item.kb_id}
                  type="button"
                  className={`stagger-child w-full text-left rounded-[18px] border p-3.5 transition-all duration-200 group ${
                    active
                      ? 'border-[var(--accent-primary)] bg-gradient-to-r from-[var(--accent-primary)]/6 to-transparent shadow-sm'
                      : 'border-transparent bg-white/50 hover:bg-white/75 hover:border-[var(--panel-border)]'
                  }`}
                  style={{ animationDelay: `${index * 40}ms` }}
                  onClick={() => setSelectedKbId(item.kb_id)}
                >
                  {/* Left accent bar (visual only via border-left on active) */}
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`mt-0.5 h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-sm ${
                        active
                          ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                          : 'bg-[var(--panel-border)]/60 text-[var(--ink-tertiary)]'
                      }`}
                    >
                      <DatabaseOutlined />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[13px] font-semibold truncate ${active ? 'text-[#1a1f1a]' : 'text-[var(--ink-primary)]'}`}>
                          {item.name}
                        </span>
                        {item.is_official && (
                          <TrophyOutlined className="text-[10px] text-amber-500 shrink-0" />
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--ink-tertiary)]">
                        <StatusIcon status={item.indexing_status} />
                        <span>{item.file_count} 文件</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex min-h-[200px] items-center justify-center">
              <Empty
                description={<span className="text-[var(--ink-tertiary)] text-sm">暂无知识库</span>}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          )}
        </div>

        {/* Bottom create button */}
        <Button
          block
          icon={<PlusOutlined />}
          onClick={() => setDrawerOpen(true)}
          className="btn-ripple mt-3 !rounded-xl !h-10 !font-medium !border-dashed !border-[var(--accent-primary)]/30 !text-[var(--accent-primary)] hover:!bg-[var(--accent-primary)]/6"
        >
          新建知识库
        </Button>
      </div>

      {/* ============================================================
          RIGHT COLUMN — Detail View (wide)
          ============================================================ */}
      <div className="min-w-0 flex-1 glass-panel rounded-[28px] p-5 flex flex-col">
        {!selectedKbId ? (
          /* No selection state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-warm)]/8">
                <DatabaseOutlined className="text-2xl text-[var(--accent-warm)]" />
              </div>
              <div className="text-[16px] font-semibold text-[#1a1f1a] mb-1">选择一个知识库</div>
              <div className="text-[14px] text-[var(--ink-tertiary)]">从左侧列表中选择或新建知识库开始使用</div>
            </div>
          </div>
        ) : (
          <>
            {/* Detail header */}
            <div className="mb-4 pb-3 border-b border-[var(--panel-border)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Typography.Title level={5} className="!mb-0 !text-[#1a1f1a]">
                      {selectedBase?.name || '知识库'}
                    </Typography.Title>
                    {selectedBase?.is_official && (
                      <Tag color="gold" className="!rounded-lg !px-2 !py-0.5 !text-[11px] !font-medium" icon={<TrophyOutlined />}>
                        官方
                      </Tag>
                    )}
                  </div>
                  <div className="text-[13px] text-[var(--ink-secondary)] mt-0.5">
                    {selectedBase?.description || '未填写描述'}
                  </div>
                </div>
                {!selectedBase?.is_official && (
                  <Tooltip title="删除知识库">
                    <Button
                      danger
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={async () => {
                        await knowledgeApi.deleteBase(selectedKbId, token);
                        await basesRequest.refreshAsync();
                        setSelectedKbId('');
                        apiMessage.success('知识库已删除');
                      }}
                      className="!rounded-lg"
                    />
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Upload area */}
            <Upload.Dragger
              className="!mb-4 !rounded-[22px] !border-2 !border-dashed !border-[var(--accent-primary)]/15 !bg-gradient-to-br !from-[var(--accent-primary)]/3 !to-[var(--accent-secondary)]/3 hover:!border-[var(--accent-primary)]/35 hover:!from-[var(--accent-primary)]/8 hover:!to-[var(--accent-secondary)]/8 transition-all duration-300"
              multiple={false}
              customRequest={async (options) => {
                try {
                  await knowledgeApi.uploadFile(selectedKbId, options.file as File, token);
                  options.onSuccess?.({}, options.file);
                  await filesRequest.refreshAsync();
                  apiMessage.success('文件上传成功');
                } catch (error) {
                  options.onError?.(error as Error);
                  apiMessage.error(error instanceof Error ? error.message : '上传失败');
                }
              }}
              showUploadList={false}
            >
              <div className="py-3">
                <div className="h-12 w-12 mx-auto rounded-xl bg-[var(--accent-primary)]/8 flex items-center justify-center mb-2">
                  <CloudUploadOutlined className="text-xl text-[var(--accent-primary)]" />
                </div>
                <p className="text-[14px] font-medium text-[#1a1f1a] mb-0.5">拖拽文件到此处上传</p>
                <p className="text-[12px] text-[var(--ink-tertiary)]">
                  支持多种文档格式，上传后将自动进行索引处理
                </p>
              </div>
            </Upload.Dragger>

            {/* Search bar */}
            <div className="mb-4 flex gap-2.5">
              <Input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="输入检索关键词..."
                onPressEnter={() => searchRequest.run()}
                className="!rounded-xl flex-1"
                prefix={<SearchOutlined className="text-[var(--ink-tertiary)]" />}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => searchRequest.run()}
                className="btn-ripple !rounded-xl !h-10 !px-4 !font-medium"
              >
                检索
              </Button>
            </div>

            {/* Scrollable content */}
            <div className="min-h-0 flex-1 overflow-auto scroll-shadow-top pr-1" onScroll={e => {
              const el = e.currentTarget;
              el.classList.toggle('scrolled', el.scrollTop > 0);
            }}>
              {/* Files section */}
              <div className="mb-4 flex items-center gap-2 pb-2 border-b border-[var(--panel-border)]">
                <FileTextOutlined className="text-[var(--accent-primary)] text-sm" />
                <span className="text-[13px] font-semibold text-[#1a1f1a]">已上传文件</span>
                {filesRequest.data?.length ? (
                  <span className="ml-auto text-[11px] text-[var(--ink-tertiary)]">
                    {filesRequest.data.length} 个文件
                  </span>
                ) : null}
              </div>

              {filesRequest.loading ? (
                <div className="flex flex-col gap-2 py-4">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="skeleton-shimmer h-[52px] w-full" />
                  ))}
                </div>
              ) : filesRequest.data?.length ? (
                <div className="space-y-2 mb-6">
                  {filesRequest.data.map(file => (
                    <div
                      key={file.file_name}
                      className="flex items-center gap-3 rounded-[16px] bg-white/70 px-4 py-2.5 border border-[var(--panel-border)] hover:border-[var(--accent-primary)]/15 hover:shadow-sm transition-all"
                    >
                      <div className="h-8 w-8 shrink-0 rounded-lg bg-[var(--accent-primary)]/8 flex items-center justify-center">
                        <FileTextOutlined className="text-sm text-[var(--accent-primary)]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-[#1a1f1a] truncate">{file.file_name}</div>
                        <div className="text-[11px] text-[var(--ink-tertiary)]">{file.file_type} · {(file.file_size / 1024).toFixed(1)} KB</div>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                        file.processing_status === 'completed' || file.processing_status === 'done'
                          ? 'bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)]'
                          : 'bg-[var(--accent-warm)]/10 text-[var(--accent-warm)]'
                      }`}>
                        {file.processing_status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[100px] items-center justify-center mb-6">
                  <Empty
                    description={<span className="text-[var(--ink-tertiary)] text-sm">暂无文件，上传开始使用</span>}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </div>
              )}

              {/* Search results */}
              {(searchRequest.data !== undefined) && (
                <>
                  <div className="mb-4 flex items-center gap-2 pb-2 border-b border-[var(--panel-border)]">
                    <SearchOutlined className="text-[var(--accent-blue)] text-sm" />
                    <span className="text-[13px] font-semibold text-[#1a1f1a]">检索结果</span>
                  </div>
                  {searchRequest.loading ? (
                    <div className="flex flex-col gap-2 py-4">
                      {[1, 2].map(n => (
                        <div key={n} className="skeleton-shimmer h-[80px] w-full" />
                      ))}
                    </div>
                  ) : searchRequest.data?.length ? (
                    <div className="space-y-2.5">
                      {searchRequest.data.map(item => (
                        <div
                          key={item.source_file + item.content.slice(0, 20)}
                          className="rounded-[18px] border border-[var(--panel-border)] bg-white/70 p-4 hover:shadow-sm transition-shadow"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[11px] text-[var(--ink-tertiary)]">
                              <FileTextOutlined />
                              <span>{item.source_file || 'unknown'}</span>
                            </div>
                            <Tag color="cyan" className="!rounded-lg !px-2 !py-0.5 !text-[11px] !font-medium !m-0">
                              {item.score.toFixed(3)}
                            </Tag>
                          </div>
                          <div className="whitespace-pre-wrap text-[13px] text-[#1a1f1a] leading-relaxed bg-[#1a1f1a]/[0.03] rounded-xl p-3">
                            {item.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex min-h-[80px] items-center justify-center">
                      <Empty
                        description={<span className="text-[var(--ink-tertiary)] text-sm">暂无检索结果</span>}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ============================================================
          DRAWER — Create Knowledge Base
          ============================================================ */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <PlusOutlined className="text-[var(--accent-primary)]" />
            <span className="display-font text-[18px] font-semibold">新建知识库</span>
          </div>
        }
        placement="right"
        width={400}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{
          body: { padding: '20px', background: 'var(--panel-strong)' },
          header: { borderBottom: '1px solid var(--panel-border)', padding: '16px 20px' },
          wrapper: {},
        }}
        className="[&_.ant-drawer-content]:!bg-transparent [&_.ant-drawer-header]:!bg-transparent"
      >
        <Space direction="vertical" size={16} className="w-full">
          <div>
            <label className="block text-sm font-medium text-[#1a1f1a] mb-2">知识库名称</label>
            <Input
              value={createName}
              onChange={event => setCreateName(event.target.value)}
              placeholder="输入知识库名称"
              className="!rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1f1a] mb-2">描述说明</label>
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 6 }}
              value={createDescription}
              onChange={event => setCreateDescription(event.target.value)}
              placeholder="简要描述知识库用途"
              className="!rounded-xl"
            />
          </div>
          <Button
            type="primary"
            block
            icon={<PlusOutlined />}
            onClick={async () => {
              try {
                await knowledgeApi.createBase({ name: createName, description: createDescription }, token);
                setCreateName('');
                setCreateDescription('');
                await basesRequest.refreshAsync();
                setDrawerOpen(false);
                apiMessage.success('知识库创建成功');
              } catch (error) {
                apiMessage.error(error instanceof Error ? error.message : '创建失败');
              }
            }}
            disabled={!createName.trim()}
            className="btn-ripple !rounded-xl !h-11 !font-medium shadow-md shadow-[var(--accent-primary)]/10"
          >
            创建知识库
          </Button>
        </Space>
      </Drawer>
    </div>
  );
}
