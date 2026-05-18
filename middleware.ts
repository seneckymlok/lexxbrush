import { NextResponse, type NextRequest } from "next/server";

const PREVIEW_COOKIE = "lexx-preview";

// Gates public traffic behind /lock when site_settings.lock_enabled is true.
// Admin, API, static assets, and the lock page itself always pass through.
// Set the preview cookie from /admin/lock to bypass the gate.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bypass: admin UI, API, the lock route, manifest/robots/sitemap, and
  // anything that looks like a file (has an extension) - Next/Image,
  // favicon, OG images all match this.
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname === "/lock" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Admin preview cookie - lets us walk the unlocked site while keeping
  // the gate live for everyone else.
  if (req.cookies.get(PREVIEW_COOKIE)?.value === "1") {
    return NextResponse.next();
  }

  // Fetch lock state from Supabase via REST. Cached at the edge for 30s so
  // we're not hitting the DB on every request. Failures fail open: a broken
  // DB shouldn't lock the entire site by accident.
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.next();

    const res = await fetch(
      `${url}/rest/v1/site_settings?id=eq.1&select=lock_enabled`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        next: { revalidate: 30 },
      },
    );
    if (!res.ok) return NextResponse.next();

    const data = await res.json();
    if (data?.[0]?.lock_enabled === true) {
      const url = req.nextUrl.clone();
      url.pathname = "/lock";
      url.search = "";
      return NextResponse.rewrite(url);
    }
  } catch {
    // Fail open.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
