'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Zap, ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ email }) => {
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-dark-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-dark-900">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            Volt<span className="text-brand-600">Store</span>
          </Link>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-brand-600" />
              </div>
              <h2 className="text-xl font-bold text-dark-900 mb-2">Check your email</h2>
              <p className="text-dark-500 text-sm mb-6">
                We've sent a password reset link. Check your inbox (and spam folder).
              </p>
              <Link href="/auth/login" className="btn-secondary text-sm">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-dark-900 mb-2">Forgot your password?</h1>
              <p className="text-dark-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                    })}
                    type="email"
                    className={`input ${errors.email ? 'input-error' : ''}`}
                    placeholder="you@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3.5 disabled:opacity-60">
                  {isSubmitting ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
              <div className="mt-5 text-center">
                <Link href="/auth/login" className="text-sm text-dark-400 hover:text-dark-700 flex items-center justify-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
