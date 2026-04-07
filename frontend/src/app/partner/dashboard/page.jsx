'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { partnersApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Copy, DollarSign, Users, TrendingUp, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  PENDING: 'badge-yellow',
  APPROVED: 'badge-green',
  REJECTED: 'badge-red',
};

export default function PartnerDashboardPage() {
  const router = useRouter();
  const { user, init } = useAuthStore();

  useEffect(() => {
    if (init && !user) router.replace('/auth/login?redirect=/partner/dashboard');
  }, [user, init, router]);

  const { data: dashData } = useQuery({
    queryKey: ['partner-dashboard'],
    queryFn: () => partnersApi.dashboard(),
    enabled: !!user,
  });

  const { data: refData } = useQuery({
    queryKey: ['partner-referrals'],
    queryFn: () => partnersApi.referrals({ limit: 10 }),
    enabled: !!user,
  });

  const dashboard = dashData?.data || {};
  const referrals = refData?.data?.referrals || [];
  const earningsChart = dashboard.earningsByMonth || [];
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${user?.partnerCode || ''}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-dark-50">
      {/* Header */}
      <div className="bg-dark-950 text-white px-4 py-8">
        <div className="container-custom flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Partner Dashboard</h1>
            <p className="text-dark-400 text-sm mt-0.5">Welcome back, {user.firstName}</p>
          </div>
          {dashboard.status && (
            <span className={`badge ${STATUS_BADGE[dashboard.status] || 'badge-gray'} text-sm px-4 py-1.5`}>
              {dashboard.status}
            </span>
          )}
        </div>
      </div>

      <div className="container-custom py-10 space-y-8">
        {/* Referral link */}
        <div className="card p-6">
          <p className="text-sm font-semibold text-dark-700 mb-2">Your Referral Link</p>
          <div className="flex gap-3">
            <input readOnly value={referralLink} className="input flex-1 bg-dark-50 text-sm font-mono" />
            <button onClick={copyLink} className="btn-primary flex items-center gap-2 px-5 whitespace-nowrap">
              <Copy className="w-4 h-4" /> Copy
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: DollarSign, label: 'Total Earnings', value: `$${(dashboard.totalEarnings || 0).toFixed(2)}`, sub: 'All time' },
            { icon: Clock, label: 'Pending', value: `$${(dashboard.pendingEarnings || 0).toFixed(2)}`, sub: 'Awaiting payout' },
            { icon: Users, label: 'Referrals', value: dashboard.totalReferrals || 0, sub: 'Total clicks + orders' },
            { icon: TrendingUp, label: 'Conversion', value: `${(dashboard.conversionRate || 0).toFixed(1)}%`, sub: 'Orders / clicks' },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-brand-600" />
                </div>
                <p className="text-dark-500 text-sm">{label}</p>
              </div>
              <p className="text-2xl font-black text-dark-900">{value}</p>
              <p className="text-xs text-dark-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Earnings chart */}
        {earningsChart.length > 0 && (
          <div className="card p-6">
            <h2 className="text-lg font-bold text-dark-900 mb-6">Earnings Over Time</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={earningsChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => [`$${v}`, 'Earnings']} />
                <Line type="monotone" dataKey="earnings" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: '#22c55e' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Referrals table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-100">
            <h2 className="text-lg font-bold text-dark-900">Recent Referrals</h2>
          </div>
          {referrals.length === 0 ? (
            <div className="px-6 py-12 text-center text-dark-400 text-sm">No referrals yet. Share your link to start earning!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-dark-50">
                  <tr>
                    {['Order #', 'Date', 'Order Total', 'Commission', 'Status'].map((h) => (
                      <th key={h} className="text-left text-dark-500 font-semibold px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-50">
                  {referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-dark-50/50">
                      <td className="px-4 py-3 font-mono text-dark-700">{r.orderNumber}</td>
                      <td className="px-4 py-3 text-dark-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-medium text-dark-900">${r.orderTotal?.toFixed(2)}</td>
                      <td className="px-4 py-3 font-semibold text-brand-600">${r.commission?.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${r.status === 'paid' ? 'badge-green' : r.status === 'pending' ? 'badge-yellow' : 'badge-gray'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
