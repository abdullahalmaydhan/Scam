import { apiError, apiOk } from "@/lib/api";
import { getShowcase } from "@/lib/game/showcase";

/** GET /api/showcase: the 3 home examples, with their answers. */
export async function GET() {
  try {
    return apiOk(await getShowcase());
  } catch {
    return apiError("GENERIC", 500);
  }
}
