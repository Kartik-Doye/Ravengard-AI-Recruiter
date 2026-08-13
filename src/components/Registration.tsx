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
        setErrors(prev => ({ ...prev, [field]: error.errors[0].message }));
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
        error.errors.forEach(err => {
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
      <h1 className="text-3xl font-semibold mb-2 text-slate-900">Complete your profile</h1>
      <p className="text-slate-500 mb-8">Please provide your details to personalize your assessment experience.</p>
      
      {serverErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <ul className="list-disc pl-5 text-sm text-red-600 space-y-1">
            {serverErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input type="text" value={formData.name} onBlur={() => handleBlur('name')} onChange={e => { setFormData({...formData, name: e.target.value}); validateField('name', e.target.value); }} className={`w-full px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-slate-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm`} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input type="email" value={formData.email} onBlur={() => handleBlur('email')} onChange={e => { setFormData({...formData, email: e.target.value}); validateField('email', e.target.value); }} className={`w-full px-4 py-2 border ${errors.email ? 'border-red-500' : 'border-slate-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm`} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
              <input type="tel" value={formData.mobile} onBlur={() => handleBlur('mobile')} onChange={e => { setFormData({...formData, mobile: e.target.value}); validateField('mobile', e.target.value); }} className={`w-full px-4 py-2 border ${errors.mobile ? 'border-red-500' : 'border-slate-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm`} />
              {errors.mobile && <p className="mt-1 text-xs text-red-500">{errors.mobile}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">College Name</label>
              <input type="text" value={formData.college} onBlur={() => handleBlur('college')} onChange={e => { setFormData({...formData, college: e.target.value}); validateField('college', e.target.value); }} className={`w-full px-4 py-2 border ${errors.college ? 'border-red-500' : 'border-slate-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm`} />
              {errors.college && <p className="mt-1 text-xs text-red-500">{errors.college}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Degree</label>
              <input type="text" value={formData.degree} onBlur={() => handleBlur('degree')} onChange={e => { setFormData({...formData, degree: e.target.value}); validateField('degree', e.target.value); }} className={`w-full px-4 py-2 border ${errors.degree ? 'border-red-500' : 'border-slate-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm`} />
              {errors.degree && <p className="mt-1 text-xs text-red-500">{errors.degree}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Graduation Year</label>
              <input type="number" value={formData.gradYear} onBlur={() => handleBlur('gradYear')} onChange={e => { setFormData({...formData, gradYear: e.target.value}); validateField('gradYear', e.target.value); }} className={`w-full px-4 py-2 border ${errors.gradYear ? 'border-red-500' : 'border-slate-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm`} />
              {errors.gradYear && <p className="mt-1 text-xs text-red-500">{errors.gradYear}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Language</label>
              <select value={formData.preferredLanguage} onBlur={() => handleBlur('preferredLanguage')} onChange={e => { setFormData({...formData, preferredLanguage: e.target.value}); validateField('preferredLanguage', e.target.value); }} className={`w-full px-4 py-2 border ${errors.preferredLanguage ? 'border-red-500' : 'border-slate-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white`}>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="Hindi">Hindi</option>
              </select>
              {errors.preferredLanguage && <p className="mt-1 text-xs text-red-500">{errors.preferredLanguage}</p>}
            </div>
          </div>
          
          <label className="flex items-start gap-3 mt-4 cursor-pointer group">
            <div className="flex items-center h-5 mt-0.5">
              <input 
                type="checkbox" 
                required
                checked={isAdult}
                onChange={(e) => setIsAdult(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <span className="text-slate-700 text-sm group-hover:text-slate-900 select-none">
              I confirm that I am at least 18 years of age.
            </span>
          </label>

          <div className="pt-4 border-t border-slate-200 mt-6">
            <button disabled={loading || !isAdult} type="submit" className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
              {loading ? 'Validating...' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
