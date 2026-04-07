import Image from 'next/image';
import { Tag } from 'lucide-react';

export default function OrderSummary({ items, subtotal, discountAmount, total, discount }) {
  const shipping = subtotal >= 150 ? 0 : 9.99;

  return (
    <div className="card p-5 sticky top-24">
      <h3 className="font-bold text-dark-900 mb-4">Order Summary</h3>

      {/* Items */}
      <div className="space-y-3 mb-5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-dark-50 border border-dark-100 flex-shrink-0">
              <Image
                src={item.image || '/placeholder.jpg'}
                alt={item.name}
                fill
                className="object-cover"
                sizes="56px"
              />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-dark-700 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-900 line-clamp-1">{item.name}</p>
              {item.variant && item.variant !== 'Default' && (
                <p className="text-xs text-dark-400">{item.variant}</p>
              )}
            </div>
            <span className="text-sm font-semibold text-dark-900 flex-shrink-0">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-dark-100 pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-dark-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-brand-600">
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              {discount?.code}
            </span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-dark-600">
          <span>Shipping</span>
          <span>{shipping === 0 ? <span className="text-brand-600 font-medium">FREE</span> : `$${shipping.toFixed(2)}`}</span>
        </div>
        {shipping > 0 && (
          <p className="text-xs text-dark-400">Free shipping on orders over $150</p>
        )}
        <div className="flex justify-between font-bold text-dark-900 text-base pt-2 border-t border-dark-100">
          <span>Total</span>
          <span>${(total + shipping).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
