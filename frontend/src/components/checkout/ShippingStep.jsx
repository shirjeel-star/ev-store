'use client';

import { useEffect, useState } from 'react';
import { usersApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';
import { MapPin, ChevronRight } from 'lucide-react';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

export default function ShippingStep({ user, onComplete, loading }) {
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (user) {
      usersApi.getAddresses().then(({ data }) => {
        setSavedAddresses(data.addresses || []);
        const def = data.addresses?.find((a) => a.isDefault);
        if (def) {
          setSelectedAddressId(def.id);
          reset(def);
        }
      }).catch(() => {});
    }
  }, [user]);

  const selectSavedAddress = (addr) => {
    setSelectedAddressId(addr.id);
    reset({
      firstName: addr.firstName,
      lastName: addr.lastName,
      address1: addr.address1,
      address2: addr.address2,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country,
      phone: addr.phone,
    });
  };

  const onSubmit = (data) => {
    onComplete(data);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-dark-900 mb-6">Shipping Address</h2>

      {/* Saved addresses */}
      {savedAddresses.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-dark-700 mb-2">Saved Addresses</p>
          <div className="grid gap-2">
            {savedAddresses.map((addr) => (
              <button
                key={addr.id}
                type="button"
                onClick={() => selectSavedAddress(addr)}
                className={clsx(
                  'w-full text-left p-3 rounded-xl border-2 transition-all flex items-start gap-3',
                  selectedAddressId === addr.id
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-dark-200 hover:border-dark-300'
                )}
              >
                <MapPin className={clsx('w-4 h-4 mt-0.5 flex-shrink-0', selectedAddressId === addr.id ? 'text-brand-600' : 'text-dark-400')} />
                <div className="text-sm">
                  <p className="font-medium text-dark-900">{addr.firstName} {addr.lastName}</p>
                  <p className="text-dark-500">{addr.address1}, {addr.city}, {addr.state} {addr.zip}</p>
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setSelectedAddressId(null); reset(); }}
              className="text-sm text-brand-600 hover:text-brand-700 text-left py-1"
            >
              + Use a different address
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First Name *</label>
            <input
              {...register('firstName', { required: 'Required' })}
              className={clsx('input', errors.firstName && 'input-error')}
              placeholder="John"
            />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input
              {...register('lastName', { required: 'Required' })}
              className={clsx('input', errors.lastName && 'input-error')}
              placeholder="Doe"
            />
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="label">Email *</label>
          <input
            {...register('email', { required: 'Required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })}
            type="email"
            className={clsx('input', errors.email && 'input-error')}
            placeholder="john@example.com"
            defaultValue={user?.email}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Phone *</label>
          <input
            {...register('phone', { required: 'Required' })}
            type="tel"
            className={clsx('input', errors.phone && 'input-error')}
            placeholder="(555) 555-5555"
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="label">Address *</label>
          <input
            {...register('address1', { required: 'Required' })}
            className={clsx('input', errors.address1 && 'input-error')}
            placeholder="123 Main St"
          />
          {errors.address1 && <p className="text-red-500 text-xs mt-1">{errors.address1.message}</p>}
        </div>

        <div>
          <label className="label">Apartment, suite, etc. (optional)</label>
          <input
            {...register('address2')}
            className="input"
            placeholder="Apt 4B"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="label">City *</label>
            <input
              {...register('city', { required: 'Required' })}
              className={clsx('input', errors.city && 'input-error')}
              placeholder="New York"
            />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
          </div>
          <div>
            <label className="label">State *</label>
            <select
              {...register('state', { required: 'Required' })}
              className={clsx('input', errors.state && 'input-error')}
            >
              <option value="">—</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">ZIP Code *</label>
            <input
              {...register('zip', { required: 'Required', pattern: { value: /^\d{5}(-\d{4})?$/, message: 'Invalid ZIP' } })}
              className={clsx('input', errors.zip && 'input-error')}
              placeholder="10001"
            />
            {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip.message}</p>}
          </div>
          <div>
            <label className="label">Country *</label>
            <select {...register('country', { required: true })} className="input">
              <option value="US">United States</option>
              <option value="CA">Canada</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-base py-4 mt-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Preparing payment…
            </span>
          ) : (
            <>Continue to Payment <ChevronRight className="w-5 h-5 ml-1" /></>
          )}
        </button>
      </form>
    </div>
  );
}
