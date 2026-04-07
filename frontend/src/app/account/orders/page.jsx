'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import AccountLayout from '@/components/account/AccountLayout';

const STATUS_STYLES = {
  PENDING:    'badge-yellow',
  CONFIRMED:  'badge-blue',
  PROCESSING: 'badge-blue',
  SHIPPED:    'badge-blue',
  DELIVERED:  'badge-green',
  CANCELLED:  'badge-red',
  REFUNDED:   'badge-gray',
};

function OrderCard({ order }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-dark-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-dark-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex w-10 h-10 bg-dark-100 rounded-xl items-center justify-center">
            <Package className="w-5 h-5 text-dark-500" />
          </div>
          <div className="text-left">
            <p className="font-bold text-dark-900 text-sm font-mono">{order.orderNumber}</p>
            <p className="text-dark-400 text-xs mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={clsx('badge', STATUS_STYLES[order.status] || 'badge-gray')}>
            {order.status}
          </span>
          <span className="font-bold text-dark-900 text-sm">${parseFloat(order.total).toFixed(2)}</span>
          {open ? <ChevronUp className="w-4 h-4 text-dark-400" /> : <ChevronDown className="w-4 h-4 text-dark-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-dark-100 p-5 space-y-4">
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-dark-50 border border-dark-100 flex-shrink-0">
                  <Image
                    src={item.image || '/placeholder.jpg'}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-dark-900 text-sm line-clamp-1">{item.name}</p>
                  {item.variantName && <p className="text-xs text-dark-400">{item.variantName}</p>}
                  <p className="text-xs text-dark-400">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-dark-900">${parseFloat(item.subtotal).toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Shipping info */}
          {order.shippingAddress && (
            <div className="pt-3 border-t border-dark-100">
              <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-1">Shipped to</p>
              <p className="text-sm text-dark-600">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                {order.shippingAddress.address1}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
              </p>
            </div>
          )}

          {/* Tracking */}
          {order.trackingNumber && (
            <div className="pt-3 border-t border-dark-100">
              <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-1">Tracking</p>
              <p className="text-sm font-mono text-brand-600">{order.trackingNumber}</p>
            </div>
          )}

          {/* Totals */}
          <div className="pt-3 border-t border-dark-100 text-sm space-y-1">
            <div className="flex justify-between text-dark-500">
              <span>Subtotal</span><span>${parseFloat(order.subtotal).toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-brand-600">
                <span>Discount</span><span>-${parseFloat(order.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-dark-500">
              <span>Shipping</span><span>{order.shippingCost === 0 ? 'FREE' : `$${parseFloat(order.shippingCost).toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-bold text-dark-900 pt-1 border-t border-dark-100">
              <span>Total</span><span>${parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list(),
  });

  const orders = data?.data?.orders || [];

  return (
    <AccountLayout>
      <h1 className="text-2xl font-bold text-dark-900 mb-6">My Orders</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-dark-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-dark-200 mx-auto mb-3" />
          <p className="text-dark-500 font-medium">No orders yet</p>
          <p className="text-dark-400 text-sm mt-1 mb-6">Place your first order to see it here</p>
          <Link href="/shop" className="btn-primary">Shop Now</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => <OrderCard key={order.id} order={order} />)}
        </div>
      )}
    </AccountLayout>
  );
}
