import { Router, Request, Response } from "express";
import crypto from "crypto";
import { db } from "../db/index";
import { interviewSchedules, candidates, sessions, candidateTasks } from "../db/schema";
import { eq, and, desc, gte, lte, ne, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "ravengard_dev_jwt_secret_change_in_production";

export const schedulingRouter = Router();

// Helper to extract authenticated candidate from Bearer token
function getCandidateFromReq(req: Request): { id: string; email?: string } | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && (decoded.id || decoded.candidateId)) {
        return { id: decoded.id || decoded.candidateId, email: decoded.email };
      }
    } catch {
      // Direct candidate ID token fallback in dev/test
      if (token.startsWith("cand-") || token.startsWith("test-")) {
        return { id: token };
      }
    }
  }
  if (req.body?.candidateId) {
    return { id: String(req.body.candidateId) };
  }
  if (req.query?.candidateId) {
    return { id: String(req.query.candidateId) };
  }
  return null;
}

/**
 * Generate standard RFC 5545 iCalendar format text
 */
function generateIcs(event: {
  uid: string;
  summary: string;
  description: string;
  startDate: Date;
  endDate: Date;
  url?: string;
}): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const formatDate = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RavenGard AI Recruiter//Interview Scheduling//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(event.startDate)}`,
    `DTEND:${formatDate(event.endDate)}`,
    `SUMMARY:${event.summary}`,
    `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`,
    event.url ? `URL:${event.url}` : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

/**
 * GET /api/candidate/scheduling/slots
 * Generates enterprise availability windows for the next N days.
 * Cross-references existing confirmed bookings to mark booked slots.
 */
schedulingRouter.get("/slots", async (req: Request, res: Response) => {
  try {
    const daysParam = parseInt(String(req.query.days || "14"), 10);
    const totalDays = Math.min(Math.max(1, isNaN(daysParam) ? 14 : daysParam), 30);
    const timezone = String(req.query.timezone || "UTC");
    const roundType = String(req.query.roundType || "ai_technical");

    // Standard business slot definitions (hours & minutes in UTC / local representation)
    const standardSlotTimes = [
      { startHour: 9, startMinute: 0, duration: 45, period: "morning" as const },
      { startHour: 10, startMinute: 30, duration: 45, period: "morning" as const },
      { startHour: 13, startMinute: 0, duration: 45, period: "afternoon" as const },
      { startHour: 14, startMinute: 30, duration: 45, period: "afternoon" as const },
      { startHour: 16, startMinute: 0, duration: 45, period: "afternoon" as const },
      { startHour: 17, startMinute: 30, duration: 45, period: "evening" as const },
    ];

    const startDate = new Date();
    // Start from tomorrow
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays);
    endDate.setHours(23, 59, 59, 999);

    // Fetch existing confirmed bookings in this window
    let bookedSlots: any[] = [];
    try {
      bookedSlots = await db
        .select()
        .from(interviewSchedules)
        .where(
          and(
            eq(interviewSchedules.status, "confirmed"),
            gte(interviewSchedules.scheduledAt, startDate),
            lte(interviewSchedules.scheduledAt, endDate)
          )
        );
    } catch (err: any) {
      console.warn("[Scheduling] Database query fallback for slots:", err.message);
    }

    const bookedTimestamps = new Set(
      bookedSlots.map((b) => new Date(b.scheduledAt).toISOString())
    );

    const slots: any[] = [];
    const days: any[] = [];

    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(currentDay.getDate() + dayOffset);

      // Skip weekend days (0 = Sunday, 6 = Saturday)
      const dayOfWeek = currentDay.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const dateStr = currentDay.toISOString().split("T")[0];
      const daySlots: any[] = [];

      for (const t of standardSlotTimes) {
        const slotStart = new Date(currentDay);
        slotStart.setUTCHours(t.startHour, t.startMinute, 0, 0);

        const slotEnd = new Date(slotStart.getTime() + t.duration * 60 * 1000);
        const isoStart = slotStart.toISOString();
        const isBooked = bookedTimestamps.has(isoStart);

        const slotItem = {
          id: `slot-${dateStr}-${String(t.startHour).padStart(2, "0")}${String(t.startMinute).padStart(2, "0")}`,
          date: dateStr,
          startTime: isoStart,
          endTime: slotEnd.toISOString(),
          displayTime: `${String(t.startHour).padStart(2, "0")}:${String(t.startMinute).padStart(2, "0")} - ${String(slotEnd.getUTCHours()).padStart(2, "0")}:${String(slotEnd.getUTCMinutes()).padStart(2, "0")}`,
          period: t.period,
          durationMinutes: t.duration,
          isAvailable: !isBooked,
          roundType,
        };

        daySlots.push(slotItem);
        slots.push(slotItem);
      }

      days.push({
        date: dateStr,
        dayOfWeek,
        dayName: currentDay.toLocaleDateString("en-US", { weekday: "short" }),
        formattedDate: currentDay.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        availableCount: daySlots.filter((s) => s.isAvailable).length,
        totalCount: daySlots.length,
      });
    }

    return res.json({
      success: true,
      timezone,
      days,
      slots,
      totalAvailable: slots.filter((s) => s.isAvailable).length,
    });
  } catch (err: any) {
    console.error("[Scheduling] Error fetching available slots:", err);
    return res.status(500).json({ success: false, error: "Failed to generate available interview slots." });
  }
});

