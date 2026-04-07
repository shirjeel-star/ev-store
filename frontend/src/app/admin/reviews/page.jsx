'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Star, CheckCircle, XCircle } from 'lucide-react';

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-dark-200'}`} />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', status, page],
    queryFn: () => adminApi.getReviews({ status, page, limit: 20 }),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => adminApi.approveReview(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-reviews'] }); toast.success('Review approved'); },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => adminApi.rejectReview(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-reviews'] }); toast.success('Review rejected'); },
  });

  const reviews = data?.data?.reviews || [];
  const total = data?.data?.total || 0;
  const pages = Math.ceil(total / 20);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-900">Reviews</h1>
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${status === s ? 'bg-brand-600 text-white' : 'bg-white border border-dark-200 text-dark-600 hover:border-brand-400'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-dark-100 rounded-2xl" />)}</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 text-dark-400">No {status.toLowerCase()} reviews</div>
        ) : reviews.map((r) => (
          <div key={r.id} className="bg-white border border-dark-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <Stars rating={r.rating} />
                  <span className="font-semibold text-dark-900 text-sm">{r.title}</span>
                </div>
                <p className="text-dark-600 text-sm mb-2">{r.body}</p>
                <div className="flex flex-wrap gap-3 text-xs text-dark-400">
                  <span>By <span className="font-medium text-dark-600">{r.user?.firstName} {r.user?.lastName}</span></span>
                  <span>•</span>
                  <span>Product: <span className="font-medium text-dark-600">{r.product?.name}</span></span>
                  <span>•</span>
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {status === 'PENDING' && (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => approveMutation.mutate(r.id)} disabled={approveMutation.isPending} className="text-brand-600 hover:text-brand-700 transition-colors" title="Approve">
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button onClick={() => rejectMutation.mutate(r.id)} disabled={rejectMutation.isPending} className="text-red-500 hover:text-red-600 transition-colors" title="Reject">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-400">Page {page} of {pages} ({total} total)</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Prev</button>
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
