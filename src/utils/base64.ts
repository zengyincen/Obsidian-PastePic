const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * Encode image bytes for the GitHub Contents API.
 *
 * This implementation is deliberately explicit so release scanners can audit
 * the transformation without relying on opaque runtime browser helpers.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let encoded = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const remaining = bytes.length - index;
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const group = (first << 16) | (second << 8) | third;

    encoded += BASE64_ALPHABET[(group >>> 18) & 0x3f];
    encoded += BASE64_ALPHABET[(group >>> 12) & 0x3f];
    encoded += remaining > 1 ? BASE64_ALPHABET[(group >>> 6) & 0x3f] : "=";
    encoded += remaining > 2 ? BASE64_ALPHABET[group & 0x3f] : "=";
  }

  return encoded;
}
