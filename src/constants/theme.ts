import type { ThemeConfig } from 'antd';

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#2d5a4f',
    colorInfo: '#2d5a4f',
    colorSuccess: '#4a7c59',
    colorWarning: '#c4783a',
    colorError: '#c7554d',
    borderRadius: 20,
    fontFamily: '"Inter", "IBM Plex Sans SC", "Segoe UI", sans-serif',
    fontSize: 14,
    colorBgContainer: 'rgba(255, 252, 245, 0.85)',
  },
  components: {
    Layout: {
      bodyBg: 'transparent',
      siderBg: 'transparent',
      headerBg: 'transparent',
    },
    Card: {
      colorBgContainer: 'rgba(255, 252, 245, 0.82)',
      borderRadiusLG: 22,
    },
    Input: {
      activeBorderColor: '#2d5a4f',
      hoverBorderColor: '#3d7a6f',
      borderRadius: 18,
      paddingInline: 16,
    },
    InputNumber: {
      activeBorderColor: '#2d5a4f',
      hoverBorderColor: '#3d7a6f',
      borderRadius: 18,
    },
    TextArea: {
      activeBorderColor: '#2d5a4f',
      hoverBorderColor: '#3d7a6f',
      borderRadius: 18,
    },
    Button: {
      borderRadius: 16,
      fontWeight: 500,
      paddingInline: 22,
    },
    Select: {
      borderRadius: 18,
      optionSelectedBg: 'rgba(45, 90, 79, 0.12)',
    },
    Drawer: {
      colorBgElevated: '#f8f5eb',
    },
    Modal: {
      contentBg: '#f8f5eb',
      headerBg: '#f8f5eb',
      borderRadiusLG: 28,
    },
    Segmented: {
      borderRadiusLG: 18,
      itemSelectedBg: '#2d5a4f',
      itemSelectedColor: '#ffffff',
    },
    Tag: {
      borderRadiusSM: 8,
      paddingInline: 10,
      paddingBlock: 4,
    },
    Alert: {
      borderRadius: 18,
      paddingInline: 18,
      paddingBlock: 14,
    },
    List: {
      descriptionFontSize: 13,
    },
    Upload: {
      borderRadiusLG: 22,
    },
  },
};
