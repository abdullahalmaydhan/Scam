import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ShowcaseItem } from "./types";

/**
 * The 3 home examples, with their answer (API.md: they're examples,
 * never used in rounds). scenarios has no RLS read policy, so this reads
 * with the service role and selects only showcase rows.
 */
export async function getShowcase(): Promise<ShowcaseItem[]> {
  const { data, error } = await createAdminClient()
    .from("scenarios")
    .select(
      "category, sender, sender_meta, subject, body, link, correct_answer, sender_en, sender_meta_en, subject_en, body_en",
    )
    .eq("is_showcase", true)
    .eq("is_active", true)
    .limit(3);
  if (error) throw error;
  return orderScamSafeScam((data ?? []) as ShowcaseItem[]);
}

/** DESIGN.md §7: the laptop shows fraud, real, fraud. Phone shows the first. */
function orderScamSafeScam(items: ShowcaseItem[]): ShowcaseItem[] {
  const scams = items.filter((i) => i.correct_answer === "scam");
  const safes = items.filter((i) => i.correct_answer === "safe");
  const out: ShowcaseItem[] = [];
  while (scams.length || safes.length) {
    if (scams.length) out.push(scams.shift()!);
    if (safes.length) out.push(safes.shift()!);
  }
  return out;
}