/**
 * GET /api/candidate/scheduling/my-schedule
 * Returns active candidate's confirmed appointments.
 */
schedulingRouter.get("/my-schedule", async (req: Request, res: Response) => {
  try {
    const candidate = getCandidateFromReq(req);
    if (!candidate?.id) {
      return res.status(401).json({ success: false, error: "Authentication required to view scheduled interviews." });
    }

    const schedules = await db
      .select()
      .from(interviewSchedules)
      .where(
        and(
          eq(interviewSchedules.candidateId, candidate.id),
          ne(interviewSchedules.status, "cancelled")
        )
      )
      .orderBy(desc(interviewSchedules.scheduledAt));

    return res.json({
      success: true,
      candidateId: candidate.id,
      schedules,
      hasActiveBooking: schedules.some((s) => s.status === "confirmed" && new Date(s.scheduledAt) > new Date()),
    });
  } catch (err: any) {
    console.error("[Scheduling] Error fetching candidate schedule:", err);
    return res.status(500).json({ success: false, error: "Failed to retrieve scheduled interviews." });
  }
});

/**
 * POST /api/candidate/scheduling/book
 * Reserves an available slot and stores it into the database.
 */
schedulingRouter.post("/book", async (req: Request, res: Response) => {
  try {
    const candidate = getCandidateFromReq(req);
    const candidateId = candidate?.id || req.body?.candidateId;
    const { sessionId, scheduledAt, endTime, timezone, roundType, notes } = req.body || {};

    if (!candidateId) {
      return res.status(401).json({ success: false, error: "Candidate identity required to reserve slot." });
    }

    if (!scheduledAt) {
      return res.status(400).json({ success: false, error: "scheduledAt timestamp is required." });
    }

    const parsedStart = new Date(scheduledAt);
    if (isNaN(parsedStart.getTime())) {
      return res.status(400).json({ success: false, error: "Invalid scheduledAt format." });
    }

    if (parsedStart.getTime() <= Date.now()) {
      return res.status(400).json({ success: false, error: "Interview slot must be scheduled for a future time." });
    }

    const parsedEnd = endTime
      ? new Date(endTime)
      : new Date(parsedStart.getTime() + 45 * 60 * 1000);

    // Conflict detection: ensure slot is not already booked by another candidate
    const existingConflict = await db
      .select()
      .from(interviewSchedules)
      .where(
        and(
          eq(interviewSchedules.status, "confirmed"),
          eq(interviewSchedules.scheduledAt, parsedStart)
        )
      )
      .limit(1);

    if (existingConflict.length > 0) {
      return res.status(409).json({
        success: false,
        error: "This time slot was just reserved by another candidate. Please select another slot.",
      });
    }

    const scheduleId = `sched-${crypto.randomUUID()}`;
    const eventUid = `${crypto.randomUUID()}@ravengard.ai`;
    const selectedRound = roundType || "ai_technical";
    const selectedTz = timezone || "UTC";
    const meetingLink = `/interview/engine?scheduleId=${scheduleId}`;

    const [savedRecord] = await db
      .insert(interviewSchedules)
      .values({
        id: scheduleId,
        candidateId,
        sessionId: sessionId || null,
        scheduledAt: parsedStart,
        endTime: parsedEnd,
        timezone: selectedTz,
        roundType: selectedRound,
        status: "confirmed",
        notes: notes ? String(notes).trim() : null,
        calendarEventUid: eventUid,
        meetingLink,
      })
      .returning();

    // Optionally create or update candidate task record
    try {
      await db.insert(candidateTasks).values({
        id: `task-${crypto.randomUUID()}`,
        candidateId,
        applicationId: `app-${candidateId}`,
        title: `Scheduled: ${selectedRound.replace("_", " ").toUpperCase()} Assessment`,
        description: `Your interview slot is confirmed for ${parsedStart.toUTCString()}.`,
        type: "live_interview",
        status: "pending",
        actionUrl: meetingLink,
        dueAt: parsedStart,
      });
    } catch {
      // Safe fallback if candidate_tasks has FK constraint
    }

    // Generate iCal payload
    const icsContent = generateIcs({
      uid: eventUid,
      summary: `RavenGard AI Recruiter: ${selectedRound.replace("_", " ").toUpperCase()}`,
      description: `RavenGard Automated Enterprise Assessment.\nRound: ${selectedRound}\nCandidate: ${candidateId}\nMeeting Link: ${meetingLink}\nNotes: ${notes || "None"}`,
      startDate: parsedStart,
      endDate: parsedEnd,
      url: meetingLink,
    });

    return res.status(201).json({
      success: true,
      message: "Interview slot successfully reserved and persisted.",
      schedule: savedRecord,
      icsContent,
    });
  } catch (err: any) {
    console.error("[Scheduling] Error booking slot:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to book interview slot." });
  }
});

