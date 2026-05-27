/**
 * Packeta REST API client (server-side only).
 * Endpoint: https://www.zasilkovna.cz/api/rest
 * All requests are POST with XML body.
 */

const PACKETA_API_URL = "https://www.zasilkovna.cz/api/rest";

// Placeholder carrier IDs - confirm with Packeta once API keys are available.
export const HD_CARRIER_IDS: Record<string, number> = {
  SK: 106,
  CZ: 131,
  DE: 111,
  AT: 112,
  PL: 113,
  HU: 114,
};

export const PACKETA_COUNTRIES = [
  { code: "SK", name: "Slovakia", nameSk: "Slovensko" },
  { code: "CZ", name: "Czech Republic", nameSk: "Česko" },
  { code: "DE", name: "Germany", nameSk: "Nemecko" },
  { code: "AT", name: "Austria", nameSk: "Rakúsko" },
  { code: "PL", name: "Poland", nameSk: "Poľsko" },
  { code: "HU", name: "Hungary", nameSk: "Maďarsko" },
] as const;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function parseXmlValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? match[1] : null;
}

function parseXmlError(xml: string): string | null {
  const status = parseXmlValue(xml, "status");
  if (status !== "fault" && status !== "error") return null;

  // PacketAttributesFault wraps child elements: <fault xsi:type="PacketAttributesFault">
  //   <attribute>fieldName</attribute><message>reason</message></fault>
  // Pull the xsi:type attribute name, the problem field, and the message.
  const faultType  = xml.match(/xsi:type="([^"]+)"/)?.[1] || "";
  const attribute  = parseXmlValue(xml, "attribute") || "";
  const message    = parseXmlValue(xml, "message") || parseXmlValue(xml, "fault") || "";

  const parts = [faultType, attribute ? `field=${attribute}` : "", message].filter(Boolean);
  return parts.join(" | ") || "Unknown Packeta API error";
}

async function postXml(xml: string): Promise<string> {
  const res = await fetch(PACKETA_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: xml,
  });

  if (!res.ok) {
    throw new Error(`Packeta API HTTP ${res.status}: ${res.statusText}`);
  }

  const text = await res.text();
  const error = parseXmlError(text);
  if (error) {
    // Log the full response so we can read which attribute failed in Vercel logs.
    console.error("[packeta] API fault response:", text);
    throw new Error(`Packeta API error: ${error}`);
  }

  return text;
}

// ── createPacket ──

interface CreatePacketParams {
  number: string;       // Order reference (max 24 chars)
  name: string;         // First name
  surname: string;      // Last name
  email: string;
  phone?: string;
  value: string;        // e.g. "29.90"
  currency?: string;    // default EUR
  weight?: number;      // kg
  eshop?: string;
  // Pickup point delivery
  addressId?: number;
  // Home delivery
  carrierId?: number;
  street?: string;
  houseNumber?: string;
  city?: string;
  zip?: string;
  country?: string;     // ISO 3166-1 alpha-2, required for home delivery
}

export async function createPacket(params: CreatePacketParams): Promise<{ packetId: string }> {
  const apiPassword = process.env.PACKETA_API_PASSWORD;
  if (!apiPassword) throw new Error("PACKETA_API_PASSWORD not configured");

  const xml = `<createPacket><apiPassword>${escapeXml(apiPassword)}</apiPassword><packetAttributes>${buildPacketAttributesXml(params)}</packetAttributes></createPacket>`;
  const response = await postXml(xml);
  const packetId = parseXmlValue(response, "id") || parseXmlValue(response, "barcode");

  if (!packetId) {
    throw new Error("Packeta createPacket: no packet ID in response");
  }

  return { packetId };
}

function buildPacketAttributesXml(params: CreatePacketParams): string {
  const fields: Record<string, string | number | undefined> = {
    number: params.number,
    name: params.name,
    surname: params.surname,
    email: params.email,
    phone: params.phone,
    value: params.value,
    currency: params.currency || "EUR",
    weight: params.weight,
    eshop: params.eshop || process.env.PACKETA_ESHOP || "lexxbrush",
    addressId: params.addressId !== undefined ? Number(params.addressId) : undefined,
    carrierId: params.carrierId,
    street: params.street,
    houseNumber: params.houseNumber,
    city: params.city,
    zip: params.zip,
    country: params.country,
  };

  return Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `<${k}>${escapeXml(String(v))}</${k}>`)
    .join("");
}

// ── packetTracking ──

export async function getPacketTracking(packetId: string): Promise<string> {
  const apiPassword = process.env.PACKETA_API_PASSWORD;
  if (!apiPassword) throw new Error("PACKETA_API_PASSWORD not configured");

  const xml = `<packetTracking><apiPassword>${escapeXml(apiPassword)}</apiPassword><packetId>${escapeXml(packetId)}</packetId></packetTracking>`;
  const response = await postXml(xml);
  return response;
}

// Packeta packetStatus numeric codes that matter to us.
// Full list at https://wiki.packeta.com/main/external-tools/api/rest-api-en
// We only need to distinguish three buckets: in-transit, delivered, terminal-other.
export const PACKETA_STATUS = {
  RECEIVED_DATA:      1,  // Data received, no physical handover yet → keep as "paid"
  ACCEPTED:           2,  // Accepted at depot → "shipped"
  ON_WAY_TO_TARGET:   3,  // → "shipped"
  READY_FOR_PICKUP:   4,  // At pickup point, awaiting customer → "shipped"
  DELIVERED:          5,  // Handed to consignee → "delivered"
  RETURNING:          6,  // → keep current status
  RETURNED:           7,  // Returned to sender → terminal, do not auto-mark delivered
  CANCELLED:          9,
  HANDED_TO_CARRIER: 12,  // Home-delivery carrier pickup → "shipped"
} as const;

