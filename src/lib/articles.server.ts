import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Learn articles. Public read (RLS: is_published), anon key. */

export type Section = { heading: string; kind: "p" | "list"; text: string | null; items: string[] | null };

export type ArticleSummary = { slug: string; title_ar: string; title_en: string | null; minutes: number; sort: number };

export type Article = ArticleSummary & {
  intro_ar: string;
  intro_en: string | null;
  sections: Section[];
  sections_en: Section[] | null;
};

export async function getArticles(): Promise<ArticleSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("articles").select("slug, title_ar, title_en, minutes, sort").order("sort");
  if (error) throw error;
  return data ?? [];
}

export async function getArticle(slug: string): Promise<Article | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("slug, title_ar, title_en, minutes, sort, intro_ar, intro_en, sections, sections_en")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}
