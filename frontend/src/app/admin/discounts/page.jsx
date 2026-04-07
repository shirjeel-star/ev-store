'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Trash2, X } from 'lucide-react';

const schema = z.object({
  code: z.string().min(3).max(30).regex(/^[A-Z0-9_-]+$/, 'Uppercase, numbers, dashes only'),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number({ coercion: true }).positive(),
  minOrderAmount: z.number({ coercion: true }).min(0).optional(),
  maxUses: z.number({ coercion: true }).int().positive().optional(),
  expiresAt: z.string().optional(),
  active: z.boolean().optional(),
});

function DiscountModal({ onClose }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'PERCENTAGE', active: true },
  });

  const mutation = useMutation({
    mutationFn: (data) => adminApi.createDiscount(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-discounts'] }); toast.success('Discount created'); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100">
          <h2 className="text-lg font-bold">New Discount Code</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="label">Code</label>
            <input {...register('code')} className="input uppercase" placeholder="SAVE20" />
            {errors.code && <p className="input-error">{errors.code.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select {...register('type')} className="input">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed ($)</option>
              </select>
            </div>
            <div>
              <label className="label">Value</label>
              <input type="number" step="0.01" {...register('value')} className="input" />
              {errors.value && <p className="input-error">{errors.value.message}</p>}
            </div>
            <div>
              <label className="label">Min Order ($)</label>
              <input type="number" step="0.01" {...register('minOrderAmount')} className="input" />
            </div>
            <div>
              <label className="label">Max Uses</label>
              <input type="number" {...register('maxUses')} className="input" placeholder="Unlimited" />
            </div>
          </div>
          <div>
            <label className="label">Expires At</label>
            <input type="date" {...register('expiresAt')} className="input" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" {...register('active')} className="w-4 h-4 text-brand-600 rounded" />
            <label htmlFor="active" className="text-sm text-dark-700">Active immediately</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDiscountsPage() {
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-discounts'],
    queryFn: () => adminApi.getDiscounts(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteDiscount(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-discounts'] }); toast.success('Deleted'); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }) => adminApi.updateDiscount(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-discounts'] }),
  });

  const discounts = data?.data?.discounts || [];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-900">Discount Codes</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Code
        </button>
      </div>

      <div className="bg-white border border-dark-100 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3 animate-pulse">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-dark-100 rounded" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-50 border-b border-dark-100">
                <tr>
                  {['Code', 'Type', 'Value', 'Min Order', 'Uses', 'Expires', 'Active', ''].map((h) => (
                    <th key={h} className="text-left text-dark-500 font-semibold px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-dark-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-dark-900">{d.code}</td>
                    <td className="px-4 py-3 text-dark-500 capitalize">{d.type.toLowerCase()}</td>
                    <td className="px-4 py-3 font-semibold text-brand-600">{d.type === 'PERCENTAGE' ? `${d.value}%` : `$${d.value}`}</td>
                    <td className="px-4 py-3 text-dark-500">{d.minOrderAmount ? `$${d.minOrderAmount}` : '—'}</td>
                    <td className="px-4 py-3 text-dark-500">{d.usedCount ?? 0}{d.maxUses ? ` / ${d.maxUses}` : ''}</td>
                    <td className="px-4 py-3 text-dark-400 text-xs">{d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : 'Never'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleMutation.mutate({ id: d.id, active: !d.active })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${d.active ? 'bg-brand-500' : 'bg-dark-200'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${d.active ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { if (confirm('Delete this code?')) deleteMutation.mutate(d.id); }} className="text-dark-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <DiscountModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
