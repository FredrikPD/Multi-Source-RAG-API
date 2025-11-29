import { describe, it, expect } from "vitest";
import { isFollowUpQuestion } from "../../../src/llm/followup.js";

describe("isFollowUpQuestion", () => {
  it("returns true for classic follow-up phrases", () => {
    const followUps = [
      "What about emergencies?",
      "And for digital products?",
      "How about priority customers?",
      "What about in Norway?",
      "What about refunds?",
      "And for Severity 2?"
    ];

    for (const q of followUps) {
      expect(isFollowUpQuestion(q)).toBe(true);
    }
  });

  it("returns false for standalone questions", () => {
    const standalone = [
      "What is the refund policy?",
      "How long is the warranty period?",
      "Explain the severity levels.",
      "What is the response time for Severity 1 incidents?"
    ];

    for (const q of standalone) {
      expect(isFollowUpQuestion(q)).toBe(false);
    }
  });

  it("handles casing and whitespace", () => {
    expect(isFollowUpQuestion("   what about outages   ")).toBe(true);
    expect(isFollowUpQuestion("HOW ABOUT SUPPORT?")).toBe(true);
  });
});
