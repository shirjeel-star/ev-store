'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap, Check } from 'lucide-react';
import clsx from 'clsx';

const PASSWORD_REQUIREMENTS = [
  { regex: /.{8,}/, label: 'At least 8 characters' },
  { regex: /[A-Z]/, label: 'One uppercase letter' },
  { regex: /[0-9]/, label: 'One number' },
];

export default function RegisterPage() {
  const router = useRouter();
  const register_ = useAuthStore((s) => s.register);
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const passwordValue = watch('password', '');

  const onSubmit = async (data) => {
    try {
      await register_({ ...data, referralCode: referralCode || undefined });
      toast.success('Account created! Welcome to VoltStore');
      router.push('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
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
          <h1 className="text-2xl font-bold text-dark-900 mt-6">Create your account</h1>
          <p className="text-dark-500 mt-1">Join 10,000+ EV drivers on VoltStore</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input
                  {...register('firstName', { required: 'Required' })}
                  className={clsx('input', errors.firstName && 'input-error')}
                  placeholder="John"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  {...register('lastName', { required: 'Required' })}
                  className={clsx('input', errors.lastName && 'input-error')}
                  placeholder="Doe"
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

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
              <label className="label">Password</label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'At least 8 characters' },
                    validate: (v) => /[A-Z]/.test(v) && /[0-9]/.test(v) || 'Must include uppercase letter and number',
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={clsx('input pr-11', errors.password && 'input-error')}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Password strength */}
              {passwordValue && (
                <div className="mt-2 space-y-1">
                  {PASSWORD_REQUIREMENTS.map(({ regex, label }) => (
                    <div key={label} className={clsx('flex items-center gap-1.5 text-xs', regex.test(passwordValue) ? 'text-brand-600' : 'text-dark-400')}>
                      <Check className={clsx('w-3 h-3', regex.test(passwordValue) ? 'text-brand-600' : 'text-dark-300')} />
                      {label}
                    </div>
                  ))}
                </div>
              )}
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Referral Code (optional)</label>
              <input
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="input"
                placeholder="Enter referral code"
                maxLength={20}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full text-base py-3.5 disabled:opacity-60 mt-2"
            >
              {isSubmitting ? 'Creating account…' : 'Create Account'}
            </button>

            <p className="text-center text-xs text-dark-400">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-brand-600 hover:underline">Terms</Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>.
            </p>
          </form>

          <div className="mt-6 pt-6 border-t border-dark-100 text-center text-sm text-dark-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-600 hover:text-brand-700 font-medium">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
