/**
 * rbacClient.ts
 * Manages active role and department sandboxing context on the frontend.
 * Enables instantaneous switching between roles:
 * - Super Admin (Executive Oversight)
 * - HR Admin (People Operations)
 * - Recruiter (Talent Acquisition)
 * - Hiring Manager (Engineering)
 * - Hiring Manager (Product)
 * - Technical Interviewer (Engineering)
 * - Finance Approver (Finance)
 */

export interface RoleProfile {
  id: string;
  role: string;
  name: string;
  department: string;
  badge: string;
  description: string;
  permissions: {
    canViewAllCandidates: boolean;
    canViewDemographics: boolean;
    canViewCompensation: boolean;
    canViewTokenBudget: boolean;
    canViewCodeReplay: boolean;
    canApproveFinance: boolean;
    canApproveRubrics: boolean;
    canGenerateOffers: boolean;
    canOverrideStatus: boolean;
    isDepartmentSiloed: boolean;
  };
}

export const PRESET_ROLES: RoleProfile[] = [
  {
    id: "super_admin",
    role: "super_admin",
    name: "Ravengard Lead Auditor",
    department: "Executive Oversight",
    badge: "SUPER ADMIN",
    description: "Full enterprise-wide authority across all departments, security rules, and audit logs.",
    permissions: {
      canViewAllCandidates: true,
      canViewDemographics: true,
      canViewCompensation: true,
      canViewTokenBudget: true,
      canViewCodeReplay: true,
      canApproveFinance: true,
      canApproveRubrics: true,
      canGenerateOffers: true,
      canOverrideStatus: true,
      isDepartmentSiloed: false,
    },
  },
  {
    id: "hr_admin",
    role: "hr_admin",
    name: "Elena Rostova (HR Director)",
    department: "People Operations",
    badge: "HR ADMIN",
    description: "Enterprise talent operations, legal compliance, offer execution, and bias audits.",
    permissions: {
      canViewAllCandidates: true,
      canViewDemographics: true,
      canViewCompensation: true,
      canViewTokenBudget: true,
      canViewCodeReplay: true,
      canApproveFinance: true,
      canApproveRubrics: true,
      canGenerateOffers: true,
      canOverrideStatus: true,
      isDepartmentSiloed: false,
    },
  },
  {
    id: "recruiter",
    role: "recruiter",
    name: "Marcus Ward (Lead Recruiter)",
    department: "Talent Acquisition",
    badge: "RECRUITER",
    description: "Candidate sourcing, pre-screening review, interview scheduling, and offer drafting.",
    permissions: {
      canViewAllCandidates: true,
      canViewDemographics: true,
      canViewCompensation: true,
      canViewTokenBudget: false,
      canViewCodeReplay: true,
      canApproveFinance: false,
      canApproveRubrics: false,
      canGenerateOffers: true,
      canOverrideStatus: true,
      isDepartmentSiloed: false,
    },
  },
  {
    id: "hm_eng",
    role: "hiring_manager",
    name: "Marcus Chen (VP Eng)",
    department: "Engineering",
    badge: "HIRING MGR (ENG)",
    description: "Siloed strictly to Engineering requisitions. Approves AI rubric criteria and technical hiring decisions.",
    permissions: {
      canViewAllCandidates: false,
      canViewDemographics: true,
      canViewCompensation: true,
      canViewTokenBudget: true,
      canViewCodeReplay: true,
      canApproveFinance: false,
      canApproveRubrics: true,
      canGenerateOffers: false,
      canOverrideStatus: true,
      isDepartmentSiloed: true,
    },
  },
  {
    id: "hm_prod",
    role: "hiring_manager",
    name: "Sophia Patel (Head of Product)",
    department: "Product",
    badge: "HIRING MGR (PROD)",
    description: "Siloed strictly to Product requisitions. Blocked from Engineering candidate pipelines.",
    permissions: {
      canViewAllCandidates: false,
      canViewDemographics: true,
      canViewCompensation: true,
      canViewTokenBudget: true,
      canViewCodeReplay: false,
      canApproveFinance: false,
      canApproveRubrics: true,
      canGenerateOffers: false,
      canOverrideStatus: true,
      isDepartmentSiloed: true,
    },
  },
  {
    id: "tech_interviewer",
    role: "technical_interviewer",
    name: "Devon Vance (Principal Architect)",
    department: "Engineering",
    badge: "TECH INTERVIEWER",
    description: "Views code sandbox replays and system design canvases. BLOCKED from candidate contact PII, salary expectations, and token costs.",
    permissions: {
      canViewAllCandidates: false,
      canViewDemographics: false,
      canViewCompensation: false,
      canViewTokenBudget: false,
      canViewCodeReplay: true,
      canApproveFinance: false,
      canApproveRubrics: false,
      canGenerateOffers: false,
      canOverrideStatus: false,
      isDepartmentSiloed: true,
    },
  },
  {
    id: "finance_approver",
    role: "finance_approver",
    name: "Claire Sinclair (VP Finance)",
    department: "Finance",
    badge: "FINANCE APPROVER",
    description: "Audits requisition compensation bands and approves LLM token budget allocations before jobs can proceed to tech lead review.",
    permissions: {
      canViewAllCandidates: false,
      canViewDemographics: false,
      canViewCompensation: true,
      canViewTokenBudget: true,
      canViewCodeReplay: false,
      canApproveFinance: true,
      canApproveRubrics: false,
      canGenerateOffers: false,
      canOverrideStatus: false,
      isDepartmentSiloed: false,
    },
  },
];

export function getActiveRoleProfile(): RoleProfile {
  const storedId = localStorage.getItem("ravengard_emulated_role_id");
  const found = PRESET_ROLES.find((r) => r.id === storedId);
  return found || PRESET_ROLES[0];
}

export function setActiveRoleProfile(profileId: string) {
  const found = PRESET_ROLES.find((r) => r.id === profileId);
  if (found) {
    localStorage.setItem("ravengard_emulated_role_id", found.id);
    localStorage.setItem("ravengard_emulated_role", found.role);
    localStorage.setItem("ravengard_emulated_department", found.department);
    window.dispatchEvent(new CustomEvent("ravengard_role_changed", { detail: found }));
  }
}

export function getRbacFetchHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem("ravengard_hr_token") || localStorage.getItem("ravengard_admin_token") || "";
  const profile = getActiveRoleProfile();

  const headers: Record<string, string> = {
    ...extraHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  headers["x-emulated-role"] = profile.role;
  headers["x-emulated-department"] = profile.department;

  return headers;
}
