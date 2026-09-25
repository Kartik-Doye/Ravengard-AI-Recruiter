import React, { useState } from 'react';
import {
  X,
  FileCheck,
  Building,
  User,
  DollarSign,
  Calendar,
  ShieldCheck,
  Download,
  Printer,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { getRbacFetchHeaders } from '../../utils/rbacClient';

interface OfferModalProps {
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  department: string;
  existingOffer?: any;
  onClose: () => void;
  onOfferGenerated: (offer: any) => void;
}

export function OfferDocumentModal({
  applicationId,
  candidateName,
  candidateEmail,
  jobTitle,
  department,
  existingOffer,
  onClose,
  onOfferGenerated,
}: OfferModalProps) {
  const [offer, setOffer] = useState<any>(existingOffer || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [baseSalary, setBaseSalary] = useState(existingOffer?.compensation?.annualBaseSalary || 165000);
  const [variableBonus, setVariableBonus] = useState(existingOffer?.compensation?.variableIncentive || '15% Target Annual Performance Bonus');
  const [equityOptions, setEquityOptions] = useState(existingOffer?.compensation?.equityGrant || '20,000 Incentive Stock Options (4-year vesting, 1-year cliff)');
  const [targetStartDate, setTargetStartDate] = useState(
    existingOffer?.position?.targetStartDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [reportingManager, setReportingManager] = useState(existingOffer?.position?.reportingTo || 'Vice President of Engineering');
  const [contingencyTerms, setContingencyTerms] = useState(
    existingOffer?.legalTerms?.contingency ||
      'Offer contingent upon successful verification of identity, background check clearance, and execution of standard Proprietary Information and Inventions Agreement.'
  );

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/hr/applications/${applicationId}/offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getRbacFetchHeaders(),
        },
        body: JSON.stringify({
          baseSalary: Number(baseSalary),
          variableBonus,
          equityOptions,
          targetStartDate,
          reportingManager,
          contingencyTerms,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate official offer letter.');
      }

      const data = await res.json();
      setOffer(data.offer);
      onOfferGenerated(data.offer);
    } catch (err: any) {
      setError(err.message || 'Error executing offer document.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!offer) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Dark sleek letterhead styling
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('RAVENGARD AI CORPORATION', 20, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('OFFICIAL EMPLOYMENT OFFER & EXECUTIVE ENGAGEMENT AGREEMENT', 20, 22);
    doc.text(`REF: ${offer.offerNumber} | DATE: ${new Date(offer.generatedAt).toLocaleDateString()}`, 20, 27);

    // Body content
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    let y = 44;
    doc.text(`CONFIDENTIAL TO: ${offer.candidate.fullName}`, 20, y);
    doc.text(`EMAIL: ${offer.candidate.email}`, 20, y + 5);
    doc.text(`EXPIRES: ${new Date(offer.expiresAt).toLocaleDateString()}`, 140, y);

    y += 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Dear ' + offer.candidate.fullName + ',', 20, y);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const intro = `On behalf of Ravengard AI Corporation, we are thrilled to extend this formal offer of employment for the position of ${offer.position.jobTitle} within our ${offer.position.department} department. Your technical assessment scores and distributed systems aptitude placed you in the top percentile of all evaluated candidates.`;
    const splitIntro = doc.splitTextToSize(intro, 170);
    doc.text(splitIntro, 20, y);

    y += splitIntro.length * 5 + 6;

    // Position Details Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('POSITION SPECIFICATIONS & ENGAGEMENT TERMS', 20, y);
    y += 4;
    doc.setDrawColor(203, 213, 225);
    doc.line(20, y, 190, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Target Start Date:  ${offer.position.targetStartDate}`, 20, y);
    doc.text(`Employment Type:   ${offer.position.employmentType}`, 110, y);
    y += 6;
    doc.text(`Reporting Manager:  ${offer.position.reportingTo}`, 20, y);
    doc.text(`Work Location:     ${offer.position.location}`, 110, y);

    y += 12;
    // Compensation Schedule
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('COMPENSATION SCHEDULE', 20, y);
    y += 4;
    doc.line(20, y, 190, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Annual Base Salary:     $${Number(offer.compensation.annualBaseSalary).toLocaleString()} USD (paid bi-weekly)`, 20, y);
    y += 6;
    doc.text(`Variable Incentive:     ${offer.compensation.variableIncentive}`, 20, y);
    y += 6;
    doc.text(`Equity Incentive Grant: ${offer.compensation.equityGrant}`, 20, y);
    y += 6;
    const splitBen = doc.splitTextToSize(`Benefits:               ${offer.compensation.benefitsSummary}`, 170);
    doc.text(splitBen, 20, y);
    y += splitBen.length * 4.5 + 4;

    // Legal Contingency
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('CONTINGENCY & LEGAL PROVISIONS', 20, y);
    y += 4;
    doc.line(20, y, 190, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const splitLegal = doc.splitTextToSize(offer.legalTerms.contingency + ' ' + offer.legalTerms.atWillNotice, 170);
    doc.text(splitLegal, 20, y);
    y += splitLegal.length * 4 + 14;

    // Signature Blocks
    doc.setDrawColor(100, 116, 139);
    doc.line(20, y, 90, y);
    doc.line(120, y, 190, y);
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(offer.company.authorizerName, 20, y);
    doc.text(offer.candidate.fullName, 120, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.text(offer.company.authorizerTitle + ', Ravengard AI', 20, y);
    doc.text('Candidate Electronic Acceptance', 120, y);

    // Save
    doc.save(`Ravengard_Official_Offer_${offer.candidate.fullName.replace(/\s+/g, '_')}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-4xl shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white tracking-wide">
                {offer ? 'Official Employment Offer Letter' : 'Generate Formal Legal Offer Letter'}
              </h2>
              <p className="text-xs text-white/50 font-mono">
                {candidateName} · {jobTitle} ({department})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {offer && (
              <>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 cursor-pointer"
                  title="Print document"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer font-semibold shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!offer ? (
            /* Configure Offer Parameters */
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 font-sans leading-relaxed">
                Ravengard transforms candidate assessment data into a standardized, legally binding employment agreement. Compensation details input here are recorded into the immutable audit trail and made available immediately for candidate electronic sign-off.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">
                    Annual Base Salary (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-white/40">$</span>
                    <input
                      type="number"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 bg-black/40 border border-white/15 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500/50"
                      placeholder="165000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">
                    Target Start Date
                  </label>
                  <input
                    type="date"
                    value={targetStartDate}
                    onChange={(e) => setTargetStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">
                    Variable Performance Incentive
                  </label>
                  <input
                    type="text"
                    value={variableBonus}
                    onChange={(e) => setVariableBonus(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500/50"
                    placeholder="15% Annual Target"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">
                    Equity Grant Terms
                  </label>
                  <input
                    type="text"
                    value={equityOptions}
                    onChange={(e) => setEquityOptions(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500/50"
                    placeholder="25,000 RSUs"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">
                    Reporting Manager / Executive
                  </label>
                  <input
                    type="text"
                    value={reportingManager}
                    onChange={(e) => setReportingManager(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500/50"
                    placeholder="Marcus Chen, Vice President of Engineering"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">
                    Contingency & Pre-Employment Verification Terms
                  </label>
                  <textarea
                    rows={2}
                    value={contingencyTerms}
                    onChange={(e) => setContingencyTerms(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-mono text-white/50 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={loading || !baseSalary}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-amber-950/30"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                  Execute Legal Offer Letter
                </button>
              </div>
            </div>
          ) : (
            /* In-App Printable Document Viewer */
            <div className="space-y-6">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs font-mono text-emerald-300">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Offer Document Executed & Staged for Candidate Electronic Signature
                </span>
                <span>Ref: {offer.offerNumber}</span>
              </div>

              {/* Styled Document Sheet */}
              <div
                id="printable-offer-document"
                className="bg-white text-slate-900 rounded-xl p-8 sm:p-12 shadow-2xl font-serif text-sm leading-relaxed border border-slate-200"
              >
                {/* Formal Letterhead */}
                <div className="border-b-2 border-slate-900 pb-5 mb-8 flex justify-between items-start">
                  <div>
                    <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 uppercase">
                      Ravengard AI Corporation
                    </h1>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      500 Howard Street, Suite 400 · San Francisco, CA 94105
                    </p>
                  </div>
                  <div className="text-right text-xs font-mono text-slate-500">
                    <p className="font-bold text-slate-800">DOCUMENT ID: {offer.offerNumber}</p>
                    <p>DATE: {new Date(offer.generatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-4 text-slate-800">
                  <p className="font-mono text-xs text-slate-500">
                    CONFIDENTIAL & PRIVILEGED · VIA RAVENGARD SECURE DOSSIER
                  </p>

                  <p>
                    <strong>Dear {offer.candidate.fullName},</strong>
                  </p>

                  <p>
                    On behalf of Ravengard AI Corporation (the &ldquo;Company&rdquo;), we are exceptionally pleased to offer you the position of <strong>{offer.position.jobTitle}</strong> within our <strong>{offer.position.department}</strong> division.
                  </p>

                  {/* Terms Table */}
                  <div className="my-6 rounded-lg border border-slate-200 overflow-hidden font-sans text-xs">
                    <div className="bg-slate-100 px-4 py-2 font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                      Summary of Compensation & Engagement Terms
                    </div>
                    <div className="divide-y divide-slate-200 p-0">
                      <div className="grid grid-cols-3 p-3">
                        <span className="font-bold text-slate-600">Annual Base Salary:</span>
                        <span className="col-span-2 text-slate-900 font-semibold">
                          ${Number(offer.compensation.annualBaseSalary).toLocaleString()} USD (Annualized, paid semi-monthly)
                        </span>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <span className="font-bold text-slate-600">Incentive Target:</span>
                        <span className="col-span-2 text-slate-900">{offer.compensation.variableIncentive}</span>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <span className="font-bold text-slate-600">Equity Incentive:</span>
                        <span className="col-span-2 text-slate-900">{offer.compensation.equityGrant}</span>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <span className="font-bold text-slate-600">Commencement Date:</span>
                        <span className="col-span-2 text-slate-900">{offer.position.targetStartDate}</span>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <span className="font-bold text-slate-600">Reporting Officer:</span>
                        <span className="col-span-2 text-slate-900">{offer.position.reportingTo}</span>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <span className="font-bold text-slate-600">Health & PTO Benefits:</span>
                        <span className="col-span-2 text-slate-700 leading-normal">{offer.compensation.benefitsSummary}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-normal">
                    <strong>Contingency Terms:</strong> {offer.legalTerms.contingency}
                  </p>

                  <p className="text-xs text-slate-600 leading-normal">
                    <strong>At-Will Relationship:</strong> {offer.legalTerms.atWillNotice} This offer will remain in effect until <strong>{new Date(offer.expiresAt).toLocaleDateString()}</strong>.
                  </p>

                  {/* Signatures */}
                  <div className="pt-10 grid grid-cols-2 gap-12 font-sans text-xs">
                    <div className="border-t border-slate-900 pt-2">
                      <p className="font-bold text-slate-900">{offer.company.authorizerName}</p>
                      <p className="text-slate-500">{offer.company.authorizerTitle}</p>
                      <p className="text-slate-400 font-mono text-[10px] mt-1">Authorized Signature · Ravengard AI</p>
                    </div>

                    <div className="border-t border-slate-400 pt-2">
                      <p className="font-bold text-slate-900">{offer.candidate.fullName}</p>
                      <p className="text-slate-500">Candidate Acceptance & Electronic Signature</p>
                      <p className="text-slate-400 font-mono text-[10px] mt-1">Date: ________________________</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
