"use server";

import { issueFormToken } from "@/lib/form-token";

/**
 * Issues a signed form token for a public form that has just rendered.
 *
 * Its own file rather than a member of app/actions.ts so the public forms can
 * import it on mount without pulling in the admin action module alongside it.
 *
 * Not rate limited: minting a token is an HMAC over a timestamp with no
 * database access, and a token on its own grants nothing — every check that
 * matters still runs at submit time.
 */
export async function issueFormTokenAction(): Promise<string> {
  return issueFormToken();
}
