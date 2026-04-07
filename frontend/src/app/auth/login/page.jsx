'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import useAuthStore from '@/store/authStore';
import useCartStore from '@/store/cartStore';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap } from 'lucide-react';
import clsx from 'clsx';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await login(data);
      await fetchCart();
      toast.success('Welcome back!');
      router.push('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-dark-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-dark-900">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            Volt<span className="text-brand-600">Store</span>
          </Link>
          <h1 className="text-2xl font-bold text-dark-900 mt-6">Welcome back</h1>
          <p className="text-dark-500 mt-1">Sign in to your account</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                })}
                type="email"
                autoComplete="email"
                className={clsx('input', errors.email && 'input-error')}
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-brand-600 hover:text-brand-700">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={clsx('input pr-11', errors.password && 'input-error')}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full text-base py-3.5 disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-dark-100 text-center text-sm text-dark-500">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-brand-600 hover:text-brand-700 font-medium">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
