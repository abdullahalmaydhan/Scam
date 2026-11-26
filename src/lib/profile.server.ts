import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Difficulty, Mode } from "@/lib/game/types";

/**
 * P-1 data, read with the user's own session (RLS: own rows only).
 * Every number comes from SQL (the user_stats / user_category_stats views
 * and user_badges); nothing is computed here except the badge progress
 * lookups API.md describes.
 */

export type Category = "sms" | "whatsapp" | "email" | "banking" | "websites";

export type Profile = {
  display_name: string;
  email: string;
  member_since: string;
  language: "ar" | "en";
  theme: "dark" | "light";
  stats: {
    total_points: number;
    rounds_completed: number;
    questions_answered: number;
    correct_answers: number;
    correct_percent: number;
  };
  categories: Array<{ category: Category; answered: number; correct: number; correct_percent: number }>;
  badges_earned: number;
  badges_total: number;
};

export type BadgeRow = {
  code: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  earned_at: string | null;
  progress: { current: number; target: number } | null;
};

export type HistoryRow = {
  mode: Mode;
  difficulty: Difficulty;
  correct: number;
  total: number;
  points: number;
  completed_at: string;
};

export async function getProfile(supabase: SupabaseClient, user: User): Promise<Profile> {
  const [profile, stats, cats, earned, total] = await Promise.all([
    supabase.from("profiles").select("display_name, language, theme, created_at").eq("id", user.id).single(),
    supabase.from("user_stats").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_category_stats").select("category, answered, correct, correct_percent").eq("user_id", user.id),
    supabase.from("user_badges").select("badge_code", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("badges").select("code", { count: "exact", head: true }),
  ]);
  if (profile.error) throw profile.error;
  if (stats.error) throw stats.error;
  if (cats.error) throw cats.error;

  const s = stats.data;
  return {
    display_name: profile.data.display_name,
    email: user.email ?? "",
    member_since: (profile.data.created_at as string).slice(0, 10),
    language: profile.data.language,
    theme: profile.data.theme,
    stats: {
      total_points: s?.total_points ?? 0,
      rounds_completed: Number(s?.rounds_completed ?? 0),
      questions_answered: Number(s?.questions_answered ?? 0),
      correct_answers: Number(s?.correct_answers ?? 0),
      correct_percent: s?.correct_percent ?? 0,
    },
    categories: (cats.data ?? []).map((c) => ({
      category: c.category,
      answered: Number(c.answered),
      correct: Number(c.correct),
      correct_percent: c.correct_percent,
    })),
    badges_earned: earned.count ?? 0,
    badges_total: total.count ?? 0,
  };
}

export async function getBadges(supabase: SupabaseClient, user: User): Promise<BadgeRow[]> {
  const [badges, mine, profile, cats] = await Promise.all([
    supabase.from("badges").select("code, name_ar, name_en, description_ar, rule, threshold, category, sort").order("sort"),
    supabase.from("user_badges").select("badge_code, earned_at").eq("user_id", user.id),
    supabase.from("profiles").select("total_points").eq("id", user.id).single(),
    supabase.from("user_category_stats").select("category, correct").eq("user_id", user.id),
  ]);
  if (badges.error) throw badges.error;
  const earnedAt = new Map((mine.data ?? []).map((b) => [b.badge_code, b.earned_at as string]));
  const points = profile.data?.total_points ?? 0;
  const correctBy = new Map((cats.data ?? []).map((c) => [c.category, Number(c.correct)]));

  return (badges.data ?? []).map((b) => {
    // API.md: points_total → current total_points; category_correct → correct
    // answers in that category; the other rules → null.
    let progress: BadgeRow["progress"] = null;
    if (b.rule === "points_total") progress = { current: points, target: b.threshold };
    if (b.rule === "category_correct") progress = { current: correctBy.get(b.category) ?? 0, target: b.threshold };
    return {
      code: b.code,
      name_ar: b.name_ar,
      name_en: b.name_en,
      description_ar: b.description_ar,
      earned_at: earnedAt.get(b.code) ?? null,
      progress,
    };
  });
}

export async function getHistory(supabase: SupabaseClient, user: User, limit = 10): Promise<HistoryRow[]> {
  const { data, error } = await supabase
    .from("game_sessions")
    .select("mode, difficulty, correct_count, total_count, points, completed_at")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    mode: r.mode,
    difficulty: r.difficulty,
    correct: r.correct_count,
    total: r.total_count,
    points: r.points,
    completed_at: r.completed_at,
  }));
}
