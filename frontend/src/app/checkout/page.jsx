'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import useCartStore from '@/store/cartStore';
import useAuthStore from '@/store/authStore';
import { paymentsApi, usersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

import ShippingStep from '@/components/checkout/ShippingStep';
import PaymentStep from '@/components/checkout/PaymentStep';
import OrderSummary from '@/components/checkout/OrderSummary';
import { Lock, ChevronRight } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const STEPS = [
  { id: 1, label: 'Shipping' },
  { id: 2, label: 'Payment' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { items, subtotal, discountAmount, total, discount } = useCartStore();
  const [step, setStep] = useState(1);
  const [shippingData, setShippingData] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.replace('/cart');
    }
  }, [items]);

  const handleShippingComplete = async (data) => {
    setShippingData(data);
    setLoading(true);

    try {
      const res = await paymentsApi.createIntent({
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        shippingAddress: data,
        discountCode: discount?.code,
      });
      setClientSecret(res.data.clientSecret);
      setPaymentIntentId(res.data.paymentIntentId);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initialize payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-dark-50 min-h-screen py-10">
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-xl font-bold text-dark-900">
            Volt<span className="text-brand-600">Store</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 ${step === s.id ? 'text-brand-600 font-semibold' : step > s.id ? 'text-dark-400' : 'text-dark-300'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= s.id ? 'bg-brand-600 text-white' : 'bg-dark-200 text-dark-500'}`}>
                    {s.id}
                  </span>
                  {s.label}
                </div>
                {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-dark-300" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="card p-6 md:p-8">
              {step === 1 && (
                <ShippingStep
                  user={user}
                  onComplete={handleShippingComplete}
                  loading={loading}
                />
              )}
              {step === 2 && clientSecret && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#16a34a',
                        colorBackground: '#ffffff',
                        borderRadius: '8px',
                        fontFamily: 'Inter, system-ui, sans-serif',
                      },
                    },
                  }}
                >
                  <PaymentStep
                    shippingData={shippingData}
                    paymentIntentId={paymentIntentId}
                    discount={discount}
                    items={items}
                    onBack={() => setStep(1)}
                  />
                </Elements>
              )}
            </div>

            {/* Security note */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-dark-400">
              <Lock className="w-3.5 h-3.5" />
              Secured by Stripe · 256-bit SSL encryption
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-2">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              discountAmount={discountAmount}
              total={total}
              discount={discount}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
