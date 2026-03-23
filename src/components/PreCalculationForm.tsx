import { useState } from 'react';
import {
  User, Mail, Phone, Building2, MapPin, ArrowRight, CheckCircle2,
  Loader2,
} from 'lucide-react';
import { cn } from '../utils/cn';

interface UserContactData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  designation: string;
  city: string;
  whatsappConsent: boolean;
}

interface Props {
  onSubmit: (data: UserContactData) => void;
  onSaveToDatabase?: (data: UserContactData) => Promise<void>;
}

export function PreCalculationForm({ onSubmit, onSaveToDatabase }: Props) {
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState<UserContactData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    designation: '',
    city: '',
    whatsappConsent: true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UserContactData, string>>>({});

  const updateField = <K extends keyof UserContactData>(key: K, value: UserContactData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof UserContactData, string>> = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email format';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[+]?[\d\s-]{10,}$/.test(form.phone)) newErrors.phone = 'Invalid phone number';
    if (!form.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!form.designation.trim()) newErrors.designation = 'Designation is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.whatsappConsent) newErrors.whatsappConsent = 'Please accept to continue';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSaveError('');

    try {
      if (onSaveToDatabase) {
        try {
          await onSaveToDatabase(form);
        } catch (dbError) {
          // Log but don't block — user still gets their report
          console.error('Database save error (non-blocking):', dbError);
        }
      }
      await new Promise((r) => setTimeout(r, 300));
      onSubmit(form);
    } catch (error) {
      setSaveError('Something went wrong. Please try again.');
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <Building2 className="h-7 w-7 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Enter Your Details</h2>
        <p className="mt-2 text-sm text-slate-500">
          Provide your contact information to get personalized recommendations and save your analysis progress.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  className={cn(
                    'w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm text-slate-900 transition focus:outline-none focus:ring-2',
                    errors.firstName
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-300 focus:border-green-500 focus:ring-green-200'
                  )}
                  placeholder="Rajesh"
                />
              </div>
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                className={cn(
                  'w-full rounded-xl border py-2.5 px-3 text-sm text-slate-900 transition focus:outline-none focus:ring-2',
                  errors.lastName
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:border-green-500 focus:ring-green-200'
                )}
                placeholder="Sharma"
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Company Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                className={cn(
                  'w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm text-slate-900 transition focus:outline-none focus:ring-2',
                  errors.companyName
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:border-green-500 focus:ring-green-200'
                )}
                placeholder="Sharma Textiles Pvt Ltd"
              />
            </div>
            {errors.companyName && <p className="mt-1 text-xs text-red-500">{errors.companyName}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Designation <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.designation}
              onChange={(e) => updateField('designation', e.target.value)}
              className={cn(
                'w-full rounded-xl border py-2.5 px-3 text-sm text-slate-900 transition focus:outline-none focus:ring-2',
                errors.designation
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                  : 'border-slate-300 focus:border-green-500 focus:ring-green-200'
              )}
              placeholder="Managing Director"
            />
            {errors.designation && <p className="mt-1 text-xs text-red-500">{errors.designation}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={cn(
                  'w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm text-slate-900 transition focus:outline-none focus:ring-2',
                  errors.email
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:border-green-500 focus:ring-green-200'
                )}
                placeholder="rajesh@company.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Mobile / WhatsApp <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className={cn(
                  'w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm text-slate-900 transition focus:outline-none focus:ring-2',
                  errors.phone
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:border-green-500 focus:ring-green-200'
                )}
                placeholder="+91 98765 43210"
              />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              City <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                className={cn(
                  'w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm text-slate-900 transition focus:outline-none focus:ring-2',
                  errors.city
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:border-green-500 focus:ring-green-200'
                )}
                placeholder="Coimbatore"
              />
            </div>
            {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
          </div>

          <div className={cn(
            'flex items-start gap-3 rounded-xl bg-slate-50 p-4',
            errors.whatsappConsent && 'border border-red-300 bg-red-50'
          )}>
            <input
              type="checkbox"
              id="whatsappConsent"
              checked={form.whatsappConsent}
              onChange={(e) => updateField('whatsappConsent', e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-green-500 focus:ring-green-200"
            />
            <label htmlFor="whatsappConsent" className={cn(
              'text-sm',
              errors.whatsappConsent ? 'text-red-600' : 'text-slate-600'
            )}>
              I agree to receive updates on WhatsApp and email about solar solutions and government subsidies. <span className="text-red-500">*</span>
            </label>
          </div>
          {errors.whatsappConsent && <p className="mt-1 text-xs text-red-500">{errors.whatsappConsent}</p>}
        </div>

        {saveError && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {saveError}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-green-200 transition-all hover:from-green-600 hover:to-emerald-600 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue to Analysis
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
