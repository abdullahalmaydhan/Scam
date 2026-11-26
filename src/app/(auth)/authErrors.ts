import type { AuthError } from "@supabase/supabase-js";

/** Supabase auth errors → our error keys (API.md, Auth). */
export function authErrorKind(err: AuthError | null): "LOGIN_FAILED" | "EMAIL_TAKEN" | "PASSWORD_SHORT" | "GENERIC" {
  if (!err) return "GENERIC";
  const code = (err as AuthError & { code?: string }).code ?? "";
  if (code === "invalid_credentials" || /invalid login credentials/i.test(err.message)) return "LOGIN_FAILED";
  if (code === "user_already_exists" || code === "email_exists" || /already registered/i.test(err.message)) {
    return "EMAIL_TAKEN";
  }
  if (code === "weak_password" || /password should be/i.test(err.message)) return "PASSWORD_SHORT";
  return "GENERIC";
}

/** Hands the email from one auth screen to the next without putting it in the URL. */
export const EMAIL_HANDOFF = "sos.authEmail";
/** Read-only (StrictMode may call state initializers twice); clear it with clearHandoffEmail. */
export function peekHandoffEmail(): string {
  try {
    return sessionStorage.getItem(EMAIL_HANDOFF) ?? "";
  } catch {
    return "";
  }
}
export function clearHandoffEmail() {
  try {
    sessionStorage.removeItem(EMAIL_HANDOFF);
  } catch {}
}
export function giveHandoffEmail(email: string) {
  try {
    sessionStorage.setItem(EMAIL_HANDOFF, email);
  } catch {}
}
