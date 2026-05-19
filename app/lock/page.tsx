import { LockScreen } from "@/components/lock/LockScreen";

// Don't cache the page itself - we want admin toggles to reflect quickly.
// The underlying fetch in middleware has a 30s revalidate cache, which is
// the actual bottleneck and that's fine.
export const dynamic = "force-dynamic";

export default function LockPage() {
  return <LockScreen />;
}
