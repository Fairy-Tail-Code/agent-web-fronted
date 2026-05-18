import { useState } from 'react';
import { MenuFoldOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Drawer } from 'antd';
import { useResponsive } from 'ahooks';
import type { ReactNode } from 'react';

type AppShellProps = {
  sidebar: ReactNode;
  main: ReactNode;
  aside?: ReactNode;
};

export default function AppShell({ sidebar, main, aside }: AppShellProps) {
  const responsive = useResponsive();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!responsive.lg) {
    return (
      <div className="min-h-screen px-4 py-4 md:px-5 md:py-5">
        <div className="mb-4 flex justify-end">
          <Button
            icon={<MenuFoldOutlined />}
            onClick={() => setMobileSidebarOpen(true)}
            className="!rounded-xl !h-10 !px-4 font-medium shadow-sm"
          >
            菜单
          </Button>
        </div>
        <div className="min-h-[calc(100vh-80px)]">{main}</div>
        <Drawer
          placement="left"
          width={380}
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          closeIcon={<CloseOutlined className="text-[var(--ink-secondary)]" />}
          styles={{
            body: { padding: '16px', background: 'transparent' },
            header: { borderBottom: '1px solid var(--panel-border)', padding: '16px 20px' },
          }}
          className="!bg-transparent"
        >
          {sidebar}
        </Drawer>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden px-6 py-6">
      <div
        className={`grid h-full gap-6 ${
          aside ? 'grid-cols-[300px_minmax(0,1fr)_340px]' : 'grid-cols-[300px_minmax(0,1fr)]'
        }`}
      >
        <div className="min-h-0">{sidebar}</div>
        <div className="min-h-0">{main}</div>
        {aside ? <div className="min-h-0">{aside}</div> : null}
      </div>
    </div>
  );
}
