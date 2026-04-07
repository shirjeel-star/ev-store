'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement, AddressElement } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import { paymentsApi } from '@/lib/api';
import useCartStore from '@/store/cartStore';
import toast from 'react-hot-toast';
import { Lock, ChevronLeft, CreditCard } from 'lucide-react';
import clsx from 'clsx';

export default function PaymentStep({ shippingData, paymentIntentId, discount, items, onBack }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setErrorMsg(null);

    // 1. Submit the Elements form (validates card details)
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrorMsg(submitError.message);
      setProcessing(false);
      return;
    }

    // 2. Confirm payment with Stripe — no redirect, just confirm the intent
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        receipt_email: shippingData.email,
        shipping: {
          name: `${shippingData.firstName} ${shippingData.lastName}`,
          address: {
            line1: shippingData.address1,
            line2: shippingData.address2 || '',
            city: shippingData.city,
            state: shippingData.state,
            postal_code: shippingData.zip,
            country: shippingData.country || 'US',
          },
          phone: shippingData.phone,
        },
      },
    });

    if (confirmError) {
      setErrorMsg(confirmError.message);
      setProcessing(false);
      return;
    }

    if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'requires_capture') {
      setErrorMsg('Payment was not completed. Please try again.');
      setProcessing(false);
      return;
    }

    // 3. Confirm order on our backend
    try {
      const { data } = await paymentsApi.confirmOrder({
        paymentIntentId,
        shippingAddress: shippingData,
        discountCode: discount?.code,
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      });

      clearCart();
      toast.success('Order placed successfully!');
      router.push(`/checkout/success?order=${data.order.orderNumber}`);
    } catch (err) {
      // Order may already exist (idempotent) — check for order number
      const existing = err.response?.data?.orderNumber;
      if (existing) {
        clearCart();
        router.push(`/checkout/success?order=${existing}`);
      } else {
        setErrorMsg(err.response?.data?.message || 'Payment succeeded but order creation failed. Contact support.');
        toast.error('Please contact support with your payment ID: ' + paymentIntentId);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-dark-900">Payment</h2>
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-dark-500 hover:text-dark-900 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Shipping summary */}
      {shippingData && (
        <div className="bg-dark-50 rounded-xl p-4 mb-6 text-sm">
          <p className="text-dark-500 text-xs font-medium uppercase tracking-wider mb-1">Shipping to</p>
          <p className="font-medium text-dark-900">{shippingData.firstName} {shippingData.lastName}</p>
          <p className="text-dark-500">{shippingData.address1}{shippingData.address2 ? `, ${shippingData.address2}` : ''}, {shippingData.city}, {shippingData.state} {shippingData.zip}</p>
          <p className="text-dark-500">{shippingData.email}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Stripe PaymentElement — handles all payment methods */}
        <div>
          <label className="label flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-dark-500" />
            Card Details
          </label>
          <PaymentElement
            options={{
              layout: 'tabs',
              wallets: { applePay: 'auto', googlePay: 'auto' },
            }}
          />
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || processing}
          className="btn-primary w-full text-base py-4 disabled:opacity-50"
        >
          {processing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing payment…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Pay Now
            </span>
          )}
        </button>

        <p className="text-center text-xs text-dark-400">
          Your payment is secured by Stripe. We never store your card details.
        </p>
      </form>
    </div>
  );
}
