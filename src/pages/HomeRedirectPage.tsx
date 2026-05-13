import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAtomValue } from 'jotai';
import { authInitializedAtom, isLoggedInAtom } from '@/store/atoms';

export default function HomeRedirectPage() {
  const authInitialized = useAtomValue(authInitializedAtom);
  const isLoggedIn = useAtomValue(isLoggedInAtom);

  if (!authInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return <Navigate to={isLoggedIn ? '/workspace' : '/login'} replace />;
}
