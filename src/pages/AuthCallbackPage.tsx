import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Spin } from 'antd';
import { isSupabaseConfigured, supabaseClient } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabaseClient) {
      return;
    }

    const redirectTarget = searchParams.get('redirect') || '/workspace';
    supabaseClient.auth.getSession().finally(() => {
      navigate(redirectTarget, { replace: true });
    });
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-4">
      {isSupabaseConfigured ? (
        <>
          <Spin size="large" />
          <div className="text-[var(--ink-soft)]">正在完成登录...</div>
        </>
      ) : (
        <Alert
          type="error"
          showIcon
          message="认证服务未就绪"
        />
      )}
    </div>
  );
}
