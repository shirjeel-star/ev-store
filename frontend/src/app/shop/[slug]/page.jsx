'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { productsApi } from '@/lib/api';
import useCartStore from '@/store/cartStore';
import useUIStore from '@/store/uiStore';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Heart, Share2, ChevronRight, Star, Check, Zap,
  ShieldCheck, Truck, ChevronDown, ChevronUp, Minus, Plus
} from 'lucide-react';
import clsx from 'clsx';
import ReviewSection from '@/components/product/ReviewSection';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [openAccordion, setOpenAccordion] = useState('description');
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useUIStore((s) => s.openCart);

  const { data, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.get(slug),
  });

  const product = data?.data?.product;

  const variants = product?.variants || [];
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || variants[0];
  const images = product?.images || [];
  const price = parseFloat(selectedVariant?.price || 0);
  const comparePrice = parseFloat(selectedVariant?.comparePrice || 0);
  const salePercent = comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;
  const inStock = (selectedVariant?.stock || 0) > 0;

  const handleAddToCart = async () => {
    if (!selectedVariant || !inStock) return;
    setAdding(true);
    try {
      await addItem(selectedVariant.id, quantity);
      toast.success(`${product.name} added to cart`);
      openCart();
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const toggleAccordion = (key) => setOpenAccordion(openAccordion === key ? null : key);

  if (isLoading) {
    return (
      <div className="container-custom py-12">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-square bg-dark-100 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 bg-dark-100 rounded animate-pulse" style={{ width: `${80 - i * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-custom py-20 text-center">
        <p className="text-dark-500 text-lg">Product not found.</p>
        <Link href="/shop" className="btn-primary mt-4 inline-flex">Back to Shop</Link>
      </div>
    );
  }

  const specs = product.specs || {};
  const features = product.features || [];

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-dark-100">
        <div className="container-custom py-3">
          <nav className="flex items-center gap-1.5 text-xs text-dark-400">
            <Link href="/" className="hover:text-dark-700 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/shop" className="hover:text-dark-700 transition-colors">Shop</Link>
            {product.category && (
              <>
                <ChevronRight className="w-3 h-3" />
                <Link href={`/shop?category=${product.category.slug}`} className="hover:text-dark-700 transition-colors">
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3 h-3" />
            <span className="text-dark-700 truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-10">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-dark-50 border border-dark-100">
              <Image
                src={images[activeImage]?.url || '/placeholder.jpg'}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {salePercent > 0 && (
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">-{salePercent}%</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={clsx(
                      'relative aspect-square rounded-xl overflow-hidden border-2 transition-all',
                      i === activeImage ? 'border-brand-500' : 'border-transparent hover:border-dark-200'
                    )}
                  >
                    <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.category && (
              <Link href={`/shop?category=${product.category.slug}`} className="text-brand-600 text-sm font-medium">
                {product.category.name}
              </Link>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-dark-900 mt-1 leading-tight">{product.name}</h1>

            {/* Rating */}
            {product._count?.reviews > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={clsx('w-4 h-4', i < Math.round(product.avgRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-dark-200')} />
                  ))}
                </div>
                <a href="#reviews" className="text-sm text-dark-400 hover:text-brand-600 transition-colors">
                  {product._count.reviews} review{product._count.reviews !== 1 ? 's' : ''}
                </a>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-3 mt-4">
              <span className="text-3xl font-bold text-dark-900">${price.toFixed(2)}</span>
              {comparePrice > price && (
                <>
                  <span className="text-xl text-dark-400 line-through">${comparePrice.toFixed(2)}</span>
                  <span className="badge bg-red-100 text-red-600 font-bold">Save ${(comparePrice - price).toFixed(2)}</span>
                </>
              )}
            </div>

            {/* Variant selector */}
            {variants.length > 1 && (
              <div className="mt-5">
                <p className="text-sm font-semibold text-dark-700 mb-2">
                  {product.variantLabel || 'Option'}:{' '}
                  <span className="text-brand-600">{selectedVariant?.name}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      disabled={v.stock === 0}
                      className={clsx(
                        'px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all',
                        (selectedVariantId === v.id || (!selectedVariantId && v.id === variants[0]?.id))
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-dark-200 text-dark-600 hover:border-dark-300',
                        v.stock === 0 && 'opacity-40 cursor-not-allowed line-through'
                      )}
                    >
                      {v.name}
                      {v.price !== variants[0]?.price && (
                        <span className="ml-1 text-xs text-dark-400">(${parseFloat(v.price).toFixed(2)})</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-5 flex items-center gap-4">
              <div>
                <p className="text-sm font-semibold text-dark-700 mb-2">Quantity</p>
                <div className="flex items-center gap-1 border border-dark-200 rounded-xl w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-dark-500 hover:text-dark-900 disabled:opacity-30"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-semibold text-dark-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedVariant?.stock || 10, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center text-dark-500 hover:text-dark-900 disabled:opacity-30"
                    disabled={quantity >= (selectedVariant?.stock || 10)}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="pt-6">
                {inStock ? (
                  <span className="badge badge-green">
                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full mr-1.5" />
                    In Stock
                  </span>
                ) : (
                  <span className="badge badge-red">Out of Stock</span>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || adding}
                className="flex-1 btn-primary text-base py-4 disabled:opacity-50"
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
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {inStock ? 'Add to Cart' : 'Out of Stock'}
                  </>
                )}
              </button>
              <button className="w-12 h-12 mt-0.5 flex items-center justify-center border-2 border-dark-200 rounded-xl text-dark-500 hover:text-red-500 hover:border-red-200 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              <button className="w-12 h-12 mt-0.5 flex items-center justify-center border-2 border-dark-200 rounded-xl text-dark-500 hover:text-brand-600 hover:border-brand-200 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: ShieldCheck, text: 'ETL Certified', sub: 'Safety tested' },
                { icon: Truck, text: 'Free Shipping', sub: 'On orders $150+' },
                { icon: Zap, text: '2-Year Warranty', sub: 'Expert support' },
              ].map(({ icon: Icon, text, sub }) => (
                <div key={text} className="text-center p-3 rounded-xl bg-dark-50 border border-dark-100">
                  <Icon className="w-5 h-5 text-brand-600 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-dark-900">{text}</p>
                  <p className="text-xs text-dark-400">{sub}</p>
                </div>
              ))}
            </div>

            {/* Accordion */}
            <div className="mt-6 border-t border-dark-100 divide-y divide-dark-100">
              {[
                {
                  key: 'description',
                  title: 'Description',
                  content: (
                    <p className="text-dark-600 text-sm leading-relaxed">{product.description}</p>
                  ),
                },
                features.length > 0 && {
                  key: 'features',
                  title: 'Key Features',
                  content: (
                    <ul className="space-y-2">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-dark-600">
                          <Check className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  ),
                },
                Object.keys(specs).length > 0 && {
                  key: 'specs',
                  title: 'Specifications',
                  content: (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {Object.entries(specs).map(([key, val]) => (
                        <div key={key}>
                          <dt className="text-dark-400">{key}</dt>
                          <dd className="font-medium text-dark-900">{val}</dd>
                        </div>
                      ))}
                    </dl>
                  ),
                },
              ]
                .filter(Boolean)
                .map(({ key, title, content }) => (
                  <div key={key}>
                    <button
                      onClick={() => toggleAccordion(key)}
                      className="flex items-center justify-between w-full py-4 text-sm font-semibold text-dark-900 hover:text-brand-600 transition-colors"
                    >
                      {title}
                      {openAccordion === key ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {openAccordion === key && <div className="pb-4">{content}</div>}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section id="reviews" className="mt-20 border-t border-dark-100 pt-12">
          <ReviewSection productSlug={slug} product={product} />
        </section>
      </div>
    </div>
  );
}
