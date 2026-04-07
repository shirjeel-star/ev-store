'use client';

import Link from 'next/link';
import { DollarSign, Users, BarChart2, Star, CheckCircle, ArrowRight } from 'lucide-react';

const TIERS = [
  { name: 'Affiliate', commission: '5%', min: '$0', desc: 'Perfect for content creators and bloggers.' },
  { name: 'Partner', commission: '8%', min: '$1,000/mo', desc: 'For established businesses and installers.' },
  { name: 'Elite', commission: '12%', min: '$10,000/mo', desc: 'Top-tier resellers and enterprise partners.' },
];

const BENEFITS = [
  'Real-time earnings dashboard',
  'Dedicated account manager',
  'Co-branded marketing materials',
  'Priority support channel',
  'Monthly commission payouts',
  'Volume bonuses available',
];

export default function PartnerLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-dark-950 text-white py-20 px-4">
        <div className="container-custom text-center">
          <div className="inline-flex items-center gap-2 bg-brand-900/40 border border-brand-700 text-brand-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Star className="w-3.5 h-3.5" /> Partner Program
          </div>
          <h1 className="text-5xl font-black mb-5 leading-tight">
            Earn up to <span className="text-brand-400">12%</span> commission<br />selling EV solutions
          </h1>
          <p className="text-dark-300 text-lg max-w-xl mx-auto mb-8">
            Join hundreds of partners growing their business with VoltStore&apos;s high-quality EV charging products.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/partner/apply" className="btn-primary text-base px-8 py-3">Apply Now <ArrowRight className="inline w-4 h-4 ml-1" /></Link>
            <Link href="/partner/dashboard" className="btn-secondary text-base px-8 py-3">Partner Login</Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="border-b border-dark-100">
        <div className="container-custom py-10 grid grid-cols-3 gap-6 text-center">
          {[['500+', 'Active Partners'], ['$2M+', 'Commissions Paid'], ['98%', 'Partner Satisfaction']].map(([val, label]) => (
            <div key={label}>
              <p className="text-3xl font-black text-brand-600">{val}</p>
              <p className="text-dark-500 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Commission Tiers */}
      <div className="container-custom py-16">
        <h2 className="section-title text-center mb-10">Commission Tiers</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((tier, i) => (
            <div key={tier.name} className={`card p-8 text-center ${i === 1 ? 'border-brand-400 ring-2 ring-brand-300' : ''}`}>
              {i === 1 && <div className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-3">Most Popular</div>}
              <h3 className="text-xl font-bold text-dark-900 mb-1">{tier.name}</h3>
              <p className="text-4xl font-black text-brand-600 my-3">{tier.commission}</p>
              <p className="text-xs text-dark-400 mb-2">Commission per sale</p>
              <p className="text-sm text-dark-500 mb-4">{tier.desc}</p>
              <p className="text-xs text-dark-400">Min volume: {tier.min}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-dark-50 py-16">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-dark-900 mb-6">Everything you need to succeed</h2>
              <ul className="space-y-3">
                {BENEFITS.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-dark-700">
                    <CheckCircle className="w-5 h-5 text-brand-500 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: DollarSign, label: 'Avg monthly earnings', value: '$1,240' },
                { icon: Users, label: 'New partners this month', value: '43' },
                { icon: BarChart2, label: 'Conversion rate', value: '8.2%' },
                { icon: Star, label: 'Avg partner rating', value: '4.9/5' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="card p-5">
                  <Icon className="w-6 h-6 text-brand-600 mb-2" />
                  <p className="text-xl font-black text-dark-900">{value}</p>
                  <p className="text-xs text-dark-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="container-custom py-16 text-center">
        <h2 className="text-3xl font-bold text-dark-900 mb-4">Ready to start earning?</h2>
        <p className="text-dark-500 mb-8 max-w-md mx-auto">Apply in minutes. We review applications within 2 business days.</p>
        <Link href="/partner/apply" className="btn-primary text-base px-10 py-3">Apply to Become a Partner</Link>
      </div>
    </div>
  );
}