/**
 * POST /api/candidate/scheduling/cancel
 * Cancels a scheduled interview slot.
 */
schedulingRouter.post("/cancel", async (req: Request, res: Response) => {
  try {
    const candidate = getCandidateFromReq(req);
    const { scheduleId, reason } = req.body || {};

    if (!scheduleId) {
      return res.status(400).json({ success: false, error: "scheduleId is required." });
    }

    const [existing] = await db
      .select()
      .from(interviewSchedules)
      .where(eq(interviewSchedules.id, scheduleId))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ success: false, error: "Scheduled interview record not found." });
    }

    if (candidate?.id && existing.candidateId !== candidate.id) {
      return res.status(403).json({ success: false, error: "Unauthorized to cancel this appointment." });
    }

    const [updated] = await db
      .update(interviewSchedules)
      .set({
        status: "cancelled",
        notes: reason ? `${existing.notes ? existing.notes + " | " : ""}Cancelled: ${reason}` : existing.notes,
        updatedAt: new Date(),
      })
      .where(eq(interviewSchedules.id, scheduleId))
      .returning();

    return res.json({
      success: true,
      message: "Interview appointment has been successfully cancelled.",
      schedule: updated,
    });
  } catch (err: any) {
    console.error("[Scheduling] Error cancelling slot:", err);
    return res.status(500).json({ success: false, error: "Failed to cancel interview appointment." });
  }
});

/**
 * POST /api/candidate/scheduling/reschedule
 * Updates an existing appointment to a new slot.
 */
schedulingRouter.post("/reschedule", async (req: Request, res: Response) => {
  try {
    const candidate = getCandidateFromReq(req);
    const { scheduleId, newScheduledAt, newEndTime, timezone } = req.body || {};

    if (!scheduleId || !newScheduledAt) {
      return res.status(400).json({ success: false, error: "scheduleId and newScheduledAt are required." });
    }

    const parsedStart = new Date(newScheduledAt);
    if (isNaN(parsedStart.getTime()) || parsedStart.getTime() <= Date.now()) {
      return res.status(400).json({ success: false, error: "newScheduledAt must be a valid future timestamp." });
    }

    const [existing] = await db
      .select()
      .from(interviewSchedules)
      .where(eq(interviewSchedules.id, scheduleId))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ success: false, error: "Scheduled interview not found." });
    }

    if (candidate?.id && existing.candidateId !== candidate.id) {
      return res.status(403).json({ success: false, error: "Unauthorized to reschedule this appointment." });
    }

    // Check conflict
    const conflict = await db
      .select()
      .from(interviewSchedules)
      .where(
        and(
          eq(interviewSchedules.status, "confirmed"),
          eq(interviewSchedules.scheduledAt, parsedStart),
          ne(interviewSchedules.id, scheduleId)
        )
      )
      .limit(1);

    if (conflict.length > 0) {
      return res.status(409).json({ success: false, error: "Target time slot is already reserved." });
    }

    const parsedEnd = newEndTime
      ? new Date(newEndTime)
      : new Date(parsedStart.getTime() + 45 * 60 * 1000);

    const [updated] = await db
      .update(interviewSchedules)
      .set({
        scheduledAt: parsedStart,
        endTime: parsedEnd,
        timezone: timezone || existing.timezone,
        status: "confirmed",
        updatedAt: new Date(),
      })
      .where(eq(interviewSchedules.id, scheduleId))
      .returning();

    return res.json({
      success: true,
      message: "Appointment successfully rescheduled.",
      schedule: updated,
    });
  } catch (err: any) {
    console.error("[Scheduling] Error rescheduling slot:", err);
    return res.status(500).json({ success: false, error: "Failed to reschedule interview." });
  }
});
