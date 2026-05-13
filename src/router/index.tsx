import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from '@/App';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import HomeRedirectPage from '@/pages/HomeRedirectPage';
import KnowledgePage from '@/pages/KnowledgePage';
import LoginPage from '@/pages/LoginPage';
import WorkspacePage from '@/pages/WorkspacePage';
import ProtectedWorkbench from '@/layout/ProtectedWorkbench';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <HomeRedirectPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'auth/callback',
        element: <AuthCallbackPage />,
      },
      {
        element: <ProtectedWorkbench />,
        children: [
          {
            path: 'workspace',
            element: <WorkspacePage />,
          },
          {
            path: 'knowledge',
            element: <KnowledgePage />,
          },
        ],
      },
    ],
  },
]);

export default router;
