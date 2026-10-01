import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { adminUsers } from "../db/schema";
import { signAdminToken } from "../middleware/auth";
import { broadcastLoginActivity } from "../routes/adminSecurity";

export async function handleAdminLogin(req: Request, res: Response) {
  try {
    const body = req.body || {};
    const identifier = String(body.email || body.username || "").trim().toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: "Username/email and password are required." });
    }

    const lookupEmail = identifier === "admin" ? "admin@ravengard.com" : (identifier === "hr" ? "hr@ravengard.com" : identifier);
    const [adminRecord] = await db.select().from(adminUsers).where(eq(adminUsers.email, lookupEmail)).limit(1);

    if (!adminRecord || !adminRecord.passwordHash) {
      return res.status(401).json({ success: false, error: "Invalid credentials." });
    }

    const passwordValid = await bcrypt.compare(password, adminRecord.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ success: false, error: "Invalid credentials." });
    }

    const standardizedRole = (adminRecord.role === "admin" || adminRecord.role === "super_admin") ? "ADMIN" : "HR";
    const orgId = adminRecord.organizationId || "org-ravengard";

    const token = signAdminToken({
      id: adminRecord.id,
      email: adminRecord.email,
      role: adminRecord.role,
      organizationId: orgId,
    });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 8 * 60 * 60 * 1000,
    });

    try {
      broadcastLoginActivity({
        id: `login_${crypto.randomUUID()}`,
        type: "LOGIN_ATTEMPT",
        email: adminRecord.email,
        role: standardizedRole,
        status: "SUCCESS",
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "198.51.100.22",
        city: "San Francisco",
        countryCode: "US",
        latitude: "37.7749",
        longitude: "-122.4194",
        authMethod: "DIRECT_CREDENTIALS",
        timestamp: new Date().toISOString()
      });
    } catch {
      // Non-fatal
    }

    return res.json({
      success: true,
      token,
      role: standardizedRole,
      specificRole: adminRecord.role,
      admin: {
        id: adminRecord.id,
        email: adminRecord.email,
        name: adminRecord.name,
        role: adminRecord.role,
        standardizedRole,
        organizationId: orgId,
      }
    });
  } catch (err: any) {
    console.error("Admin login error:", err);
    return res.status(500).json({ success: false, error: "Authentication failed." });
  }
}
