'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, ShieldCheck, Truck, Star, ChevronRight, Check, Award, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';

// ─── Hero Section ───────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative bg-dark-950 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-brand-950 opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,197,94,0.12),transparent)]" />
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(to right, #22c55e 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative container-custom py-24 md:py-36">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-600/20 border border-brand-500/30 text-brand-400 text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Premium EV Charging Equipment
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
            Power Your Drive.{' '}
            <span className="text-brand-400">Anywhere.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-dark-300 leading-relaxed max-w-2xl mx-auto">
            From Level 2 home chargers to intelligent NEMA splitters — VoltStore has everything you need to charge smarter, faster, and more affordably.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="btn-primary text-base px-8 py-4">
              Shop All Products <ArrowRight className="w-5 h-5 ml-1" />
            </Link>
            <Link href="/shop?category=nema-splitters" className="btn-secondary text-base px-8 py-4 bg-white/10 text-white border-white/20 hover:bg-white/20">
              See NEMA Splitters
            </Link>
          </div>
          {/* Social proof */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-dark-400">
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span>4.9/5 from 1,200+ reviews</span>
            </div>
            <span className="hidden sm:block text-dark-700">·</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-500" />
              <span>ETL certified · 2-year warranty</span>
            </div>
            <span className="hidden sm:block text-dark-700">·</span>
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-brand-500" />
              <span>Free shipping over $150</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features bar ────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Zap, title: 'Up to 48A Charging', desc: 'Level 2 speeds for all EVs' },
  { icon: ShieldCheck, title: 'ETL & UL Certified', desc: 'Safety tested and approved' },
  { icon: Truck, title: 'Free Shipping', desc: 'On all orders over $150' },
  { icon: Award, title: '2-Year Warranty', desc: 'Backed by expert support' },
];

function FeaturesBar() {
  return (
    <section className="bg-white border-b border-dark-100">
      <div className="container-custom py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="font-semibold text-dark-900 text-sm">{title}</p>
                <p className="text-dark-500 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Featured Products ────────────────────────────────────────────────────────
function FeaturedProducts() {
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsApi.list({ limit: 4, sort: 'featured' }),
  });

  const products = data?.data?.products || [];

  return (
    <section className="py-20 bg-dark-50">
      <div className="container-custom">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-2">Top Picks</p>
            <h2 className="section-title">Featured Products</h2>
          </div>
          <Link href="/shop" className="flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium text-sm transition-colors">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Use Case section ─────────────────────────────────────────────────────────
const USE_CASES = [
  {
    title: "One outlet? No problem.",
    subtitle: "NEMA Splitters",
    desc: "Plug two EVs into a single NEMA 14-50 outlet with our intelligent splitter — automatically managing load so both vehicles charge overnight.",
    cta: "Shop Splitters",
    href: "/shop?category=nema-splitters",
    gradient: "from-brand-600 to-brand-800",
    checkmarks: ['Supports 30A & 50A outlets', 'ETL certified', 'No electrician needed', 'Charges 2 EVs simultaneously'],
  },
  {
    title: "Full-speed home charging",
    subtitle: "Level 2 Chargers",
    desc: "Go from nearly empty to fully charged overnight with our 40-48A Level 2 home chargers. Compatible with all EVs including Tesla via NACS adapter.",
    cta: "Shop Chargers",
    href: "/shop?category=ev-chargers",
    gradient: "from-electric-600 to-electric-800",
    checkmarks: ['Up to 48A / 11.5kW', 'NACS & J1772 connectors', 'Hardwired & plug-in options', 'Smart WiFi connectivity'],
  },
];

function UseCases() {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <p className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-2">Solutions</p>
          <h2 className="section-title">The right charger for every situation</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {USE_CASES.map((uc) => (
            <div key={uc.title} className={`relative rounded-3xl bg-gradient-to-br ${uc.gradient} text-white p-8 md:p-10 overflow-hidden`}>
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold mb-4">{uc.subtitle}</span>
                <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-3">{uc.title}</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-6">{uc.desc}</p>
                <ul className="space-y-2 mb-8">
                  {uc.checkmarks.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-white flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
                <Link
                  href={uc.href}
                  className="inline-flex items-center gap-2 bg-white text-dark-900 font-semibold px-6 py-3 rounded-xl hover:bg-dark-100 transition-colors"
                >
                  {uc.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Michael R.",
    location: "Austin, TX",
    vehicle: "Tesla Model 3",
    rating: 5,
    text: "The NEMA splitter is absolutely brilliant. Both my Model 3 and wife's Leaf charge overnight on the same outlet. Installation took 10 minutes.",
  },
  {
    name: "Sarah K.",
    location: "Denver, CO",
    vehicle: "Ford Mustang Mach-E",
    rating: 5,
    text: "Switched from a slow Level 1 charger to the AC Lite 48A. I go from 20% to 100% in under 5 hours. Best EV accessory purchase I've ever made.",
  },
  {
    name: "James W.",
    location: "Portland, OR",
    vehicle: "Chevrolet Bolt",
    rating: 5,
    text: "VoltStore's customer support is exceptional. They helped me choose the right charger for my garage setup and it works perfectly.",
  },
];

function Testimonials() {
  return (
    <section className="py-20 bg-dark-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <p className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-2">Reviews</p>
          <h2 className="section-title">Loved by EV drivers</h2>
          <p className="section-subtitle mx-auto text-center mt-3">
            Over 10,000 EV drivers trust VoltStore for their home charging needs.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-6">
              <div className="flex gap-1 mb-3">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-dark-700 text-sm leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-dark-900 text-sm">{t.name}</p>
                  <p className="text-dark-400 text-xs">{t.vehicle} · {t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Partner CTA ─────────────────────────────────────────────────────────────
function PartnerCTA() {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="bg-gradient-to-r from-dark-900 to-dark-800 rounded-3xl px-8 md:px-16 py-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-brand-400" />
              <span className="text-brand-400 font-semibold text-sm uppercase tracking-wider">Partner Program</span>
            </div>
            <h2 className="text-white text-3xl md:text-4xl font-bold leading-tight">
              Earn up to 15% on every sale
            </h2>
            <p className="text-dark-400 mt-3 max-w-lg">
              Join electricians, EV installers, and content creators who earn commissions by recommending VoltStore products to their audience.
            </p>
          </div>
          <Link
            href="/partner/apply"
            className="flex-shrink-0 btn-primary text-base px-8 py-4"
          >
            Apply Now <ArrowRight className="w-5 h-5 ml-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturesBar />
      <FeaturedProducts />
      <UseCases />
      <Testimonials />
      <PartnerCTA />
    </>
  );
}
