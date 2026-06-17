"use client";

// Scheduled-drop picker. Stores the release moment as an ISO/UTC string (or
// null = publish immediately) while presenting a native datetime-local input in
// the admin's own timezone. Shows a live, human hint of when the drop lands.

interface Props {
  /** ISO string (UTC) or null/"" for "publish immediately". */
  value: string | null;
  onChange: (iso: string | null) => void;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO (UTC) → "YYYY-MM-DDTHH:mm" in the browser's local time for the input. */
function isoToLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local value (local time) → ISO/UTC string. */
function localToISO(local: string): string | null {
  if (!local) return null;
  const d = new Date(local); // interpreted as local time
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function relativeHint(iso: string | null): { text: string; tone: "muted" | "scheduled" | "live" } {
  if (!iso) return { text: "Publishes immediately when saved.", tone: "muted" };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { text: "Publishes immediately when saved.", tone: "muted" };

  const diffMs = d.getTime() - Date.now();
  const absolute = d.toLocaleString(undefined, {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });

  if (diffMs <= 0) return { text: `Already live (released ${absolute}).`, tone: "live" };

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const mins = Math.round(diffMs / 60000);
  const hrs = Math.round(diffMs / 3_600_000);
  const days = Math.round(diffMs / 86_400_000);
  const rel =
    Math.abs(days) >= 1 ? rtf.format(days, "day")
    : Math.abs(hrs) >= 1 ? rtf.format(hrs, "hour")
    : rtf.format(Math.max(mins, 1), "minute");

  return { text: `Scheduled · drops ${rel} (${absolute})`, tone: "scheduled" };
}

export function ReleaseScheduleField({ value, onChange }: Props) {
  const hint = relativeHint(value);
  const toneColor =
    hint.tone === "scheduled" ? "text-amber-400/80"
    : hint.tone === "live" ? "text-green-400/80"
    : "text-white/30";

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="datetime-local"
          value={isoToLocal(value)}
          onChange={(e) => onChange(localToISO(e.target.value))}
          style={{ colorScheme: "dark" }}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-white/25 transition-colors"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="px-3 py-3 text-xs text-white/40 hover:text-white/70 whitespace-nowrap transition-colors"
            title="Clear - publish immediately"
          >
            Vymazať
          </button>
        )}
      </div>
      <p className={`text-[11px] mt-2 ${toneColor}`}>{hint.text}</p>
    </div>
  );
}
