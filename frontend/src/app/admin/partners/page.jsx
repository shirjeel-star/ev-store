'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';

const STATUS_STYLE = {
  PENDING: 'badge-yellow',
  APPROVED: 'badge-green',
  REJECTED: 'badge-red',
};

function PartnerRow({ partner, onApprove, onReject }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="hover:bg-dark-50/50 cursor-pointer" onClick={() => setOpen(!open)}>
        <td className="px-4 py-3 font-medium text-dark-900">{partner.businessName}</td>
        <td className="px-4 py-3 text-dark-500 text-sm">{partner.user?.email}</td>
        <td className="px-4 py-3 text-dark-500 capitalize">{partner.partnerType}</td>
        <td className="px-4 py-3 text-dark-500">{partner.audienceSize}</td>
        <td className="px-4 py-3">
          <span className={`badge text-xs ${STATUS_STYLE[partner.status] || 'badge-gray'}`}>{partner.status}</span>
        </td>
        <td className="px-4 py-3 font-semibold text-brand-600">{partner.commissionRate ? `${partner.commissionRate}%` : '—'}</td>
        <td className="px-4 py-3 text-dark-400 text-xs">{new Date(partner.createdAt).toLocaleDateString()}</td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          {partner.status === 'PENDING' && (
            <div className="flex items-center gap-2">
              <button onClick={() => onApprove(partner.id)} title="Approve" className="text-brand-600 hover:text-brand-700 transition-colors">
                <CheckCircle className="w-5 h-5" />
              </button>
              <button onClick={() => onReject(partner.id)} title="Reject" className="text-red-500 hover:text-red-600 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          )}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={8} className="bg-dark-50 px-6 py-4 border-t border-dark-100 text-sm">
            <div className="space-y-2">
              <p className="text-dark-700">{partner.description}</p>
              <div className="flex flex-wrap gap-4 text-xs text-dark-400 mt-2">
                {partner.website && (
                  <a href={partner.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-electric-600 hover:text-electric-700" onClick={(e) => e.stopPropagation()}>
                    <ExternalLink className="w-3 h-3" /> {partner.website}
                  </a>
                )}
                {partner.partnerCode && <span>Code: <span className="font-mono font-medium text-dark-700">{partner.partnerCode}</span></span>}
                <span>Total Referrals: <span className="font-medium text-dark-700">{partner.totalReferrals ?? 0}</span></span>
                <span>Commissions Paid: <span className="font-medium text-dark-700">${(partner.commissionsPaid ?? 0).toFixed(2)}</span></span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminPartnersPage() {
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-partners', status, page],
    queryFn: () => adminApi.getPartners({ status, page, limit: 20 }),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => adminApi.approvePartner(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-partners'] }); toast.success('Partner approved'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => adminApi.rejectPartner(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-partners'] }); toast.success('Partner rejected'); },
    onError: () => toast.error('Failed'),
  });

  const partners = data?.data?.partners || [];
  const total = data?.data?.total || 0;
  const pages = Math.ceil(total / 20);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-900">Partners <span className="text-dark-400 font-normal text-lg ml-1">({total})</span></h1>
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${status === s ? 'bg-brand-600 text-white' : 'bg-white border border-dark-200 text-dark-600 hover:border-brand-400'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-dark-100 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3 animate-pulse">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-dark-100 rounded" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-50 border-b border-dark-100">
                <tr>
                  {['Business', 'Email', 'Type', 'Audience', 'Status', 'Rate', 'Applied', ''].map((h) => (
                    <th key={h} className="text-left text-dark-500 font-semibold px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {partners.map((p) => (
                  <PartnerRow
                    key={p.id}
                    partner={p}
                    onApprove={(id) => approveMutation.mutate(id)}
                    onReject={(id) => rejectMutation.mutate(id)}
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
