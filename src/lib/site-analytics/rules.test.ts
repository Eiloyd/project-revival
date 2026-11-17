import { describe, expect, it } from "vitest";
import { classifySource, explainError, parseAgent } from "./rules";

describe("site analytics rules", () => {
  it("classifies sources", () => {
    expect(classifySource("www.google.co.in", "riloyd.com")).toBe("google");
    expect(classifySource("l.instagram.com", "riloyd.com")).toBe("instagram");
    expect(classifySource(null, "riloyd.com")).toBe("direct");
    expect(classifySource("riloyd.com", "www.riloyd.com")).toBe("internal");
    expect(classifySource(null, "riloyd.com", "fb_cpc")).toBe("ads");
    expect(classifySource("example.org", "riloyd.com")).toBe("referral");
  });
  it("parses devices", () => {
    expect(parseAgent("Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile Safari/537").device).toBe("mobile");
    expect(parseAgent("Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537").os).toBe("Windows");
  });
  it("explains errors", () => {
    expect(explainError("error", "ChunkLoadError: Loading chunk 5 failed").title).toBe("Page part could not load");
    expect(explainError("error", "TypeError: Cannot read properties of undefined").severity).toBe("high");
    expect(explainError("resource", "image failed").title).toBe("File or picture missing");
  });
});
