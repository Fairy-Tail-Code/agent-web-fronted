import { Outlet } from 'react-router-dom';
import { CopilotKit } from '@copilotkit/react-core/v2';
import { useAtomValue } from 'jotai';
import { accessTokenAtom, currentAgentAtom, currentSessionIdAtom, isLoggedInAtom } from '@/store/atoms';
import { toAuthorizationHeader } from '@/lib/authHeader';

const publicLicenseKey = import.meta.env.VITE_COPILOTKIT_PUBLIC_KEY || undefined;

export default function App() {
  const authToken = useAtomValue(accessTokenAtom);
  const isLoggedIn = useAtomValue(isLoggedInAtom);
  const currentAgent = useAtomValue(currentAgentAtom);
  const currentSessionId = useAtomValue(currentSessionIdAtom);
  const authorizationHeader = toAuthorizationHeader(authToken);

  console.log('[App] authToken:', authToken ? `${authToken.substring(0, 20)}...` : 'empty');
  console.log('[App] authorizationHeader:', authorizationHeader ? `${authorizationHeader.substring(0, 30)}...` : 'empty');

  return (
    <CopilotKit
      runtimeUrl={import.meta.env.VITE_ADAPTER_BASE_URL || '/agui'}
      useSingleEndpoint={false}
      agent="agno_agent"
      threadId={isLoggedIn ? currentSessionId || undefined : undefined}
      headers={{
        ...(authorizationHeader ? { Authorization: authorizationHeader } : {}),
        'x-agent-id': currentAgent?.id || 'data_agent',
        'x-agent-kind': currentAgent?.kind || 'agent',
      }}
      properties={{
        agent_id: currentAgent?.id,
        agent_kind: currentAgent?.kind,
      }}
      publicLicenseKey={publicLicenseKey}
      showDevConsole={false}
    >
      <Outlet />
    </CopilotKit>
  );
}
