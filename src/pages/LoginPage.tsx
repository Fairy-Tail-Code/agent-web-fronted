import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, Input, Space, Typography, message } from 'antd';
import { LinkOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAtomValue } from 'jotai';
import { currentAgentAtom, isLoggedInAtom } from '@/store/atoms';
import { isSupabaseConfigured, supabaseClient } from '@/lib/supabaseClient';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLoggedIn = useAtomValue(isLoggedInAtom);
  const currentAgent = useAtomValue(currentAgentAtom);
  const [messageApi, contextHolder] = message.useMessage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectTarget = useMemo(() => searchParams.get('redirect') || '/workspace', [searchParams]);

  useEffect(() => {
    if (isLoggedIn) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isLoggedIn, navigate, redirectTarget]);

  const handleSendLink = async () => {
    if (!supabaseClient) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        throw error;
      }

      messageApi.success('登录链接已发送，请前往邮箱点击 magic link 完成登录。');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '发送登录链接失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      {contextHolder}
      <div className="mx-auto max-w-[1180px]">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_420px]">
          <div className="glass-panel rounded-[34px] p-8 md:p-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#182126] px-4 py-2 text-sm text-white">
              <SafetyCertificateOutlined />
              <span>登录账户</span>
            </div>
            <Typography.Title level={1} className="heading-font !mb-3 !text-[38px] !leading-[1.08] !text-[#182126]">
              通过邮件登录链接进入工作台。
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 !max-w-[720px] !text-[16px] !leading-8 !text-[var(--ink-soft)]">
              输入邮箱后，系统会发送一封登录邮件。点击邮件中的 magic link 即可完成登录，首次使用同样会自动创建账户。
            </Typography.Paragraph>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Card className="!rounded-[24px] !border-none !bg-white/60">
                <div className="text-sm font-semibold text-[#182126]">Magic Link</div>
                <div className="mt-2 text-sm text-[var(--ink-soft)]">邮箱内会收到一封登录邮件，点击链接后即可直接进入工作台。</div>
              </Card>
              <Card className="!rounded-[24px] !border-none !bg-white/60">
                <div className="text-sm font-semibold text-[#182126]">自动续期</div>
                <div className="mt-2 text-sm text-[var(--ink-soft)]">会话会自动保持，刷新页面后仍可继续工作。</div>
              </Card>
              <Card className="!rounded-[24px] !border-none !bg-white/60">
                <div className="text-sm font-semibold text-[#182126]">开箱可用</div>
                <div className="mt-2 text-sm text-[var(--ink-soft)]">登录后直接进入对话与知识库，无需额外配置。</div>
              </Card>
            </div>
          </div>

          <div className="glass-panel rounded-[34px] p-6 md:p-8">
            <div className="mb-5">
              <div className="heading-font text-[28px] font-semibold text-[#182126]">登录工作台</div>
              <div className="mt-2 text-sm text-[var(--ink-soft)]">
                当前 Agent: <span className="font-medium text-[#182126]">{currentAgent?.name || 'Agent Workbench'}</span>
              </div>
            </div>

            {!isSupabaseConfigured ? (
              <Alert
                type="error"
                showIcon
                message="缺少 Supabase 前端配置"
                description="请在 .env 中提供 VITE_SUPABASE_URL 或 VITE_SUPABASE_AUTH_URL，以及 VITE_SUPABASE_ANON_KEY。"
              />
            ) : (
              <Space direction="vertical" size={14} className="w-full">
                <Input
                  size="large"
                  prefix={<MailOutlined />}
                  value={email}
                  onChange={event => setEmail(event.target.value.trim())}
                  placeholder="输入邮箱"
                  onPressEnter={handleSendLink}
                />
                <Button
                  type="primary"
                  size="large"
                  block
                  loading={loading}
                  disabled={!email}
                  onClick={handleSendLink}
                  icon={<LinkOutlined />}
                >
                  发送登录链接
                </Button>
                <div className="text-center text-sm text-[var(--ink-soft)]">
                  首次使用同样通过登录链接进入，系统会自动创建账户。
                </div>
              </Space>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
