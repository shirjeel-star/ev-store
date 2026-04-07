'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  price: z.number({ coercion: true }).positive(),
  compareAtPrice: z.number({ coercion: true }).optional(),
  stock: z.number({ coercion: true }).int().nonnegative(),
  category: z.string().min(1),
  sku: z.string().min(1),
  featured: z.boolean().optional(),
});

function ProductModal({ product, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!product?.id;

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: product || { featured: false },
  });

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? adminApi.updateProduct(product.id, data) : adminApi.createProduct(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(isEdit ? 'Product updated' : 'Product created');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error saving product'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100">
          <h2 className="text-lg font-bold">{isEdit ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Product Name</label>
              <input {...register('name')} className="input" />
              {errors.name && <p className="input-error">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Slug</label>
              <input {...register('slug')} className="input" />
              {errors.slug && <p className="input-error">{errors.slug.message}</p>}
            </div>
            <div>
              <label className="label">SKU</label>
              <input {...register('sku')} className="input" />
              {errors.sku && <p className="input-error">{errors.sku.message}</p>}
            </div>
            <div>
              <label className="label">Price ($)</label>
              <input type="number" step="0.01" {...register('price')} className="input" />
              {errors.price && <p className="input-error">{errors.price.message}</p>}
            </div>
            <div>
              <label className="label">Compare Price ($)</label>
              <input type="number" step="0.01" {...register('compareAtPrice')} className="input" />
            </div>
            <div>
              <label className="label">Stock</label>
              <input type="number" {...register('stock')} className="input" />
              {errors.stock && <p className="input-error">{errors.stock.message}</p>}
            </div>
            <div>
              <label className="label">Category</label>
              <select {...register('category')} className="input">
                <option value="">Select…</option>
                <option value="ev-chargers">EV Chargers</option>
                <option value="nema-splitters">NEMA Splitters</option>
                <option value="accessories">Accessories</option>
              </select>
              {errors.category && <p className="input-error">{errors.category.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea {...register('description')} rows={3} className="input resize-none" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="featured" {...register('featured')} className="w-4 h-4 text-brand-600 rounded" />
              <label htmlFor="featured" className="text-sm text-dark-700">Featured product</label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [modal, setModal] = useState(null); // null | 'create' | product object
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page],
    queryFn: () => adminApi.getProducts({ page, limit: 15 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteProduct(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Deleted'); },
    onError: () => toast.error('Delete failed'),
  });

  const products = data?.data?.products || [];
  const total = data?.data?.total || 0;
  const pages = Math.ceil(total / 15);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-900">Products <span className="text-dark-400 font-normal text-lg ml-1">({total})</span></h1>
        <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Product
        </button>
      </div>

      <div className="bg-white border border-dark-100 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3 animate-pulse">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-dark-100 rounded" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-50 border-b border-dark-100">
                <tr>
                  {['Name', 'SKU', 'Category', 'Price', 'Stock', 'Status', ''].map((h) => (
                    <th key={h} className="text-left text-dark-500 font-semibold px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-dark-50/50">
                    <td className="px-4 py-3 font-medium text-dark-900 max-w-xs truncate">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-dark-500">{p.sku}</td>
                    <td className="px-4 py-3 text-dark-500 capitalize">{p.category}</td>
                    <td className="px-4 py-3 font-semibold text-dark-900">${p.price?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={p.stock > 5 ? 'text-brand-600' : p.stock > 0 ? 'text-amber-600' : 'text-red-500'}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${p.isActive !== false ? 'badge-green' : 'badge-gray'}`}>{p.isActive !== false ? 'Active' : 'Draft'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModal(p)} className="text-dark-400 hover:text-brand-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button
                          onClick={() => { if (confirm('Delete this product?')) deleteMutation.mutate(p.id); }}
                          className="text-dark-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-100 text-sm">
            <span className="text-dark-400">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Prev</button>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {modal && <ProductModal product={modal === 'create' ? null : modal} onClose={() => setModal(null)} />}
    </div>
  );
}
