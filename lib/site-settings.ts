import { createAdminClient } from "@/lib/supabase";

export type SiteSettings = {
  lock_enabled: boolean;
};

const DEFAULTS: SiteSettings = {
  lock_enabled: false,
};

// Server-only read of the singleton site_settings row. Falls back to defaults
// if the row or the table doesn't exist yet.
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select("lock_enabled")
      .eq("id", 1)
      .maybeSingle();

    if (!data) return DEFAULTS;
    return data as SiteSettings;
  } catch {
    return DEFAULTS;
  }
}
