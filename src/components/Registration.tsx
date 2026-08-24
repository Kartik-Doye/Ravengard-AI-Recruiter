import React, { useState } from 'react';
import { registrationSchema } from '../lib/validation';
import { z } from 'zod';

export default function Registration({ user, onComplete }: { user: string, onComplete: (user: string) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    college: '',
    degree: '',
    gradYear: '',
    preferredLanguage: 'English'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [isAdult, setIsAdult] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateField = (field: string, value: any) => {
    try {
      const fieldSchema = (registrationSchema.shape as any)[field];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.issues[0].message }));
      }
    }
  };

  const handleBlur = (field: string) => {
    validateField(field, formData[field as keyof typeof formData]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerErrors([]);
    
    try {
      registrationSchema.parse(formData);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    setLoading(true);
    try {
      const token = user;
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        onComplete(user);
      } else {
        setServerErrors(data.errors || ['An error occurred during registration.']);
      }
    } catch (error) {
      setServerErrors(['Network error. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[600px] mx-auto">
      <h1 className="text-3xl font-semibold mb-2 text-white">Complete your profile</h1>
      <p className="text-white/50 mb-8">Please provide your details to personalize your assessment experience.</p>
      
      {serverErrors.length > 0 && (
        <div className="mb-6 p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-md">
          <ul className="list-disc pl-5 text-sm text-[var(--color-error)] space-y-1">
            {serverErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="glass-panel p-8 rounded-xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-1">Full Name</label>
              <input type="text" id="name" aria-invalid={!!errors.name} aria-errormessage="name-error" aria-required="true" value={formData.name} onBlur={() => handleBlur('name')} onChange={e => { setFormData({...formData, name: e.target.value}); validateField('name', e.target.value); }} className={`w-full px-4 py-2 border ${errors.name ? 'border-[var(--color-error)]' : 'border-white/10'} bg-white/5 rounded-md focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none text-sm text-white`} />
              {errors.name && <p id="name-error" className="mt-1 text-xs text-[var(--color-error)]">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">Email Address</label>
              <input type="email" id="email" aria-invalid={!!errors.email} aria-errormessage="email-error" aria-required="true" value={formData.email} onBlur={() => handleBlur('email')} onChange={e => { setFormData({...formData, email: e.target.value}); validateField('email', e.target.value); }} className={`w-full px-4 py-2 border ${errors.email ? 'border-[var(--color-error)]' : 'border-white/10'} bg-white/5 rounded-md focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none text-sm text-white`} />
              {errors.email && <p id="email-error" className="mt-1 text-xs text-[var(--color-error)]">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-white/80 mb-1">Mobile Number</label>
              <input type="tel" id="mobile" aria-invalid={!!errors.mobile} aria-errormessage="mobile-error" aria-required="true" value={formData.mobile} onBlur={() => handleBlur('mobile')} onChange={e => { setFormData({...formData, mobile: e.target.value}); validateField('mobile', e.target.value); }} className={`w-full px-4 py-2 border ${errors.mobile ? 'border-[var(--color-error)]' : 'border-white/10'} bg-white/5 rounded-md focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none text-sm text-white`} />
              {errors.mobile && <p id="mobile-error" className="mt-1 text-xs text-[var(--color-error)]">{errors.mobile}</p>}
            </div>
            <div>
              <label htmlFor="college" className="block text-sm font-medium text-white/80 mb-1">College Name</label>
              <input type="text" id="college" aria-invalid={!!errors.college} aria-errormessage="college-error" aria-required="true" value={formData.college} onBlur={() => handleBlur('college')} onChange={e => { setFormData({...formData, college: e.target.value}); validateField('college', e.target.value); }} className={`w-full px-4 py-2 border ${errors.college ? 'border-[var(--color-error)]' : 'border-white/10'} bg-white/5 rounded-md focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none text-sm text-white`} />
              {errors.college && <p id="college-error" className="mt-1 text-xs text-[var(--color-error)]">{errors.college}</p>}
            </div>
            <div>
              <label htmlFor="degree" className="block text-sm font-medium text-white/80 mb-1">Degree</label>
              <input type="text" id="degree" aria-invalid={!!errors.degree} aria-errormessage="degree-error" aria-required="true" value={formData.degree} onBlur={() => handleBlur('degree')} onChange={e => { setFormData({...formData, degree: e.target.value}); validateField('degree', e.target.value); }} className={`w-full px-4 py-2 border ${errors.degree ? 'border-[var(--color-error)]' : 'border-white/10'} bg-white/5 rounded-md focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none text-sm text-white`} />
              {errors.degree && <p id="degree-error" className="mt-1 text-xs text-[var(--color-error)]">{errors.degree}</p>}
            </div>
            <div>
              <label htmlFor="gradYear" className="block text-sm font-medium text-white/80 mb-1">Graduation Year</label>
              <input type="number" id="gradYear" aria-invalid={!!errors.gradYear} aria-errormessage="gradYear-error" aria-required="true" value={formData.gradYear} onBlur={() => handleBlur('gradYear')} onChange={e => { setFormData({...formData, gradYear: e.target.value}); validateField('gradYear', e.target.value); }} className={`w-full px-4 py-2 border ${errors.gradYear ? 'border-[var(--color-error)]' : 'border-white/10'} bg-white/5 rounded-md focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none text-sm text-white`} />
              {errors.gradYear && <p id="gradYear-error" className="mt-1 text-xs text-[var(--color-error)]">{errors.gradYear}</p>}
            </div>
            <div>
              <label htmlFor="preferredLanguage" className="block text-sm font-medium text-white/80 mb-1">Preferred Language</label>
              <select id="preferredLanguage" aria-invalid={!!errors.preferredLanguage} aria-errormessage="preferredLanguage-error" aria-required="true" value={formData.preferredLanguage} onBlur={() => handleBlur('preferredLanguage')} onChange={e => { setFormData({...formData, preferredLanguage: e.target.value}); validateField('preferredLanguage', e.target.value); }} className={`w-full px-4 py-2 border ${errors.preferredLanguage ? 'border-[var(--color-error)]' : 'border-white/10'} bg-white/5 rounded-md focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none text-sm text-white`}>
                <option className="text-black" value="English">English</option>
                <option className="text-black" value="Spanish">Spanish</option>
                <option className="text-black" value="French">French</option>
                <option className="text-black" value="Hindi">Hindi</option>
              </select>
              {errors.preferredLanguage && <p id="preferredLanguage-error" className="mt-1 text-xs text-[var(--color-error)]">{errors.preferredLanguage}</p>}
            </div>
          </div>
          
          <label className="flex items-start gap-3 mt-4 cursor-pointer group">
            <div className="flex items-center h-5 mt-0.5">
              <input 
                type="checkbox" 
                required
                checked={isAdult}
                onChange={(e) => setIsAdult(e.target.checked)}
                className="w-4 h-4 text-[var(--color-primary)] bg-white/5 border-white/20 rounded focus:ring-[var(--color-primary)] focus:ring-offset-[var(--color-bg-2)] cursor-pointer"
              />
            </div>
            <span className="text-white/70 text-sm group-hover:text-white transition-colors select-none">
              I confirm that I am at least 18 years of age.
            </span>
          </label>

          <div className="pt-4 border-t border-white/10 mt-6">
            <button disabled={loading || !isAdult} type="submit" className="w-full bg-[var(--color-primary)] text-white font-semibold py-3 px-4 rounded-md hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              {loading ? 'Validating...' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
