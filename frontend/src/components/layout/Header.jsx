'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, User, Menu, X, Zap, ChevronDown } from 'lucide-react';
import useCartStore from '@/store/cartStore';
import useAuthStore from '@/store/authStore';
import useUIStore from '@/store/uiStore';
import clsx from 'clsx';

const NAV_LINKS = [
  {
    label: 'Shop',
    href: '/shop',
    children: [
      { label: 'All Products', href: '/shop' },
      { label: 'EV Chargers', href: '/shop?category=ev-chargers' },
      { label: 'NEMA Splitters', href: '/shop?category=nema-splitters' },
      { label: 'Accessories', href: '/shop?category=accessories' },
    ],
  },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Support', href: '/support' },
  { label: 'Partners', href: '/partner' },
];

export default function Header() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const itemCount = useCartStore((s) => s.itemCount);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { openCart, searchOpen, openSearch, closeSearch, mobileMenuOpen, openMobileMenu, closeMobileMenu } = useUIStore();
  const searchRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      closeSearch();
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-brand-600 text-white text-center text-xs py-2 px-4 font-medium tracking-wide">
        Free shipping on orders over $150 · Use code <span className="font-bold">WELCOME10</span> for 10% off your first order
      </div>

      <header
        className={clsx(
          'sticky top-0 z-40 bg-white transition-shadow duration-200',
          scrolled ? 'shadow-md' : 'border-b border-dark-100'
        )}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-dark-900">
              <div className="flex items-center justify-center w-8 h-8 bg-brand-600 rounded-lg">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span>Volt<span className="text-brand-600">Store</span></span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) =>
                link.children ? (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => setActiveDropdown(link.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-dark-600 hover:text-dark-900 rounded-lg hover:bg-dark-50 transition-colors">
                      {link.label}
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {activeDropdown === link.label && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-card-hover border border-dark-100 py-1.5 animate-fade-in">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-4 py-2 text-sm text-dark-600 hover:text-dark-900 hover:bg-dark-50 transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="px-3 py-2 text-sm font-medium text-dark-600 hover:text-dark-900 rounded-lg hover:bg-dark-50 transition-colors"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-2 animate-fade-in">
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products…"
                    className="w-48 md:w-64 px-3 py-1.5 text-sm border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button type="button" onClick={closeSearch} className="p-2 text-dark-400 hover:text-dark-600">
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button onClick={openSearch} className="p-2 text-dark-500 hover:text-dark-900 rounded-lg hover:bg-dark-50 transition-colors">
                  <Search className="w-5 h-5" />
                </button>
              )}

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative p-2 text-dark-500 hover:text-dark-900 rounded-lg hover:bg-dark-50 transition-colors"
                aria-label="Open cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 bg-brand-600 text-white text-xs font-bold rounded-full">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </button>

              {/* Account */}
              {user ? (
                <div className="relative hidden md:block group">
                  <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-dark-600 hover:text-dark-900 rounded-lg hover:bg-dark-50 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                      {user.firstName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden lg:inline">{user.firstName}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-card-hover border border-dark-100 py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link href="/account" className="block px-4 py-2 text-sm text-dark-600 hover:bg-dark-50">My Account</Link>
                    <Link href="/account/orders" className="block px-4 py-2 text-sm text-dark-600 hover:bg-dark-50">My Orders</Link>
                    <Link href="/wishlist" className="block px-4 py-2 text-sm text-dark-600 hover:bg-dark-50">Wishlist</Link>
                    {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                      <Link href="/admin" className="block px-4 py-2 text-sm text-brand-600 font-medium hover:bg-brand-50">Admin Panel</Link>
                    )}
                    {user.role === 'PARTNER' && (
                      <Link href="/partner/dashboard" className="block px-4 py-2 text-sm text-electric-600 font-medium hover:bg-electric-50">Partner Dashboard</Link>
                    )}
                    <div className="border-t border-dark-100 mt-1 pt-1">
                      <button
                        onClick={logout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="hidden md:flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-dark-900 text-white rounded-lg hover:bg-dark-700 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={mobileMenuOpen ? closeMobileMenu : openMobileMenu}
                className="md:hidden p-2 text-dark-500 hover:text-dark-900 rounded-lg hover:bg-dark-50 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-dark-100 bg-white animate-slide-up">
            <nav className="container-custom py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <div key={link.label}>
                  <Link
                    href={link.href}
                    onClick={closeMobileMenu}
                    className="block px-3 py-2.5 text-sm font-medium text-dark-700 hover:bg-dark-50 rounded-lg transition-colors"
                  >
                    {link.label}
                  </Link>
                  {link.children && (
                    <div className="pl-4">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={closeMobileMenu}
                          className="block px-3 py-2 text-sm text-dark-500 hover:text-dark-900 hover:bg-dark-50 rounded-lg transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-2 border-t border-dark-100 mt-2">
                {user ? (
                  <>
                    <Link href="/account" onClick={closeMobileMenu} className="block px-3 py-2.5 text-sm font-medium text-dark-700 hover:bg-dark-50 rounded-lg">My Account</Link>
                    <button onClick={() => { logout(); closeMobileMenu(); }} className="block w-full text-left px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg">Sign Out</button>
                  </>
                ) : (
                  <Link href="/auth/login" onClick={closeMobileMenu} className="btn-primary w-full justify-center">Sign In</Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
