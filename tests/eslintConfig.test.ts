import { describe, expect, it } from "bun:test";

const getFlatConfig = async () => {
  const eslintConfigModule = await import("../eslint.config.mjs");
  const importedConfig = eslintConfigModule.default;

  return Array.isArray(importedConfig) ? importedConfig : [importedConfig];
};

const findRuleEntry = (config: Array<Record<string, unknown>>, ruleName: string) =>
  config.find((entry) => {
    if (!("rules" in entry) || typeof entry.rules !== "object" || entry.rules === null) {
      return false;
    }

    return ruleName in entry.rules;
  });

describe("eslint architecture config", () => {
  it("defines folder-boundary rules for app, features, and shared layers", async () => {
    const config = await getFlatConfig();
    const ruleEntry = findRuleEntry(config, "boundaries/dependencies");

    expect(ruleEntry).toBeDefined();

    const rules = ruleEntry && "rules" in ruleEntry && typeof ruleEntry.rules === "object" && ruleEntry.rules;
    const rule = rules && "boundaries/dependencies" in rules && rules["boundaries/dependencies"];

    expect(rule).toEqual([
      "error",
      expect.objectContaining({
        default: "disallow",
        rules: expect.arrayContaining([
          expect.objectContaining({
            from: expect.objectContaining({ type: "app" }),
            allow: expect.objectContaining({
              to: expect.arrayContaining([
                expect.objectContaining({ type: "app" }),
                expect.objectContaining({ type: "feature" }),
                expect.objectContaining({ type: "shared" }),
              ]),
            }),
          }),
          expect.objectContaining({
            from: expect.objectContaining({ type: "feature" }),
            allow: expect.objectContaining({
              to: expect.arrayContaining([
                expect.objectContaining({ type: "feature" }),
                expect.objectContaining({ type: "shared" }),
              ]),
            }),
          }),
          expect.objectContaining({
            from: expect.objectContaining({ type: "shared" }),
            allow: expect.objectContaining({
              to: expect.objectContaining({ type: "shared" }),
            }),
          }),
        ]),
      }),
    ]);
  });

  it("defines feature-local and tests exceptions through boundaries settings", async () => {
    const config = await getFlatConfig();
    const settingsEntry = config.find((entry) => "settings" in entry);

    expect(settingsEntry).toBeDefined();

    const boundariesElements = (settingsEntry as {
      settings: { boundaries?: { elements?: Array<Record<string, unknown>> } };
    }).settings.boundaries?.elements;

    expect(boundariesElements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "feature", pattern: "src/features/*/**" }),
        expect.objectContaining({ type: "shared", pattern: "src/shared/**" }),
        expect.objectContaining({ type: "test", pattern: "tests/**" }),
      ])
    );
  });
});
