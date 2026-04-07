'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';

const SETTINGS_FIELDS = [
  { section: 'General', fields: [
    { key: 'siteName', label: 'Site Name', type: 'text' },
    { key: 'siteEmail', label: 'Support Email', type: 'email' },
    { key: 'sitePhone', label: 'Phone Number', type: 'text' },
  ]},
  { section: 'Shipping', fields: [
    { key: 'freeShippingThreshold', label: 'Free Shipping Threshold ($)', type: 'number' },
    { key: 'defaultShippingRate', label: 'Flat Shipping Rate ($)', type: 'number' },
  ]},
  { section: 'Business', fields: [
    { key: 'taxRate', label: 'Tax Rate (%)', type: 'number' },
    { key: 'defaultCurrency', label: 'Currency Code', type: 'text' },
  ]},
  { section: 'Partner Program', fields: [
    { key: 'defaultCommissionRate', label: 'Default Commission Rate (%)', type: 'number' },
    { key: 'partnerMinPayout', label: 'Min Payout Amount ($)', type: 'number' },
  ]},
];

export default function AdminSettingsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminApi.getSettings(),
  });

  const settings = data?.data?.settings || {};

  const { register, handleSubmit } = useForm({ values: settings });

  const mutation = useMutation({
    mutationFn: (d) => adminApi.updateSettings(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-settings'] }); toast.success('Settings saved'); },
    onError: () => toast.error('Failed to save settings'),
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-dark-200 rounded w-48" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-dark-100 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-dark-900">Site Settings</h1>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-8">
        {SETTINGS_FIELDS.map(({ section, fields }) => (
          <div key={section} className="bg-white border border-dark-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-dark-900 mb-5">{section}</h2>
            <div className="space-y-4">
              {fields.map(({ key, label, type }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input
                    type={type}
                    step={type === 'number' ? '0.01' : undefined}
                    {...register(key)}
                    className="input"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center gap-2 px-8 py-3">
          <Save className="w-4 h-4" />
          {mutation.isPending ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
