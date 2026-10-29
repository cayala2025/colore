import { es } from "@/content/es";
import { requireAdmin } from "@/lib/adminAuth";
import { loadDiscountHash, loadSettings } from "@/lib/finance/queries";
import { SETTING_FIELDS, toFormValue } from "@/lib/finance/settings";
import { DiscountCodeForm } from "./DiscountCodeForm";
import { SettingsForm } from "./SettingsForm";

export default async function FinanceSettingsPage() {
  await requireAdmin();
  const [settings, hash] = await Promise.all([loadSettings(), loadDiscountHash()]);
  const initial = Object.fromEntries(SETTING_FIELDS.map((f) => [f.key, toFormValue(f, settings)]));
  const t = es.finance.settings;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-muted">{t.intro}</p>
      </div>
      <DiscountCodeForm enabled={Boolean(hash)} />
      <SettingsForm initial={initial} />
    </div>
  );
}
