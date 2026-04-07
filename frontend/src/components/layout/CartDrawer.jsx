'use client';

import { Fragment } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Tag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import useCartStore from '@/store/cartStore';
import useUIStore from '@/store/uiStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function CartDrawer() {
  const cartOpen = useUIStore((s) => s.cartOpen);
  const closeCart = useUIStore((s) => s.closeCart);
  const { items, subtotal, discountAmount, total, discount, loading, updateItem, removeItem, applyDiscount, removeDiscount } = useCartStore();
  const [discountInput, setDiscountInput] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  const handleApplyDiscount = async (e) => {
    e.preventDefault();
    if (!discountInput.trim()) return;
    setApplyingDiscount(true);
    try {
      const data = await applyDiscount(discountInput.trim().toUpperCase());
      toast.success(`Code applied! You save $${data.discountAmount?.toFixed(2)}`);
      setDiscountInput('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid discount code');
    } finally {
      setApplyingDiscount(false);
    }
  };

  const formatPrice = (n) => `$${parseFloat(n).toFixed(2)}`;

  return (
    <>
      {/* Backdrop */}
      {cartOpen && (
        <div
          className="fixed inset-0 bg-dark-900/50 z-50 animate-fade-in"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={clsx(
          'fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out',
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-600" />
            <h2 className="font-bold text-dark-900 text-lg">
              Cart {items.length > 0 && <span className="text-dark-400 text-sm font-normal">({items.length} items)</span>}
            </h2>
          </div>
          <button onClick={closeCart} className="p-2 rounded-lg hover:bg-dark-50 text-dark-500 hover:text-dark-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <ShoppingBag className="w-16 h-16 text-dark-200 mb-4" />
              <p className="text-dark-500 font-medium">Your cart is empty</p>
              <p className="text-dark-400 text-sm mt-1 mb-6">Add some products to get started</p>
              <button
                onClick={closeCart}
                className="btn-primary"
              >
                Shop Now
              </button>
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdate={updateItem}
                onRemove={removeItem}
                formatPrice={formatPrice}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-dark-100 px-5 py-4 space-y-4">
            {/* Discount code */}
            {discount ? (
              <div className="flex items-center justify-between bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-2 text-brand-700 text-sm font-medium">
                  <Tag className="w-4 h-4" />
                  <span>{discount.code}</span>
                  <span className="text-brand-500">(-{formatPrice(discountAmount)})</span>
                </div>
                <button onClick={removeDiscount} className="text-dark-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyDiscount} className="flex gap-2">
                <input
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="Discount code"
                  className="flex-1 px-3 py-2 text-sm border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  disabled={applyingDiscount}
                  className="px-4 py-2 bg-dark-900 text-white text-sm font-semibold rounded-lg hover:bg-dark-700 transition-colors disabled:opacity-50"
                >
                  Apply
                </button>
              </form>
            )}

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-dark-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-brand-600">
                  <span>Discount</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-dark-400 text-xs">
                <span>Shipping</span>
                <span>{subtotal >= 150 ? 'FREE' : 'Calculated at checkout'}</span>
              </div>
              <div className="flex justify-between font-bold text-dark-900 text-base pt-2 border-t border-dark-100">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <Link
              href="/checkout"
              onClick={closeCart}
              className="btn-primary w-full text-base py-3.5"
            >
              Checkout <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link href="/cart" onClick={closeCart} className="block text-center text-sm text-dark-500 hover:text-dark-900 transition-colors">
              View Full Cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

function CartItem({ item, onUpdate, onRemove, formatPrice }) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    await onRemove(item.id);
  };

  return (
    <div className="flex gap-3">
      <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-dark-50 border border-dark-100">
        <Image
          src={item.image || '/placeholder.jpg'}
          alt={item.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-dark-900 text-sm leading-snug line-clamp-2">{item.name}</p>
        {item.variant && item.variant !== 'Default' && (
          <p className="text-xs text-dark-400 mt-0.5">{item.variant}</p>
        )}
        <p className="text-brand-600 font-bold text-sm mt-1">{formatPrice(item.price)}</p>

        <div className="flex items-center justify-between mt-2">
          {/* Qty */}
          <div className="flex items-center gap-1 border border-dark-200 rounded-lg">
            <button
              onClick={() => onUpdate(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="w-7 h-7 flex items-center justify-center text-dark-500 hover:text-dark-900 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-6 text-center text-sm font-medium text-dark-900">{item.quantity}</span>
            <button
              onClick={() => onUpdate(item.id, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
              className="w-7 h-7 flex items-center justify-center text-dark-500 hover:text-dark-900 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          {/* Remove */}
          <button
            onClick={handleRemove}
            disabled={removing}
            className="p-1.5 text-dark-300 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
