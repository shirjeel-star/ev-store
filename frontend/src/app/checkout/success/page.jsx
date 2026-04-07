'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { CheckCircle, Package, ArrowRight, Home } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center py-20 px-4">
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-brand-600" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-dark-900 mb-2">Order Confirmed!</h1>
        <p className="text-dark-500 text-lg mb-6">
          Thank you for your purchase. We've sent a confirmation email with your order details.
        </p>

        {orderNumber && (
          <div className="bg-white border border-dark-200 rounded-2xl p-5 mb-8 inline-block">
            <p className="text-sm text-dark-400 mb-1">Order number</p>
            <p className="text-xl font-bold text-dark-900 font-mono tracking-wider">{orderNumber}</p>
          </div>
        )}

        {/* What's next */}
        <div className="text-left bg-white border border-dark-100 rounded-2xl p-6 mb-8 space-y-4">
          <h2 className="font-bold text-dark-900">What happens next?</h2>
          {[
            { icon: '📧', title: 'Confirmation email', desc: 'Check your inbox for your order confirmation' },
            { icon: '📦', title: 'We\'ll pack your order', desc: 'Your items will be packed within 1 business day' },
            { icon: '🚚', title: 'Shipping updates', desc: 'You\'ll receive tracking info once your order ships (1-3 business days)' },
          ].map((step) => (
            <div key={step.title} className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0 mt-0.5">{step.icon}</span>
              <div>
                <p className="font-semibold text-dark-900 text-sm">{step.title}</p>
                <p className="text-dark-500 text-xs">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {orderNumber && (
            <Link href={`/account/orders`} className="btn-primary">
              <Package className="w-4 h-4 mr-2" />
              Track My Order
            </Link>
          )}
          <Link href="/shop" className="btn-secondary">
            <Home className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
