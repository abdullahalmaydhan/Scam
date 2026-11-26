import { NextResponse } from "next/server";

/** Error codes the UI maps to `errors.*` in ui-strings. */
export type ApiErrorCode =
  | "BAD_REQUEST"
  | "NOT_ENOUGH_QUESTIONS"
  | "SESSION_NOT_FOUND"
  | "SESSION_ALREADY_SUBMITTED"
  | "SESSION_NOT_YOURS"
  | "WRONG_ANSWER_COUNT"
  | "WRONG_ANSWER_POSITIONS"
  | "NETWORK"
  | "AUTH_REQUIRED"
  | "CLAIM_NOT_ALLOWED"
  | "GENERIC";

export function apiError(code: ApiErrorCode, status: number) {
  return NextResponse.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });
}

export function apiOk<T>(body: T) {
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}

/**
 * The SQL functions raise their error code as the message (errcode P0001).
 * Returns the code when it is one of `known`, otherwise null.
 */
export function sqlErrorCode<K extends string>(
  err: { code?: string; message?: string } | null,
  known: readonly K[],
): K | null {
  if (!err || err.code !== "P0001") return null;
  return (known as readonly string[]).includes(err.message ?? "") ? (err.message as K) : null;
}

/** A fetch-level failure reaching Supabase (no HTTP response). */
export function isNetworkError(err: { message?: string } | null): boolean {
  return !!err && /fetch failed|network|ECONN|ETIMEDOUT/i.test(err.message ?? "");
}
