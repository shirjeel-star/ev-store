'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, Suspense } from 'react';
import { productsApi } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { Filter, SlidersHorizontal, X, ChevronDown, ChevronUp, Search } from 'lucide-react';
import clsx from 'clsx';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

const CATEGORIES = [
  { value: '', label: 'All Products' },
  { value: 'ev-chargers', label: 'EV Chargers' },
  { value: 'nema-splitters', label: 'NEMA Splitters' },
  { value: 'accessories', label: 'Accessories' },
];

const PRICE_RANGES = [
  { label: 'Under $200', min: 0, max: 200 },
  { label: '$200 – $400', min: 200, max: 400 },
  { label: '$400 – $700', min: 400, max: 700 },
  { label: '$700+', min: 700, max: 99999 },
];

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [openSections, setOpenSections] = useState({ category: true, price: true });

  const params = {
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'featured',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', params],
    queryFn: () => productsApi.list({ ...params, limit: 12 }),
    keepPreviousData: true,
  });

  const products = data?.data?.products || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    if (key !== 'page') p.delete('page');
    router.push(`/shop?${p.toString()}`);
  };

  const toggleSection = (key) =>
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  const FiltersPanel = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateParam('search', e.target.search.value);
          }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            name="search"
            defaultValue={params.search}
            placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>
      </div>

      {/* Category */}
      <div>
        <button
          onClick={() => toggleSection('category')}
          className="flex items-center justify-between w-full font-semibold text-dark-900 text-sm mb-3"
        >
          Category
          {openSections.category ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {openSections.category && (
          <div className="space-y-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => updateParam('category', cat.value)}
                className={clsx(
                  'block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  params.category === cat.value
                    ? 'bg-brand-600 text-white font-medium'
                    : 'text-dark-600 hover:bg-dark-50'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price */}
      <div>
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full font-semibold text-dark-900 text-sm mb-3"
        >
          Price Range
          {openSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {openSections.price && (
          <div className="space-y-1.5">
            {PRICE_RANGES.map((range) => {
              const active = params.minPrice === String(range.min) && params.maxPrice === String(range.max);
              return (
                <button
                  key={range.label}
                  onClick={() => {
                    if (active) {
                      updateParam('minPrice', '');
                      updateParam('maxPrice', '');
                    } else {
                      const p = new URLSearchParams(searchParams.toString());
                      p.set('minPrice', range.min);
                      p.set('maxPrice', range.max);
                      p.delete('page');
                      router.push(`/shop?${p.toString()}`);
                    }
                  }}
                  className={clsx(
                    'block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                    active
                      ? 'bg-brand-600 text-white font-medium'
                      : 'text-dark-600 hover:bg-dark-50'
                  )}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Clear */}
      {(params.category || params.search || params.minPrice) && (
        <button
          onClick={() => router.push('/shop')}
          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium"
        >
          <X className="w-4 h-4" /> Clear filters
        </button>
      )}
    </div>
  );

  return (
    <div className="container-custom py-10">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">
            {params.category ? CATEGORIES.find((c) => c.value === params.category)?.label || 'Products' : 'All Products'}
          </h1>
          <p className="text-dark-400 text-sm mt-0.5">
            {isLoading ? '…' : `${total} product${total !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-dark-200 rounded-xl text-sm font-medium text-dark-700 hover:bg-dark-50 transition-colors"
          >
            <Filter className="w-4 h-4" /> Filters
          </button>

          {/* Sort */}
          <div className="relative">
            <select
              value={params.sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="appearance-none pl-4 pr-8 py-2.5 border border-dark-200 rounded-xl text-sm font-medium text-dark-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer bg-white"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <SlidersHorizontal className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <FiltersPanel />
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-dark-50 rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-dark-400 text-lg">No products found.</p>
              <button onClick={() => router.push('/shop')} className="mt-4 btn-secondary">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className={clsx('grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5', isFetching && 'opacity-60 pointer-events-none')}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => updateParam('page', i + 1)}
                      className={clsx(
                        'w-10 h-10 rounded-xl text-sm font-medium transition-colors',
                        params.page === i + 1
                          ? 'bg-brand-600 text-white'
                          : 'border border-dark-200 text-dark-600 hover:bg-dark-50'
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <>
          <div className="fixed inset-0 bg-dark-900/50 z-50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white p-6 overflow-y-auto animate-slide-in-right">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-dark-900 text-lg">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)}>
                <X className="w-5 h-5 text-dark-500" />
              </button>
            </div>
            <FiltersPanel />
          </div>
        </>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense>
      <ShopContent />
    </Suspense>
  );
}
