'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Lock, Eye, EyeOff, MapPin, Plus, Trash2, Check } from 'lucide-react';
import clsx from 'clsx';
import AccountLayout from '@/components/account/AccountLayout';

function ProfileTab() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const onSubmit = async (data) => {
    try {
      const { data: res } = await usersApi.updateProfile(data);
      updateUser(res.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-dark-900 mb-6">Personal Information</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First Name</label>
            <input {...register('firstName', { required: 'Required' })} className={clsx('input', errors.firstName && 'input-error')} />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="label">Last Name</label>
            <input {...register('lastName', { required: 'Required' })} className={clsx('input', errors.lastName && 'input-error')} />
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <input {...register('email', { required: 'Required' })} type="email" className="input" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input {...register('phone')} type="tel" className="input" placeholder="+1 (555) 555-5555" />
        </div>
        <button type="submit" disabled={isSubmitting || !isDirty} className="btn-primary disabled:opacity-50">
          {isSubmitting ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      {/* Change password */}
      <ChangePasswordForm />
    </div>
  );
}

function ChangePasswordForm() {
  const [showForm, setShowForm] = useState(false);
  const [show, setShow] = useState({});
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await usersApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully');
      reset();
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <div className="mt-10 pt-8 border-t border-dark-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-dark-900">Password & Security</h3>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            Change Password
          </button>
        )}
      </div>
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
          {['currentPassword', 'newPassword', 'confirmPassword'].map((field) => {
            const labels = { currentPassword: 'Current Password', newPassword: 'New Password', confirmPassword: 'Confirm New Password' };
            return (
              <div key={field}>
                <label className="label">{labels[field]}</label>
                <div className="relative">
                  <input
                    {...register(field, { required: 'Required', ...(field === 'newPassword' ? { minLength: { value: 8, message: 'Min 8 chars' } } : {}) })}
                    type={show[field] ? 'text' : 'password'}
                    className={clsx('input pr-11', errors[field] && 'input-error')}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShow((s) => ({ ...s, [field]: !s[field] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400">
                    {show[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field].message}</p>}
              </div>
            );
          })}
          <div className="flex gap-3">
            <button type="submit" disabled={isSubmitting} className="btn-primary text-sm disabled:opacity-50">{isSubmitting ? 'Saving…' : 'Update Password'}</button>
            <button type="button" onClick={() => { setShowForm(false); reset(); }} className="btn-secondary text-sm">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

function AddressesTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => usersApi.getAddresses(),
  });
  const addresses = data?.data?.addresses || [];
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const addMutation = useMutation({
    mutationFn: (d) => usersApi.addAddress(d),
    onSuccess: () => { qc.invalidateQueries(['addresses']); setShowForm(false); reset(); toast.success('Address added'); },
    onError: () => toast.error('Failed to add address'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersApi.deleteAddress(id),
    onSuccess: () => { qc.invalidateQueries(['addresses']); toast.success('Address removed'); },
  });

  const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-dark-900">Saved Addresses</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-secondary text-sm px-4 py-2">
          <Plus className="w-4 h-4 mr-1.5" /> Add Address
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-24 bg-dark-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {addresses.map((addr) => (
            <div key={addr.id} className="border border-dark-200 rounded-xl p-4 relative group">
              {addr.isDefault && <span className="absolute top-3 right-3 badge badge-green">Default</span>}
              <p className="font-semibold text-dark-900 text-sm">{addr.firstName} {addr.lastName}</p>
              <p className="text-dark-500 text-sm mt-1">{addr.address1}</p>
              {addr.address2 && <p className="text-dark-500 text-sm">{addr.address2}</p>}
              <p className="text-dark-500 text-sm">{addr.city}, {addr.state} {addr.zip}</p>
              <button
                onClick={() => deleteMutation.mutate(addr.id)}
                className="absolute bottom-3 right-3 p-1.5 text-dark-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {addresses.length === 0 && !showForm && (
            <p className="text-dark-400 text-sm col-span-2">No saved addresses yet.</p>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit((d) => addMutation.mutate(d))} className="border border-dark-200 rounded-xl p-5 space-y-4 max-w-lg">
          <h3 className="font-bold text-dark-900">New Address</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input {...register('firstName', { required: true })} className={clsx('input', errors.firstName && 'input-error')} />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input {...register('lastName', { required: true })} className={clsx('input', errors.lastName && 'input-error')} />
            </div>
          </div>
          <div>
            <label className="label">Address *</label>
            <input {...register('address1', { required: true })} className={clsx('input', errors.address1 && 'input-error')} />
          </div>
          <div>
            <label className="label">Apt/Suite</label>
            <input {...register('address2')} className="input" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">City *</label>
              <input {...register('city', { required: true })} className={clsx('input', errors.city && 'input-error')} />
            </div>
            <div>
              <label className="label">State *</label>
              <select {...register('state', { required: true })} className="input">
                <option value="">—</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">ZIP *</label>
              <input {...register('zip', { required: true })} className={clsx('input', errors.zip && 'input-error')} />
            </div>
            <div>
              <label className="label">Country</label>
              <select {...register('country')} className="input">
                <option value="US">United States</option>
                <option value="CA">Canada</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input {...register('isDefault')} type="checkbox" id="isDefault" className="rounded border-dark-300" />
            <label htmlFor="isDefault" className="text-sm text-dark-700">Set as default address</label>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={addMutation.isPending} className="btn-primary text-sm">
              {addMutation.isPending ? 'Saving…' : 'Save Address'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); reset(); }} className="btn-secondary text-sm">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
];

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const user = useAuthStore((s) => s.user);

  return (
    <AccountLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-900">My Account</h1>
        <p className="text-dark-400 text-sm mt-0.5">Welcome back, {user?.firstName}</p>
      </div>
      <div className="flex gap-1 mb-6 border-b border-dark-100">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === id ? 'border-brand-600 text-brand-600' : 'border-transparent text-dark-500 hover:text-dark-900'
            )}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>
      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'addresses' && <AddressesTab />}
    </AccountLayout>
  );
}
