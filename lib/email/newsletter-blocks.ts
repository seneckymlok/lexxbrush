// ─── Newsletter blocks ───────────────────────────────────────────────────────
//
// A small content-block system for the admin composer. Every block has:
//   • A shape (TS interface)
//   • A default factory (used when adding the block)
//   • An HTML renderer (table-row, inline styles only - Outlook/Gmail safe)
//   • A plain-text renderer (for the text/* mime part)
//
// The composer maintains an array of these blocks. Saving / sending just
// concatenates the rendered output of each block into the existing campaign
// frame from `lib/email/frame.ts`.

// ─── Types ───────────────────────────────────────────────────────────────────

export type BlockType =
  | "hero"
  | "body"
  | "quote"
  | "products"
  | "image"
  | "cta"
  | "divider"
  | "spacer";

export interface HeroBlock {
  id:       string;
  type:     "hero";
  /** Small uppercase line above the headline. e.g. "♥   NEW DROP" */
  eyebrow:  string;
  /** Big display line. */
  headline: string;
  /** Optional supporting paragraph. */
  body:     string;
}

export interface BodyBlock {
  id:   string;
  type: "body";
  text: string;
}

export interface QuoteBlock {
  id:           string;
  type:         "quote";
  text:         string;
  attribution?: string;
}

export interface ProductsBlock {
  id:          string;
  type:        "products";
  /** Optional small heading above the row (e.g. "Newly released"). */
  heading?:    string;
  /** Ordered list of product IDs. Renderer looks each up in the product map. */
  productIds:  string[];
  /** Layout: 1 = single big card, 2 = side-by-side, 3 = compact triple. */
  columns:     1 | 2 | 3;
}

export interface ImageBlock {
  id:       string;
  type:     "image";
  url:      string;
  alt:      string;
  caption?: string;
  /** Optional URL - wraps the image in an anchor. */
  link?:    string;
}

export interface CtaBlock {
  id:    string;
  type:  "cta";
  label: string;
  url:   string;
  /** Visual style. `solid` = white pill, `outline` = bordered. */
  style: "solid" | "outline";
}

export interface DividerBlock {
  id:   string;
  type: "divider";
}

export interface SpacerBlock {
  id:   string;
  type: "spacer";
  /** Vertical height. */
  size: "sm" | "md" | "lg";
}

export type Block =
  | HeroBlock
  | BodyBlock
  | QuoteBlock
  | ProductsBlock
  | ImageBlock
  | CtaBlock
  | DividerBlock
  | SpacerBlock;

// ─── Product shape (the bits the renderer needs) ─────────────────────────────

export interface RenderProduct {
  id:       string;
  name:     string;            // already localized (or English fallback)
  /** Per-unit price in cents. */
  priceCents:number;
  /** First image URL - must be absolute https. */
  imageUrl: string | null;
  /** Whether the product is sold out - adds a visual badge. */
  isSold:   boolean;
}

