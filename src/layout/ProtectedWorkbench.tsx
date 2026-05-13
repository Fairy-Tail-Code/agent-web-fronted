import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAtomValue } from 'jotai';
import { authInitializedAtom, isLoggedInAtom } from '@/store/atoms';
import WorkbenchLayout from './WorkbenchLayout';

export default function ProtectedWorkbench() {
  const location = useLocation();
  const authInitialized = useAtomValue(authInitializedAtom);
  const isLoggedIn = useAtomValue(isLoggedInAtom);

  if (!authInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
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
