"use client";

import { useRouter } from "next/navigation";
import { es } from "@/content/es";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.replace("/cobro/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} className="min-h-11 rounded-lg px-3 font-medium hover:bg-bg">
      {es.finance.pos.signOut}
    </button>
  );
}
