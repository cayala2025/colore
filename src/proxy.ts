// Admin gate (Next 16 renamed "middleware" to "proxy"). Runs before every /admin request:
// refreshes the Supabase session cookie, then requires a signed-in user whose email is in `admins`.
// Pages and server actions re-check with requireAdmin() as well (defense in depth).
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { adminBypassEnabled, BYPASS_COOKIE } from "@/lib/adminBypass";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (adminBypassEnabled(request.cookies.get(BYPASS_COOKIE)?.value)) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });

  const toLogin = (error?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = error ? `?error=${error}` : "";
    const redirect = NextResponse.redirect(url);
    for (const c of response.cookies.getAll()) redirect.cookies.set(c);
    return redirect;
  };

  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (!email) return toLogin();

  // RLS policy "admins_select_own" lets a signed-in user read only their own admins row.
  const { data: adminRow } = await supabase.from("admins").select("email").eq("email", email).maybeSingle();
  if (!adminRow) return toLogin("not_admin");

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
