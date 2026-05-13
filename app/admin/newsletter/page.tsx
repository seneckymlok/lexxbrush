"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BlockComposer, type ComposerProduct } from "@/components/admin/newsletter/BlockComposer";
import {
  type Block,
  renderBlocksToHtml,
  renderBlocksToText,
  makeStarterBlocks,
} from "@/lib/email/newsletter-blocks";
import { wrapInFrame } from "@/lib/email/frame";

// ─── Admin newsletter console ────────────────────────────────────────────────
//
// One-page surface for composing and sending newsletter campaigns plus
// reviewing the list and past sends.
//
// Composing is block-based (see lib/email/newsletter-blocks.ts). The right
// pane previews the email exactly as recipients will see it, including the
// shared header + footer frame.
//
// Strict guardrails:
//   • Cannot send until a successful "Send test" has happened.
//   • Final send requires typing a confirmation phrase.
//   • Any edit to the composition invalidates the previous test.

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

async function adminFetch(url: string, options?: RequestInit) {
  const token = await getToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      "Content-Type": "application/json",
      Authorization:  `Bearer ${token}`,
    },
  });
}

interface Stats { pending: number; confirmed: number; unsubscribed: number; suppressed: number; }
interface Campaign {
  id: string;
  subject: string;
  preheader: string | null;
  status: "draft" | "sending" | "sent" | "failed";
  recipient_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  complained_count: number;
  unsubscribed_count: number;
  created_at: string;
  sent_at: string | null;
  attribution_revenue_cents?: number;
  attribution_orders?:        number;
  audience_filter?:           { locale?: string; segment?: string } | null;
}

type Segment = "all" | "buyers" | "non_buyers";
interface Subscriber {
  id: string;
  email: string;
  locale: string;
  status: string;
  source: string | null;
  created_at: string;
}

const CONFIRM_PHRASE = "SEND";

const CONTACT_EMAIL = "info@lexxbrush.eu";
const SITE_URL = "https://lexxbrush.eu";

