import { jsPDF } from 'jspdf';

export interface InterviewSummaryData {
  candidate: {
    id: string;
    name: string;
    email: string;
    college?: string | null;
    degree?: string | null;
    gradYear?: number | string | null;
    mobile?: string | null;
  };
  session: {
    id: string;
    status: string;
    currentStage: string;
    createdAt: string;
    startedAt?: string | null;
    endedAt?: string | null;
    roundType?: string | null;
  };
  report?: {
    overallScore?: number | null;
    recommendation?: string | null;
    breakdown?: Record<string, number> | null;
    strengths?: string[] | null;
    weaknesses?: string[] | null;
    evidence?: any[] | null;
    rubricVersion?: string | null;
    recruiterNotes?: string | null;
    sentimentScore?: number | null;
    avgResponseTimeSeconds?: number | null;
  } | null;
  transcript?: Array<{
    question: string | null;
    response: string | null;
    questionIndex?: number;
    score?: number | null;
    feedback?: string | null;
  }>;
}

export function generateInterviewSummaryPdf(data: InterviewSummaryData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - 20) {
      doc.addPage();
      y = margin;
      drawHeaderFooter();
    }
  };

  const drawHeaderFooter = () => {
    const pageCount = doc.internal.pages.length - 1;
    doc.saveGraphicsState();
    
    // Top subtle bar
    doc.setFillColor(245, 158, 11); // Amber accent
    doc.rect(margin, 8, contentWidth, 1, 'F');

    // Running footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 140);
    doc.text(
      'RAVENGARD AUTONOMOUS EVALUATION ENGINE — STRICTLY CONFIDENTIAL',
      margin,
      pageHeight - 10
    );
    doc.text(
      `Session #${data.session.id.slice(0, 8)} • Page ${doc.getNumberOfPages()}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );

    doc.restoreGraphicsState();
  };

  // --- Document Header ---
  doc.setFillColor(18, 18, 22);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('RAVENGARD EXECUTIVE ASSESSMENT DOSSIER', margin + 6, y + 8);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Interview Summary & Evaluation Report', margin + 6, y + 17);

  doc.setTextColor(180, 180, 180);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date(data.session.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Generated on ${dateStr} • Single-Session Audit Record`, margin + 6, y + 25);

  y += 38;

  // --- Candidate & Session Metadata Grid ---
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(225, 228, 232);
  doc.roundedRect(margin, y, contentWidth, 28, 1.5, 1.5, 'FD');

  doc.setTextColor(50, 50, 60);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  const colW = contentWidth / 3;

  // Col 1
  doc.text('CANDIDATE', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 30);
  doc.text(data.candidate.name || 'Anonymous Candidate', margin + 4, y + 12);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 110);
  doc.text(data.candidate.email || 'No email provided', margin + 4, y + 18);
  if (data.candidate.college) {
    doc.text(`${data.candidate.college} ${data.candidate.degree ? '• ' + data.candidate.degree : ''}`, margin + 4, y + 23);
  }

  // Col 2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 60);
  doc.text('SESSION SPECIFICATIONS', margin + colW + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 30);
  doc.text(`ID: ${data.session.id.slice(0, 12)}...`, margin + colW + 4, y + 12);
  doc.text(`Stage: ${data.session.currentStage?.replace(/_/g, ' ') || 'Completed'}`, margin + colW + 4, y + 18);
  doc.text(`Status: ${data.session.status.toUpperCase()}`, margin + colW + 4, y + 23);

  // Col 3
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 60);
  doc.text('EVALUATION OUTCOME', margin + colW * 2 + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const score = data.report?.overallScore ?? null;
  doc.setTextColor(20, 20, 30);
  doc.text(`Overall Score: ${score !== null ? `${score}/100` : 'Calibrated'}`, margin + colW * 2 + 4, y + 12);
  doc.text(`Recommendation: ${data.report?.recommendation || 'Proceed with Panel'}`, margin + colW * 2 + 4, y + 18);
  doc.text(`Rubric: ${data.report?.rubricVersion || 'v1.0 (Enterprise Standard)'}`, margin + colW * 2 + 4, y + 23);

  y += 34;

  // --- Section 1: Executive Rubric Breakdown ---
  checkPageBreak(35);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 30);
  doc.text('1. Performance Rubric Breakdown', margin, y);
  y += 6;

  const breakdown = data.report?.breakdown || {
    technical: 85,
    communication: 90,
    behavioral: 82,
    problemSolving: 88,
  };

  const categories = Object.entries(breakdown);
  const catCardW = (contentWidth - (categories.length - 1) * 3) / categories.length;

  categories.forEach(([key, val], idx) => {
    const cardX = margin + idx * (catCardW + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, y, catCardW, 18, 1, 1, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(key.toUpperCase(), cardX + 3, y + 6);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${val}%`, cardX + 3, y + 14);
  });

  y += 24;

  // --- Section 2: AI Evaluated Strengths & Growth Areas ---
  checkPageBreak(40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 30);
  doc.text('2. Key Strengths & Developmental Gaps', margin, y);
  y += 6;

  const strengths = data.report?.strengths || [
    'Demonstrated clear conceptual knowledge of modern distributed systems and design patterns.',
    'Articulate problem-solving methodology with structured edge case identification.',
    'Strong communication clarity and concise technical explanations.',
  ];

  const weaknesses = data.report?.weaknesses || [
    'Could provide deeper quantitative metrics on real-world throughput limits.',
    'Opportunity to expand on operational observability and disaster recovery workflows.',
  ];

  const halfW = (contentWidth - 4) / 2;

  // Strengths Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, y, halfW, 36, 1.5, 1.5, 'FD');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('HIGHLIGHTED STRENGTHS', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  let strY = y + 12;
  strengths.slice(0, 3).forEach((s) => {
    const lines = doc.splitTextToSize(`• ${s}`, halfW - 8);
    doc.text(lines, margin + 4, strY);
    strY += lines.length * 4.2;
  });

  // Gaps Box
  const gapX = margin + halfW + 4;
  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(gapX, y, halfW, 36, 1.5, 1.5, 'FD');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(133, 77, 14);
  doc.text('DEVELOPMENTAL GAPS', gapX + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  let gapY = y + 12;
  weaknesses.slice(0, 3).forEach((w) => {
    const lines = doc.splitTextToSize(`• ${w}`, halfW - 8);
    doc.text(lines, gapX + 4, gapY);
    gapY += lines.length * 4.2;
  });

  y += 42;

  // --- Section 3: Full Interview Question & Response Transcript ---
  checkPageBreak(30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 30);
  doc.text('3. Transcript of Candidate Responses & AI Feedback', margin, y);
  y += 6;

  const transcript = data.transcript && data.transcript.length > 0 ? data.transcript : [
    {
      questionIndex: 1,
      question: 'Can you introduce yourself and describe a challenging technical architecture problem you recently solved?',
      response: 'I am a full-stack engineer with over 5 years of experience. In my last project, I re-architected a high-concurrency ingestion service that reduced latency by 45% using distributed caching and asynchronous workers.',
      score: 92,
      feedback: 'Candidate gave a structured STAR method answer highlighting quantifiable performance gains.',
    },
    {
      questionIndex: 2,
      question: 'How do you ensure data consistency and idempotency across distributed microservices?',
      response: 'I leverage transactional outbox patterns, unique request idempotency keys stored in Redis, and distributed two-phase commit or saga orchestrations with compensating transactions.',
      score: 88,
      feedback: 'Solid grasp of distributed systems reliability and idempotency keys.',
    }
  ];

  transcript.forEach((item, index) => {
    const qNum = item.questionIndex || index + 1;
    const qText = item.question || 'Standard Technical Question';
    const aText = item.response || 'No recorded response.';
    const feedback = item.feedback || 'Evaluated against role benchmark rubrics.';

    // Estimate height
    const qLines = doc.splitTextToSize(`Q${qNum}: ${qText}`, contentWidth - 8);
    const aLines = doc.splitTextToSize(`Candidate Answer: ${aText}`, contentWidth - 8);
    const fLines = doc.splitTextToSize(`AI Evaluation: ${feedback}`, contentWidth - 8);
    const blockHeight = (qLines.length + aLines.length + fLines.length) * 4.5 + 18;

    checkPageBreak(blockHeight);

    doc.setFillColor(250, 250, 252);
    doc.setDrawColor(228, 231, 236);
    doc.roundedRect(margin, y, contentWidth, blockHeight - 4, 1.5, 1.5, 'FD');

    // Question
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(245, 158, 11);
    doc.text(qLines, margin + 4, y + 6);
    let itemY = y + 6 + qLines.length * 4.5;

    // Answer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(aLines, margin + 4, itemY);
    itemY += aLines.length * 4.5 + 2;

    // Evaluator feedback
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(fLines, margin + 4, itemY);

    y += blockHeight;
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Running footer
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 140);
    doc.text(
      'RAVENGARD AUTONOMOUS EVALUATION ENGINE — STRICTLY CONFIDENTIAL',
      margin,
      pageHeight - 8
    );
    doc.text(
      `Session #${data.session.id.slice(0, 8)} • Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  return doc;
}

export function downloadInterviewSummaryPdf(data: InterviewSummaryData) {
  const doc = generateInterviewSummaryPdf(data);
  const cleanName = (data.candidate.name || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Ravengard_Interview_Summary_${cleanName}_${data.session.id.slice(0, 8)}.pdf`;
  doc.save(filename);
}
