import "server-only";

// A reverse proxy can leave NextRequest.url pointing at the internal listener.
// Use an administrator-owned origin, never arbitrary forwarded request headers.
export function applicationOrigin(request: Request): string | null {
  const configured = process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL;
  if (configured) {
    try {
      const url = new URL(configured);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== "/"
      )
        return null;
      const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
      if (url.protocol !== "https:" && !local) return null;
      return url.origin;
    } catch {
      return null;
    }
  }
  const url = new URL(request.url);
  const host = request.headers.get("host");
  // Local next start can normalize its request URL to another listener host.
  // Host is only used for loopback, never to authorize a public deployment.
  if (host && /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host)) {
    return new URL(`${url.protocol}//${host}`).origin;
  }
  return url.origin;
}

export function isSameOrigin(request: Request): boolean {
  const expected = applicationOrigin(request);
  return (
    expected !== null &&
    request.headers.get("origin") === expected &&
    request.headers.get("sec-fetch-site") !== "cross-site"
  );
}
