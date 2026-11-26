import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeMessage, ScanFailed, type ScanInput } from "@/lib/scan";
import { scanLimit, scansLeft } from "@/lib/scanLimit.server";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentUserId } from "@/lib/supabase/user";

// Gemini can take up to 20s, plus one retry.
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const TextBody = z.object({ type: z.literal("text"), text: z.string() });

type Err =
  | "AUTH_REQUIRED"
  | "DAILY_LIMIT"
  | "IMAGE_TOO_LARGE"
  | "IMAGE_TYPE"
  | "TEXT_TOO_SHORT"
  | "BAD_REQUEST"
  | "SCAN_FAILED"
  | "GENERIC";

function fail(error: Err, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/scan (signed in). Text as JSON, image as multipart.
 * Never stores or logs the message: only a scan_usage row (type, result,
 * time) after a successful analysis. Failed calls aren't counted.
 */
export async function POST(req: Request) {
  // 1. Auth.
  const userId = await currentUserId();
  if (!userId) return fail("AUTH_REQUIRED", 401);

  // 2. Daily limit.
  let left: number;
  try {
    left = await scansLeft(userId);
  } catch {
    return fail("GENERIC", 500);
  }
  if (left <= 0) return fail("DAILY_LIMIT", 429, { limit: scanLimit() });

  // 3. Validate.
  let input: ScanInput;
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.startsWith("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (form?.get("type") !== "image" || !(file instanceof File)) return fail("BAD_REQUEST", 400);
    if (!IMAGE_TYPES.includes(file.type)) return fail("IMAGE_TYPE", 415);
    if (file.size > MAX_IMAGE_BYTES) {
      return fail("IMAGE_TOO_LARGE", 413, { size_mb: Math.round((file.size / 1024 / 1024) * 10) / 10 });
    }
    // In memory only.
    input = { type: "image", data: Buffer.from(await file.arrayBuffer()).toString("base64"), mimeType: file.type };
  } else {
    const parsed = TextBody.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("BAD_REQUEST", 400);
    const text = parsed.data.text.trim();
    if (text.length < 10) return fail("TEXT_TOO_SHORT", 400);
    if (text.length > 4000) return fail("BAD_REQUEST", 400);
    input = { type: "text", text };
  }

  // 4. Analyze. A failure is not counted and nothing is stored.
  let result;
  try {
    result = await analyzeMessage(input);
  } catch (err) {
    return fail(err instanceof ScanFailed ? "SCAN_FAILED" : "GENERIC", 502);
  }

  // 5. Count it: type, result and time only.
  const { error } = await createAdminClient()
    .from("scan_usage")
    .insert({ user_id: userId, input_type: input.type, result: result.risk });
  if (error) return fail("GENERIC", 500);

  return NextResponse.json({ ...result, remaining: Math.max(0, left - 1) }, { headers: { "Cache-Control": "no-store" } });
}
