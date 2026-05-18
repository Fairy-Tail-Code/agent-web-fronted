import { useState } from 'react';
import { CopilotChatAttachmentQueue, type CopilotChatInputProps } from '@copilotkit/react-core/v2';
import { Alert, Button, Input, Space } from 'antd';
import { PaperClipOutlined, SendOutlined, StopOutlined, ThunderboltOutlined, RobotOutlined } from '@ant-design/icons';
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
      className={`glass-panel-strong rounded-[32px] p-5 transition-all duration-300 ${
        dragOver ? 'ring-2 ring-[#2d5a4f]/40 shadow-xl shadow-[#2d5a4f]/15 scale-[1.01]' : 'shadow-lg'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {!isLoggedIn ? (
        <Alert
          type="warning"
          showIcon
          className="mb-4 !rounded-xl !border-[#c4783a]/30 !bg-[#c4783a]/8"
          message={isSupabaseConfigured ? '当前未登录。发送消息会先跳转到登录页。' : '当前缺少 Supabase 配置，登录流程不可用。'}
        />
      ) : null}
      {attachments?.length && onRemoveAttachment ? (
        <div className="mb-4">
          <CopilotChatAttachmentQueue attachments={attachments} onRemoveAttachment={onRemoveAttachment} />
        </div>
      ) : null}
      <div className="relative">
        <Input.TextArea
          autoSize={{ minRows: 3, maxRows: 6 }}
          value={value}
          onChange={event => setValue(event.target.value)}
          onPressEnter={event => {
            if (!event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder={currentAgent?.promptHint || '输入任务目标、数据背景或你希望生成的内容...'}
          className="!bg-white/70 !text-[#1a1f1a] !text-[15px] !rounded-[24px] !border-[var(--panel-border)] focus:!border-[#2d5a4f] !pr-14"
          style={{
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
          }}
        />
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2d5a4f]/8 text-[13px] text-[#2d5a4f]">
            <RobotOutlined className="text-sm" />
            <span className="font-medium">{currentAgent?.name || 'Default Agent'}</span>
          </div>
          {isUploading ? (
            <div className="flex items-center gap-2 text-[13px] text-[#c4783a]">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-medium">上传中...</span>
            </div>
          ) : null}
        </div>
        <Space size={12}>
          {onAddFile ? (
            <Button
              icon={<PaperClipOutlined />}
              onClick={onAddFile}
              className="!rounded-xl !h-10 !px-4 hover:!bg-[#2d5a4f]/8 hover:!text-[#2d5a4f] transition-colors"
            >
              添加文件
            </Button>
          ) : null}
          {inProgress ? (
            <Button
              icon={<StopOutlined />}
              onClick={onStop}
              className="!rounded-xl !h-10 !px-5 !bg-[#c7554d] hover:!bg-[#d96b63] !border-transparent shadow-md shadow-[#c7554d]/20"
            >
              停止
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={isUploading || (!value.trim() && !hasAttachments)}
              className="!rounded-xl !h-10 !px-6 !font-medium !bg-gradient-to-r !from-[#2d5a4f] !to-[#3d7a6f] hover:!from-[#3d7a6f] hover:!to-[#4a7c59] !border-none shadow-lg shadow-[#2d5a4f]/25 hover:shadow-xl hover:shadow-[#2d5a4f]/30 transition-all"
            >
              发送
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
}
