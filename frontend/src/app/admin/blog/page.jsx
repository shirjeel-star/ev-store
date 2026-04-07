'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const schema = z.object({
  title: z.string().min(3),
  slug: z.string().min(2),
  excerpt: z.string().max(300).optional(),
  body: z.string().min(10),
  category: z.string().optional(),
  published: z.boolean().optional(),
});

function PostModal({ post, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!post?.id;

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: post || { published: false },
  });

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? adminApi.updateBlogPost(post.id, data) : adminApi.createBlogPost(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-blog'] }); toast.success(isEdit ? 'Post updated' : 'Post created'); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error saving post'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100">
          <h2 className="text-lg font-bold">{isEdit ? 'Edit Post' : 'New Post'}</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="label">Title</label>
            <input {...register('title')} className="input" />
            {errors.title && <p className="input-error">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Slug</label>
              <input {...register('slug')} className="input" />
              {errors.slug && <p className="input-error">{errors.slug.message}</p>}
            </div>
            <div>
              <label className="label">Category</label>
              <input {...register('category')} className="input" placeholder="guides, news, tips…" />
            </div>
          </div>
          <div>
            <label className="label">Excerpt <span className="text-dark-400 font-normal">(optional)</span></label>
            <textarea {...register('excerpt')} rows={2} className="input resize-none" />
          </div>
          <div>
            <label className="label">Body (HTML)</label>
            <textarea {...register('body')} rows={8} className="input resize-none font-mono text-sm" />
            {errors.body && <p className="input-error">{errors.body.message}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="published" {...register('published')} className="w-4 h-4 text-brand-600 rounded" />
            <label htmlFor="published" className="text-sm text-dark-700">Published</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminBlogPage() {
  const [modal, setModal] = useState(null);
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-blog', page],
    queryFn: () => adminApi.getBlogPosts({ page, limit: 15 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteBlogPost(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-blog'] }); toast.success('Deleted'); },
  });

  const posts = data?.data?.posts || [];
  const total = data?.data?.total || 0;
  const pages = Math.ceil(total / 15);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-900">Blog Posts <span className="text-dark-400 font-normal text-lg ml-1">({total})</span></h1>
        <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      <div className="bg-white border border-dark-100 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3 animate-pulse">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-dark-100 rounded" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-50 border-b border-dark-100">
                <tr>
                  {['Title', 'Category', 'Status', 'Date', ''].map((h) => (
                    <th key={h} className="text-left text-dark-500 font-semibold px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {posts.map((p) => (
                  <tr key={p.id} className="hover:bg-dark-50/50">
                    <td className="px-4 py-3 font-medium text-dark-900 max-w-xs truncate">{p.title}</td>
                    <td className="px-4 py-3 text-dark-500 capitalize">{p.category || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${p.published ? 'badge-green' : 'badge-gray'}`}>{p.published ? 'Published' : 'Draft'}</span>
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModal(p)} className="text-dark-400 hover:text-brand-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm('Delete post?')) deleteMutation.mutate(p.id); }} className="text-dark-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-100 text-sm">
            <span className="text-dark-400">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Prev</button>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {modal && <PostModal post={modal === 'create' ? null : modal} onClose={() => setModal(null)} />}
    </div>
  );
}
