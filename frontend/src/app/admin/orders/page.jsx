'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { RefreshCcw, DollarSign } from 'lucide-react';

const STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

const STATUS_STYLE = {
  PENDING: 'badge-yellow',
  PROCESSING: 'badge-blue',
  SHIPPED: 'badge-blue',
  DELIVERED: 'badge-green',
  CANCELLED: 'badge-red',
  REFUNDED: 'badge-gray',
};

function OrderRow({ order, onStatusChange, onRefund }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="hover:bg-dark-50/50 cursor-pointer" onClick={() => setOpen(!open)}>
        <td className="px-4 py-3 font-mono text-xs text-dark-700">{order.orderNumber}</td>
        <td className="px-4 py-3 text-dark-700">{order.customerName || order.user?.email}</td>
        <td className="px-4 py-3 font-semibold text-dark-900">${order.total?.toFixed(2)}</td>
        <td className="px-4 py-3">
          <span className={`badge text-xs ${STATUS_STYLE[order.status] || 'badge-gray'}`}>{order.status}</span>
        </td>
        <td className="px-4 py-3 text-dark-400 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <select
              value={order.status}
              onChange={(e) => onStatusChange(order.id, e.target.value)}
              className="text-xs border border-dark-200 rounded-lg px-2 py-1 bg-white text-dark-700 focus:outline-none focus:ring-1 ring-brand-400"
            >
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            {['DELIVERED', 'PROCESSING'].includes(order.status) && (
              <button onClick={() => onRefund(order)} title="Refund" className="text-dark-400 hover:text-red-500 transition-colors">
                <DollarSign className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} className="bg-dark-50 px-6 py-4 border-t border-dark-100">
            <div className="space-y-2">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                  <span className="font-medium text-dark-900 flex-1">{item.productName}</span>
                  <span className="text-dark-400">×{item.quantity}</span>
                  <span className="font-semibold text-dark-800">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              {order.shippingAddress && (
                <p className="text-xs text-dark-400 mt-2">
                  Ship to: {order.shippingAddress.address1}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                </p>
              )}
              {order.trackingNumber && <p className="text-xs text-dark-500 font-medium">Tracking: {order.trackingNumber}</p>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, status],
    queryFn: () => adminApi.getOrders({ page, limit: 20, status: status || undefined }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status: s }) => adminApi.updateOrderStatus(id, s),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); toast.success('Status updated'); },
    onError: () => toast.error('Failed to update status'),
  });

  const refundMutation = useMutation({
    mutationFn: ({ id }) => adminApi.refundOrder(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); toast.success('Refund initiated'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Refund failed'),
  });

  const orders = data?.data?.orders || [];
  const total = data?.data?.total || 0;
  const pages = Math.ceil(total / 20);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-900">Orders <span className="text-dark-400 font-normal text-lg ml-1">({total})</span></h1>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input w-44 text-sm py-2">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white border border-dark-100 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3 animate-pulse">{[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-dark-100 rounded" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-50 border-b border-dark-100">
                <tr>
                  {['Order #', 'Customer', 'Total', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-dark-500 font-semibold px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {orders.map((o) => (
                  <OrderRow
                    key={o.id}
                    order={o}
                    onStatusChange={(id, s) => statusMutation.mutate({ id, status: s })}
                    onRefund={(o) => { if (confirm(`Refund order ${o.orderNumber}?`)) refundMutation.mutate({ id: o.id }); }}
                  />
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
    </div>
  );
}
