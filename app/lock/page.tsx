import { getSiteSettings } from "@/lib/site-settings";
import { LockScreen } from "@/components/lock/LockScreen";

// Don't cache the page itself - we want admin toggles to reflect quickly.
// The underlying fetch in middleware has a 30s revalidate cache, which is
// the actual bottleneck and that's fine.
export const dynamic = "force-dynamic";

export default async function LockPage() {
  const settings = await getSiteSettings();

  return (
    <LockScreen
      titleEn={settings.lock_title_en}
      titleSk={settings.lock_title_sk}
      subtitleEn={settings.lock_subtitle_en}
      subtitleSk={settings.lock_subtitle_sk}
    />
  );
}
