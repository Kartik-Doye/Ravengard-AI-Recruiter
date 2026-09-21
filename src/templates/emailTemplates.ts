/**
 * Exact transactional email templates specified for Ravengard AI Recruiter.
 * All dynamic tokens are sanitized and formatted cleanly.
 */

export interface ShortlistInvitationParams {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  magicAssessmentLink: string;
}

export interface AssessmentCompletedParams {
  candidateName: string;
  jobTitle: string;
  companyName: string;
}

export interface NonSelectionRejectionParams {
  candidateName: string;
  jobTitle: string;
  constructiveFeedback: string;
}

export function renderShortlistInvitationEmail(params: ShortlistInvitationParams) {
  const subject = `Next Steps for Your Application at ${params.companyName}`;
  const bodyText = `Dear ${params.candidateName},

Thank you for applying for the ${params.jobTitle} position at ${params.companyName}. We were impressed by your background and experience, which closely align with the core requirements of this role. 

As the next step in our selection process, we invite you to complete an interactive, online skills assessment via our platform, Ravengard. Please click the secure link below to access your personal assessment portal:

${params.magicAssessmentLink}

This link is unique to you and will remain active for 48 hours. We look forward to evaluating your expertise.

Best regards,
The Hiring Team`;

  const bodyHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px;">RAVENGARD</span>
        <span style="font-size: 14px; color: #64748b; margin-left: 8px;">| Intelligent Talent Assessment</span>
      </div>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Dear ${escapeHtml(params.candidateName)},</p>
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
        Thank you for applying for the <strong>${escapeHtml(params.jobTitle)}</strong> position at <strong>${escapeHtml(params.companyName)}</strong>. We were impressed by your background and experience, which closely align with the core requirements of this role.
      </p>
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
        As the next step in our selection process, we invite you to complete an interactive, online skills assessment via our platform, Ravengard. Please click the secure link below to access your personal assessment portal:
      </p>
      <div style="margin: 28px 0; text-align: center;">
        <a href="${escapeHtml(params.magicAssessmentLink)}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">Access Assessment Portal</a>
      </div>
      <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px;">
        <em>This link is unique to you and will remain active for 48 hours. We look forward to evaluating your expertise.</em>
      </p>
      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; font-size: 14px; color: #475569;">
        Best regards,<br />
        <strong>The Hiring Team</strong>
      </div>
    </div>
  `;

  return { subject, bodyText, bodyHtml };
}

export function renderAssessmentCompletedEmail(params: AssessmentCompletedParams) {
  const subject = `Assessment Completed - ${params.jobTitle} at ${params.companyName}`;
  const bodyText = `Dear ${params.candidateName},

Thank you for taking the time to complete the interactive assessment for the ${params.jobTitle} role. We have successfully received your responses and completed candidate evaluation data.

Our hiring team, alongside our recruitment platform Ravengard, is now reviewing your assessment performance against our role criteria. We evaluate applications thoroughly to ensure fairness for all candidates.

We will be in touch shortly regarding the next steps in our hiring process. Should you have any questions in the meantime, please feel free to reach out directly to our HR team.

Warm regards,
The Recruitment Team`;

  const bodyHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px;">RAVENGARD</span>
      </div>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Dear ${escapeHtml(params.candidateName)},</p>
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
        Thank you for taking the time to complete the interactive assessment for the <strong>${escapeHtml(params.jobTitle)}</strong> role. We have successfully received your responses and completed candidate evaluation data.
      </p>
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
        Our hiring team, alongside our recruitment platform Ravengard, is now reviewing your assessment performance against our role criteria. We evaluate applications thoroughly to ensure fairness for all candidates.
      </p>
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
        We will be in touch shortly regarding the next steps in our hiring process. Should you have any questions in the meantime, please feel free to reach out directly to our HR team.
      </p>
      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; font-size: 14px; color: #475569;">
        Warm regards,<br />
        <strong>The Recruitment Team</strong>
      </div>
    </div>
  `;

  return { subject, bodyText, bodyHtml };
}

export function renderNonSelectionRejectionEmail(params: NonSelectionRejectionParams) {
  const subject = `Update on Your Application for ${params.jobTitle}`;
  const bodyText = `Dear ${params.candidateName},

Thank you for taking the time to apply and complete our evaluation process for the ${params.jobTitle} position. We truly appreciate the effort you put into your application.

After careful review of your application against our current role requirements, we regret to inform you that we will not be moving forward with your candidacy at this time. Our decision was primarily based on specific alignment gaps with required technical competencies for this specific position:

${params.constructiveFeedback}

We encourage you to apply for future openings that match your profile and wish you every success.

Sincerely,
The HR Team`;

  const bodyHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px;">RAVENGARD</span>
      </div>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Dear ${escapeHtml(params.candidateName)},</p>
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
        Thank you for taking the time to apply and complete our evaluation process for the <strong>${escapeHtml(params.jobTitle)}</strong> position. We truly appreciate the effort you put into your application.
      </p>
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
        After careful review of your application against our current role requirements, we regret to inform you that we will not be moving forward with your candidacy at this time. Our decision was primarily based on specific alignment gaps with required technical competencies for this specific position:
      </p>
      <div style="background-color: #f8fafc; border-left: 3px solid #64748b; padding: 14px 18px; margin: 20px 0; font-size: 14px; color: #334155; line-height: 1.6; border-radius: 0 6px 6px 0;">
        ${escapeHtml(params.constructiveFeedback)}
      </div>
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
        We encourage you to apply for future openings that match your profile and wish you every success.
      </p>
      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; font-size: 14px; color: #475569;">
        Sincerely,<br />
        <strong>The HR Team</strong>
      </div>
    </div>
  `;

  return { subject, bodyText, bodyHtml };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
