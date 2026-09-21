import React, { useState } from 'react';
import { FileDown, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { downloadInterviewSummaryPdf, InterviewSummaryData } from '../../utils/pdfGenerator';

interface DownloadSummaryButtonProps {
  sessionId: string;
  candidateName?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'compact';
  preloadedData?: Partial<InterviewSummaryData>;
}

export const DownloadSummaryButton: React.FC<DownloadSummaryButtonProps> = ({
  sessionId,
  candidateName,
  className = '',
  variant = 'secondary',
  preloadedData,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (downloading) return;

    setDownloading(true);
    setError(null);
    setDownloadSuccess(false);

    try {
      // If we already have full data passed in, use it
      if (
        preloadedData &&
        preloadedData.candidate &&
        preloadedData.session &&
        preloadedData.transcript &&
        preloadedData.transcript.length > 0
      ) {
        downloadInterviewSummaryPdf(preloadedData as InterviewSummaryData);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
        return;
      }

      const token = localStorage.getItem('ravengard_admin_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/admin/sessions/${sessionId}/summary`, { headers });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to retrieve structured interview summary');
      }

      downloadInterviewSummaryPdf({
        candidate: data.candidate,
        session: data.session,
        report: data.report,
        transcript: data.transcript,
      });

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      console.error('PDF download failure:', err);
      setError(err.message || 'Error generating PDF');
      setTimeout(() => setError(null), 4000);
    } finally {
      setDownloading(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-amber-500 hover:bg-amber-400 text-black font-medium border border-amber-400/50 shadow-md shadow-amber-500/10';
      case 'outline':
        return 'bg-white/5 hover:bg-white/10 text-white/90 border border-white/15';
      case 'compact':
        return 'px-2.5 py-1 text-xs bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 rounded-md';
      case 'secondary':
      default:
        return 'bg-[var(--color-bg-2)] hover:bg-[var(--color-bg-3)] text-[var(--color-text-primary)] border border-[var(--color-border)]';
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        aria-label="Download Interview Summary PDF"
        title="Download structured executive summary & candidate evaluation PDF"
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${getVariantStyles()} ${className}`}
      >
        {downloading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span>Generating PDF...</span>
          </>
        ) : downloadSuccess ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300">Downloaded</span>
          </>
        ) : (
          <>
            <FileDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Download Summary (PDF)</span>
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full mt-1 right-0 z-50 flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-red-950/90 text-red-200 border border-red-800/80 rounded-md shadow-lg whitespace-nowrap">
          <AlertCircle className="w-3 h-3 text-red-400" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
