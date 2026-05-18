import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useAtomValue } from 'jotai';
import { authInitializedAtom, isLoggedInAtom } from '@/store/atoms';

export default function HomeRedirectPage() {
  const authInitialized = useAtomValue(authInitializedAtom);
  const isLoggedIn = useAtomValue(isLoggedInAtom);

  if (!authInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf9f2]">
        <div className="text-center">
          <Spin
            size="large"
            indicator={<LoadingOutlined style={{ fontSize: 32, color: '#2d5a4f' }} spin />}
          />
          <div className="mt-4 text-[15px] text-[var(--ink-tertiary)]">正在初始化...</div>
        </div>
      </div>
    );
  }

  return <Navigate to={isLoggedIn ? '/workspace' : '/login'} replace />;
}
