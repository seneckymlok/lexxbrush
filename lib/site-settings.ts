import { createAdminClient } from "@/lib/supabase";

export type SiteSettings = {
  lock_enabled: boolean;
  lock_title_en: string;
  lock_title_sk: string;
  lock_subtitle_en: string;
  lock_subtitle_sk: string;
};

const DEFAULTS: SiteSettings = {
  lock_enabled: false,
  lock_title_en: "BACK SOON.",
  lock_title_sk: "O CHVÍĽU.",
  lock_subtitle_en: "Putting on the finishing touches.",
  lock_subtitle_sk: "Dolaďujeme posledné detaily.",
};

// Server-only read of the singleton site_settings row. Falls back to defaults
// if the row or the table doesn't exist yet.
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select(
        "lock_enabled, lock_title_en, lock_title_sk, lock_subtitle_en, lock_subtitle_sk",
      )
      .eq("id", 1)
      .maybeSingle();

    if (!data) return DEFAULTS;
    return data as SiteSettings;
  } catch {
    return DEFAULTS;
  }
}
