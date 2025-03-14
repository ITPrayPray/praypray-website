// src/components/Sidebar.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Heart,
  BarChart2,
  Menu,
  FileText,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isDesktop: boolean;
}

export default function Sidebar({
  isOpen,
  toggleSidebar,
  isDesktop,
}: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      name: '首頁',
      href: '/',
      icon: <Home className="w-5 h-5" />,
    },
    {
      name: '探索',
      href: '/explorer',
      icon: <Search className="w-5 h-5" />,
    },
    {
      name: '收藏',
      href: '/favourite',
      icon: <Heart className="w-5 h-5" />,
    },
    {
      name: '分析',
      href: '/analytics',
      icon: <BarChart2 className="w-5 h-5" />,
    },
    {
      name: '詳細信息', // 新增選單項目
      href: '/detail',
      icon: <FileText className="w-5 h-5" />,
    },
  ];

  // 定義判斷當前選單項目是否 active 的邏輯
  const isActive = (itemHref: string) => {
    if (itemHref === '/detail') {
      return pathname.startsWith('/detail');
    }
    return pathname === itemHref;
  };

  if (!isOpen) {
    // 當側邊欄關閉時，不渲染側邊欄
    return null;
  }

  return (
    <div
      className={`bg-white border-r flex flex-col transition-all duration-300 ease-in-out ${
        isDesktop
          ? 'w-64'
          : 'fixed inset-y-0 left-0 z-50 w-64 transform'
      } ${
        !isDesktop && (isOpen ? 'translate-x-0' : '-translate-x-full')
      }`}
    >
      {/* 頂部部分 */}
      <div className="p-4 flex items-center justify-between border-b">
        <h2 className="text-xl font-bold text-primary">拜拜 Pray Pray</h2>
        {/* 顯示關閉按鈕 */}
        <button onClick={toggleSidebar} className="focus:outline-none">
          <Menu className="w-6 h-6 text-primary" />
        </button>
      </div>
      {/* 選單項目 */}
      <nav className="flex-1 overflow-y-auto">
        <ul>
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
                  isActive(item.href) ? 'bg-gray-100 font-semibold' : ''
                }`}
                onClick={!isDesktop ? toggleSidebar : undefined}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}