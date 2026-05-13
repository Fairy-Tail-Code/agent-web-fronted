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
} from 'antd';
import { DeleteOutlined, InboxOutlined, SearchOutlined } from '@ant-design/icons';
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
      <div className="glass-panel flex h-full items-center justify-center rounded-[28px] p-6">
        <Alert
          type="info"
          showIcon
          message="请先登录后再访问知识库。"
        />
      </div>
    );
  }

  return (
    <div className="glass-panel flex h-full min-h-0 flex-col rounded-[28px] p-4">
      {contextHolder}
      <Space direction="vertical" size={10} className="mb-4 w-full">
        <Input
          value={createName}
          onChange={event => setCreateName(event.target.value)}
          placeholder="知识库名称"
        />
        <Input.TextArea
          autoSize={{ minRows: 2, maxRows: 4 }}
          value={createDescription}
          onChange={event => setCreateDescription(event.target.value)}
          placeholder="知识库说明"
        />
        <Button
          type="primary"
          onClick={async () => {
            try {
              await knowledgeApi.createBase({ name: createName, description: createDescription }, token);
              setCreateName('');
              setCreateDescription('');
              await basesRequest.refreshAsync();
            } catch (error) {
              apiMessage.error(error instanceof Error ? error.message : '创建失败');
            }
          }}
        >
          新建知识库
        </Button>
      </Space>

      <div className="mb-3 text-xs font-semibold tracking-[0.18em] text-[var(--ink-soft)] uppercase">Bases</div>
      <div className="mb-4 max-h-[240px] overflow-auto pr-1">
        {basesRequest.loading ? (
          <div className="flex justify-center py-6">
            <Spin />
          </div>
        ) : basesRequest.data?.length ? (
          <List
            dataSource={basesRequest.data}
            renderItem={item => (
              <List.Item className="!border-none !px-0 !py-2">
                <Card
                  size="small"
                  className={`w-full cursor-pointer !rounded-[20px] ${item.kb_id === selectedKbId ? '!bg-[#182126] !text-white' : '!bg-white/70'}`}
                  onClick={() => setSelectedKbId(item.kb_id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className={`mt-1 text-xs ${item.kb_id === selectedKbId ? 'text-white/70' : 'text-[var(--ink-soft)]'}`}>
                        {item.description || '未填写描述'}
                      </div>
                    </div>
                    {!item.is_official ? (
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
                        }}
                      />
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Tag>{item.indexing_status}</Tag>
                    <Tag>{item.file_count} files</Tag>
                    {item.is_official ? <Tag color="gold">official</Tag> : null}
                  </div>
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无知识库" />
        )}
      </div>

      {selectedKbId ? (
        <>
          <Upload.Dragger
            className="!mb-4 !rounded-[22px] !border-dashed !border-black/10 !bg-white/55"
            multiple={false}
            customRequest={async (options: UploadRequestOption) => {
              try {
                await knowledgeApi.uploadFile(selectedKbId, options.file as File, token);
                options.onSuccess?.({}, options.file);
                await filesRequest.refreshAsync();
              } catch (error) {
                options.onError?.(error as Error);
              }
            }}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">上传到当前知识库</p>
            <p className="ant-upload-hint">支持后端允许的文档格式，上传后会异步索引。</p>
          </Upload.Dragger>

          <div className="mb-3 flex gap-2">
            <Input
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="输入检索问题"
              onPressEnter={() => searchRequest.run()}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={() => searchRequest.run()}>
              检索
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto pr-1">
            <Typography.Title level={5}>文件</Typography.Title>
            <List
              size="small"
              dataSource={filesRequest.data || []}
              locale={{ emptyText: filesRequest.loading ? <Spin /> : '暂无文件' }}
              renderItem={file => (
                <List.Item className="!px-0">
                  <div className="w-full rounded-2xl bg-white/60 px-3 py-2">
                    <div className="text-sm font-medium text-[#182126]">{file.file_name}</div>
                    <div className="mt-1 text-xs text-[var(--ink-soft)]">
                      {file.processing_status} · {file.file_type} · {Math.round(file.file_size / 1024)} KB
                    </div>
                  </div>
                </List.Item>
              )}
            />

            <Typography.Title level={5} className="!mt-6">
              检索结果
            </Typography.Title>
            <List
              dataSource={searchRequest.data || []}
              locale={{ emptyText: searchRequest.loading ? <Spin /> : '暂无检索结果' }}
              renderItem={item => (
                <List.Item className="!px-0">
                  <Card className="w-full !rounded-[20px] !border-none !bg-white/65">
                    <div className="text-xs text-[var(--ink-soft)]">
                      {item.source_file || 'unknown source'} · score {item.score.toFixed(3)}
                    </div>
                    <div className="mt-2 whitespace-pre-wrap text-sm text-[#182126]">{item.content}</div>
                  </Card>
                </List.Item>
              )}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
