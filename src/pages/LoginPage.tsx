import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, Input, Typography, message } from 'antd';
import {
  ArrowRightOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAtomValue } from 'jotai';
import { currentAgentAtom, isLoggedInAtom } from '@/store/atoms';
import { isSupabaseConfigured, supabaseClient } from '@/lib/supabaseClient';

// Turnstile 配置
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
const CAPTCHA_ENABLED = TURNSTILE_SITE_KEY && TURNSTILE_SITE_KEY !== '';

// Turnstile script loading — must be robust against cached scripts and race conditions
function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Script already loaded — still wait for turnstile to be available
    const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
    if (existing && window.turnstile) {
      resolve();
      return;
    }
    if (existing) {
      // Script tag exists but turnstile not ready yet — poll
      const poll = setInterval(() => {
        if (window.turnstile) {
          clearInterval(poll);
          resolve();
        }
      }, 100);
      // Safety timeout after 10s
      setTimeout(() => {
        clearInterval(poll);
        reject(new Error('Turnstile script loaded but window.turnstile not available'));
      }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
    script.async = true;
    script.defer = true;

    // Set callback BEFORE appending to avoid race on cached scripts
    window.onTurnstileLoad = () => {
      // Wait one tick for turnstile to be fully initialized
      setTimeout(() => {
        if (window.turnstile) {
          resolve();
        } else {
          reject(new Error('Turnstile script loaded but window.turnstile not available'));
        }
      }, 0);
    };
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
      if (!turnstileWidgetRef.current) {
        console.error('Turnstile render returned null widget ID');
      }
    }).catch((err) => {
      console.error('Turnstile 加载失败:', err);
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
      if (!supabaseClient) return;
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          captchaToken: CAPTCHA_ENABLED ? turnstileTokenRef.current : undefined,
        },
      });
      if (error) throw error;
      messageApi.success('登录链接已发送，请前往邮箱点击链接完成登录。');
    } catch (error) {
      if (CAPTCHA_ENABLED && error instanceof Error && error.message.includes('captcha')) {
        // CAPTCHA 验证失败，重置 widget
        if (window.turnstile && turnstileWidgetRef.current) {
          window.turnstile.reset(turnstileWidgetRef.current);
          turnstileTokenRef.current = '';
        }
      }
      messageApi.error(error instanceof Error ? error.message : '发送登录链接失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {contextHolder}

      {/* ---- Background: gradient + geometric shapes ---- */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a32] via-[#2d5a4f] to-[#1a4a3a]" />
      {/* Large decorative triangle */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-[0.08]">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <polygon points="200,0 200,200 0,200" fill="white" />
        </svg>
      </div>
      {/* Small decorative circles */}
      <div className="absolute top-[15%] left-[10%] w-3 h-3 rounded-full bg-white/10" style={{ animation: 'floatShape 5s ease-in-out infinite' }} />
      <div className="absolute top-[60%] left-[8%] w-2 h-2 rounded-full bg-white/8" style={{ animation: 'floatShape 7s ease-in-out infinite reverse' }} />
      <div className="absolute bottom-[20%] right-[12%] w-4 h-4 rounded-full bg-white/6" style={{ animation: 'floatShape 6s ease-in-out infinite' }} />
      {/* Soft glow orbs */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[var(--accent-secondary)]/10 -top-40 -right-40 blur-3xl" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-[var(--accent-primary)]/10 -bottom-32 -left-32 blur-3xl" />

      {/* ---- Login Card ---- */}
      <div className="relative z-10 w-full max-w-[420px] mx-4 slide-up">
        {/* Geometric overlap accent */}
        <div className="absolute -top-5 -right-5 w-24 h-24 rounded-[20px] bg-gradient-to-br from-[var(--accent-secondary)] to-[#5ba88e] opacity-80 shadow-xl -z-10 rotate-12" />
        <div className="absolute -bottom-3 -left-3 w-16 h-16 rounded-2xl bg-[var(--accent-warm)]/60 shadow-lg -z-10 -rotate-6" />

        <div className="bg-white rounded-[28px] shadow-2xl shadow-black/15 p-8 md:p-10 relative overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/30">
              <ThunderboltOutlined className="text-white text-lg" />
            </div>
            <span className="display-font text-[20px] font-semibold text-[#1a1f1a]">Agent Studio</span>
          </div>

          {/* Title */}
          <h1 className="display-font text-[28px] font-bold text-[#1a1f1a] mb-2 leading-tight">
            欢迎回来
          </h1>
          <p className="text-[14px] text-[var(--ink-secondary)] mb-8 leading-relaxed">
            输入邮箱，通过魔法链接安全登录工作台
          </p>

          {!isSupabaseConfigured ? (
            <Alert
              type="error"
              showIcon
              message="缺少 Supabase 前端配置"
              description="请在 .env 中提供 VITE_SUPABASE_URL 或 VITE_SUPABASE_AUTH_URL，以及 VITE_SUPABASE_ANON_KEY。"
              className="!rounded-xl mb-4"
            />
          ) : (
            <>
              {/* Email input */}
              <div className="mb-6">
                <label className="block text-[13px] font-medium text-[var(--ink-secondary)] mb-2">
                  邮箱地址
                </label>
                <div className="relative group">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center text-[var(--accent-primary)]/50 group-focus-within:text-[var(--accent-primary)] transition-colors">
                    <UserOutlined className="text-[14px]" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value.trim())}
                    onKeyDown={e => { if (e.key === 'Enter') handleSendLink(); }}
                    placeholder="your@email.com"
                    className="w-full h-12 pl-10 pr-4 text-[15px] text-[#1a1f1a] bg-transparent border-b-2 border-[var(--panel-border)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors placeholder:text-[var(--ink-tertiary)]/60"
                  />
                </div>
              </div>

              {/* Password hint (visual only, matching reference style) */}
              <div className="mb-6">
                <label className="block text-[13px] font-medium text-[var(--ink-secondary)] mb-2">
                  认证方式
                </label>
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center text-[var(--accent-primary)]/50">
                    <LockOutlined className="text-[14px]" />
                  </div>
                  <div className="w-full h-12 pl-10 flex items-center text-[14px] text-[var(--ink-tertiary)] border-b-2 border-[var(--panel-border)]">
                    邮件魔法链接验证
                  </div>
                </div>
              </div>

              {/* Turnstile CAPTCHA widget */}
              {CAPTCHA_ENABLED && (
                <div
                  ref={turnstileContainerRef}
                  className="flex justify-center mb-5"
                  style={{ minHeight: 65 }}
                />
              )}

              {/* Login button */}
              <button
                type="button"
                onClick={handleSendLink}
                disabled={loading || !email}
                className="btn-ripple w-full h-12 rounded-2xl bg-gradient-to-r from-[var(--accent-primary)] to-[#3d7a6f] text-white text-[15px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent-primary)]/25 hover:shadow-xl hover:shadow-[var(--accent-primary)]/35 hover:from-[#3d7a6f] hover:to-[var(--accent-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    <SendOutlined className="text-sm" />
                    发送登录链接
                    <ArrowRightOutlined className="text-sm" />
                  </>
                )}
              </button>

              {/* Bottom hint */}
              <div className="mt-5 text-center text-[13px] text-[var(--ink-tertiary)] leading-relaxed">
                首次使用？输入邮箱即可自动注册
              </div>
            </>
          )}

          {/* Security badge */}
          <div className="mt-6 pt-5 border-t border-[var(--panel-border)] flex items-center justify-center gap-2 text-[12px] text-[var(--ink-tertiary)]">
            <SafetyCertificateOutlined className="text-[var(--accent-secondary)]" />
            <span>端到端加密 · Cloudflare 安全防护</span>
          </div>
        </div>
      </div>

      {/* Floating animation keyframes */}
      <style>{`
        @keyframes floatShape {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
