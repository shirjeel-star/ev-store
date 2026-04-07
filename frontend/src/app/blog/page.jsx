'use client';

import { useQuery } from '@tanstack/react-query';
import { blogApi } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, Tag, ArrowRight } from 'lucide-react';

export default function BlogPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['blog'],
    queryFn: () => blogApi.list({ limit: 20 }),
  });

  const posts = data?.data?.posts || [];

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-dark-900 to-dark-800 py-16 px-4">
        <div className="container-custom text-center">
          <h1 className="text-4xl font-bold text-white mb-3">EV Charging Resource Hub</h1>
          <p className="text-dark-300 text-lg max-w-xl mx-auto">
            Guides, tips, and news to help you get the most out of your electric vehicle.
          </p>
        </div>
      </div>

      <div className="container-custom py-14">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-dark-50 rounded-2xl h-80 animate-pulse" />)}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-dark-400 py-16">No posts yet. Check back soon!</p>
        ) : (
          <>
            {/* Featured post */}
            {posts[0] && (
              <Link href={`/blog/${posts[0].slug}`} className="group block mb-12">
                <div className="relative rounded-3xl overflow-hidden bg-dark-900">
                  {posts[0].coverImage && (
                    <div className="relative w-full h-80 md:h-96">
                      <Image src={posts[0].coverImage} alt={posts[0].title} fill className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-60" sizes="100vw" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 flex flex-col justify-end p-8">
                    <div className="flex items-center gap-3 text-sm text-dark-400 mb-3">
                      {posts[0].category && <span className="badge badge-green">{posts[0].category}</span>}
                      <Calendar className="w-4 h-4 ml-2" />
                      {new Date(posts[0].publishedAt || posts[0].createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight group-hover:text-brand-400 transition-colors">{posts[0].title}</h2>
                    <p className="text-dark-300 mt-2 max-w-2xl line-clamp-2">{posts[0].excerpt}</p>
                    <span className="inline-flex items-center gap-2 mt-4 text-brand-400 font-medium text-sm">Read More <ArrowRight className="w-4 h-4" /></span>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
              {posts.slice(1).map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group card hover:shadow-card-hover transition-all">
                  {post.coverImage && (
                    <div className="relative aspect-video overflow-hidden">
                      <Image src={post.coverImage} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                    </div>
                  )}
                  <div className="p-5">
                    {post.category && <span className="badge badge-blue mb-2">{post.category}</span>}
                    <h3 className="font-bold text-dark-900 leading-snug group-hover:text-brand-600 transition-colors line-clamp-2">{post.title}</h3>
                    <p className="text-dark-500 text-sm mt-2 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center gap-3 mt-4 text-xs text-dark-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                      {post.readTime && (
                        <>
                          <span>·</span>
                          <Clock className="w-3.5 h-3.5" />
                          {post.readTime} min read
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
