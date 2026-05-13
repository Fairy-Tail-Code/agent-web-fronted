import { useState } from 'react';
import { MenuOutlined } from '@ant-design/icons';
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
      <div className="min-h-screen px-4 py-4">
        <div className="mb-4 flex justify-end">
          <Button icon={<MenuOutlined />} onClick={() => setMobileSidebarOpen(true)}>
            面板
          </Button>
        </div>
        <div className="min-h-[calc(100vh-88px)]">
          {main}
        </div>
        <Drawer
          placement="left"
          width={360}
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          bodyStyle={{ padding: 12 }}
        >
          {sidebar}
        </Drawer>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden px-5 py-5">
      <div
        className={`grid h-full gap-5 ${
          aside ? 'grid-cols-[280px_minmax(0,1fr)_320px]' : 'grid-cols-[280px_minmax(0,1fr)]'
        }`}
      >
        <div className="min-h-0">{sidebar}</div>
        <div className="min-h-0">{main}</div>
        {aside ? <div className="min-h-0">{aside}</div> : null}
      </div>
    </div>
  );
}
