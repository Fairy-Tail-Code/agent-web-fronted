import { type ReactNode, useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { cleanupAuthUrl } from '@/lib/authUrl';
import { supabaseClient } from '@/lib/supabaseClient';
import { authInitializedAtom, supabaseSessionAtom } from '@/store/atoms';

type AuthProviderProps = {
  children: ReactNode;
};

export default function AuthProvider({ children }: AuthProviderProps) {
  const setSession = useSetAtom(supabaseSessionAtom);
  const setAuthInitialized = useSetAtom(authInitializedAtom);

  useEffect(() => {
    if (!supabaseClient) {
      setSession(null);
      setAuthInitialized(true);
      return;
    }

    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        cleanupAuthUrl();
      }
      setAuthInitialized(true);
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        cleanupAuthUrl();
      }
      setAuthInitialized(true);
    });

    return () => subscription.unsubscribe();
  }, [setAuthInitialized, setSession]);

  return <>{children}</>;
}
