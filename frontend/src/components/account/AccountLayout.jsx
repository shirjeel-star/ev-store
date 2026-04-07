'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { useEffect } from 'react';
import { User, Package, MapPin, LogOut, Zap } from 'lucide-react';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/account', label: 'Profile', icon: User, exact: true },
  { href: '/account/orders', label: 'Orders', icon: Package },
];

export default function AccountLayout({ children }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const initialized = useAuthStore((s) => s.initialized);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (initialized && !user) {
      router.push('/auth/login?redirect=' + encodeURIComponent(pathname));
    }
  }, [initialized, user]);

  if (!user) return null;

  return (
    <div className="bg-dark-50 min-h-screen py-10">
      <div className="container-custom">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-dark-100">
                <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-lg">
                  {user.firstName?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-dark-900 text-sm truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-dark-400 text-xs truncate">{user.email}</p>
                </div>
              </div>
              <nav className="space-y-0.5">
                {NAV.map(({ href, label, icon: Icon, exact }) => (
                  <Link
                    key={href}
                    href={href}
                    className={clsx(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      (exact ? pathname === href : pathname.startsWith(href))
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-dark-600 hover:bg-dark-50 hover:text-dark-900'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                ))}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors mt-2 border-t border-dark-100 pt-3"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="lg:col-span-3">
            <div className="card p-6 md:p-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
