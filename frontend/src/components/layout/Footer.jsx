'use client';

import Link from 'next/link';
import { Zap, Twitter, Youtube, Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import { useState } from 'react';
import { newsletterApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    try {
      await newsletterApi.subscribe(email);
      toast.success('Subscribed! Check your inbox for a welcome email.');
      setEmail('');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="bg-dark-900 text-dark-300">
      {/* Newsletter */}
      <div className="border-b border-dark-800">
        <div className="container-custom py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-white font-bold text-xl">Stay charged up</h3>
            <p className="text-dark-400 text-sm mt-1">Deals, product news, and EV tips — straight to your inbox.</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-3 max-w-md">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-2.5 bg-dark-800 text-white placeholder-dark-500 rounded-lg border border-dark-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
            />
            <button
              type="submit"
              disabled={subscribing}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              {subscribing ? '…' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>

      {/* Links */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-brand-600 rounded-lg">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              Volt<span className="text-brand-500">Store</span>
            </Link>
            <p className="text-sm text-dark-400 leading-relaxed max-w-xs">
              Premium EV charging equipment for every electric vehicle. Charge smarter, drive further.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[
                { icon: Twitter, href: '#' },
                { icon: Youtube, href: '#' },
                { icon: Instagram, href: '#' },
                { icon: Facebook, href: '#' },
              ].map(({ icon: Icon, href }) => (
                <a key={href} href={href} className="w-9 h-9 flex items-center justify-center rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-400 hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Shop</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'All Products', href: '/shop' },
                { label: 'EV Chargers', href: '/shop?category=ev-chargers' },
                { label: 'NEMA Splitters', href: '/shop?category=nema-splitters' },
                { label: 'Accessories', href: '/shop?category=accessories' },
                { label: 'New Arrivals', href: '/shop?sort=newest' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-dark-400 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Help</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'FAQ', href: '/faq' },
                { label: 'Support Center', href: '/support' },
                { label: 'Shipping Policy', href: '/support/shipping-policy' },
                { label: 'Returns', href: '/support/return-policy' },
                { label: 'Installation Guide', href: '/support/installation' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-dark-400 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Blog', href: '/blog' },
                { label: 'Partner Program', href: '/partner' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-dark-400 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 space-y-2 text-sm text-dark-400">
              <a href="mailto:hello@voltstore.com" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-3.5 h-3.5" /> hello@voltstore.com
              </a>
              <a href="tel:+18005555555" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-3.5 h-3.5" /> 1-800-555-5555
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-dark-800">
        <div className="container-custom py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-dark-500">
          <span>© {new Date().getFullYear()} VoltStore, Inc. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Secure checkout powered by</span>
            <span className="font-bold text-dark-300">Stripe</span>
            <span>·</span>
            <span>SSL encrypted</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
