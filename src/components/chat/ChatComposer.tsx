import { useState } from 'react';
import { CopilotChatAttachmentQueue, type CopilotChatInputProps } from '@copilotkit/react-core/v2';
import { Alert, Button, Input, Space } from 'antd';
import { PaperClipOutlined, SendOutlined, StopOutlined } from '@ant-design/icons';
import { useAtomValue } from 'jotai';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWorkbenchContext } from '@/layout/WorkbenchLayout';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { currentAgentAtom, currentSessionIdAtom, isLoggedInAtom } from '@/store/atoms';

export default function ChatComposer(props: CopilotChatInputProps) {
  const { inProgress, onSend, onStop, attachments, onRemoveAttachment, onAddFile, dragOver, onDragOver, onDragLeave, onDrop } = props;
  const [value, setValue] = useState('');
  const isLoggedIn = useAtomValue(isLoggedInAtom);
  const currentAgent = useAtomValue(currentAgentAtom);
  const currentSessionId = useAtomValue(currentSessionIdAtom);
  const { prepareSessionForSend } = useWorkbenchContext();
  const navigate = useNavigate();
  const location = useLocation();
  const hasAttachments = Boolean(attachments?.length);
  const isUploading = Boolean(attachments?.some(attachment => attachment.status === 'uploading'));

  const handleSend = async () => {
    const text = value.trim();
    if (!text && !hasAttachments) {
      return;
    }
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    if (!currentSessionId) {
      const nextSessionId = await prepareSessionForSend();
      if (!nextSessionId) {
        return;
      }
      window.setTimeout(() => {
        onSend(text);
      }, 0);
    } else {
      onSend(text);
    }

    setValue('');
  };

  return (
    <div
      className={`glass-panel-strong rounded-[28px] p-4 transition-colors ${dragOver ? 'ring-2 ring-[#1f7a8c]/40' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {!isLoggedIn ? (
        <Alert
          type="warning"
          showIcon
          className="mb-3"
          message={isSupabaseConfigured ? '当前未登录。发送消息会先跳转到登录页。' : '当前缺少 Supabase 配置，登录流程不可用。'}
        />
      ) : null}
      {attachments?.length && onRemoveAttachment ? (
        <div className="mb-3">
          <CopilotChatAttachmentQueue attachments={attachments} onRemoveAttachment={onRemoveAttachment} />
        </div>
      ) : null}
      <Input.TextArea
        autoSize={{ minRows: 4, maxRows: 8 }}
        value={value}
        onChange={event => setValue(event.target.value)}
        onPressEnter={event => {
          if (!event.shiftKey) {
            event.preventDefault();
            handleSend();
          }
        }}
        placeholder={currentAgent?.promptHint || '输入任务目标、数据背景或你希望生成的内容。'}
        className="!bg-white/55 !text-[#182126] !text-[15px]"
      />
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="text-sm text-[var(--ink-soft)]">
          当前模式: <span className="font-medium text-[#182126]">{currentAgent?.name}</span>
          {isUploading ? <span className="ml-3 text-[#1f7a8c]">文件上传中...</span> : null}
        </div>
        <Space>
          {onAddFile ? (
            <Button icon={<PaperClipOutlined />} onClick={onAddFile}>
              添加文件
            </Button>
          ) : null}
          {inProgress ? (
            <Button icon={<StopOutlined />} onClick={onStop}>
              停止
            </Button>
          ) : (
            <Button type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={isUploading || (!value.trim() && !hasAttachments)}>
              发送
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
}
