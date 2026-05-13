import type { ThemeConfig } from 'antd';

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#1f7a8c',
    colorInfo: '#1f7a8c',
    colorSuccess: '#4f8a5b',
    colorWarning: '#c56a2d',
    colorError: '#c44536',
    borderRadius: 18,
    fontFamily: '"Avenir Next", "IBM Plex Sans SC", "Segoe UI", sans-serif',
  },
  components: {
    Layout: {
      bodyBg: 'transparent',
      siderBg: 'transparent',
      headerBg: 'transparent',
    },
    Card: {
      colorBgContainer: 'rgba(255,255,255,0.72)',
    },
    Input: {
      activeBorderColor: '#1f7a8c',
      hoverBorderColor: '#1f7a8c',
    },
    Drawer: {
      colorBgElevated: '#f4ede1',
    },
    Modal: {
      contentBg: '#f4ede1',
      headerBg: '#f4ede1',
    },
  },
};
