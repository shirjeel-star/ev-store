'use client';

import Link from 'next/link';
import Image from 'next/image';
import useCartStore from '@/store/cartStore';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

function formatPrice(n) {
  return `$${parseFloat(n).toFixed(2)}`;
}

export default function CartPage() {
  const { items, subtotal, discountAmount, total, discount, updateItem, removeItem, applyDiscount, removeDiscount } = useCartStore();
  const [discountInput, setDiscountInput] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  const handleApplyDiscount = async (e) => {
    e.preventDefault();
    if (!discountInput.trim()) return;
    setApplyingDiscount(true);
    try {
      const data = await applyDiscount(discountInput.trim().toUpperCase());
      toast.success(`Code applied! You save ${formatPrice(data.discountAmount)}`);
      setDiscountInput('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid discount code');
    } finally {
      setApplyingDiscount(false);
    }
  };

  const shipping = subtotal >= 150 ? 0 : 9.99;

  if (items.length === 0) {
    return (
      <div className="container-custom py-24 text-center">
        <ShoppingBag className="w-20 h-20 text-dark-200 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-dark-900 mb-2">Your cart is empty</h1>
        <p className="text-dark-400 mb-8">Add some products to get started</p>
        <Link href="/shop" className="btn-primary">Browse Products <ArrowRight className="w-4 h-4 ml-2" /></Link>
      </div>
    );
  }

  return (
    <div className="bg-dark-50 min-h-screen py-10">
      <div className="container-custom">
        <h1 className="text-2xl font-bold text-dark-900 mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="card p-5 flex gap-4">
                <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-dark-50 border border-dark-100">
                  <Image
                    src={item.image || '/placeholder.jpg'}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/shop/${item.slug || ''}`}>
                    <h3 className="font-semibold text-dark-900 text-sm leading-snug hover:text-brand-600 transition-colors line-clamp-2">{item.name}</h3>
                  </Link>
                  {item.variant && item.variant !== 'Default' && (
                    <p className="text-xs text-dark-400 mt-0.5">{item.variant}</p>
                  )}
                  <p className="text-brand-600 font-bold mt-1">{formatPrice(item.price)}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 border border-dark-200 rounded-xl">
                      <button
                        onClick={() => updateItem(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center text-dark-500 hover:text-dark-900 disabled:opacity-30"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-dark-900">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-8 h-8 flex items-center justify-center text-dark-500 hover:text-dark-900 disabled:opacity-30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-dark-900">{formatPrice(item.price * item.quantity)}</span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-dark-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="font-bold text-dark-900 mb-4">Order Summary</h2>

              {/* Discount */}
              {discount ? (
                <div className="flex items-center justify-between bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5 mb-4">
                  <div className="flex items-center gap-2 text-brand-700 text-sm font-medium">
                    <Tag className="w-4 h-4" />
                    {discount.code} (-{formatPrice(discountAmount)})
                  </div>
                  <button onClick={removeDiscount} className="text-dark-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyDiscount} className="flex gap-2 mb-4">
                  <input
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    placeholder="Discount code"
                    className="flex-1 input py-2 text-sm"
                  />
                  <button type="submit" disabled={applyingDiscount} className="px-4 py-2 bg-dark-900 text-white text-sm font-semibold rounded-xl hover:bg-dark-700 transition-colors disabled:opacity-50">
                    Apply
                  </button>
                </form>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-dark-600">
                  <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-brand-600">
                    <span>Discount</span><span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-dark-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? <span className="text-brand-600 font-medium">FREE</span> : `${formatPrice(shipping)}`}</span>
                </div>
                {shipping > 0 && subtotal < 150 && (
                  <p className="text-xs text-dark-400">
                    Add {formatPrice(150 - subtotal)} more for free shipping
                  </p>
                )}
                <div className="flex justify-between font-bold text-dark-900 text-base pt-2 border-t border-dark-100">
                  <span>Total</span>
                  <span>{formatPrice(total + shipping)}</span>
                </div>
              </div>

              <Link href="/checkout" className="btn-primary w-full text-base py-4 mt-4">
                Proceed to Checkout <ArrowRight className="w-5 h-5 ml-1" />
              </Link>

              <Link href="/shop" className="block text-center text-sm text-dark-500 hover:text-dark-900 transition-colors mt-3">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
