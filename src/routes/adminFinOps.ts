import { Router } from "express";
import { db } from "../db/index";
import { departmentBudgets, tokenLedger, modelRoutingRules } from "../db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { authAdmin, requireRole, AdminAuthRequest } from "../middleware/admin";
import { logAdminAction } from "../lib/auditLogger";

const router = Router();

router.use(requireAuth);
router.use(authAdmin as any);

// ─── GET /api/admin/finops/overview ──────────────────────────────────────────
router.get("/overview", async (req, res) => {
  try {
    const budgets = await db.select().from(departmentBudgets).orderBy(departmentBudgets.department);
    
    // Aggregation across token ledger
    const totalSpendRes = await db
      .select({
        sumCost: sql<string>`COALESCE(SUM(CAST(${tokenLedger.totalCostUsd} AS NUMERIC)), 0)`,
        sumTokens: sql<number>`COALESCE(SUM(${tokenLedger.promptTokens} + ${tokenLedger.completionTokens}), 0)`,
        countTurns: sql<number>`COUNT(*)`,
      })
      .from(tokenLedger);

    // Calculate department utilization percentages
    const departmentStats = budgets.map((b) => {
      const usage = b.currentMonthUsageTokens || 0;
      const cap = b.monthlyTokenCap || 1;
      const percentUsed = Math.round((usage / cap) * 100);
      const isSoftWarning = percentUsed >= (b.softWarningThreshold || 80);
      const isHardCapReached = percentUsed >= 100;
      return {
        ...b,
        percentUsed,
        isSoftWarning,
        isHardCapReached,
      };
    });

    const aggregate = {
      totalSpentUsd: Number(totalSpendRes[0]?.sumCost || 0).toFixed(4),
      totalTokensConsumed: Number(totalSpendRes[0]?.sumTokens || 0),
      totalTurnsLogged: Number(totalSpendRes[0]?.countTurns || 0),
      activeCostPerInterviewAverage: "0.2450", // Industry baseline
    };

    res.json({
      success: true,
      departments: departmentStats,
      aggregate,
    });
  } catch (err: any) {
    console.error("FinOps overview error:", err);
    res.status(500).json({ success: false, error: "Failed to retrieve FinOps overview." });
  }
});

// ─── PUT /api/admin/finops/budgets/:department ──────────────────────────────
router.put("/budgets/:department", requireRole("admin", "hr_admin"), async (req, res) => {
  try {
    const adminReq = req as AdminAuthRequest;
    const { department } = req.params;
    const { monthlyTokenCap, softWarningThreshold, hardCapAction } = req.body;

    if (!monthlyTokenCap || monthlyTokenCap < 1000) {
      return res.status(400).json({ success: false, error: "Monthly token cap must be at least 1,000 tokens." });
    }

    const action = hardCapAction === "BLOCK" || hardCapAction === "NOTIFY" ? hardCapAction : "DEGRADE_MODEL";

    const updated = await db
      .insert(departmentBudgets)
      .values({
        id: `dept_${department.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        department,
        monthlyTokenCap: Number(monthlyTokenCap),
        softWarningThreshold: Number(softWarningThreshold || 80),
        hardCapAction: action,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: departmentBudgets.department,
        set: {
          monthlyTokenCap: Number(monthlyTokenCap),
          softWarningThreshold: Number(softWarningThreshold || 80),
          hardCapAction: action,
          updatedAt: new Date(),
        },
      })
      .returning();

    await logAdminAction({
      adminId: adminReq.admin?.id || "system",
      role: adminReq.admin?.role || "admin",
      action: "UPDATE_DEPARTMENT_BUDGET",
      target: department,
      metadata: { monthlyTokenCap, softWarningThreshold, hardCapAction: action },
    });

    res.json({
      success: true,
      budget: updated[0],
      message: `Budget updated for department ${department}.`,
    });
  } catch (err: any) {
    console.error("Update budget error:", err);
    res.status(500).json({ success: false, error: "Failed to update department budget." });
  }
});

// ─── GET /api/admin/finops/token-ledger ──────────────────────────────────────
router.get("/token-ledger", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);
    const departmentFilter = req.query.department as string;

    let query = db.select().from(tokenLedger);
    if (departmentFilter) {
      query = db.select().from(tokenLedger).where(eq(tokenLedger.department, departmentFilter)) as any;
    }

    const records = await query.orderBy(desc(tokenLedger.createdAt)).limit(limit);

    res.json({
      success: true,
      count: records.length,
      ledger: records,
    });
  } catch (err: any) {
    console.error("Token ledger error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch token ledger." });
  }
});

// ─── GET /api/admin/finops/model-routing ─────────────────────────────────────
router.get("/model-routing", async (req, res) => {
  try {
    const rules = await db.select().from(modelRoutingRules).orderBy(modelRoutingRules.seniorityLevel);
    res.json({
      success: true,
      rules,
    });
  } catch (err: any) {
    console.error("Model routing error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch model routing rules." });
  }
});

// ─── PUT /api/admin/finops/model-routing/:seniorityLevel ────────────────────
router.put("/model-routing/:seniorityLevel", requireRole("admin", "hr_admin"), async (req, res) => {
  try {
    const adminReq = req as AdminAuthRequest;
    const { seniorityLevel } = req.params;
    const { primaryModel, fallbackModel, maxPromptTokensOverride } = req.body;

    if (!primaryModel || !fallbackModel) {
      return res.status(400).json({ success: false, error: "Both primary and fallback models are required." });
    }

    const updated = await db
      .insert(modelRoutingRules)
      .values({
        id: `route_${seniorityLevel.toLowerCase()}`,
        seniorityLevel: seniorityLevel.toUpperCase(),
        primaryModel,
        fallbackModel,
        maxPromptTokensOverride: maxPromptTokensOverride ? Number(maxPromptTokensOverride) : 4096,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: modelRoutingRules.seniorityLevel,
        set: {
          primaryModel,
          fallbackModel,
          maxPromptTokensOverride: maxPromptTokensOverride ? Number(maxPromptTokensOverride) : 4096,
          updatedAt: new Date(),
        },
      })
      .returning();

    await logAdminAction({
      adminId: adminReq.admin?.id || "system",
      role: adminReq.admin?.role || "admin",
      action: "UPDATE_MODEL_ROUTING_RULE",
      target: seniorityLevel,
      metadata: { primaryModel, fallbackModel, maxPromptTokensOverride },
    });

    res.json({
      success: true,
      rule: updated[0],
      message: `Routing policy updated for ${seniorityLevel}.`,
    });
  } catch (err: any) {
    console.error("Update routing rule error:", err);
    res.status(500).json({ success: false, error: "Failed to update model routing rule." });
  }
});

export default router;
