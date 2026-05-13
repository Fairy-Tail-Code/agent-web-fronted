import React from 'react';
import ReactDOM from 'react-dom/client';
import { App as AntApp, ConfigProvider } from 'antd';
import { RouterProvider } from 'react-router-dom';
import { Provider as JotaiProvider } from 'jotai';
import router from '@/router';
import { themeConfig } from '@/constants/theme';
import AuthProvider from '@/providers/AuthProvider';
import '@/global.css';
import 'antd/dist/reset.css';
import '@/styles/copilotkit-v2.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <JotaiProvider>
      <AuthProvider>
        <ConfigProvider theme={themeConfig}>
          <AntApp>
            <RouterProvider router={router} />
          </AntApp>
        </ConfigProvider>
      </AuthProvider>
    </JotaiProvider>
  </React.StrictMode>
);
