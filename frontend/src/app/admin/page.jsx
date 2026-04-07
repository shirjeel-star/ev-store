'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { DollarSign, ShoppingCart, Users, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.dashboard(),
    staleTime: 60_000,
  });

  const d = data?.data || {};
  const revenueByDay = d.revenueByDay || [];
  const ordersByDay = d.ordersByDay || [];

  const stats = [
    { icon: DollarSign, label: 'Total Revenue', value: `$${(d.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, change: d.revenueChange, color: 'bg-brand-50 text-brand-600' },
    { icon: ShoppingCart, label: 'Total Orders', value: (d.totalOrders || 0).toLocaleString(), change: d.ordersChange, color: 'bg-electric-50 text-electric-600' },
    { icon: Users, label: 'New Customers', value: (d.newCustomers || 0).toLocaleString(), change: d.customersChange, color: 'bg-purple-50 text-purple-600' },
    { icon: TrendingUp, label: 'Avg Order Value', value: `$${(d.avgOrderValue || 0).toFixed(2)}`, change: d.aovChange, color: 'bg-amber-50 text-amber-600' },
  ];

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-dark-200 rounded w-48" />
        <div className="grid grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-dark-200 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-dark-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-dark-900">Dashboard</h1>
        <p className="text-dark-400 text-sm mt-0.5">Last 30 days overview</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map(({ icon: Icon, label, value, change, color }) => {
          const isPos = (change || 0) >= 0;
          return (
            <div key={label} className="bg-white border border-dark-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {change !== undefined && (
                  <div className={`flex items-center gap-0.5 text-xs font-semibold ${isPos ? 'text-brand-600' : 'text-red-500'}`}>
                    {isPos ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {Math.abs(change)}%
                  </div>
                )}
              </div>
              <p className="text-2xl font-black text-dark-900">{value}</p>
              <p className="text-dark-400 text-xs mt-0.5">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue */}
        <div className="bg-white border border-dark-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-dark-900 mb-5">Revenue (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} width={60} />
              <Tooltip formatter={(v) => [`$${v}`, 'Revenue']} labelFormatter={(l) => `Date: ${l}`} />
              <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders */}
        <div className="bg-white border border-dark-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-dark-900 mb-5">Orders (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ordersByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v, 'Orders']} labelFormatter={(l) => `Date: ${l}`} />
              <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent orders */}
      {d.recentOrders?.length > 0 && (
        <div className="bg-white border border-dark-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-100">
            <h2 className="text-base font-bold text-dark-900">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-50">
                <tr>
                  {['Order', 'Customer', 'Total', 'Status', 'Date'].map((h) => (
                    <th key={h} className="text-left text-dark-500 font-semibold px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {d.recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-dark-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-dark-700">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-dark-700">{o.customerName}</td>
                    <td className="px-4 py-3 font-semibold text-dark-900">${o.total?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${o.status === 'DELIVERED' ? 'badge-green' : o.status === 'PROCESSING' ? 'badge-blue' : o.status === 'CANCELLED' ? 'badge-red' : 'badge-yellow'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
