/**
 * Cryptographic utilities for the export system.
 *
 * Uses the Web Crypto API (SubtleCrypto) for SHA-256 hashing.
 * Falls back to a deterministic string hash when SubtleCrypto is unavailable.
 */

/**
 * Compute a SHA-256 hex digest of the given input string.
 * Uses the native Web Crypto API when available.
 */
export async function sha256(input: string): Promise<string> {
  if (typeof globalThis.crypto?.subtle?.digest === 'function') {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback: deterministic FNV-1a-like 64-char hex (not cryptographic, but stable)
  return fallbackHash(input);
}

/**
 * Synchronous SHA-256-like hash fallback (FNV-1a variant).
 * Produces a 64-character hex string for compatibility with SHA-256 output length.
 */
function fallbackHash(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined = (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  // Repeat to fill 64 chars
  return (combined + combined + combined + combined).slice(0, 64);
}

/**
 * Compute a checksum for an array of export rows.
 * Serializes the data deterministically and returns the SHA-256 hex digest.
 */
export async function computeDataChecksum(rows: ReadonlyArray<Record<string, unknown>>): Promise<string> {
  const serialized = JSON.stringify(rows, Object.keys(rows[0] ?? {}).sort());
  return sha256(serialized);
}

/**
 * Generate a v4-style UUID using crypto.getRandomValues when available.
 */
export function generateExportId(): string {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32),
    ].join('-');
  }
  // Fallback (non-secure, but unique enough for export IDs)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
