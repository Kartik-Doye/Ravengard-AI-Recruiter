import React, { useState, useRef, useEffect } from 'react';
import { registrationSchema } from '../lib/validation';
import { Check, ChevronDown, School, AlertCircle } from 'lucide-react';

const COMMON_COLLEGES = [
  "Massachusetts Institute of Technology",
  "Stanford University",
  "University of California, Berkeley",
  "Carnegie Mellon University",
  "University of Waterloo",
  "Georgia Institute of Technology",
  "Harvard University",
  "California Institute of Technology",
  "University of Texas at Austin",
  "University of Washington",
  "University of Illinois Urbana-Champaign",
  "University of Michigan",
  "Princeton University",
  "Cornell University",
  "Columbia University",
  "University of Toronto",
  "University of British Columbia",
  "University of Oxford",
  "University of Cambridge",
  "Imperial College London",
  "ETH Zurich",
  "National University of Singapore",
  "Nanyang Technological University",
  "Indian Institute of Technology Bombay",
  "Indian Institute of Technology Delhi",
  "Indian Institute of Technology Madras",
  "Tsinghua University",
  "Peking University"
];

const DEGREE_OPTIONS = [
  "B.S. Computer Science",
  "B.S. Software Engineering",
  "B.S. Electrical Engineering & Computer Science (EECS)",
  "B.S. Data Science & Artificial Intelligence",
  "B.S. Mathematics & Computer Science",
  "B.A. Computer Science",
  "M.S. Computer Science",
  "M.S. Software Engineering",
  "M.S. Distributed Systems & Cloud Architecture",
  "M.S. Machine Learning & AI",
  "Ph.D. Computer Science / Engineering",
  "Other / Self-Taught Developer"
];

const GRAD_YEARS = Array.from({ length: 11 }, (_, i) => (2020 + i).toString());

