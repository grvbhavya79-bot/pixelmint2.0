import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/server/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  subject: z.string().trim().min(3, "Subject must be at least 3 characters.").max(150),
  message: z.string().trim().min(10, "Message must be at least 10 characters.").max(5000),
  honeypot: z.string().max(0).optional(), // spam trap: must stay empty
});

/** Send the notification email through the configured provider (Resend-compatible). */
async function sendNotificationEmail(fields: { name: string; email: string; subject: string; message: string }): Promise<boolean> {
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM;
  const to = process.env.CONTACT_TO_EMAIL || "grvbhavya79@gmail.com";
  if (!apiKey || !from) return false; // email not configured — message still stored

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: fields.email,
        subject: `[ToolBox100 Contact] ${fields.subject}`,
        text: `From: ${fields.name} <${fields.email}>\n\n${fields.message}`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`contact:${ip}`, RATE_LIMITS.contact.limit, RATE_LIMITS.contact.windowMs);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: `You've reached the message limit for now — please try again in about ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.` },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." },
      { status: 400 },
    );
  }
  if (parsed.data.honeypot) {
    // silent spam drop
    return NextResponse.json({ success: true });
  }

  try {
    await db.contactMessage.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
      },
    });
    const emailed = await sendNotificationEmail(parsed.data);
    return NextResponse.json({
      success: true,
      emailed,
      message: emailed
        ? "Message sent — we'll reply soon."
        : "Message received and stored — we'll reply soon.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Something went wrong while sending. Please try again." },
      { status: 500 },
    );
  }
}