export interface RenderContext {
  /** Lookup table for product blocks. Keyed by product id. */
  products: Record<string, RenderProduct>;
  /** Public site URL (no trailing slash). */
  siteUrl:  string;
  locale:   "en" | "sk";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const esc = (s: string | undefined | null) =>
  (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const eur = (cents: number) =>
  `€${(cents / 100).toLocaleString("en-IE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** Turn newlines in body copy into `<br>` while still escaping HTML. */
function nl2br(s: string) {
  return esc(s).replace(/\n/g, "<br>");
}

function randId() {
  // Short ids are enough - they only exist client-side as React keys and DnD
  // anchors. Don't need crypto strength.
  return Math.random().toString(36).slice(2, 10);
}

// ─── Default factories ───────────────────────────────────────────────────────

export function makeDefaultBlock(type: BlockType): Block {
  const id = randId();
  switch (type) {
    case "hero":     return { id, type, eyebrow: "♥   New drop", headline: "Three new pieces.", body: "Hand-airbrushed. One of one. Available now." };
    case "body":     return { id, type, text: "" };
    case "quote":    return { id, type, text: "", attribution: "" };
    case "products": return { id, type, productIds: [], columns: 2, heading: "" };
    case "image":    return { id, type, url: "", alt: "", caption: "", link: "" };
    case "cta":      return { id, type, label: "View the drop", url: "", style: "solid" };
    case "divider":  return { id, type };
    case "spacer":   return { id, type, size: "md" };
  }
}

/** A reasonable starter when the composer opens empty. */
export function makeStarterBlocks(): Block[] {
  return [
    makeDefaultBlock("hero"),
    makeDefaultBlock("products"),
    makeDefaultBlock("cta"),
  ];
}

// ─── HTML renderers ──────────────────────────────────────────────────────────

function renderHero(b: HeroBlock): string {
  return `
    <tr>
      <td style="padding:0 0 32px 0;">
        ${b.eyebrow ? `
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#a014dc;margin-bottom:12px;">
          ${esc(b.eyebrow)}
        </div>` : ""}
        ${b.headline ? `
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:36px;font-weight:800;line-height:1.05;color:#ffffff;letter-spacing:-0.02em;">
          ${esc(b.headline)}
        </div>` : ""}
        ${b.body ? `
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#8a8a8a;margin-top:16px;">
          ${nl2br(b.body)}
        </div>` : ""}
      </td>
    </tr>`;
}

function renderBody(b: BodyBlock): string {
  if (!b.text.trim()) return "";
  return `
    <tr>
      <td style="padding:0 0 24px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#dcdcdc;">
        ${nl2br(b.text)}
      </td>
    </tr>`;
}

function renderQuote(b: QuoteBlock): string {
  if (!b.text.trim()) return "";
  return `
    <tr>
      <td style="padding:8px 0 32px 0;">
        <div style="border-left:2px solid #a014dc;padding:4px 0 4px 18px;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:18px;line-height:1.5;color:#ffffff;">
            ${nl2br(b.text)}
          </div>
          ${b.attribution ? `
          <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6a6a6a;margin-top:12px;">
            - ${esc(b.attribution)}
          </div>` : ""}
        </div>
      </td>
    </tr>`;
}

function renderProductCard(p: RenderProduct, siteUrl: string, mode: "wide" | "half" | "third"): string {
  const url    = `${siteUrl}/product/${p.id}`;
  const width  = mode === "wide" ? 568 : mode === "half" ? 272 : 176;
  const imgPad = mode === "wide" ? 0 : 0;
  const imgSize = width;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${width}" style="width:${width}px;max-width:${width}px;">
      <tr>
        <td style="padding:0 0 ${imgPad}px 0;">
          <a href="${esc(url)}" style="display:block;text-decoration:none;">
            ${p.imageUrl ? `
            <img src="${esc(p.imageUrl)}" alt="${esc(p.name)}" width="${imgSize}" height="${imgSize}"
                 style="display:block;width:100%;max-width:${imgSize}px;height:auto;border-radius:10px;background:#0a0a0a;object-fit:cover;" />
            ` : `
            <div style="width:${imgSize}px;max-width:100%;height:${imgSize}px;background:#0a0a0a;border-radius:10px;"></div>
            `}
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 4px 0 4px;">
          <a href="${esc(url)}" style="text-decoration:none;color:inherit;">
            <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;line-height:1.35;color:#ffffff;letter-spacing:0.02em;">
              ${esc(p.name)}${p.isSold ? ` <span style="color:#a014dc;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin-left:6px;">Sold</span>` : ""}
            </div>
            <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#8a8a8a;margin-top:4px;">
              ${eur(p.priceCents)}
            </div>
          </a>
        </td>
      </tr>
    </table>`;
}

function renderProducts(b: ProductsBlock, ctx: RenderContext): string {
  const picked = b.productIds
    .map((id) => ctx.products[id])
    .filter((p): p is RenderProduct => !!p);
  if (picked.length === 0) return "";

  const cols = Math.min(b.columns, picked.length) as 1 | 2 | 3;
  const mode: "wide" | "half" | "third" = cols === 1 ? "wide" : cols === 2 ? "half" : "third";
  const gap  = 16;

  // Chunk products into rows. e.g. 5 products at cols=2 → rows of [2, 2, 1].
  const rows: RenderProduct[][] = [];
  for (let i = 0; i < picked.length; i += cols) {
    rows.push(picked.slice(i, i + cols));
  }

  const rowsHtml = rows.map((row, rowIdx) => `
    <tr>
      <td style="padding:${rowIdx === 0 ? 0 : gap}px 0 0 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            ${row.map((p, i) => `
              <td valign="top" style="padding:0 ${i < row.length - 1 ? gap : 0}px 0 0;width:${cols === 1 ? "100%" : cols === 2 ? "50%" : "33.33%"};">
                ${renderProductCard(p, ctx.siteUrl, mode)}
              </td>`).join("")}
            ${row.length < cols ? Array.from({ length: cols - row.length }, () =>
              `<td style="width:${cols === 2 ? "50%" : "33.33%"}">&nbsp;</td>`).join("") : ""}
          </tr>
        </table>
      </td>
    </tr>`).join("");

  return `
    <tr>
      <td style="padding:0 0 32px 0;">
        ${b.heading ? `
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#6a6a6a;margin:0 0 16px 0;">
          ${esc(b.heading)}
        </div>` : ""}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${rowsHtml}
        </table>
      </td>
    </tr>`;
}

function renderImage(b: ImageBlock): string {
  if (!b.url) return "";
  const imgEl = `<img src="${esc(b.url)}" alt="${esc(b.alt)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border-radius:10px;" />`;
  const wrapped = b.link
    ? `<a href="${esc(b.link)}" style="display:block;text-decoration:none;">${imgEl}</a>`
    : imgEl;
  return `
    <tr>
      <td style="padding:0 0 ${b.caption ? 8 : 32}px 0;">
        ${wrapped}
      </td>
    </tr>
    ${b.caption ? `
    <tr>
      <td style="padding:0 0 32px 0;text-align:center;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#6a6a6a;">
        ${esc(b.caption)}
      </td>
    </tr>` : ""}`;
}

function renderCta(b: CtaBlock): string {
  if (!b.label || !b.url) return "";
  const styles = b.style === "outline"
    ? "background:transparent;color:#ffffff;border:1px solid #2a2a2a;"
    : "background:#ffffff;color:#000000;border:0;";
  return `
    <tr>
      <td align="center" style="padding:8px 0 32px 0;">
        <a href="${esc(b.url)}" style="display:inline-block;${styles}text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;padding:16px 36px;border-radius:999px;">
          ${esc(b.label)}
        </a>
      </td>
    </tr>`;
}

function renderDivider(): string {
  return `
    <tr>
      <td style="padding:8px 0 32px 0;">
        <div style="border-top:1px solid #1a1a1a;height:0;font-size:0;line-height:0;">&nbsp;</div>
      </td>
    </tr>`;
}

function renderSpacer(b: SpacerBlock): string {
  const h = b.size === "sm" ? 16 : b.size === "lg" ? 56 : 32;
  return `
    <tr>
      <td style="height:${h}px;line-height:${h}px;font-size:${h}px;">&nbsp;</td>
    </tr>`;
}

// ─── Top-level renderers ─────────────────────────────────────────────────────

/**
 * Render blocks to the HTML body that gets slotted into `wrapInFrame`. The
 * caller is responsible for the frame; this function emits a sequence of
 * `<tr>` rows.
 */
export function renderBlocksToHtml(blocks: Block[], ctx: RenderContext): string {
  return blocks.map((b) => {
    switch (b.type) {
      case "hero":     return renderHero(b);
      case "body":     return renderBody(b);
      case "quote":    return renderQuote(b);
      case "products": return renderProducts(b, ctx);
      case "image":    return renderImage(b);
      case "cta":      return renderCta(b);
      case "divider":  return renderDivider();
      case "spacer":   return renderSpacer(b);
    }
  }).join("\n");
}

/**
 * Build the plain-text alternative. Tries to keep the structural rhythm
 * (newlines around hero, dashes around dividers) without dumping HTML.
 */
export function renderBlocksToText(blocks: Block[], ctx: RenderContext): string {
  const parts: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "hero":
        if (b.eyebrow)  parts.push(b.eyebrow.toUpperCase());
        if (b.headline) parts.push(b.headline);
        if (b.body)     parts.push(b.body);
        break;
      case "body":
        if (b.text.trim()) parts.push(b.text);
        break;
      case "quote":
        if (b.text.trim()) {
          parts.push(`"${b.text}"${b.attribution ? `\n- ${b.attribution}` : ""}`);
        }
        break;
      case "products": {
        if (b.heading) parts.push(b.heading.toUpperCase());
        for (const id of b.productIds) {
          const p = ctx.products[id];
          if (!p) continue;
          parts.push(`• ${p.name} - ${eur(p.priceCents)}\n  ${ctx.siteUrl}/product/${p.id}`);
        }
        break;
      }
      case "image":
        if (b.url) {
          parts.push(`[${b.alt || "image"}]${b.caption ? ` - ${b.caption}` : ""}`);
          if (b.link) parts.push(b.link);
        }
        break;
      case "cta":
        if (b.label && b.url) parts.push(`→ ${b.label}\n  ${b.url}`);
        break;
      case "divider":
        parts.push(`-----`);
        break;
      case "spacer":
        // Intentional - produces a blank line via the join below.
        parts.push(``);
        break;
    }
  }
  return parts.join("\n\n");
}
