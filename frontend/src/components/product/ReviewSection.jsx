'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { Star, ThumbsUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import clsx from 'clsx';

function StarRating({ value, onChange, size = 5 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <Star
            className={clsx(
              `w-${size} h-${size} transition-colors`,
              (hover || value) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-dark-200 hover:text-yellow-300'
            )}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="border-b border-dark-100 py-6 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
            {review.user?.firstName?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-dark-900 text-sm">{review.user?.firstName} {review.user?.lastName?.[0]}.</span>
              {review.verifiedPurchase && (
                <span className="badge badge-green text-xs">Verified Purchase</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={clsx('w-3.5 h-3.5', i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-dark-200')} />
                ))}
              </div>
              <span className="text-xs text-dark-400">{new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
      {review.title && (
        <p className="font-semibold text-dark-900 text-sm mt-3">{review.title}</p>
      )}
      <p className="text-dark-600 text-sm leading-relaxed mt-1.5">{review.body}</p>
      {review.helpfulCount > 0 && (
        <div className="flex items-center gap-1.5 mt-3 text-xs text-dark-400">
          <ThumbsUp className="w-3.5 h-3.5" />
          {review.helpfulCount} found this helpful
        </div>
      )}
    </div>
  );
}

export default function ReviewSection({ productSlug, product }) {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ['reviews', productSlug, page],
    queryFn: () => productsApi.reviews(productSlug, { page, limit: 5 }),
  });

  const reviews = data?.data?.reviews || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: { rating: 0, title: '', body: '' },
  });
  const ratingValue = watch('rating');

  const submitMutation = useMutation({
    mutationFn: (formData) => productsApi.addReview(productSlug, formData),
    onSuccess: () => {
      toast.success('Review submitted! It will appear after moderation.');
      reset();
      qc.invalidateQueries(['reviews', productSlug]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    },
  });

  const avgRating = product?.avgRating || 0;
  const reviewCount = product?._count?.reviews || 0;

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-dark-900">Customer Reviews</h2>
          {reviewCount > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={clsx('w-5 h-5', i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-dark-200')} />
                ))}
              </div>
              <span className="font-bold text-dark-900 text-lg">{avgRating.toFixed(1)}</span>
              <span className="text-dark-400 text-sm">({reviewCount} reviews)</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Review list */}
        <div className="lg:col-span-2">
          {reviews.length === 0 ? (
            <p className="text-dark-400 py-6">No reviews yet. Be the first to review this product!</p>
          ) : (
            <>
              {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
              {totalPages > 1 && (
                <div className="flex gap-2 mt-6">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={clsx('w-9 h-9 rounded-lg text-sm font-medium border transition-colors',
                        page === i + 1 ? 'bg-brand-600 text-white border-brand-600' : 'border-dark-200 text-dark-600 hover:bg-dark-50'
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Write review */}
        <div>
          <div className="card p-6">
            <h3 className="font-bold text-dark-900 mb-4">Write a Review</h3>
            {!user ? (
              <div className="text-center py-4">
                <p className="text-dark-500 text-sm mb-3">Please sign in to leave a review.</p>
                <a href="/auth/login" className="btn-primary text-sm py-2.5 px-5">Sign In</a>
              </div>
            ) : (
              <form onSubmit={handleSubmit((d) => submitMutation.mutate(d))} className="space-y-4">
                <div>
                  <label className="label">Rating *</label>
                  <StarRating value={ratingValue} onChange={(v) => setValue('rating', v)} />
                  {errors.rating && <p className="text-red-500 text-xs mt-1">Please select a rating</p>}
                </div>
                <div>
                  <label className="label">Title</label>
                  <input
                    {...register('title', { maxLength: 100 })}
                    className="input"
                    placeholder="Summarize your experience"
                  />
                </div>
                <div>
                  <label className="label">Review *</label>
                  <textarea
                    {...register('body', { required: 'Review is required', minLength: { value: 20, message: 'At least 20 characters' } })}
                    rows={4}
                    className="input resize-none"
                    placeholder="Tell others about your experience..."
                  />
                  {errors.body && <p className="text-red-500 text-xs mt-1">{errors.body.message}</p>}
                </div>
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="btn-primary w-full"
                >
                  {submitMutation.isPending ? 'Submitting…' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