export default function Registration({ user, onComplete }: { user: string, onComplete: (user: string) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    college: '',
    degree: '',
    gradYear: '2024',
    preferredLanguage: 'English'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [isAdult, setIsAdult] = useState(false);
  const [loading, setLoading] = useState(false);

  // College autocomplete state
  const [collegeSearch, setCollegeSearch] = useState('');
  const [isCollegeOpen, setIsCollegeOpen] = useState(false);
  const collegeRef = useRef<HTMLDivElement>(null);

  const filteredColleges = collegeSearch.trim() === ''
    ? COMMON_COLLEGES.slice(0, 8)
    : COMMON_COLLEGES.filter(c => c.toLowerCase().includes(collegeSearch.toLowerCase()));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (collegeRef.current && !collegeRef.current.contains(e.target as Node)) {
        setIsCollegeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateField = (field: string, value: any) => {
    const result = registrationSchema.safeParse({ ...formData, [field]: value });
    if (!result.success) {
      const fieldError = result.error.issues.find(err => err.path[0] === field);
      if (fieldError) {
        setErrors(prev => ({ ...prev, [field]: fieldError.message }));
        return;
      }
    }
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field: string) => {
    validateField(field, formData[field as keyof typeof formData]);
  };

  const isFormValid = Boolean(
    isAdult &&
    formData.name.trim() &&
    formData.email.trim() &&
    formData.mobile.trim() &&
    formData.college.trim() &&
    formData.degree.trim() &&
    formData.gradYear.trim()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerErrors([]);
    
    const result = registrationSchema.safeParse(formData);
    let newErrors: Record<string, string> = {};
    let hasErrors = false;
    
    if (!result.success) {
      hasErrors = true;
      result.error.issues.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
    }
    
    if (!isAdult) {
      hasErrors = true;
      newErrors['isAdult'] = 'You must confirm you are 18 or older.';
    }
    
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setLoading(true);
    try {
      const token = user;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout
      
      let res;
      try {
        res = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }
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
    <div className="max-w-[640px] mx-auto py-4">
      <h1 className="text-3xl font-semibold mb-2 text-white tracking-tight">Complete your profile</h1>
      <p className="text-white/60 mb-8 text-sm">Please provide your details to personalize your candidate assessment copilot experience.</p>
      
      {serverErrors.length > 0 && (
        <div className="mb-6 p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--color-error)] shrink-0 mt-0.5" />
          <ul className="list-disc pl-2 text-sm text-[var(--color-error)] space-y-1">
            {serverErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="glass-panel p-8 rounded-2xl border border-white/10 bg-[#0b0f19]/80 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                Full Name <span className="text-violet-400">*</span>
              </label>
              <input 
                type="text" 
                id="name" 
                placeholder="e.g. Elena Rostova"
                aria-invalid={!!errors.name} 
                aria-errormessage="name-error" 
                aria-required="true" 
                value={formData.name} 
                onBlur={() => handleBlur('name')} 
                onChange={e => { setFormData({...formData, name: e.target.value}); validateField('name', e.target.value); }} 
                className={`w-full px-3.5 py-2.5 border ${errors.name ? 'border-[var(--color-error)]' : 'border-white/10 focus:border-violet-400'} bg-white/5 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none text-sm text-white placeholder-white/25 transition-all`} 
              />
              {errors.name && <p id="name-error" className="mt-1 text-xs text-[var(--color-error)]">{errors.name}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                Email Address <span className="text-violet-400">*</span>
              </label>
              <input 
                type="email" 
                id="email" 
                placeholder="elena@example.com"
                aria-invalid={!!errors.email} 
                aria-errormessage="email-error" 
                aria-required="true" 
                value={formData.email} 
                onBlur={() => handleBlur('email')} 
                onChange={e => { setFormData({...formData, email: e.target.value}); validateField('email', e.target.value); }} 
                className={`w-full px-3.5 py-2.5 border ${errors.email ? 'border-[var(--color-error)]' : 'border-white/10 focus:border-violet-400'} bg-white/5 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none text-sm text-white placeholder-white/25 transition-all`} 
              />
              {errors.email && <p id="email-error" className="mt-1 text-xs text-[var(--color-error)]">{errors.email}</p>}
            </div>

            {/* Mobile Number */}
            <div>
              <label htmlFor="mobile" className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                Mobile Number <span className="text-violet-400">*</span>
              </label>
              <input 
                type="tel" 
                id="mobile" 
                placeholder="+1 555-0192"
                aria-invalid={!!errors.mobile} 
                aria-errormessage="mobile-error" 
                aria-required="true" 
                value={formData.mobile} 
                onBlur={() => handleBlur('mobile')} 
                onChange={e => { setFormData({...formData, mobile: e.target.value}); validateField('mobile', e.target.value); }} 
                className={`w-full px-3.5 py-2.5 border ${errors.mobile ? 'border-[var(--color-error)]' : 'border-white/10 focus:border-violet-400'} bg-white/5 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none text-sm text-white placeholder-white/25 transition-all`} 
              />
              {errors.mobile && <p id="mobile-error" className="mt-1 text-xs text-[var(--color-error)]">{errors.mobile}</p>}
            </div>

            {/* College Name: Typeahead / Search-and-Select Autocomplete */}
            <div className="relative" ref={collegeRef}>
              <label htmlFor="college" className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5 flex items-center justify-between">
                <span>College / University <span className="text-violet-400">*</span></span>
                <span className="text-[10px] text-white/40 normal-case">Type or choose from list</span>
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  id="college" 
                  autoComplete="off"
                  placeholder="Search university or enter name..."
                  aria-invalid={!!errors.college} 
                  aria-errormessage="college-error" 
                  aria-required="true" 
                  value={formData.college} 
                  onFocus={() => {
                    setCollegeSearch(formData.college);
                    setIsCollegeOpen(true);
                  }}
                  onBlur={() => {
                    handleBlur('college');
                  }} 
                  onChange={e => { 
                    const val = e.target.value;
                    setFormData({...formData, college: val}); 
                    setCollegeSearch(val);
                    setIsCollegeOpen(true);
                    validateField('college', val); 
                  }} 
                  className={`w-full pl-3.5 pr-9 py-2.5 border ${errors.college ? 'border-[var(--color-error)]' : 'border-white/10 focus:border-violet-400'} bg-white/5 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none text-sm text-white placeholder-white/25 transition-all`} 
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setIsCollegeOpen(prev => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${isCollegeOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {isCollegeOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-56 overflow-y-auto rounded-xl border border-white/15 bg-[#121826] shadow-2xl backdrop-blur-2xl py-1 text-sm">
                  {filteredColleges.length > 0 ? (
                    filteredColleges.map((collegeName) => {
                      const isSelected = formData.college === collegeName;
                      return (
                        <button
                          key={collegeName}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormData(prev => ({ ...prev, college: collegeName }));
                            setCollegeSearch(collegeName);
                            validateField('college', collegeName);
                            setIsCollegeOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-white/10 transition-colors ${
                            isSelected ? 'bg-violet-600/20 text-violet-300 font-medium' : 'text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <School className="w-3.5 h-3.5 text-white/40 shrink-0" />
                            <span className="truncate">{collegeName}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-violet-400 shrink-0 ml-2" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3.5 py-2.5 text-xs text-white/50 italic">
                      No preset match found. You can keep typing "{collegeSearch}" as custom institution.
                    </div>
                  )}
                </div>
              )}
              {errors.college && <p id="college-error" className="mt-1 text-xs text-[var(--color-error)]">{errors.college}</p>}
            </div>

            {/* Degree Field: Standardized Dropdown */}
            <div>
              <label htmlFor="degree" className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                Standardized Degree <span className="text-violet-400">*</span>
              </label>
              <div className="relative">
                <select 
                  id="degree" 
                  aria-invalid={!!errors.degree} 
                  aria-errormessage="degree-error" 
                  aria-required="true" 
                  value={formData.degree} 
                  onBlur={() => handleBlur('degree')} 
                  onChange={e => { setFormData({...formData, degree: e.target.value}); validateField('degree', e.target.value); }} 
                  className={`w-full pl-3.5 pr-10 py-2.5 border appearance-none ${errors.degree ? 'border-[var(--color-error)]' : 'border-white/10 focus:border-violet-400'} bg-white/5 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none text-sm text-white transition-all`}
                >
                  <option value="" disabled className="bg-[#121826] text-white/40">Select degree program...</option>
                  {DEGREE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#121826] text-white">
                      {opt}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              {errors.degree && <p id="degree-error" className="mt-1 text-xs text-[var(--color-error)]">{errors.degree}</p>}
            </div>

            {/* Graduation Year: Constrained numerical select dropdown (2020–2030) */}
            <div>
              <label htmlFor="gradYear" className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                Graduation Year <span className="text-violet-400">*</span>
              </label>
              <div className="relative">
                <select 
                  id="gradYear" 
                  aria-invalid={!!errors.gradYear} 
                  aria-errormessage="gradYear-error" 
                  aria-required="true" 
                  value={formData.gradYear} 
                  onBlur={() => handleBlur('gradYear')} 
                  onChange={e => { setFormData({...formData, gradYear: e.target.value}); validateField('gradYear', e.target.value); }} 
                  className={`w-full pl-3.5 pr-10 py-2.5 border appearance-none ${errors.gradYear ? 'border-[var(--color-error)]' : 'border-white/10 focus:border-violet-400'} bg-white/5 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none text-sm text-white transition-all`}
                >
                  {GRAD_YEARS.map(yr => (
                    <option key={yr} value={yr} className="bg-[#121826] text-white">{yr}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              {errors.gradYear && <p id="gradYear-error" className="mt-1 text-xs text-[var(--color-error)]">{errors.gradYear}</p>}
            </div>

            {/* Preferred Language */}
            <div className="md:col-span-2">
              <label htmlFor="preferredLanguage" className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                Preferred Assessment Language <span className="text-violet-400">*</span>
              </label>
              <div className="relative">
                <select 
                  id="preferredLanguage" 
                  aria-invalid={!!errors.preferredLanguage} 
                  aria-errormessage="preferredLanguage-error" 
                  aria-required="true" 
                  value={formData.preferredLanguage} 
                  onBlur={() => handleBlur('preferredLanguage')} 
                  onChange={e => { setFormData({...formData, preferredLanguage: e.target.value}); validateField('preferredLanguage', e.target.value); }} 
                  className={`w-full pl-3.5 pr-10 py-2.5 border appearance-none ${errors.preferredLanguage ? 'border-[var(--color-error)]' : 'border-white/10 focus:border-violet-400'} bg-white/5 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none text-sm text-white transition-all`}
                >
                  <option className="bg-[#121826] text-white" value="English">English</option>
                  <option className="bg-[#121826] text-white" value="Spanish">Spanish</option>
                  <option className="bg-[#121826] text-white" value="French">French</option>
                  <option className="bg-[#121826] text-white" value="Hindi">Hindi</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              {errors.preferredLanguage && <p id="preferredLanguage-error" className="mt-1 text-xs text-[var(--color-error)]">{errors.preferredLanguage}</p>}
            </div>
          </div>
          
          {/* 18+ Checkbox with explicit hover, focus-visible ring, and interactive state */}
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all">
            <label className="flex items-start gap-3.5 cursor-pointer group select-none">
              <div className="flex items-center h-5 mt-0.5">
                <input 
                  type="checkbox" 
                  id="isAdultCheck"
                  required
                  checked={isAdult}
                  onChange={(e) => setIsAdult(e.target.checked)}
                  className="w-4 h-4 text-violet-600 bg-white/10 border-white/20 rounded focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0b0f19] cursor-pointer transition-all"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                  I confirm that I am at least 18 years of age.
                </span>
                <span className="text-xs text-white/50 mt-0.5">
                  Mandatory candidate verification requirement under EEOC & GDPR hiring compliance guidelines.
                </span>
              </div>
            </label>
            {errors.isAdult && <p className="text-[var(--color-error)] text-xs mt-2 ml-7.5">{errors.isAdult}</p>}
          </div>

          {/* Submit Button with clear visual indication for disabled state */}
          <div className="pt-2 border-t border-white/10">
            <button 
              disabled={loading || !isFormValid} 
              type="submit" 
              className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                isFormValid && !loading
                  ? 'bg-violet-600 text-white hover:bg-violet-500 hover:shadow-[0_0_24px_rgba(139,92,246,0.45)] cursor-pointer active:scale-[0.99]'
                  : 'bg-white/5 text-white/35 border border-white/10 cursor-not-allowed shadow-none'
              }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Validating Profile...
                </>
              ) : (
                'Complete Profile'
              )}
            </button>
            {!isFormValid && (
              <p className="text-center text-xs text-white/40 mt-2.5">
                {!isAdult ? "Please verify age eligibility to proceed." : "Please fill out all required fields above."}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
