import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminBypassEnabled, BYPASS_ADMIN_EMAIL, BYPASS_COOKIE } from "./adminBypass";
import { supabaseAdmin } from "./supabase/admin";
import { supabaseServer } from "./supabase/server";

export type Admin = { email: string };

export async function isAdminEmail(email: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin().from("admins").select("email").eq("email", email.toLowerCase()).maybeSingle();
  if (error) throw new Error(`admin lookup failed: ${error.message}`);
  return Boolean(data);
}

/** The signed-in admin, or null (not signed in, or signed in but not in `admins`). */
export async function getAdmin(): Promise<Admin | null> {
  if (adminBypassEnabled((await cookies()).get(BYPASS_COOKIE)?.value)) return { email: BYPASS_ADMIN_EMAIL };
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser(); // verified with Supabase Auth, not just the cookie
  const email = data.user?.email;
  if (!email) return null;
  return (await isAdminEmail(email)) ? { email: email.toLowerCase() } : null;
}

/** Use at the top of every admin page and server action. Redirects to the login when not allowed. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
