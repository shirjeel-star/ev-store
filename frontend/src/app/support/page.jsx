'use client';

import { useQuery } from '@tanstack/react-query';
import { supportApi } from '@/lib/api';
import Link from 'next/link';
import { Book, ChevronRight, Mail, MessageCircle, Phone, FileText, Zap, Shield, Truck } from 'lucide-react';

const SUPPORT_CATEGORIES = [
  { icon: Zap, title: 'Installation & Setup', desc: 'Guides for installing your charger or splitter', filter: 'installation' },
  { icon: Shield, title: 'Warranty & Returns', desc: 'Our policies and how to file a claim', filter: 'warranty' },
  { icon: Truck, title: 'Shipping & Delivery', desc: 'Shipping times, tracking, and carriers', filter: 'shipping' },
  { icon: MessageCircle, title: 'Troubleshooting', desc: 'Common issues and how to fix them', filter: 'troubleshooting' },
];

export default function SupportPage() {
  const { data } = useQuery({
    queryKey: ['support-docs'],
    queryFn: () => supportApi.list({ limit: 20 }),
  });
  const docs = data?.data?.docs || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-dark-950 text-white py-16 px-4">
        <div className="container-custom text-center">
          <h1 className="text-4xl font-bold mb-3">Support Center</h1>
          <p className="text-dark-300 text-lg">How can we help you today?</p>
        </div>
      </div>

      <div className="container-custom py-14">
        {/* Category cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {SUPPORT_CATEGORIES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6 hover:shadow-card-hover transition-shadow cursor-pointer group">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
                <Icon className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="font-bold text-dark-900 text-sm mb-1">{title}</h3>
              <p className="text-dark-500 text-xs">{desc}</p>
            </div>
          ))}
        </div>

        {/* Documentation */}
        {docs.length > 0 && (
          <div className="mb-14">
            <h2 className="text-2xl font-bold text-dark-900 mb-6">Documentation & Guides</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {docs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/support/${doc.slug}`}
                  className="flex items-start gap-4 p-5 border border-dark-100 rounded-2xl hover:border-brand-300 hover:bg-brand-50 transition-all group"
                >
                  <FileText className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-dark-900 text-sm group-hover:text-brand-700 transition-colors">{doc.title}</p>
                    {doc.excerpt && <p className="text-dark-500 text-xs mt-0.5 line-clamp-1">{doc.excerpt}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-dark-300 group-hover:text-brand-600 flex-shrink-0 mt-0.5 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Contact options */}
        <div className="bg-dark-50 rounded-3xl p-10">
          <h2 className="text-2xl font-bold text-dark-900 text-center mb-8">Contact Support</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Mail, title: 'Email Us', desc: 'Get a response within 24h', cta: 'Send Email', href: 'mailto:support@voltstore.com' },
              { icon: MessageCircle, title: 'Live Chat', desc: 'Available Mon–Fri 9am–5pm PST', cta: 'Start Chat', href: '#' },
              { icon: Phone, title: 'Call Us', desc: 'Toll-free: 1-800-555-5555', cta: 'View Hours', href: 'tel:+18005555555' },
            ].map(({ icon: Icon, title, desc, cta, href }) => (
              <div key={title} className="text-center">
                <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-7 h-7 text-brand-600" />
                </div>
                <h3 className="font-bold text-dark-900 mb-1">{title}</h3>
                <p className="text-dark-500 text-sm mb-3">{desc}</p>
                <a href={href} className="btn-outline-brand text-sm py-2 px-5">{cta}</a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
