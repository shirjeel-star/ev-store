'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { partnersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const schema = z.object({
  businessName: z.string().min(2, 'Required'),
  website: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  partnerType: z.enum(['affiliate', 'reseller', 'installer', 'fleet'], { required_error: 'Select a type' }),
  audienceSize: z.enum(['<1k', '1k-10k', '10k-100k', '100k+'], { required_error: 'Select audience size' }),
  description: z.string().min(20, 'Minimum 20 characters').max(500),
  referralCode: z.string().optional(),
});

const PARTNER_TYPES = [
  { value: 'affiliate', label: 'Affiliate / Content Creator' },
  { value: 'reseller', label: 'Reseller / Distributor' },
  { value: 'installer', label: 'EV Installer / Electrician' },
  { value: 'fleet', label: 'Fleet / Corporate' },
];

const AUDIENCE_SIZES = [
  { value: '<1k', label: 'Under 1,000' },
  { value: '1k-10k', label: '1,000 – 10,000' },
  { value: '10k-100k', label: '10,000 – 100,000' },
  { value: '100k+', label: '100,000+' },
];

export default function PartnerApplyPage() {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data) => partnersApi.apply(data),
    onSuccess: () => setSubmitted(true),
    onError: (err) => toast.error(err.response?.data?.message || 'Application failed. Please try again.'),
  });

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-brand-600" />
          </div>
          <h1 className="text-3xl font-bold text-dark-900 mb-3">Application Submitted!</h1>
          <p className="text-dark-500 mb-8">We review applications within 2 business days and will email you the result.</p>
          <Link href="/" className="btn-primary px-8 py-3">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <Link href="/partner" className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 text-sm mb-8 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Partner Program
        </Link>
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-dark-900 mb-1">Partner Application</h1>
          <p className="text-dark-500 text-sm mb-8">Tell us about yourself and your business.</p>

          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
            <div>
              <label className="label">Business / Channel Name</label>
              <input {...register('businessName')} className="input" placeholder="VoltGarage LLC" />
              {errors.businessName && <p className="input-error">{errors.businessName.message}</p>}
            </div>

            <div>
              <label className="label">Website or Social Profile</label>
              <input {...register('website')} className="input" placeholder="https://yoursite.com" />
              {errors.website && <p className="input-error">{errors.website.message}</p>}
            </div>

            <div>
              <label className="label">Partner Type</label>
              <select {...register('partnerType')} className="input">
                <option value="">Select type…</option>
                {PARTNER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {errors.partnerType && <p className="input-error">{errors.partnerType.message}</p>}
            </div>

            <div>
              <label className="label">Monthly Audience / Reach</label>
              <select {...register('audienceSize')} className="input">
                <option value="">Select range…</option>
                {AUDIENCE_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {errors.audienceSize && <p className="input-error">{errors.audienceSize.message}</p>}
            </div>

            <div>
              <label className="label">Tell us about your audience / business <span className="text-dark-400 font-normal">(how you plan to promote VoltStore)</span></label>
              <textarea {...register('description')} rows={4} className="input resize-none" placeholder="We run an EV enthusiast community of 15k members…" />
              {errors.description && <p className="input-error">{errors.description.message}</p>}
            </div>

            <div>
              <label className="label">Referral Code <span className="text-dark-400 font-normal">(optional)</span></label>
              <input {...register('referralCode')} className="input" placeholder="PARTNER123" />
            </div>

            <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3 text-base">
              {mutation.isPending ? 'Submitting…' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
