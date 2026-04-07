'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Star, FileText,
  Tag, Handshake, Settings, LogOut, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';

const NAV = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/products', icon: Package, label: 'Products' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/admin/customers', icon: Users, label: 'Customers' },
  { href: '/admin/reviews', icon: Star, label: 'Reviews' },
  { href: '/admin/blog', icon: FileText, label: 'Blog' },
  { href: '/admin/discounts', icon: Tag, label: 'Discounts' },
  { href: '/admin/partners', icon: Handshake, label: 'Partners' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, init, logout, isAdmin } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (init && (!user || !isAdmin())) router.replace('/auth/login?redirect=/admin');
  }, [user, init, isAdmin, router]);

  if (!user || !isAdmin()) return null;

  const isActive = (href, exact) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex h-screen bg-dark-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-dark-950 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'} flex-shrink-0`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-dark-800">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {!collapsed && <span className="font-bold text-sm">VoltStore Admin</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
          {NAV.map(({ href, icon: Icon, label, exact }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive(href, exact)
                  ? 'bg-brand-600 text-white'
                  : 'text-dark-300 hover:bg-dark-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-dark-800 p-2 space-y-0.5">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl text-sm transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
          </button>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-dark-400 hover:text-red-400 hover:bg-dark-800 rounded-xl text-sm transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