export default function AdminNewsletterPage() {
  // ─── State ─────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<"compose" | "subscribers" | "history">("compose");

  // List counts
  const [stats, setStats] = useState<Stats | null>(null);

  // Composer
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [locale, setLocale] = useState<"all" | "en" | "sk">("all");
  const [segment, setSegment] = useState<Segment>("all");
  const [audienceCount, setAudienceCount] = useState<number | null>(null);

  // Products for the picker
  const [products, setProducts] = useState<ComposerProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Send state machine
  const [hasTested, setHasTested] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTyped, setConfirmTyped] = useState("");

  // Status feedback
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // History + subscribers tabs
  const [history, setHistory] = useState<Campaign[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  // ─── Effects ───────────────────────────────────────────────────────────────
  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    adminFetch("/api/admin/newsletter?action=stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  // Fetch products once for the picker. We use the existing admin endpoint
  // and re-shape rows into the ComposerProduct format.
  useEffect(() => {
    adminFetch("/api/admin?table=products")
      .then((r) => r.json())
      .then((rows: any[]) => {
        if (!Array.isArray(rows)) return setProducts([]);
        const out: ComposerProduct[] = rows.map((r) => ({
          id:         r.id,
          name:       r.name_en || r.name?.en || r.name || "Untitled",
          priceCents: r.price ?? 0,
          imageUrl:   Array.isArray(r.images) && r.images.length > 0 ? r.images[0] : null,
          isSold:     !!r.is_sold,
          category:   r.category,
        }));
        // Newest-first feels right (matches admin/products page).
        out.sort((a, b) => a.name.localeCompare(b.name));
        setProducts(out);
      })
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, []);

  // Live audience count for current filter
  useEffect(() => {
    adminFetch(`/api/admin/newsletter?action=audience&locale=${locale}&segment=${segment}`)
      .then((r) => r.json())
      .then((d) => setAudienceCount(d.count ?? 0))
      .catch(() => setAudienceCount(null));
  }, [locale, segment]);

  useEffect(() => {
    if (tab === "history") {
      adminFetch("/api/admin/newsletter?action=history").then((r) => r.json()).then(setHistory).catch(() => {});
    }
    if (tab === "subscribers") {
      adminFetch("/api/admin/newsletter?action=list").then((r) => r.json()).then(setSubscribers).catch(() => {});
    }
  }, [tab]);

  // ─── Derived render output ─────────────────────────────────────────────────
  // Live HTML/text built from the block model + product data. Recomputed on
  // every keystroke — block renderers are pure string-builders, so this is
  // cheap even for 50+ blocks.

  const renderCtx = useMemo(() => {
    const productMap: Record<string, ComposerProduct> = {};
    for (const p of products) productMap[p.id] = p;
    return {
      products: productMap,
      siteUrl:  SITE_URL,
      locale:   (locale === "sk" ? "sk" : "en") as "en" | "sk",
    };
  }, [products, locale]);

  const bodyHtml = useMemo(
    () => renderBlocksToHtml(blocks, renderCtx),
    [blocks, renderCtx],
  );
  const bodyText = useMemo(
    () => renderBlocksToText(blocks, renderCtx),
    [blocks, renderCtx],
  );

  // Fully framed preview HTML — mirrors what subscribers receive.
  const previewSrcDoc = useMemo(() => {
    return wrapInFrame({
      preheader:    preheader || subject || "",
      bodyHtml,
      bodyIsRows:   true,
      locale:       renderCtx.locale,
      unsubUrl:     "#preview-unsubscribe",
      siteUrl:      SITE_URL,
      contactEmail: CONTACT_EMAIL,
    });
  }, [bodyHtml, preheader, subject, renderCtx.locale]);

  // Any edit to subject/preheader/blocks invalidates the previous test.
  useEffect(() => {
    setHasTested(false);
  }, [subject, preheader, blocks]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  async function sendTest() {
    if (!subject.trim() || !bodyHtml.trim() || !bodyText.trim()) {
      showToast("Add a subject and at least one block.", "error");
      return;
    }
    setSendingTest(true);
    try {
      const res = await adminFetch("/api/admin/newsletter", {
        method: "POST",
        body:   JSON.stringify({
          action:    "test",
          subject:   subject.trim(),
          preheader: preheader.trim() || undefined,
          html:      bodyHtml,
          text:      bodyText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Test failed");
      setHasTested(true);
      showToast(`Test sent → ${data.sentTo}`);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSendingTest(false);
    }
  }

  async function sendCampaign() {
    if (!hasTested) {
      showToast("Send a test first.", "error");
      return;
    }
    if (confirmTyped !== CONFIRM_PHRASE) {
      showToast(`Type "${CONFIRM_PHRASE}" to confirm.`, "error");
      return;
    }
    setSending(true);
    try {
      const res = await adminFetch("/api/admin/newsletter", {
        method: "POST",
        body:   JSON.stringify({
          action:    "send",
          subject:   subject.trim(),
          preheader: preheader.trim() || undefined,
          html:      bodyHtml,
          text:      bodyText,
          audience:  { status: "confirmed", locale, segment },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      showToast(`Sent to ${data.sent} subscriber(s). ${data.failed ? data.failed + " failed." : ""}`);
      setSubject("");
      setPreheader("");
      setBlocks([]);
      setHasTested(false);
      setConfirmOpen(false);
      setConfirmTyped("");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSending(false);
    }
  }

  async function deleteSubscriber(id: string) {
    if (!confirm("Permanently delete this subscriber row?")) return;
    try {
      const res = await adminFetch(`/api/admin/newsletter?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      showToast("Subscriber deleted.");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-300 ${
          toast.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>{toast.msg}</div>
      )}

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold text-white">Newsletter</h1>
        {stats && (
          <div className="flex items-center gap-5 text-xs">
            <Stat label="Confirmed" value={stats.confirmed} accent="emerald" />
            <Stat label="Pending" value={stats.pending} accent="amber" />
            <Stat label="Unsubscribed" value={stats.unsubscribed} accent="slate" />
            <Stat label="Suppressed" value={stats.suppressed} accent="red" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/5">
        {(["compose", "subscribers", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs uppercase tracking-wider border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-white/50 text-white"
                : "border-transparent text-white/40 hover:text-white/70"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "compose" && (
        <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,540px)] gap-6">
          {/* Composer */}
          <div className="space-y-4 min-w-0">
            <Field label="Subject" hint={`${subject.length}/200`}>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                className="w-full bg-white/[0.02] border border-white/10 focus:border-white/30 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition-colors"
                placeholder="Three new pieces. Tonight."
              />
            </Field>

            <Field label="Preheader (inbox preview text)" hint={`${preheader.length}/120`}>
              <input
                value={preheader}
                onChange={(e) => setPreheader(e.target.value)}
                maxLength={120}
                className="w-full bg-white/[0.02] border border-white/10 focus:border-white/30 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none"
                placeholder="Subscribers see them first. 20:00 CET sharp."
              />
            </Field>

            <Field label="Audience">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value as Segment)}
                    className="bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"
                    title="Who receives this campaign"
                  >
                    <option value="all"        className="bg-[#1a1a1a]">All confirmed</option>
                    <option value="buyers"     className="bg-[#1a1a1a]">Past buyers only</option>
                    <option value="non_buyers" className="bg-[#1a1a1a]">Subscribers who haven't bought</option>
                  </select>
                  <select
                    value={locale}
                    onChange={(e) => setLocale(e.target.value as any)}
                    className="bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"
                    title="Language filter"
                  >
                    <option value="all" className="bg-[#1a1a1a]">All languages</option>
                    <option value="en"  className="bg-[#1a1a1a]">English only</option>
                    <option value="sk"  className="bg-[#1a1a1a]">Slovak only</option>
                  </select>
                </div>
                <span className="text-xs text-white/40">
                  {audienceCount === null ? "—" : `${audienceCount} recipient${audienceCount === 1 ? "" : "s"}`}
                </span>
              </div>
            </Field>

            {/* Composer toolbar */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">Content</p>
              {blocks.length === 0 && (
                <button
                  type="button"
                  onClick={() => setBlocks(makeStarterBlocks())}
                  className="text-[10px] uppercase tracking-wider text-white/50 hover:text-white"
                >
                  Load drop template
                </button>
              )}
            </div>

            <BlockComposer
              blocks={blocks}
              onChange={setBlocks}
              products={products}
              loadingProducts={productsLoading}
            />

            {/* Action row */}
            <div className="flex items-center gap-3 pt-4 sticky bottom-4 bg-[#0a0a0a]/80 backdrop-blur-sm py-3 -mx-2 px-2 rounded-lg border-t border-white/5">
              <button
                onClick={sendTest}
                disabled={sendingTest || blocks.length === 0}
                className="px-4 py-2 text-xs uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white/80 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingTest ? "Sending test…" : hasTested ? "Send another test" : "Send test"}
              </button>

              <button
                onClick={() => setConfirmOpen(true)}
                disabled={!hasTested || !audienceCount || blocks.length === 0}
                title={!hasTested ? "Send a test first" : !audienceCount ? "No recipients in audience" : ""}
                className={`px-4 py-2 text-xs uppercase tracking-wider rounded-lg transition-all ${
                  hasTested && audienceCount && blocks.length > 0
                    ? "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                    : "bg-white/[0.03] border border-white/5 text-white/30 cursor-not-allowed"
                }`}
              >
                Send to {audienceCount ?? 0}
              </button>

              <div className="flex-1" />

              <span className="text-[10px] uppercase tracking-wider text-white/30">
                {blocks.length} block{blocks.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {/* Preview */}
          <div className="xl:sticky xl:top-6 h-fit">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Preview</p>
              <span className="text-[10px] text-white/30">Live · 600px wide</span>
            </div>
            <div className="bg-[#050505] border border-white/10 rounded-lg overflow-hidden h-[760px]">
              <iframe
                srcDoc={previewSrcDoc}
                className="w-full h-full"
                sandbox=""
                title="Preview"
              />
            </div>
          </div>
        </div>
      )}

      {tab === "subscribers" && (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_120px_120px_140px_60px] px-5 py-3 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
            <div>Email</div><div>Locale</div><div>Status</div><div>Source</div><div>Joined</div><div></div>
          </div>
          {subscribers.length === 0 ? (
            <div className="px-5 py-16 text-center text-white/30 text-sm">No subscribers yet</div>
          ) : (
            subscribers.map((s) => (
              <div key={s.id} className="grid grid-cols-[1fr_80px_120px_120px_140px_60px] px-5 py-3 border-b border-white/5 last:border-b-0 items-center text-sm">
                <div className="text-white/80 truncate">{s.email}</div>
                <div className="text-white/50 text-xs">{s.locale}</div>
                <div>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                    s.status === "confirmed"  ? "bg-emerald-500/10 text-emerald-400" :
                    s.status === "pending"    ? "bg-amber-500/10 text-amber-400" :
                    s.status === "unsubscribed" ? "bg-white/5 text-white/40" :
                                                "bg-red-500/10 text-red-400"
                  }`}>{s.status}</span>
                </div>
                <div className="text-white/40 text-xs truncate">{s.source || "—"}</div>
                <div className="text-white/30 text-xs">{new Date(s.created_at).toLocaleDateString()}</div>
                <button
                  onClick={() => deleteSubscriber(s.id)}
                  className="text-white/20 hover:text-red-400 text-xs justify-self-end"
                  aria-label="Delete subscriber"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/5 rounded-xl px-5 py-16 text-center">
              <p className="text-white/30 text-sm">No campaigns yet</p>
            </div>
          ) : (
            history.map((c) => {
              const revenue = (c.attribution_revenue_cents ?? 0) / 100;
              const orders  = c.attribution_orders ?? 0;
              const seg     = c.audience_filter?.segment;
              const loc     = c.audience_filter?.locale;
              return (
                <div key={c.id} className="bg-white/[0.02] border border-white/5 rounded-xl px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white/80 truncate">{c.subject}</p>
                      {c.preheader && <p className="text-xs text-white/30 mt-0.5 truncate">{c.preheader}</p>}
                      <p className="text-[10px] text-white/30 mt-2 uppercase tracking-wider flex items-center gap-2 flex-wrap">
                        <span>{c.sent_at ? new Date(c.sent_at).toLocaleString() : "—"} · {c.status}</span>
                        {seg && seg !== "all" && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/50">
                            {seg === "buyers" ? "Buyers" : "Non-buyers"}
                          </span>
                        )}
                        {loc && loc !== "all" && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/50">
                            {loc.toUpperCase()}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs flex-shrink-0">
                      <Metric label="Sent"     value={c.recipient_count} />
                      <Metric label="Delivered" value={c.delivered_count} />
                      <Metric label="Opened"    value={c.opened_count} />
                      <Metric label="Clicked"   value={c.clicked_count} />
                      <Metric label="Bounce"    value={c.bounced_count} accent="red" />
                      <Metric label="Unsub"     value={c.unsubscribed_count} accent="slate" />
                    </div>
                  </div>
                  {c.sent_at && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-[10px] uppercase tracking-[0.25em] text-white/30">
                        Attributed revenue · 7 days
                      </span>
                      {orders > 0 ? (
                        <span className="text-emerald-400 font-medium">
                          €{revenue.toFixed(2)}
                          <span className="text-white/40 font-normal ml-2">
                            ({orders} order{orders === 1 ? "" : "s"})
                          </span>
                        </span>
                      ) : (
                        <span className="text-white/30">No attributed orders yet</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-md w-full p-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-3">Final check</p>
            <h2 className="text-xl font-semibold text-white mb-2">
              Send &ldquo;{subject || "(no subject)"}&rdquo; to {audienceCount} subscriber{audienceCount === 1 ? "" : "s"}?
            </h2>
            <p className="text-sm text-white/50 leading-relaxed mb-5">
              This is irreversible. Once you click send, the email goes out. Subscribers will see it in their inbox within seconds.
            </p>
            <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5 block">
              Type <span className="text-white/80 font-mono">{CONFIRM_PHRASE}</span> to confirm
            </label>
            <input
              autoFocus
              value={confirmTyped}
              onChange={(e) => setConfirmTyped(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 focus:border-white/30 rounded-lg px-3 py-2.5 text-sm text-white outline-none font-mono"
              placeholder={CONFIRM_PHRASE}
            />
            <div className="flex items-center gap-3 mt-5 justify-end">
              <button
                onClick={() => { setConfirmOpen(false); setConfirmTyped(""); }}
                className="px-4 py-2 text-xs uppercase tracking-wider text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={sendCampaign}
                disabled={sending || confirmTyped !== CONFIRM_PHRASE}
                className="px-4 py-2 text-xs uppercase tracking-wider bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tiny UI bits ───────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] uppercase tracking-wider text-white/40">{label}</label>
        {hint && <span className="text-[10px] text-white/25">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: "emerald" | "amber" | "slate" | "red" }) {
  const c = accent === "emerald" ? "text-emerald-400"
         : accent === "amber"   ? "text-amber-400"
         : accent === "red"     ? "text-red-400"
                                : "text-white/60";
  return (
    <div className="text-right">
      <div className={`text-base font-semibold ${c}`}>{value.toLocaleString()}</div>
      <div className="text-[9px] uppercase tracking-wider text-white/30">{label}</div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent?: "red" | "slate" }) {
  const c = accent === "red" ? "text-red-400/80" : accent === "slate" ? "text-white/40" : "text-white/70";
  return (
    <div className="text-center min-w-[44px]">
      <div className={`text-sm font-medium ${c}`}>{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-white/25">{label}</div>
    </div>
  );
}
