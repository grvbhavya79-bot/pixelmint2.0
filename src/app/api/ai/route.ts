import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/server/rate-limit";

/**
 * Server-side AI endpoint for Pixelmint.fun AI tools.
 * The z-ai SDK only ever runs here — never on the client.
 */

const TASKS = {
  summarize: {
    system:
      "You are a precise summarizer for Pixelmint.fun. Produce clean, faithful summaries that a busy reader can trust. Never invent facts.",
    build: (input: string, opts: Record<string, string>) =>
      `Summarize the following text. Length: ${opts.length ?? "Medium"} — Short means 2-3 sentences, Medium means one short paragraph, Detailed means one paragraph followed by a bulleted list of key points. Use plain text with simple dashes for bullets.\n\nTEXT:\n${input}`,
    maxTokens: 900,
  },
  improve: {
    system:
      "You are an expert editor for Pixelmint.fun. Rewrite the user's text so it is clear, polished and natural. Preserve the author's meaning, facts and intent exactly. Output only the rewritten text.",
    build: (input: string, opts: Record<string, string>) =>
      `Rewrite the following text with a ${opts.tone ?? "Professional"} tone. Fix grammar, spelling and punctuation; tighten wording and improve flow. Keep it about the same length unless the tone is Concise. Output only the rewrite.\n\nTEXT:\n${input}`,
    maxTokens: 1400,
  },
  ideas: {
    system:
      "You are a sharp, practical brainstorming partner for Pixelmint.fun. You produce specific, usable ideas — never vague filler.",
    build: (input: string, opts: Record<string, string>) =>
      `Generate exactly 10 ${opts.kind ?? "Creative"} ideas for this topic: "${input}". ${opts.kind === "Bold" ? "Favor ambitious, attention-grabbing ideas." : opts.kind === "Practical" ? "Favor ideas that can be executed quickly with minimal resources." : "Favor fresh, unexpected angles."}\nFormat each as:\n1. **Idea title** — one sentence explaining why it works.`,
    maxTokens: 1100,
  },
} as const;

type TaskKey = keyof typeof TASKS;

const schema = z.object({
  task: z.enum(["summarize", "improve", "ideas"]),
  input: z.string().trim().min(8, "Please enter a bit more text first.").max(10_000, "Text is limited to 10,000 characters."),
  options: z.record(z.string(), z.string()).optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`ai:${ip}`, 12, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "You're using the AI tools quickly — please wait a moment and try again." },
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
      { success: false, error: parsed.error.issues[0]?.message ?? "Please check your input." },
      { status: 400 },
    );
  }

  const { task, input, options } = parsed.data;
  const conf = TASKS[task as TaskKey];
  const prompt = conf.build(input, options ?? {});

  try {
    const { default: ZAI } = await import("z-ai-web-dev-sdk");
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: conf.system },
        { role: "user", content: prompt },
      ],
      temperature: task === "ideas" ? 0.9 : 0.4,
      max_tokens: conf.maxTokens,
    });

    const output = completion.choices?.[0]?.message?.content?.trim();
    if (!output) {
      return NextResponse.json(
        { success: false, error: "The AI returned an empty response — please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, output });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const friendly = /timeout|abort/i.test(msg)
      ? "The AI took too long to respond — please try again."
      : "The AI service is briefly unavailable — please try again in a moment.";
    return NextResponse.json({ success: false, error: friendly }, { status: 502 });
  }
}
