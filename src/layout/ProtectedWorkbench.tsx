import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useAtomValue } from 'jotai';
import { authInitializedAtom, isLoggedInAtom } from '@/store/atoms';
import WorkbenchLayout from './WorkbenchLayout';

export default function ProtectedWorkbench() {
  const location = useLocation();
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

  if (!isLoggedIn) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return (
    <WorkbenchLayout>
      <Outlet />
    </WorkbenchLayout>
  );
}
