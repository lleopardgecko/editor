import { describe, it, expect } from "vitest";
import { config } from "./proxy";

// Next.js wraps the matcher string as ^<pattern>$ against the full pathname.
const pattern = new RegExp(`^${config.matcher[0]}$`);

describe("proxy matcher", () => {
  it("matches page routes", () => {
    expect(pattern.test("/")).toBe(true);
    expect(pattern.test("/login")).toBe(true);
    expect(pattern.test("/doc/abc-123")).toBe(true);
  });

  it("skips static assets", () => {
    expect(pattern.test("/_next/static/chunks/main.js")).toBe(false);
    expect(pattern.test("/_next/image")).toBe(false);
    expect(pattern.test("/favicon.ico")).toBe(false);
  });

  it("skips image files", () => {
    expect(pattern.test("/logo.svg")).toBe(false);
    expect(pattern.test("/photo.png")).toBe(false);
    expect(pattern.test("/hero.jpg")).toBe(false);
    expect(pattern.test("/banner.webp")).toBe(false);
  });
});
