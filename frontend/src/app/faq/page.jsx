'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { faqsApi } from '@/lib/api';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import clsx from 'clsx';

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-dark-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-dark-50 transition-colors gap-4"
      >
        <span className="font-semibold text-dark-900 text-sm">{faq.question}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-brand-600 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-dark-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="border-t border-dark-100 px-5 py-4">
          <p className="text-dark-600 text-sm leading-relaxed">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const { data, isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => faqsApi.list({ limit: 100 }),
  });

  const faqs = data?.data?.faqs || [];

  const categories = ['All', ...new Set(faqs.map((f) => f.category).filter(Boolean))];
  const filtered = faqs.filter((f) => {
    const matchesCategory = activeCategory === 'All' || f.category === activeCategory;
    const matchesSearch = !search || f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 py-16 px-4">
        <div className="container-custom text-center">
          <h1 className="text-4xl font-bold text-white mb-3">Frequently Asked Questions</h1>
          <p className="text-brand-100 text-lg mb-8">Find answers to common questions about EV charging</p>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions…"
              className="w-full pl-12 pr-5 py-4 rounded-2xl text-dark-900 focus:outline-none focus:ring-2 focus:ring-white text-sm"
            />
          </div>
        </div>
      </div>

      <div className="container-custom py-14">
        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                activeCategory === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-dark-100 rounded-2xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-dark-400 py-16">No questions match your search.</p>
        ) : (
          <div className="space-y-3 max-w-3xl">
            {filtered.map((faq) => <FAQItem key={faq.id} faq={faq} />)}
          </div>
        )}

        {/* Contact */}
        <div className="mt-16 bg-dark-50 rounded-3xl p-10 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-dark-900 mb-2">Still have questions?</h2>
          <p className="text-dark-500 mb-6">Our team is here to help, 7 days a week.</p>
          <a href="/support" className="btn-primary">Contact Support</a>
        </div>
      </div>
    </div>
  );
}
