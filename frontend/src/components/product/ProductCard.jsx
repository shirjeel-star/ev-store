'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Star, Heart, Eye, Zap, Tag } from 'lucide-react';
import { useState } from 'react';
import useCartStore from '@/store/cartStore';
import useUIStore from '@/store/uiStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function ProductCard({ product }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);
  const [imgSrc, setImgSrc] = useState(product.images?.[0]?.url || '/placeholder.jpg');
  const [hoverSrc, setHoverSrc] = useState(product.images?.[1]?.url || product.images?.[0]?.url || '/placeholder.jpg');
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useUIStore((s) => s.openCart);

  const defaultVariant = product.variants?.[0];
  const price = parseFloat(defaultVariant?.price || product.price || product.basePrice || 0);
  const comparePrice = parseFloat(defaultVariant?.comparePrice || defaultVariant?.compareAtPrice || product.comparePrice || product.compareAtPrice || 0);
  const salePercent = comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;
  const inStock = product.variants?.some((v) => (v.stock ?? v.inventory ?? 0) > 0) ?? true;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!defaultVariant || !inStock) return;
    setAdding(true);
    try {
      await addItem(defaultVariant.id, 1);
      toast.success(`${product.name} added to cart`);
      openCart();
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group card hover:shadow-card-hover transition-all duration-300">
      {/* Image */}
      <Link href={`/shop/${product.slug}`} className="block relative aspect-square overflow-hidden bg-dark-50">
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          className="object-cover group-hover:opacity-0 transition-opacity duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          onError={() => setImgSrc('/placeholder.jpg')}
        />
        <Image
          src={hoverSrc}
          alt={product.name}
          fill
          className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          onError={() => setHoverSrc('/placeholder.jpg')}
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {salePercent > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
              <Tag className="w-3 h-3" /> -{salePercent}%
            </span>
          )}
          {product.badges?.includes('BEST_SELLER') && (
            <span className="px-2 py-0.5 bg-brand-600 text-white text-xs font-bold rounded-full">Best Seller</span>
          )}
          {!inStock && (
            <span className="px-2 py-0.5 bg-dark-500 text-white text-xs font-bold rounded-full">Out of Stock</span>
          )}
        </div>

        {/* Quick actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.preventDefault(); setIsWishlisted(!isWishlisted); }}
            className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-brand-50 transition-colors"
          >
            <Heart className={clsx('w-4 h-4', isWishlisted ? 'fill-red-500 text-red-500' : 'text-dark-400')} />
          </button>
          <Link
            href={`/shop/${product.slug}`}
            className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-brand-50 transition-colors"
          >
            <Eye className="w-4 h-4 text-dark-400" />
          </Link>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {product.category && (
          <p className="text-xs text-dark-400 font-medium mb-1">{product.category.name}</p>
        )}
        <Link href={`/shop/${product.slug}`}>
          <h3 className="font-semibold text-dark-900 text-sm leading-snug line-clamp-2 hover:text-brand-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product._count?.reviews > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={clsx(
                    'w-3 h-3',
                    i < Math.round(product.avgRating || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-dark-200'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-dark-400">({product._count.reviews})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-dark-900 text-lg">${price.toFixed(2)}</span>
          {comparePrice > price && (
            <span className="text-dark-400 text-sm line-through">${comparePrice.toFixed(2)}</span>
          )}
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock || adding || !defaultVariant}
          className={clsx(
            'w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
            inStock
              ? 'bg-dark-900 text-white hover:bg-brand-600 active:bg-brand-700'
              : 'bg-dark-100 text-dark-400 cursor-not-allowed',
            adding && 'opacity-70'
          )}
        >
          {adding ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Adding…
            </span>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              {inStock ? 'Add to Cart' : 'Out of Stock'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
