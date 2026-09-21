import React, { useState, useRef, useEffect } from 'react';
import { registrationSchema } from '../lib/validation';
import { 
  Check, 
  ChevronDown, 
  School, 
  AlertCircle, 
  UploadCloud, 
  FileText, 
  Loader2, 
  Sparkles, 
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

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

// Standard Phone Formatter & Validator
export function validatePhoneFormat(phone: string): { valid: boolean; warning?: string } {
  const trimmed = (phone || '').trim();
  if (!trimmed) {
    return { valid: false, warning: "Mobile number is required" };
  }
  const digits = trimmed.replace(/\D/g, '');
  
  // Accepts standard formats: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890, +1 123-456-7890, international 10-15 digits
  const formatValid = /^(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}$/.test(trimmed) ||
                      /^\+?[0-9\s\-().]{10,20}$/.test(trimmed);

  if (digits.length < 10 || digits.length > 15 || !formatValid) {
    return { valid: false, warning: "Please enter a valid 10-digit phone number" };
  }
  return { valid: true };
}

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

  // Resume Upload Drop Zone State
  const [isDragging, setIsDragging] = useState(false);
  const [parsingResume, setParsingResume] = useState(false);
  const [parsedFileName, setParsedFileName] = useState<string | null>(null);
  const [parsedFileSize, setParsedFileSize] = useState<number | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [parseSuccessMsg, setParseSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Immediate inline check for phone number
    if (field === 'mobile') {
      const phoneCheck = validatePhoneFormat(value);
      if (!phoneCheck.valid) {
        setErrors(prev => ({ ...prev, mobile: phoneCheck.warning || "Please enter a valid 10-digit phone number" }));
        return;
      }
    }

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

  // Resume processing handler
  const processResumeFile = async (file: File) => {
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.pdf') && !ext.endsWith('.docx') && !ext.endsWith('.doc')) {
      setServerErrors(["Unsupported file format. Please upload a PDF or DOCX resume."]);
      return;
    }

    setParsingResume(true);
    setServerErrors([]);
    setParseSuccessMsg(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('resume', file);

      const res = await fetch('/api/candidate/parse-resume', {
        method: 'POST',
        body: uploadFormData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to extract candidate details from resume.");
      }

      const p = data.parsed || {};
      const newValues = {
        name: p.name || formData.name,
        email: p.email || formData.email,
        mobile: p.mobile || formData.mobile,
        college: p.college || formData.college,
        degree: p.degree || formData.degree,
        gradYear: p.gradYear ? String(p.gradYear) : formData.gradYear,
        preferredLanguage: formData.preferredLanguage
      };

      setFormData(prev => ({
        ...prev,
        ...newValues
      }));

      if (p.college) {
        setCollegeSearch(p.college);
      }

      if (data.rawResumeText) {
        setResumeText(data.rawResumeText);
      }

      setParsedFileName(file.name);
      setParsedFileSize(file.size);
      setParseSuccessMsg(`Resume "${file.name}" parsed cleanly! Details have been pre-filled below.`);

      // Clear any previous field errors since fields were pre-filled
      setErrors({});
    } catch (err: any) {
      console.error("Resume parse error:", err);
      setServerErrors([err.message || "Unable to parse resume. You can still fill in the details manually."]);
    } finally {
      setParsingResume(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processResumeFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processResumeFile(e.target.files[0]);
    }
  };

  // Helper to load sample resume (PDF or DOCX) directly for quick testing
  const handleLoadSampleResume = async (type: 'pdf' | 'docx' = 'pdf') => {
    try {
      setParsingResume(true);
      const url = type === 'docx' ? '/sample-resume.docx' : '/sample-resume.pdf';
      const fileName = type === 'docx' ? 'elena-rostova-sample-resume.docx' : 'alex-rivera-sample-resume.pdf';
      const mime = type === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf';
      
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: mime });
      await processResumeFile(file);
    } catch (err: any) {
      console.error("Sample resume load error:", err);
      // Fallback pre-fill directly
      if (type === 'docx') {
        setFormData(prev => ({
          ...prev,
          name: 'Elena Rostova',
          email: 'elena.rostova@example.com',
          mobile: '(555) 019-2834',
          college: 'Stanford University',
          degree: 'M.S. Machine Learning & AI',
          gradYear: '2025'
        }));
        setCollegeSearch('Stanford University');
        setParsedFileName('elena-rostova-sample-resume.docx');
      } else {
        setFormData(prev => ({
          ...prev,
          name: 'Alex Rivera',
          email: 'alex.rivera@example.com',
          mobile: '(555) 019-2834',
          college: 'University of California, Berkeley',
          degree: 'B.S. Computer Science',
          gradYear: '2024'
        }));
        setCollegeSearch('University of California, Berkeley');
        setParsedFileName('alex-rivera-sample-resume.pdf');
      }
      setParseSuccessMsg('Sample resume details pre-filled cleanly!');
      setErrors({});
    } finally {
      setParsingResume(false);
    }
  };

  const isPhoneValid = validatePhoneFormat(formData.mobile).valid;

  const isFormValid = Boolean(
    isAdult &&
    formData.name.trim() &&
    formData.email.trim() &&
    isPhoneValid &&
    formData.college.trim() &&
    formData.degree.trim() &&
    formData.gradYear.trim()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerErrors([]);
    
    // Check phone format first to provide inline warning if invalid
    const phoneCheck = validatePhoneFormat(formData.mobile);
    let newErrors: Record<string, string> = {};
    let hasErrors = false;

    if (!phoneCheck.valid) {
      hasErrors = true;
      newErrors['mobile'] = phoneCheck.warning || "Please enter a valid 10-digit phone number";
    }

    const result = registrationSchema.safeParse(formData);
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
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout
      
      let res;
      try {
        res = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            resumeText: resumeText || undefined
          }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      let data: any = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        data = null;
      }

      if (res.ok && data?.success !== false) {
        onComplete(user);
      } else {
        // Extract EXACT error messages returned by API payload — replace generic banners
        const errorList: string[] = [];
        if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          data.errors.forEach((err: any) => {
            const errStr = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
            errorList.push(errStr);
            if (errStr.toLowerCase().includes('phone') || errStr.toLowerCase().includes('mobile')) {
              setErrors(prev => ({ ...prev, mobile: errStr }));
            }
            if (errStr.toLowerCase().includes('email')) {
              setErrors(prev => ({ ...prev, email: errStr }));
            }
          });
        } else if (data?.error && typeof data.error === 'string') {
          errorList.push(data.error);
        } else if (data?.message && typeof data.message === 'string') {
          errorList.push(data.message);
        } else {
          errorList.push(`Registration request failed (${res.status} ${res.statusText || 'Server Error'})`);
        }
        setServerErrors(errorList);
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        setServerErrors(['Registration request timed out. Please check your network and retry.']);
      } else {
        setServerErrors([error?.message || 'Network connectivity error. Please check your connection.']);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[680px] mx-auto py-4">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2 text-white tracking-tight">Complete your profile</h1>
        <p className="text-white/60 text-sm">
          Please provide your candidate details to personalize your proctored assessment session.
        </p>
      </div>
      
      {/* Exact Server Error Banner */}
      {serverErrors.length > 0 && (
        <div id="registration-error-banner" className="mb-6 p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/40 rounded-xl flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-[var(--color-error)] shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm text-[var(--color-error)]">
            <p className="font-semibold">Registration notice:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {serverErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Parse Success Banner */}
      {parseSuccessMsg && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3 text-emerald-300 text-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{parseSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setParseSuccessMsg(null)}
            className="text-xs text-emerald-400/70 hover:text-emerald-300 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Glass Panel Card */}
      <div className="glass-panel p-8 rounded-2xl border border-white/10 bg-[#0b0f19]/85 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        
        {/* Upload Resume Drop Zone */}
        <div id="upload-resume-dropzone" className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Upload Resume</span>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Auto-Fills Form
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleLoadSampleResume('pdf')}
                disabled={parsingResume}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors underline cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" /> Sample PDF
              </button>
              <span className="text-white/20">•</span>
              <button
                type="button"
                onClick={() => handleLoadSampleResume('docx')}
                disabled={parsingResume}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors underline cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" /> Sample DOCX
              </button>
            </div>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center ${
              isDragging
                ? 'border-violet-400 bg-violet-500/10 scale-[1.01]'
                : parsedFileName
                ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60'
                : 'border-white/15 bg-white/[0.02] hover:border-violet-400/50 hover:bg-white/[0.04]'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".pdf,.docx,.doc"
              onChange={handleFileInputChange}
              className="hidden" 
              id="resume-file-input"
            />

            {parsingResume ? (
              <div className="py-3 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                <p className="text-sm font-medium text-white">Extracting candidate details from resume...</p>
                <p className="text-xs text-white/40">Parsing name, email, phone, university, and degree</p>
              </div>
            ) : parsedFileName ? (
              <div className="flex items-center justify-between gap-4 text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{parsedFileName}</p>
                    <p className="text-xs text-white/50">
                      {parsedFileSize ? `${(parsedFileSize / 1024).toFixed(1)} KB • ` : ''}Parsed and pre-filled below
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg shrink-0 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Replace
                </button>
              </div>
            ) : (
              <div className="py-2 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-2.5">
                  <UploadCloud className="w-5 h-5 text-violet-400" />
                </div>
                <p className="text-sm font-medium text-white mb-0.5">
                  Drag and drop your resume (PDF or DOCX) here
                </p>
                <p className="text-xs text-white/50">
                  or <span className="text-violet-400 underline font-medium">browse files</span> from your device
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Candidate Profile Form */}
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
                onChange={e => { 
                  const val = e.target.value;
                  setFormData({...formData, name: val}); 
                  validateField('name', val); 
                }} 
                className={`w-full px-3.5 py-2.5 border ${errors.name ? 'border-[var(--color-error)]' : 'border-white/10 focus:border-violet-400'} bg-white/5 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none text-sm text-white placeholder-white/25 transition-all`} 
              />
              {errors.name && <p id="name-error" className="mt-1.5 text-xs text-[var(--color-error)] flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{errors.name}</p>}
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
                onChange={e => { 
                  const val = e.target.value;
                  setFormData({...formData, email: val}); 
                  validateField('email', val); 
                }} 
                className={`w-full px-3.5 py-2.5 border ${errors.email ? 'border-[var(--color-error)]' : 'border-white/10 focus:border-violet-400'} bg-white/5 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none text-sm text-white placeholder-white/25 transition-all`} 
              />
              {errors.email && <p id="email-error" className="mt-1.5 text-xs text-[var(--color-error)] flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{errors.email}</p>}
            </div>

            {/* Mobile Number with Format Validation & Inline Warning */}
            <div>
              <label htmlFor="mobile" className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                Mobile Number <span className="text-violet-400">*</span>
              </label>
              <input 
                type="tel" 
                id="mobile" 
                placeholder="(555) 019-2834 or +1 (555) 019-2834"
                aria-invalid={!!errors.mobile} 
                aria-errormessage="mobile-error" 
                aria-required="true" 
                value={formData.mobile} 
                onBlur={() => handleBlur('mobile')} 
                onChange={e => { 
                  const val = e.target.value;
                  setFormData({...formData, mobile: val}); 
                  validateField('mobile', val); 
                }} 
                className={`w-full px-3.5 py-2.5 border ${errors.mobile ? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]/30' : 'border-white/10 focus:border-violet-400'} bg-white/5 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none text-sm text-white placeholder-white/25 transition-all`} 
              />
              {errors.mobile ? (
                <p id="mobile-error" className="mt-1.5 text-xs text-[var(--color-error)] flex items-center gap-1.5 font-medium animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.mobile}</span>
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-white/40">Standard 10-digit format (e.g. (555) 019-2834 or 555-019-2834)</p>
              )}
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
              {errors.college && <p id="college-error" className="mt-1.5 text-xs text-[var(--color-error)] flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{errors.college}</p>}
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
                  onChange={e => { 
                    const val = e.target.value;
                    setFormData({...formData, degree: val}); 
                    validateField('degree', val); 
                  }} 
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
              {errors.degree && <p id="degree-error" className="mt-1.5 text-xs text-[var(--color-error)] flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{errors.degree}</p>}
            </div>

            {/* Graduation Year: Constrained numerical select dropdown */}
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
                  onChange={e => { 
                    const val = e.target.value;
                    setFormData({...formData, gradYear: val}); 
                    validateField('gradYear', val); 
                  }} 
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
              {errors.gradYear && <p id="gradYear-error" className="mt-1.5 text-xs text-[var(--color-error)] flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{errors.gradYear}</p>}
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
                  onChange={e => { 
                    const val = e.target.value;
                    setFormData({...formData, preferredLanguage: val}); 
                    validateField('preferredLanguage', val); 
                  }} 
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
              {errors.preferredLanguage && <p id="preferredLanguage-error" className="mt-1.5 text-xs text-[var(--color-error)] flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{errors.preferredLanguage}</p>}
            </div>
          </div>
          
          {/* 18+ Checkbox */}
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

          {/* Submit Button */}
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
                {!isAdult ? "Please verify age eligibility to proceed." : !isPhoneValid ? "Please enter a valid 10-digit phone number." : "Please fill out all required fields above."}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
