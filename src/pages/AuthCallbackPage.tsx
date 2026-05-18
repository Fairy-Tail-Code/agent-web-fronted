import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 bg-[#fdf9f2]">
      {isSupabaseConfigured ? (
        <>
          <Spin
            size="large"
            indicator={<LoadingOutlined style={{ fontSize: 36, color: '#2d5a4f' }} spin />}
          />
          <div className="text-[15px] text-[var(--ink-secondary)] font-medium">正在完成登录...</div>
        </>
      ) : (
        <Alert
          type="error"
          showIcon
          message="认证服务未就绪"
          description="请检查 Supabase 配置是否正确"
          className="!rounded-xl"
        />
      )}
    </div>
  );
}