const SHIPPED_CODES   = new Set<number>([2, 3, 4, 12]);
const DELIVERED_CODES = new Set<number>([5]);

export interface PacketTrackingRecord {
  statusCode: number;
  statusText: string;
  dateTime:   string | null;
}

export interface PacketTrackingSummary {
  /** Highest "progress" code seen across all records (delivered > shipped > received). */
  latestCode:   number | null;
  latestText:   string | null;
  /** Normalised bucket the cron uses to decide order.status. */
  bucket:       "received" | "shipped" | "delivered" | "returned" | "cancelled" | "unknown";
  records:      PacketTrackingRecord[];
}

/**
 * Parse the XML returned by getPacketTracking into a normalised summary.
 * The Packeta response wraps multiple <record> entries inside <packetTrackingResult>.
 * We treat the highest progress code as authoritative: once 5 (delivered) appears
 * it never goes back to "shipped" even if a later record is administrative noise.
 */
export function parsePacketStatus(xml: string): PacketTrackingSummary {
  const records: PacketTrackingRecord[] = [];
  const recordRe = /<record[^>]*>([\s\S]*?)<\/record>/g;
  let m: RegExpExecArray | null;
  while ((m = recordRe.exec(xml)) !== null) {
    const inner = m[1];
    const codeStr = parseXmlValue(inner, "statusCode");
    if (!codeStr) continue;
    records.push({
      statusCode: Number(codeStr),
      statusText: parseXmlValue(inner, "statusText") || parseXmlValue(inner, "codeText") || "",
      dateTime:   parseXmlValue(inner, "dateTime"),
    });
  }

  if (records.length === 0) {
    return { latestCode: null, latestText: null, bucket: "unknown", records };
  }

  const codes = records.map(r => r.statusCode);
  const hasDelivered = codes.some(c => DELIVERED_CODES.has(c));
  const hasReturned  = codes.includes(PACKETA_STATUS.RETURNED);
  const hasCancelled = codes.includes(PACKETA_STATUS.CANCELLED);
  const hasShipped   = codes.some(c => SHIPPED_CODES.has(c));

  // Pick a representative "latest" — prefer the most advanced progress event,
  // not just the last entry in the array (which can be administrative).
  let latest = records[records.length - 1];
  if (hasDelivered)      latest = records.find(r => DELIVERED_CODES.has(r.statusCode))!;
  else if (hasShipped)   latest = [...records].reverse().find(r => SHIPPED_CODES.has(r.statusCode))!;

  let bucket: PacketTrackingSummary["bucket"] = "unknown";
  if (hasDelivered)      bucket = "delivered";
  else if (hasCancelled) bucket = "cancelled";
  else if (hasReturned)  bucket = "returned";
  else if (hasShipped)   bucket = "shipped";
  else                   bucket = "received";

  return {
    latestCode: latest.statusCode,
    latestText: latest.statusText || null,
    bucket,
    records,
  };
}

// ── packetCourierNumber (for home delivery / external carriers) ──

export async function getPacketCourierNumber(packetId: string): Promise<string | null> {
  const apiPassword = process.env.PACKETA_API_PASSWORD;
  if (!apiPassword) throw new Error("PACKETA_API_PASSWORD not configured");

  const xml = `<packetCourierNumber><apiPassword>${escapeXml(apiPassword)}</apiPassword><packetId>${escapeXml(packetId)}</packetId></packetCourierNumber>`;
  const response = await postXml(xml);
  return parseXmlValue(response, "number") || parseXmlValue(response, "courierNumber");
}

// ── packetLabelPdf ──

export async function getPacketLabel(packetId: string, format: string = "A7 on A4"): Promise<string> {
  const apiPassword = process.env.PACKETA_API_PASSWORD;
  if (!apiPassword) throw new Error("PACKETA_API_PASSWORD not configured");

  const xml = `<packetLabelPdf><apiPassword>${escapeXml(apiPassword)}</apiPassword><packetId>${escapeXml(packetId)}</packetId><format>${escapeXml(format)}</format></packetLabelPdf>`;
  const response = await postXml(xml);
  return parseXmlValue(response, "pdf") || response;
}

// ── packetCourierLabelPdf (for HD / external carriers) ──

export async function getPacketCourierLabel(packetId: string): Promise<string> {
  const apiPassword = process.env.PACKETA_API_PASSWORD;
  if (!apiPassword) throw new Error("PACKETA_API_PASSWORD not configured");

  const xml = `<packetCourierLabelPdf><apiPassword>${escapeXml(apiPassword)}</apiPassword><packetId>${escapeXml(packetId)}</packetId></packetCourierLabelPdf>`;
  const response = await postXml(xml);
  return parseXmlValue(response, "pdf") || response;
}

// ── Public tracking URL ──

export function getTrackingUrl(packetId: string, lang: string = "en"): string {
  return `https://tracking.packeta.com/${lang}/?id=${packetId}`;
}
