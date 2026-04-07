'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

function CustomerRow({ c }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="hover:bg-dark-50/50 cursor-pointer" onClick={() => setOpen(!open)}>
        <td className="px-4 py-3 font-medium text-dark-900">{c.firstName} {c.lastName}</td>
        <td className="px-4 py-3 text-dark-500 text-sm">{c.email}</td>
        <td className="px-4 py-3 text-dark-700">{c._count?.orders ?? 0}</td>
        <td className="px-4 py-3 font-semibold text-dark-900">${(c.totalSpent || 0).toFixed(2)}</td>
        <td className="px-4 py-3">
          <span className={`badge text-xs ${c.role === 'ADMIN' ? 'badge-red' : c.role === 'PARTNER' ? 'badge-blue' : 'badge-gray'}`}>{c.role}</span>
        </td>
        <td className="px-4 py-3 text-dark-400 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
        <td className="px-4 py-3 text-dark-400">{open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} className="bg-dark-50 px-6 py-3 border-t border-dark-100 text-sm">
            <div className="flex flex-wrap gap-6">
              <div><span className="text-dark-400 text-xs">Phone: </span><span className="text-dark-700">{c.phone || '—'}</span></div>
              <div><span className="text-dark-400 text-xs">Email verified: </span><span className={c.emailVerified ? 'text-brand-600' : 'text-red-500'}>{c.emailVerified ? 'Yes' : 'No'}</span></div>
              <div><span className="text-dark-400 text-xs">Partner code: </span><span className="font-mono text-dark-700">{c.partnerCode || '—'}</span></div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', page, search],
    queryFn: () => adminApi.getCustomers({ page, limit: 20, search: search || undefined }),
  });

  const customers = data?.data?.customers || [];
  const total = data?.data?.total || 0;
  const pages = Math.ceil(total / 20);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-900">Customers <span className="text-dark-400 font-normal text-lg ml-1">({total})</span></h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search customers…"
            className="input pl-9 py-2 text-sm w-56"
          />
        </div>
      </div>

      <div className="bg-white border border-dark-100 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3 animate-pulse">{[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-dark-100 rounded" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-50 border-b border-dark-100">
                <tr>
                  {['Name', 'Email', 'Orders', 'Total Spent', 'Role', 'Joined', ''].map((h) => (
                    <th key={h} className="text-left text-dark-500 font-semibold px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {customers.map((c) => <CustomerRow key={c.id} c={c} />)}
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
    </div>
  );
}
