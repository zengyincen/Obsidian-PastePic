import { describe, expect, it } from "vitest";
import { getJsonPath, parseObjectJson } from "../src/utils/json";

describe("JSON helpers", () => {
  it("reads nested properties and array indexes", () => {
    const value = { data: { images: [{ url: "https://example.com/a.png" }] } };
    expect(getJsonPath(value, "data.images[0].url")).toBe("https://example.com/a.png");
  });

  it("returns undefined for missing paths", () => {
    expect(getJsonPath({ data: {} }, "data.url")).toBeUndefined();
  });

  it("accepts primitive header values and converts them to strings", () => {
    expect(parseObjectJson('{"X-Retry":3,"X-Enabled":true}', "请求头"))
      .toEqual({ "X-Retry": "3", "X-Enabled": "true" });
  });

  it("rejects arrays and nested values", () => {
    expect(() => parseObjectJson("[]", "请求头")).toThrow("必须是 JSON 对象");
    expect(() => parseObjectJson('{"nested":{"x":1}}', "请求头")).toThrow("值只能是");
  });
});
