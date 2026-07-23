import { describe, expect, it } from "vitest";
import { arrayBufferToBase64 } from "../src/utils/base64";

function bytes(...values: number[]): ArrayBuffer {
  return Uint8Array.from(values).buffer;
}

describe("GitHub content encoding", () => {
  it("matches RFC 4648 vectors", () => {
    expect(arrayBufferToBase64(bytes())).toBe("");
    expect(arrayBufferToBase64(bytes(102))).toBe("Zg==");
    expect(arrayBufferToBase64(bytes(102, 111))).toBe("Zm8=");
    expect(arrayBufferToBase64(bytes(102, 111, 111))).toBe("Zm9v");
  });

  it("preserves arbitrary binary image bytes", () => {
    expect(arrayBufferToBase64(bytes(0, 255, 16, 128))).toBe("AP8QgA==");
  });
});
