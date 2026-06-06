import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, Input, Space, Typography, message } from 'antd';
import { LinkOutlined, MailOutlined, SafetyCertificateOutlined, LockOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useAtomValue } from 'jotai';
import { currentAgentAtom, isLoggedInAtom } from '@/store/atoms';
import { isSupabaseConfigured, supabaseClient } from '@/lib/supabaseClient';

// Turnstile 配置
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
const CAPTCHA_ENABLED = TURNSTILE_SITE_KEY && TURNSTILE_SITE_KEY !== '';
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || '/backend';

// Turnstile script 加载
function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
    script.async = true;
    script.defer = true;
    window.onTurnstileLoad = () => resolve();
    script.onerror = () => reject(new Error('Turnstile script load failed'));
    document.head.appendChild(script);
  });
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLoggedIn = useAtomValue(isLoggedInAtom);
  const currentAgent = useAtomValue(currentAgentAtom);
  const [messageApi, contextHolder] = message.useMessage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Turnstile state
  const turnstileWidgetRef = useRef<string | null>(null);
  const turnstileTokenRef = useRef<string>('');
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  const redirectTarget = useMemo(() => searchParams.get('redirect') || '/workspace', [searchParams]);

  useEffect(() => {
    if (isLoggedIn) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isLoggedIn, navigate, redirectTarget]);

  // 初始化 Turnstile widget
  useEffect(() => {
    if (!CAPTCHA_ENABLED || !turnstileContainerRef.current) return;

    let cancelled = false;
    loadTurnstileScript().then(() => {
      if (cancelled || !window.turnstile || !turnstileContainerRef.current) return;

      // 清理旧 widget
      if (turnstileWidgetRef.current) {
        try { window.turnstile.remove(turnstileWidgetRef.current); } catch { /* ignore */ }
      }

      turnstileWidgetRef.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => {
          turnstileTokenRef.current = token;
        },
        'error-callback': () => {
          turnstileTokenRef.current = '';
        },
        'expired-callback': () => {
          turnstileTokenRef.current = '';
        },
        theme: 'light',
        size: 'normal',
      });
    }).catch((err) => {
      console.warn('Turnstile 加载失败，跳过 CAPTCHA:', err);
    });

    return () => {
      cancelled = true;
      if (turnstileWidgetRef.current && window.turnstile) {
        try { window.turnstile.remove(turnstileWidgetRef.current); } catch { /* ignore */ }
        turnstileWidgetRef.current = null;
      }
    };
  }, []);

  const handleSendLink = async () => {
    if (!email) return;

    setLoading(true);
    try {
      // 如果启用了 CAPTCHA，走后端 /auth/send-magic-link
      if (CAPTCHA_ENABLED) {
        const turnstileToken = turnstileTokenRef.current;

        const resp = await fetch(`${BACKEND_BASE_URL}/auth/send-magic-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            turnstile_token: turnstileToken,
          }),
        });

        const data = await resp.json();

        if (!resp.ok) {
          // 如果 CAPTCHA 验证失败，重置 widget
          if (resp.status === 403 && window.turnstile && turnstileWidgetRef.current) {
            window.turnstile.reset(turnstileWidgetRef.current);
            turnstileTokenRef.current = '';
          }
          throw new Error(data.detail || '发送登录链接失败');
        }

        messageApi.success(data.message || '登录链接已发送，请前往邮箱点击链接完成登录。');
      } else {
        // 未启用 CAPTCHA，直接调用 Supabase（兼容旧行为）
        if (!supabaseClient) return;
        const { error } = await supabaseClient.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: true },
        });
        if (error) throw error;
        messageApi.success('登录链接已发送，请前往邮箱点击 magic link 完成登录。');
      }
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '发送登录链接失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-10 flex items-center justify-center">
      {contextHolder}
      <div className="mx-auto max-w-[1200px] w-full">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_440px] items-center">
          <div className="glass-panel rounded-[38px] p-10 md:p-14 slide-up">
            <div className="mb-8">
              <div className="inline-flex items-center gap-3 rounded-full bg-[#2d5a4f] px-5 py-2.5 text-sm text-white shadow-lg shadow-[#2d5a4f]/25">
                <SafetyCertificateOutlined className="text-base" />
                <span className="font-medium">安全登录</span>
              </div>
            </div>
            <Typography.Title level={1} className="display-font !mb-5 !text-[42px] !leading-[1.1] !text-[#1a1f1a]">
              通过魔法链接<br />进入您的工作空间
            </Typography.Title>
            <Typography.Paragraph className="!mb-8 !max-w-[600px] !text-[17px] !leading-[1.8] !text-[var(--ink-secondary)]">
              输入邮箱后，系统将发送一封安全的登录邮件。点击邮件中的魔法链接即可完成身份验证——无需密码，即刻访问。
            </Typography.Paragraph>
            <div className="grid gap-5 md:grid-cols-3">
              <Card className="!rounded-[26px] !border-none !bg-white/80 !shadow-sm hover:!shadow-md transition-shadow duration-300">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#2d5a4f]/10 text-[#2d5a4f]">
                  <LockOutlined className="text-lg" />
                </div>
                <div className="text-sm font-semibold text-[#1a1f1a] mb-2">零密码登录</div>
                <div className="text-sm text-[var(--ink-tertiary)] leading-relaxed">通过邮箱魔法链接验证身份，告别传统密码管理的烦恼。</div>
              </Card>
              <Card className="!rounded-[26px] !border-none !bg-white/80 !shadow-sm hover:!shadow-md transition-shadow duration-300">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#c4783a]/10 text-[#c4783a]">
                  <ThunderboltOutlined className="text-lg" />
                </div>
                <div className="text-sm font-semibold text-[#1a1f1a] mb-2">自动续期</div>
                <div className="text-sm text-[var(--ink-tertiary)] leading-relaxed">会话安全保持，页面刷新后无需重复登录，无缝继续工作。</div>
              </Card>
              <Card className="!rounded-[26px] !border-none !bg-white/80 !shadow-sm hover:!shadow-md transition-shadow duration-300">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#4a7c59]/10 text-[#4a7c59]">
                  <MailOutlined className="text-lg" />
                </div>
                <div className="text-sm font-semibold text-[#1a1f1a] mb-2">人机验证</div>
                <div className="text-sm text-[var(--ink-tertiary)] leading-relaxed">集成 Cloudflare Turnstile 安全验证，防止机器人批量攻击。</div>
              </Card>
            </div>
          </div>

          <div className="glass-panel-strong rounded-[38px] p-8 md:p-10 slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="mb-8">
              <div className="display-font text-[32px] font-semibold text-[#1a1f1a] mb-3">登录工作台</div>
              <div className="text-[15px] text-[var(--ink-secondary)]">
                当前 Agent: <span className="font-medium text-[#1a1f1a]">{currentAgent?.name || 'Agent Workbench'}</span>
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
              <Space direction="vertical" size={16} className="w-full">
                <div>
                  <label className="block text-sm font-medium text-[#1a1f1a] mb-2.5">邮箱地址</label>
                  <Input
                    size="large"
                    prefix={<MailOutlined className="text-[var(--ink-tertiary)]" />}
                    value={email}
                    onChange={event => setEmail(event.target.value.trim())}
                    placeholder="your@email.com"
                    onPressEnter={handleSendLink}
                    className="h-12 text-[15px]"
                  />
                </div>

                {/* Turnstile CAPTCHA widget */}
                {CAPTCHA_ENABLED && (
                  <div
                    ref={turnstileContainerRef}
                    className="flex justify-center"
                    style={{ minHeight: 65 }}
                  />
                )}

                <Button
                  type="primary"
                  size="large"
                  block
                  loading={loading}
                  disabled={!email}
                  onClick={handleSendLink}
                  icon={<LinkOutlined />}
                  className="h-12 text-[15px] font-medium shadow-lg shadow-[#2d5a4f]/20 hover:shadow-xl hover:shadow-[#2d5a4f]/30 transition-all duration-300"
                >
                  发送登录链接
                </Button>
                <div className="text-center text-sm text-[var(--ink-tertiary)] leading-relaxed">
                  首次使用同样通过登录链接进入，系统会自动创建您的账户。
                </div>
              </Space>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
