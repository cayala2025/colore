// Admin gate (Next 16 renamed "middleware" to "proxy"). Runs before every /admin and /cobro request:
// refreshes the Supabase session cookie, then requires a signed-in user whose email is in `admins`
// (everything) or an active `staff` row (/cobro only; staff opening /admin are sent to /cobro).
// Pages and server actions re-check with requireAdmin() as well (defense in depth).
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { accessFor, type Role } from "@/lib/access";
import { adminBypassEnabled, BYPASS_COOKIE } from "@/lib/adminBypass";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login" || pathname === "/cobro/login") return NextResponse.next();
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

  const redirectTo = (path: string, error?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = error ? `?error=${error}` : "";
    const redirect = NextResponse.redirect(url);
    for (const c of response.cookies.getAll()) redirect.cookies.set(c);
    return redirect;
  };

  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  const inCobro = pathname === "/cobro" || pathname.startsWith("/cobro/");
  if (!email) return redirectTo(inCobro ? "/cobro/login" : "/admin/login");

  // RLS policies "admins_select_own" / "staff_select_own" let a signed-in user read only their own row.
  let role: Role | null = null;
  const { data: adminRow } = await supabase.from("admins").select("email").eq("email", email).maybeSingle();
  if (adminRow) role = "admin";
  else {
    const { data: staffRow } = await supabase.from("staff").select("email").eq("email", email).eq("active", true).maybeSingle();
    if (staffRow) role = "staff";
  }

  const access = accessFor(pathname, role);
  if (access === "allow") return response;
  if (access === "cobro") return redirectTo("/cobro");
  return access === "cobro-login" ? redirectTo("/cobro/login", "not_staff") : redirectTo("/admin/login", "not_admin");
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/cobro", "/cobro/:path*"],
};
