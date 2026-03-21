import { useState } from 'react';
import {
  User, Mail, Phone, MapPin, Building2, Send, CheckCircle2,
  Loader2, Shield, X,
} from 'lucide-react';
import { cn } from '../utils/cn';
import type { EnergyInput, EnergyReport, Lead } from '../types';
import { createLead } from '../services/api';

interface Props {
  energyInput: EnergyInput;
  energyReport: EnergyReport;
  onClose: () => void;
  onSuccess: (lead: Lead) => void;
}

export function LeadCaptureForm({ energyInput, energyReport, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pinCode: '',
    currentProvider: '',
    notes: '',
    interestedIn: ['solar'] as string[],
  });

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interestedIn: prev.interestedIn.includes(interest)
        ? prev.interestedIn.filter((i) => i !== interest)
        : [...prev.interestedIn, interest],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.firstName || !form.email || !form.phone) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      const result = await createLead({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: energyInput.state,
        pinCode: form.pinCode,
        propertyType: energyInput.propertyType,
        monthlyBill: energyInput.monthlyBill,
        roofAge: energyInput.roofAge,
        roofType: energyInput.roofType,
        squareFootage: energyInput.squareFootage,
        interestedIn: form.interestedIn,
        currentProvider: form.currentProvider,
        notes: form.notes,
        source: 'Energy Calculator',
        energyReport,
      });

      if (result.success && result.data) {
        setSuccess(true);
        setTimeout(() => onSuccess(result.data!), 2000);
      } else {
        setError(result.error || 'Failed to submit. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Report Requested! 🎉</h3>
          <p className="mt-2 text-slate-500">
            Your personalised solar energy report is being prepared. We'll send it to your email and WhatsApp shortly.
          </p>
          <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            Lead successfully captured and sent to backend ✓
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-slate-100 p-6 pb-4">
          <h2 className="text-xl font-bold text-slate-900">Get Your Free Solar Report</h2>
          <p className="mt-1 text-sm text-slate-500">
            Fill in your details and we'll send your complete personalised energy savings report with subsidy details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    placeholder="Rahul"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  placeholder="Kumar"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  placeholder="rahul@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    placeholder="B-12, Sector 21"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  placeholder="Mumbai"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">PIN Code</label>
                <input
                  type="text"
                  value={form.pinCode}
                  onChange={(e) => updateField('pinCode', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  placeholder="400001"
                  maxLength={6}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Electricity Provider</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.currentProvider}
                    onChange={(e) => updateField('currentProvider', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    placeholder="BSES, Tata Power..."
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Interested In</label>
              <div className="flex flex-wrap gap-2">
                {['solar', 'battery', 'ev-charging', 'smart-home', 'solar-water-heater'].map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-all',
                      form.interestedIn.includes(interest)
                        ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    )}
                  >
                    {interest.replace(/-/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="Any additional details..."
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="mt-6 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 font-semibold text-white shadow-lg shadow-orange-200 transition-all hover:from-orange-600 hover:to-amber-600 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              {loading ? 'Submitting to Backend...' : 'Get My Free Report'}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <Shield className="h-3.5 w-3.5" />
              Your information is secure and will never be shared.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
