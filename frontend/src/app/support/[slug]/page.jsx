'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { supportApi } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SupportDocPage() {
  const { slug } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['support-doc', slug],
    queryFn: () => supportApi.getBySlug(slug),
  });
  const doc = data?.data;

  if (isLoading) {
    return (
      <div className="container-custom py-20">
        <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 bg-dark-100 rounded w-2/3" />
          <div className="h-4 bg-dark-100 rounded w-full" />
          <div className="h-4 bg-dark-100 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (!doc) return <div className="container-custom py-20 text-center text-dark-500">Article not found.</div>;

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="container-custom max-w-3xl">
        <Link href="/support" className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 text-sm mb-8 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Support Center
        </Link>
        <h1 className="text-3xl font-bold text-dark-900 mb-4">{doc.title}</h1>
        <div
          className="prose prose-slate max-w-none mt-6"
          dangerouslySetInnerHTML={{ __html: doc.content }}
        />
        <div className="mt-12 p-6 bg-brand-50 rounded-2xl border border-brand-100">
          <p className="text-dark-700 text-sm font-medium mb-1">Was this article helpful?</p>
          <p className="text-dark-500 text-xs mb-3">If you still need help, contact our team.</p>
          <a href="mailto:support@voltstore.com" className="btn-primary text-sm py-2 px-5">Contact Support</a>
        </div>
      </div>
    </div>
  );
}
