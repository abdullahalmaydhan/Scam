import { apiError, apiOk } from "@/lib/api";
import { getArticles } from "@/lib/articles.server";

/** GET /api/articles → [{ slug, title_ar, title_en, minutes, sort }] */
export async function GET() {
  try {
    return apiOk(await getArticles());
  } catch {
    return apiError("GENERIC", 500);
  }
}
