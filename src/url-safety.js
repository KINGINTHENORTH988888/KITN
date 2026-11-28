/**
 * Only expose absolute HTTP(S) links from collected records.
 * Reject unsafe schemes and credential-bearing URLs before rendering links.
 */
export function safeExternalUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!parsed.hostname || parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
