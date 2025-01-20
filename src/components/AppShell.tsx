// src/components/AppShell.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import UserMenu from '@/components/UserMenu';
import { Menu } from 'lucide-react';
import { useMedia } from 'react-use';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 使用 useMedia 检测是否为桌面设备（md 尺寸及以上）
  const isDesktop = useMedia('(min-width: 768px)', true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 当屏幕尺寸变化时，重置侧边栏状态
  useEffect(() => {
    if (isDesktop) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
  }, [isDesktop]);

  return (
    <div className="flex">
      {/* 侧边栏 */}
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        isDesktop={isDesktop}
      />

      {/* 主内容区域 */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isDesktop && isSidebarOpen ? "justify-between" : ''
        }`}
      >
        {/* 顶部导航栏 */}
        <header className="p-1 flex items-center">
          {/* 当侧边栏关闭时，显示打开按钮 */}
          {(!isSidebarOpen || !isDesktop) && (
            <button onClick={toggleSidebar} className="focus:outline-none">
              <Menu className="w-6 h-6" />
            </button>
          )}
          <div className="ml-auto">
          <UserMenu />
          </div>
        </header>

        {/* 主内容 */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>

      {/* 遮罩层（仅在移动设备上显示） */}
      {!isDesktop && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
}
