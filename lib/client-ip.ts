import { headers } from "next/headers";

/**
 * The requesting client's IP address, or null when it can't be determined.
 *
 * ## Trust model — read before changing the header order
 *
 * Every one of these headers is just a string a client can put on a request.
 * They are only trustworthy because a proxy in front of the app *overwrites*
 * them, discarding whatever the client sent. Get that wrong and an IP rate
 * limiter becomes decorative: a bot sends `x-forwarded-for: <random>` on every
 * request and lands in a fresh bucket each time.
 *
 * So the order below is deliberate, most-trustworthy first:
 *
 * 1. `x-vercel-forwarded-for` — set by Vercel's edge, unconditionally. A client
 *    that sends its own copy has it replaced, so this is the one header the
 *    platform fully owns.
 * 2. `x-real-ip` — also set by Vercel, and by most reverse proxies, to a single
 *    address rather than a chain.
 * 3. `x-forwarded-for` — the standard, but a comma-separated chain. The
 *    left-most entry is the original client *if* the front-most proxy replaces
 *    the header; if it appends instead, that entry is attacker-controlled.
 *    Last resort for exactly that reason.
 *
 * If this app is ever put behind a different proxy, or served directly, revisit
 * this list — the limiter's guarantees are only as good as it is.
 */
export async function clientIp(): Promise<string | null> {
  try {
    const h = await headers();

    const vercel = h.get("x-vercel-forwarded-for")?.trim();
    if (vercel) return vercel.split(",")[0]!.trim() || null;

    const real = h.get("x-real-ip")?.trim();
    if (real) return real;

    const forwarded = h.get("x-forwarded-for");
    return forwarded?.split(",")[0]?.trim() || null;
  } catch {
    // Outside a request scope (a script, a background job) there are no headers
    // to read.
    return null;
  }
}

/** The requesting client's user agent, or null. */
export async function clientUserAgent(): Promise<string | null> {
  try {
    return (await headers()).get("user-agent");
  } catch {
    return null;
  }
}
