'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { blogApi } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, ArrowLeft } from 'lucide-react';

export default function BlogPostPage() {
  const { slug } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => blogApi.get(slug),
  });

  const post = data?.data?.post;

  if (isLoading) {
    return (
      <div className="container-custom py-12 max-w-3xl mx-auto space-y-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-6 bg-dark-100 rounded animate-pulse" />)}
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container-custom py-20 text-center">
        <p className="text-dark-500">Post not found</p>
        <Link href="/blog" className="btn-primary mt-4 inline-flex">Back to Blog</Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <article className="container-custom py-12 max-w-3xl mx-auto">
        <Link href="/blog" className="inline-flex items-center gap-2 text-dark-400 hover:text-dark-700 text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> All Posts
        </Link>

        {post.category && <span className="badge badge-green mb-3">{post.category}</span>}
        <h1 className="text-3xl md:text-4xl font-bold text-dark-900 leading-tight mt-2">{post.title}</h1>

        <div className="flex items-center gap-3 text-sm text-dark-400 mt-4 mb-8">
          <Calendar className="w-4 h-4" />
          {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          {post.author && <><span>·</span><span>{post.author.firstName} {post.author.lastName}</span></>}
          {post.readTime && <><span>·</span><span>{post.readTime} min read</span></>}
        </div>

        {post.coverImage && (
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-10">
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 800px" />
          </div>
        )}

        <div
          className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-dark-900 prose-p:text-dark-600 prose-a:text-brand-600 hover:prose-a:text-brand-700 prose-strong:text-dark-900 prose-li:text-dark-600"
          dangerouslySetInnerHTML={{ __html: post.body || `<p>${post.excerpt || ''}</p>` }}
        />
      </article>
    </div>
  );
}
