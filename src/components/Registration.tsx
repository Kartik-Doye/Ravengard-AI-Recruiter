import React, { useState, useRef, useEffect } from 'react';
import { registrationSchema } from '../lib/validation';
import { useToast } from '../contexts/ToastContext';
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
  CheckCircle2, 
  Lock, 
  Eye, 
  EyeOff, 
  KeyRound,
  Globe,
  Phone,
  Search
} from 'lucide-react';
import { 
  PasswordStrengthIndicator, 
  evaluatePasswordStrength, 
  getPasswordStrength 
} from './auth/PasswordStrengthIndicator';
import { 
  COUNTRIES, 
  CountryInfo, 
  DEFAULT_COUNTRY, 
  detectDefaultCountry, 
  validateNationalPhone 
} from '../lib/countryData';

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

// Backward-compatible phone validator export
export function validatePhoneFormat(phone: string, country?: CountryInfo): { valid: boolean; warning?: string } {
  const trimmed = (phone || '').trim();
  if (!trimmed) {
    return { valid: false, warning: "Mobile number is required" };
  }
  if (country) {
    return validateNationalPhone(trimmed, country);
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 16) {
    return { valid: false, warning: "Please enter a valid phone number" };
  }
  return { valid: true };
}

export default function Registration({ user, onComplete }: { user: string, onComplete: (user: string) => void }) {
  const { addToast } = useToast();

  // Country & Dialing Code state
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(DEFAULT_COUNTRY);
  const [selectedDialCountry, setSelectedDialCountry] = useState<CountryInfo>(DEFAULT_COUNTRY);
  const [phoneLocal, setPhoneLocal] = useState('');
  
  // Country & Dial picker dropdowns state
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [isDialPickerOpen, setIsDialPickerOpen] = useState(false);
  const [dialSearch, setDialSearch] = useState('');
  
  const countryRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    country: DEFAULT_COUNTRY.name,
    college: '',
    degree: '',
    gradYear: '2024',
    preferredLanguage: 'English'
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  // 1. Auto-detect Country & Calling Code on Mount via Locale & Timezone + IP fallback
  useEffect(() => {
    const detected = detectDefaultCountry();
    setSelectedCountry(detected);
    setSelectedDialCountry(detected);
    setFormData(prev => ({
      ...prev,
      country: detected.name
    }));

    // Async IP-based geolocation check to detect exact ISP country if available
    const controller = new AbortController();
    fetch('https://ipapi.co/json/', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data && data.country_code) {
          const match = COUNTRIES.find(c => c.code === data.country_code);
          if (match) {
            setSelectedCountry(match);
            setSelectedDialCountry(match);
            setFormData(prev => ({
              ...prev,
              country: match.name
            }));
          }
        }
      })
      .catch(() => {
        // Fallback silently to browser locale / timezone detection
      });

    return () => controller.abort();
  }, []);

  // Filtered lists for typeahead / search
  const filteredCountries = countrySearch.trim() === ''
    ? COUNTRIES
    : COUNTRIES.filter(c => 
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
        c.code.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.dialCode.includes(countrySearch)
      );

  const filteredDialCountries = dialSearch.trim() === ''
    ? COUNTRIES
    : COUNTRIES.filter(c => 
        c.name.toLowerCase().includes(dialSearch.toLowerCase()) || 
        c.dialCode.includes(dialSearch) ||
        c.code.toLowerCase().includes(dialSearch.toLowerCase())
      );

  const filteredColleges = collegeSearch.trim() === ''
    ? COMMON_COLLEGES.slice(0, 8)
    : COMMON_COLLEGES.filter(c => c.toLowerCase().includes(collegeSearch.toLowerCase()));

  // Outside click handlers
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (collegeRef.current && !collegeRef.current.contains(e.target as Node)) {
        setIsCollegeOpen(false);
      }
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setIsCountryPickerOpen(false);
      }
      if (dialRef.current && !dialRef.current.contains(e.target as Node)) {
        setIsDialPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update E.164 phone whenever local number or dial country changes
  const handlePhoneChange = (val: string, dialCountry: CountryInfo = selectedDialCountry) => {
    setPhoneLocal(val);
    const digits = val.replace(/\D/g, '');
    let cleanDigits = digits;
    if (dialCountry.code !== 'US' && dialCountry.code !== 'CA' && cleanDigits.startsWith('0')) {
      cleanDigits = cleanDigits.substring(1);
    }
    const e164 = digits.length > 0 ? `${dialCountry.dialCode}${cleanDigits}` : '';
    setFormData(prev => ({ ...prev, mobile: e164 }));

    const check = validateNationalPhone(val, dialCountry);
    if (!check.valid && val.trim().length > 0) {
      setErrors(prev => ({ ...prev, mobile: check.warning || `Invalid phone format for ${dialCountry.name}` }));
    } else {
      setErrors(prev => ({ ...prev, mobile: '' }));
    }
  };

  // When candidate selects Country of Residence:
  const handleCountrySelect = (country: CountryInfo) => {
    setSelectedCountry(country);
    // Auto-synchronize calling code dropdown to match residence country
    setSelectedDialCountry(country);
    setFormData(prev => ({ ...prev, country: country.name }));
    setIsCountryPickerOpen(false);
    setCountrySearch('');

    // Revalidate phone number against new country rules
    if (phoneLocal) {
      handlePhoneChange(phoneLocal, country);
    }
    setErrors(prev => ({ ...prev, country: '' }));
  };

  // When candidate selects a different STD calling code prefix:
  const handleDialCodeSelect = (country: CountryInfo) => {
    setSelectedDialCountry(country);
    setIsDialPickerOpen(false);
    setDialSearch('');
    if (phoneLocal) {
      handlePhoneChange(phoneLocal, country);
    }
  };

  const validateField = (field: string, value: any) => {
    if (field === 'mobile') {
      const check = validateNationalPhone(phoneLocal, selectedDialCountry);
      if (!check.valid) {
        setErrors(prev => ({ ...prev, mobile: check.warning || `Please enter a valid phone number for ${selectedDialCountry.name}` }));
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
        country: p.country || formData.country,
        college: p.college || formData.college,
        degree: p.degree || formData.degree,
        gradYear: p.gradYear ? String(p.gradYear) : formData.gradYear,
        preferredLanguage: formData.preferredLanguage
      };

      setFormData(prev => ({
        ...prev,
        ...newValues
      }));

      if (p.mobile) {
        // Detect if mobile has a country code prefix
        const rawDigits = p.mobile.replace(/\D/g, '');
        const matchedCountry = COUNTRIES.find(c => p.mobile.startsWith(c.dialCode)) || selectedDialCountry;
        setSelectedDialCountry(matchedCountry);
        const stripped = p.mobile.startsWith(matchedCountry.dialCode)
          ? p.mobile.slice(matchedCountry.dialCode.length).trim()
          : p.mobile;
        setPhoneLocal(stripped);
      }

      if (p.country) {
        const cMatch = COUNTRIES.find(c => c.name.toLowerCase() === p.country.toLowerCase() || c.code.toLowerCase() === p.country.toLowerCase());
        if (cMatch) {
          setSelectedCountry(cMatch);
        }
      }

      if (p.college) {
        setCollegeSearch(p.college);
      }

      if (data.rawResumeText) {
        setResumeText(data.rawResumeText);
      }

      setParsedFileName(file.name);
      setParsedFileSize(file.size);
      setParseSuccessMsg(`Resume "${file.name}" parsed cleanly! Details have been pre-filled below.`);
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
      const usCountry = COUNTRIES.find(c => c.code === 'US') || DEFAULT_COUNTRY;
      setSelectedCountry(usCountry);
      setSelectedDialCountry(usCountry);
      setPhoneLocal('(555) 019-2834');
      
      if (type === 'docx') {
        setFormData(prev => ({
          ...prev,
          name: 'Elena Rostova',
          email: 'elena.rostova@example.com',
          mobile: '+15550192834',
          country: 'United States',
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
          mobile: '+15550192834',
          country: 'United States',
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

  const isPhoneValid = validateNationalPhone(phoneLocal, selectedDialCountry).valid;

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
    const phoneCheck = validateNationalPhone(phoneLocal, selectedDialCountry);
    let newErrors: Record<string, string> = {};
    let hasErrors = false;

    if (!phoneCheck.valid) {
      hasErrors = true;
      newErrors['mobile'] = phoneCheck.warning || `Please enter a valid phone number for ${selectedDialCountry.name}`;
    }

    // Password strength gatekeeper
    if (password) {
      const emailPrefix = formData.email ? formData.email.split('@')[0] : '';
      const strength = evaluatePasswordStrength(password, [formData.name, emailPrefix]);
      if (!strength.isValid) {
        hasErrors = true;
        newErrors['password'] = 'Please choose a stronger password (at least 8 characters with Score 3/Strong) before continuing.';
      }
    }

    const payloadMobile = phoneCheck.valid && phoneCheck.e164 
      ? phoneCheck.e164 
      : `${selectedDialCountry.dialCode}${phoneLocal.replace(/\D/g, '')}`;

    const submissionData = {
      ...formData,
      mobile: payloadMobile,
      country: selectedCountry.name
    };

    const result = registrationSchema.safeParse(submissionData);
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
            ...submissionData,
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
          errorList.push("Registration failed. Please check your details and try again.");
        }
        setServerErrors(errorList);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setServerErrors(["Registration request timed out. Please try again."]);
      } else {
        setServerErrors([e.message || "An unexpected network error occurred."]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[760px] mx-auto py-8 px-4 font-sans">
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

            {/* 1. Country / Region Selection Field */}
            <div className="relative" ref={countryRef}>
              <label htmlFor="country-selector" className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-violet-400" />
                  Country / Region of Residence <span className="text-violet-400">*</span>
                </span>
                <span className="text-[10px] text-white/40 normal-case">ISO Search & Typeahead</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  id="country-selector"
                  onClick={() => setIsCountryPickerOpen(prev => !prev)}
                  className={`w-full px-3.5 py-2.5 border ${
                    errors.country ? 'border-[var(--color-error)]' : 'border-white/10 hover:border-white/20 focus:border-violet-400'
                  } bg-white/5 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none text-sm text-white flex items-center justify-between transition-all text-left`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-lg leading-none">{selectedCountry.flag}</span>
                    <span className="font-medium text-white truncate">{selectedCountry.name}</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-mono bg-white/10 text-white/60 rounded">
                      {selectedCountry.code}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-white/40 shrink-0 transition-transform ${isCountryPickerOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Country Search & Selection Popover */}
                {isCountryPickerOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-64 overflow-y-auto rounded-xl border border-white/15 bg-[#121826] shadow-2xl backdrop-blur-2xl p-2 text-sm animate-in fade-in duration-150">
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search country or code (e.g. India, US, +91)..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        autoFocus
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 outline-none focus:border-violet-400"
                      />
                    </div>

                    <div className="space-y-0.5">
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((c) => {
                          const isSelected = selectedCountry.code === c.code;
                          return (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => handleCountrySelect(c)}
                              className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between hover:bg-white/10 transition-colors ${
                                isSelected ? 'bg-violet-600/25 text-violet-300 font-medium' : 'text-zinc-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <span className="text-base">{c.flag}</span>
                                <span className="truncate">{c.name}</span>
                                <span className="text-[11px] font-mono text-white/40">({c.code})</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-mono text-violet-400/80">{c.dialCode}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3 py-2 text-xs text-white/40 italic">
                          No matching country found.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.country && <p className="mt-1.5 text-xs text-[var(--color-error)] flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{errors.country}</p>}
            </div>

            {/* 2. Integrated Phone STD Dialing Code Selector & Dynamic Validation */}
            <div className="relative">
              <label htmlFor="mobile-input" className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-violet-400" />
                  Mobile Number <span className="text-violet-400">*</span>
                </span>
                <span className="text-[10px] text-white/40 normal-case">E.164 International Format</span>
              </label>

              <div className="flex items-center gap-2" ref={dialRef}>
                {/* STD Dialing Code Dropdown Prefix */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsDialPickerOpen(prev => !prev)}
                    className="h-10 px-3 border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-1.5 text-sm text-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none transition-all cursor-pointer font-mono"
                    title={`Calling Code: ${selectedDialCountry.name} (${selectedDialCountry.dialCode})`}
                  >
                    <span className="text-base leading-none">{selectedDialCountry.flag}</span>
                    <span className="font-semibold text-white/90">{selectedDialCountry.dialCode}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${isDialPickerOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dialing Code Selector Popover */}
                  {isDialPickerOpen && (
                    <div className="absolute left-0 top-full mt-1.5 z-50 w-64 max-h-60 overflow-y-auto rounded-xl border border-white/15 bg-[#121826] shadow-2xl backdrop-blur-2xl p-2 text-sm animate-in fade-in duration-150">
                      <div className="relative mb-2">
                        <Search className="w-3 h-3 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search code (e.g. +91, UK)..."
                          value={dialSearch}
                          onChange={(e) => setDialSearch(e.target.value)}
                          autoFocus
                          className="w-full pl-7 pr-2.5 py-1 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 outline-none focus:border-violet-400"
                        />
                      </div>

                      <div className="space-y-0.5">
                        {filteredDialCountries.map((c) => {
                          const isSelected = selectedDialCountry.code === c.code;
                          return (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => handleDialCodeSelect(c)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between hover:bg-white/10 transition-colors ${
                                isSelected ? 'bg-violet-600/25 text-violet-300 font-medium' : 'text-zinc-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-sm">{c.flag}</span>
                                <span className="text-xs truncate">{c.name}</span>
                              </div>
                              <span className="text-xs font-mono font-semibold text-violet-400 shrink-0 ml-1.5">
                                {c.dialCode}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Local Phone Number Input with Dynamic Placeholder */}
                <div className="flex-1">
                  <input 
                    type="tel" 
                    id="mobile-input" 
                    placeholder={selectedDialCountry.formatHint}
                    aria-invalid={!!errors.mobile} 
                    aria-errormessage="mobile-error" 
                    aria-required="true" 
                    value={phoneLocal} 
                    onBlur={() => handleBlur('mobile')} 
                    onChange={e => handlePhoneChange(e.target.value)} 
                    className={`w-full h-10 px-3.5 border ${
                      errors.mobile ? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]/30' : 'border-white/10 focus:border-violet-400'
                    } bg-white/5 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none text-sm text-white placeholder-white/25 transition-all font-mono`} 
                  />
                </div>
              </div>

              {errors.mobile ? (
                <p id="mobile-error" className="mt-1.5 text-xs text-[var(--color-error)] flex items-center gap-1.5 font-medium animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.mobile}</span>
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-white/40">
                  Format for {selectedDialCountry.name}: <span className="font-mono text-white/60">{selectedDialCountry.formatHint}</span> (Full E.164: <span className="font-mono text-violet-400">{selectedDialCountry.dialCode}{phoneLocal.replace(/\D/g, '') || '...'}</span>)
                </p>
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
            <div>
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

            {/* Assessment Security Password / PIN with Real-Time Entropy & Pattern Meter */}
            <div className="md:col-span-2">
              <label htmlFor="reg-password" className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-violet-400" />
                  Account Security Password <span className="text-white/40 normal-case font-normal">(Optional for candidate session recovery)</span>
                </span>
                <span className="text-[10px] text-white/40 normal-case">Real-time strength meter</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="reg-password"
                  placeholder="Create a strong password (min 8 characters, uppercase, number, symbol)..."
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  className={`w-full pl-10 pr-11 py-2.5 border ${
                    errors.password ? 'border-[var(--color-error)]' : 'border-white/10 focus:border-violet-400'
                  } bg-white/5 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none text-sm text-white placeholder-white/25 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded text-white/40 hover:text-white/90 hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {errors.password && (
                <p className="mt-1.5 text-xs text-[var(--color-error)] flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.password}
                </p>
              )}

              {/* Real-Time Password Strength Visual Meter */}
              {password && (
                <div className="mt-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <PasswordStrengthIndicator 
                    password={password} 
                    userInputs={[formData.name, formData.email ? formData.email.split('@')[0] : '']} 
                    showRequirementsList={true} 
                  />
                </div>
              )}
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

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-all shadow-lg shadow-violet-600/20 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating Profile...</span>
                </>
              ) : (
                <span>Complete Registration & Proceed</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
