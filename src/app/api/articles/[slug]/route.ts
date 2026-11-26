import { NextResponse } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { getArticle } from "@/lib/articles.server";

/** GET /api/articles/[slug] → the full article with its sections (ar + en). */
export async function GET(_req: Request, ctx: RouteContext<"/api/articles/[slug]">) {
  const { slug } = await ctx.params;
  try {
    const article = await getArticle(slug);
    if (!article) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    return apiOk(article);
  } catch {
    return apiError("GENERIC", 500);
  }
}
