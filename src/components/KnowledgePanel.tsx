import { useEffect, useState } from 'react';
import { useRequest } from 'ahooks';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  List,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
  type UploadRequestOption,
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
} from '@ant-design/icons';
import { useAtom, useAtomValue } from 'jotai';
import { knowledgeApi } from '@/services/api';
import { accessTokenAtom, selectedKnowledgeBaseIdAtom } from '@/store/atoms';

export default function KnowledgePanel() {
  const token = useAtomValue(accessTokenAtom);
  const [selectedKbId, setSelectedKbId] = useAtom(selectedKnowledgeBaseIdAtom);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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
    <div className="glass-panel-strong flex h-full min-h-0 flex-col rounded-[32px] p-5">
      {contextHolder}
      <div className="mb-5 flex items-center gap-2.5 pb-4 border-b border-[var(--panel-border)]">
        <DatabaseOutlined className="text-[#2d5a4f] text-lg" />
        <span className="display-font text-[22px] font-semibold text-[#1a1f1a]">知识库管理</span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto pr-2">
        <Space direction="vertical" size={12} className="mb-6 w-full">
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
              autoSize={{ minRows: 2, maxRows: 4 }}
              value={createDescription}
              onChange={event => setCreateDescription(event.target.value)}
              placeholder="简要描述知识库用途"
              className="!rounded-xl"
            />
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={async () => {
              try {
                await knowledgeApi.createBase({ name: createName, description: createDescription }, token);
                setCreateName('');
                setCreateDescription('');
                await basesRequest.refreshAsync();
                apiMessage.success('知识库创建成功');
              } catch (error) {
                apiMessage.error(error instanceof Error ? error.message : '创建失败');
              }
            }}
            disabled={!createName.trim()}
            className="!rounded-xl !h-10 !font-medium shadow-md shadow-[#2d5a4f]/10"
          >
            新建知识库
          </Button>
        </Space>

        <div className="mb-4 text-xs font-semibold tracking-[0.16em] text-[var(--ink-tertiary)] uppercase flex items-center gap-2">
          <DatabaseOutlined />
          Knowledge Bases
        </div>
        <div className="mb-6 max-h-[280px] overflow-auto pr-1">
          {basesRequest.loading ? (
            <div className="flex justify-center py-8">
              <Spin size="large" tip="加载中..." />
            </div>
          ) : basesRequest.data?.length ? (
            <div className="space-y-3">
              {basesRequest.data.map((item, index) => (
                <Card
                  key={item.kb_id}
                  size="small"
                  className={`!rounded-[22px] cursor-pointer transition-all duration-200 ${
                    item.kb_id === selectedKbId
                      ? '!bg-gradient-to-r !from-[#2d5a4f] !to-[#3d7a6f] !text-white !border-transparent !shadow-lg shadow-[#2d5a4f]/20 scale-[1.01]'
                      : '!bg-white/75 !border-[var(--panel-border)] hover:!bg-white/90 hover:!shadow-md'
                  }`}
                  bodyStyle={{ padding: '16px 18px' }}
                  onClick={() => setSelectedKbId(item.kb_id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-[15px] mb-1.5 ${item.kb_id === selectedKbId ? 'text-white' : 'text-[#1a1f1a]'}`}>
                        {item.name}
                      </div>
                      <div className={`text-xs ${item.kb_id === selectedKbId ? 'text-white/80' : 'text-[var(--ink-tertiary)]'} leading-relaxed`}>
                        {item.description || '未填写描述'}
                      </div>
                    </div>
                    {!item.is_official ? (
                      <Tooltip title="删除知识库">
                        <Button
                          danger
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={async event => {
                            event.stopPropagation();
                            await knowledgeApi.deleteBase(item.kb_id, token);
                            await basesRequest.refreshAsync();
                            if (selectedKbId === item.kb_id) {
                              setSelectedKbId('');
                            }
                            apiMessage.success('知识库已删除');
                          }}
                          className={`!rounded-lg ${item.kb_id === selectedKbId ? 'hover:!bg-white/20' : ''}`}
                        />
                      </Tooltip>
                    ) : null}
                  </div>
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    <Tag
                      className={`!rounded-lg !px-2.5 !py-1 !text-xs ${
                        item.kb_id === selectedKbId
                          ? '!bg-white/20 !text-white !border-white/30'
                          : '!bg-[#2d5a4f]/8 !text-[#2d5a4f] !border-[#2d5a4f]/15'
                      }`}
                    >
                      {item.indexing_status}
                    </Tag>
                    <Tag
                      className={`!rounded-lg !px-2.5 !py-1 !text-xs ${
                        item.kb_id === selectedKbId
                          ? '!bg-white/20 !text-white !border-white/30'
                          : '!bg-[#4a7c59]/8 !text-[#4a7c59] !border-[#4a7c59]/15'
                      }`}
                    >
                      {item.file_count} 文件
                    </Tag>
                    {item.is_official ? (
                      <Tag
                        color="gold"
                        className="!rounded-lg !px-2.5 !py-1 !text-xs !font-medium"
                        icon={<TrophyOutlined />}
                      >
                        官方
                      </Tag>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Empty
              description={
                <span className="text-[var(--ink-tertiary)] text-sm">暂无知识库</span>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>

        {selectedKbId ? (
          <>
            <Upload.Dragger
              className="!mb-5 !rounded-[24px] !border-2 !border-dashed !border-[#2d5a4f]/20 !bg-gradient-to-br !from-[#2d5a4f]/5 !to-[#4a7c59]/5 hover:!border-[#2d5a4f]/40 hover:!from-[#2d5a4f]/10 hover:!to-[#4a7c59]/10 transition-all duration-300"
              multiple={false}
              customRequest={async (options: UploadRequestOption) => {
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
              <p className="ant-upload-drag-icon mb-3">
                <div className="h-14 w-14 mx-auto rounded-xl bg-[#2d5a4f]/10 flex items-center justify-center">
                  <CloudUploadOutlined className="text-2xl text-[#2d5a4f]" />
                </div>
              </p>
              <p className="ant-upload-text text-[15px] font-medium text-[#1a1f1a] mb-1">拖拽文件到此处上传</p>
              <p className="ant-upload-hint text-xs text-[var(--ink-tertiary)]">
                支持多种文档格式，上传后将自动进行索引处理
              </p>
            </Upload.Dragger>

            <div className="mb-4 flex gap-3">
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
                className="!rounded-xl !h-10 !px-5 !font-medium"
              >
                检索
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              <div className="mb-4 flex items-center gap-2.5 pb-3 border-b border-[var(--panel-border)]">
                <FileTextOutlined className="text-[#2d5a4f]" />
                <Typography.Title level={5} className="!mb-0 text-[#1a1f1a]">
                  已上传文件
                </Typography.Title>
                {filesRequest.data?.length ? (
                  <span className="ml-auto text-xs text-[var(--ink-tertiary)]">
                    {filesRequest.data.length} 个文件
                  </span>
                ) : null}
              </div>
              {filesRequest.loading ? (
                <div className="flex justify-center py-6">
                  <Spin tip="加载中..." />
                </div>
              ) : filesRequest.data?.length ? (
                <List
                  size="small"
                  dataSource={filesRequest.data}
                  renderItem={(file, index) => (
                    <List.Item className="!px-0 !py-2.5">
                      <div className="w-full rounded-2xl bg-white/75 px-4 py-3 border border-[var(--panel-border)] hover:border-[#2d5a4f]/20 hover:shadow-sm transition-all">
                        <div className="text-sm font-medium text-[#1a1f1a] mb-1">{file.file_name}</div>
                        <div className="flex items-center gap-3 text-xs text-[var(--ink-tertiary)]">
                          <span className="px-2 py-0.5 rounded-md bg-[#2d5a4f]/8 text-[#2d5a4f]">
                            {file.processing_status}
                          </span>
                          <span>{file.file_type}</span>
                          <span>{(file.file_size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty
                  description={
                    <span className="text-[var(--ink-tertiary)] text-sm">暂无文件</span>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}

              <div className="mb-4 mt-8 flex items-center gap-2.5 pb-3 border-b border-[var(--panel-border)]">
                <SearchOutlined className="text-[#2d5a4f]" />
                <Typography.Title level={5} className="!mb-0 text-[#1a1f1a]">
                  检索结果
                </Typography.Title>
              </div>
              {searchRequest.loading ? (
                <div className="flex justify-center py-6">
                  <Spin tip="检索中..." />
                </div>
              ) : searchRequest.data?.length ? (
                <List
                  dataSource={searchRequest.data}
                  renderItem={(item, index) => (
                    <List.Item className="!px-0 !py-2.5">
                      <Card className="w-full !rounded-[22px] !border-[var(--panel-border)] !bg-white/75 hover:!shadow-md transition-shadow">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs text-[var(--ink-tertiary)]">
                            <FileTextOutlined />
                            <span>{item.source_file || 'unknown source'}</span>
                          </div>
                          <Tag
                            color="cyan"
                            className="!rounded-lg !px-2.5 !py-0.5 !text-xs !font-medium"
                          >
                            score: {item.score.toFixed(3)}
                          </Tag>
                        </div>
                        <div className="whitespace-pre-wrap text-sm text-[#1a1f1a] leading-relaxed bg-[#1a1f1a]/3 rounded-xl p-3 mt-2">
                          {item.content}
                        </div>
                      </Card>
                    </List.Item>
                  )}
                />
              ) : searchRequest.data?.length === 0 && !searchRequest.loading ? (
                <Empty
                  description={
                    <span className="text-[var(--ink-tertiary)] text-sm">暂无检索结果</span>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
