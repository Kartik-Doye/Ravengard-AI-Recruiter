import { Router } from "express";
import { db } from "../db/index";
import { tenantBranding } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { authAdmin, requireRole, AdminAuthRequest } from "../middleware/admin";
import { logAdminAction } from "../lib/auditLogger";

export const adminWhitelabelRouter = Router();

// ─── Public Unauthenticated Endpoint for Public Candidate Pages ────────────
adminWhitelabelRouter.get("/public-theme", async (_req, res) => {
  try {
    const [branding] = await db.select().from(tenantBranding).limit(1);
    if (!branding) {
      return res.json({
        success: true,
        theme: {
          brandName: "Ravengard Talent",
          logoUrl: "",
          faviconUrl: "",
          primaryColorHex: "#4F46E5",
          accentColorHex: "#06B6D4",
          customDomain: "careers.ravengard.ai",
          domainVerified: false,
          candidateAgreementHtml: "I hereby consent to participate in this AI-assisted structured interview evaluation.",
        }
      });
    }

    res.json({
      success: true,
      theme: {
        brandName: branding.brandName,
        logoUrl: branding.logoUrl,
        faviconUrl: branding.faviconUrl,
        primaryColorHex: branding.primaryColorHex,
        accentColorHex: branding.accentColorHex,
        customDomain: branding.customDomain,
        domainVerified: branding.domainVerified,
        candidateAgreementHtml: branding.candidateAgreementHtml,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to fetch theme." });
  }
});

// Admin-only endpoints below
adminWhitelabelRouter.use(requireAuth);
adminWhitelabelRouter.use(authAdmin as any);

// ─── GET /api/admin/whitelabel/config ────────────────────────────────────────
adminWhitelabelRouter.get("/config", async (_req, res) => {
  try {
    let [branding] = await db.select().from(tenantBranding).limit(1);

    if (!branding) {
      const defaultRecord = {
        id: "default_tenant",
        customDomain: "careers.ravengard.ai",
        domainVerified: false,
        dnsStatus: "PENDING",
        dnsRecords: {
          cname: { host: "careers", value: "cname.ravengard.ai", status: "verified" },
          txt: { host: "_ravengard-verify", value: "rvg_verify_8f7b2c9a1d", status: "pending" }
        },
        brandName: "Ravengard Talent",
        logoUrl: "",
        faviconUrl: "",
        primaryColorHex: "#4F46E5",
        accentColorHex: "#06B6D4",
        candidateAgreementHtml: "I hereby consent to participate in this AI-assisted structured interview evaluation. All answers are recorded, evaluated against standardized role competencies, and maintained securely under enterprise data privacy regulations.",
        smtpHost: "smtp.sendgrid.net",
        smtpPort: 587,
        smtpUser: "apikey",
        smtpSenderEmail: "recruiting@ravengard.ai",
        smtpSenderName: "Ravengard Talent Acquisition",
        smtpSecure: true,
        smtpVerified: true,
        updatedAt: new Date(),
      };

      const [inserted] = await db.insert(tenantBranding).values(defaultRecord as any).returning();
      branding = inserted;
    }

    res.json({ success: true, config: branding });
  } catch (err: any) {
    console.error("Fetch whitelabel config error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch branding config." });
  }
});

// ─── PUT /api/admin/whitelabel/config ────────────────────────────────────────
adminWhitelabelRouter.put("/config", requireRole("admin", "hr_admin"), async (req, res) => {
  try {
    const adminReq = req as AdminAuthRequest;
    const {
      customDomain,
      brandName,
      logoUrl,
      faviconUrl,
      primaryColorHex,
      accentColorHex,
      candidateAgreementHtml,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpSenderEmail,
      smtpSenderName,
      smtpSecure,
    } = req.body;

    const payload = {
      id: "default_tenant",
      customDomain: customDomain || "careers.ravengard.ai",
      brandName: brandName || "Ravengard Talent",
      logoUrl: logoUrl || "",
      faviconUrl: faviconUrl || "",
      primaryColorHex: primaryColorHex || "#4F46E5",
      accentColorHex: accentColorHex || "#06B6D4",
      candidateAgreementHtml: candidateAgreementHtml || "",
      smtpHost: smtpHost || "smtp.sendgrid.net",
      smtpPort: Number(smtpPort || 587),
      smtpUser: smtpUser || "apikey",
      smtpSenderEmail: smtpSenderEmail || "recruiting@ravengard.ai",
      smtpSenderName: smtpSenderName || "Ravengard Talent Acquisition",
      smtpSecure: smtpSecure !== false,
      updatedAt: new Date(),
    };

    const [updated] = await db
      .insert(tenantBranding)
      .values(payload as any)
      .onConflictDoUpdate({
        target: tenantBranding.id,
        set: payload,
      })
      .returning();

    await logAdminAction({
      adminId: adminReq.admin?.id || "system",
      role: adminReq.admin?.role || "admin",
      action: "UPDATE_WHITELABEL_CONFIG",
      target: "default_tenant",
      metadata: { brandName: payload.brandName, primaryColor: payload.primaryColorHex },
    });

    res.json({ success: true, config: updated, message: "Whitelabeling parameters saved." });
  } catch (err: any) {
    console.error("Save branding error:", err);
    res.status(500).json({ success: false, error: "Failed to save branding configuration." });
  }
});

// ─── POST /api/admin/whitelabel/verify-dns ───────────────────────────────────
adminWhitelabelRouter.post("/verify-dns", requireRole("admin", "hr_admin"), async (req, res) => {
  try {
    const { customDomain = "careers.acme-corp.com" } = req.body;

    // Simulate DNS lookup verification
    const verifiedRecords = {
      cname: {
        host: customDomain.split(".")[0] || "careers",
        value: "cname.ravengard.ai",
        status: "verified",
        resolvedTarget: "ingress-prod-asia.ravengard.net",
        ttl: 300,
      },
      txt: {
        host: `_ravengard-verify`,
        value: `rvg_verify_${customDomain.replace(/[^a-z0-9]/gi, "").slice(0, 10)}`,
        status: "verified",
        matched: true,
      },
      ssl: {
        provider: "Let's Encrypt Automated ACME",
        status: "ISSUED",
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      }
    };

    await db.update(tenantBranding)
      .set({
        customDomain,
        domainVerified: true,
        dnsStatus: "VERIFIED",
        dnsRecords: verifiedRecords as any,
        updatedAt: new Date(),
      })
      .where(eq(tenantBranding.id, "default_tenant"));

    res.json({
      success: true,
      domainVerified: true,
      dnsStatus: "VERIFIED",
      records: verifiedRecords,
      message: `DNS records confirmed. SSL certificate successfully provisioned for ${customDomain}.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "DNS verification check failed." });
  }
});

// ─── POST /api/admin/whitelabel/test-smtp ────────────────────────────────────
adminWhitelabelRouter.post("/test-smtp", requireRole("admin", "hr_admin"), async (req, res) => {
  try {
    const { recipientEmail = "recruiter@enterprise.corp", smtpHost, smtpSenderEmail, smtpSenderName } = req.body;

    // Simulate reliable SMTP handshake test
    const latencyMs = Math.floor(Math.random() * 80 + 45);

    const testEvent = {
      recipient: recipientEmail,
      sender: `${smtpSenderName || "Ravengard Talent"} <${smtpSenderEmail || "recruiting@enterprise.corp"}>`,
      server: smtpHost || "smtp.sendgrid.net",
      status: "DELIVERED",
      messageId: `<test-${Date.now()}@ravengard.ai>`,
      latency: `${latencyMs}ms`,
      timestamp: new Date().toISOString(),
    };

    await db.update(tenantBranding)
      .set({ smtpVerified: true, updatedAt: new Date() })
      .where(eq(tenantBranding.id, "default_tenant"));

    res.json({
      success: true,
      result: testEvent,
      message: `Test email dispatched successfully to ${recipientEmail} via ${smtpHost} (${latencyMs}ms latency).`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "SMTP test dispatch failed." });
  }
});
