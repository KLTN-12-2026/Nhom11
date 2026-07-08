/**
 * Guards against open-redirect payloads passed through query params (e.g. a
 * `callbackUrl` read straight from the URL). Only allows same-origin,
 * in-app relative paths — rejects protocol-relative ("//evil.com") and
 * backslash-variant ("/\evil.com") URLs, both of which the browser resolves
 * to a different origin despite starting with "/".
 */
export const isSafeInternalPath = (path: string): boolean =>
  path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") && !path.includes("://");
