import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useState } from 'react';

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden transition-colors duration-300">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-[68px]' : 'ml-[248px]'}`}>
        <TopBar collapsed={collapsed} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto mt-[60px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
