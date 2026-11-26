import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase session cookie on every page request, and:
 * - /profile needs an account → /login?next=/profile
 * - /login, /signup when signed in → home
 * /scan and /settings stay open: they show their guest state (HANDOFF §5, decision 27).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const signedIn = !!data.user;
  const path = request.nextUrl.pathname;

  const redirect = (to: string) => {
    const r = NextResponse.redirect(new URL(to, request.url));
    // Keep any refreshed session cookies on the redirect.
    for (const c of response.cookies.getAll()) r.cookies.set(c);
    return r;
  };

  if (!signedIn && (path === "/profile" || path.startsWith("/profile/"))) {
    return redirect(`/login?next=${encodeURIComponent(path)}`);
  }
  if (signedIn && (path === "/login" || path === "/signup")) {
    return redirect("/");
  }
  return response;
}

export const config = {
  // Pages only: not API routes, Next internals or static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
