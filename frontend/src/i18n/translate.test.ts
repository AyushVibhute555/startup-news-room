import { beforeEach, describe, expect, it, vi } from "vitest";
import { translateTextApi } from "@/lib/api";
import { clearTranslationCache, translateText } from "./translate";

vi.mock("@/lib/api", () => ({
  translateTextApi: vi.fn(),
}));

describe("translateText", () => {
  beforeEach(() => {
    clearTranslationCache();
    vi.mocked(translateTextApi).mockReset();
  });

  it("shares an in-flight request for identical text and language", async () => {
    vi.mocked(translateTextApi).mockResolvedValue("नमस्ते");

    const results = await Promise.all([translateText("Hello", "hi"), translateText("Hello", "hi")]);

    expect(results).toEqual(["नमस्ते", "नमस्ते"]);
    expect(translateTextApi).toHaveBeenCalledTimes(1);
  });
});
