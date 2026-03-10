import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Orchestrator } from "../orchestrator.js";
import { ScriptAgent } from "../agents/script-agent.js";
import { BrandAgent } from "../agents/brand-agent.js";
import { ReviewAgent } from "../agents/review-agent.js";
import { parseArgs } from "../utils/args.js";

describe("parseArgs", () => {
  it("parses --prompt correctly", () => {
    const config = parseArgs(["--prompt", "test prompt"]);
    assert.equal(config.prompt, "test prompt");
  });

  it("sets defaults", () => {
    const config = parseArgs([]);
    assert.equal(config.prompt, null);
    assert.equal(config.output, "./output");
    assert.equal(config.parallel, 5);
    assert.equal(config.review, true);
    assert.equal(config.dryRun, false);
  });

  it("parses --dry-run", () => {
    const config = parseArgs(["--prompt", "x", "--dry-run"]);
    assert.equal(config.dryRun, true);
  });
});

describe("ScriptAgent", () => {
  it("produces script, shot-list, and themes", async () => {
    const agent = new ScriptAgent();
    const result = await agent.run({ prompt: "luxury watch ad" });
    assert.equal(result.agent, "ScriptAgent");
    assert.equal(result.assets.length, 3);
    const types = result.assets.map((a) => a.type);
    assert.ok(types.includes("script"));
    assert.ok(types.includes("shot-list"));
    assert.ok(types.includes("themes"));
  });

  it("extracts luxury themes", async () => {
    const agent = new ScriptAgent();
    const result = await agent.run({ prompt: "luxury watch brand" });
    const themes = result.assets.find((a) => a.type === "themes").content;
    assert.ok(themes.some((t) => t.keyword === "luxury"));
    assert.ok(themes.some((t) => t.keyword === "watch"));
  });
});

describe("BrandAgent", () => {
  it("produces brand identity assets", async () => {
    const agent = new BrandAgent();
    const result = await agent.run({ prompt: "luxury premium brand" });
    assert.equal(result.assets.length, 3);
    const brand = result.assets.find((a) => a.type === "brand-identity").content;
    assert.equal(brand.personality.archetype, "Ruler");
  });
});

describe("ReviewAgent", () => {
  it("detects missing assets", async () => {
    const agent = new ReviewAgent();
    const result = await agent.run({
      prompt: "test",
      dependencies: { allAssets: [] },
    });
    const report = result.assets.find((a) => a.type === "qa-report").content;
    assert.ok(report.issuesFound > 0);
  });
});

describe("Orchestrator dry-run", () => {
  it("runs without errors in dry-run mode", async () => {
    const orch = new Orchestrator({
      prompt: "luxury watch ad",
      dryRun: true,
      review: true,
    });
    const result = await orch.run();
    assert.deepEqual(result.assets, []);
  });
});

describe("Orchestrator full run", () => {
  it("produces a complete asset library", async () => {
    const orch = new Orchestrator({
      prompt: "Create an ad for a luxury watch brand around the concept of borrowed time",
      output: "./output",
      parallel: 5,
      review: true,
      dryRun: false,
    });
    const result = await orch.run();
    assert.ok(result.assets.length > 10);
    assert.ok(result.review.issuesFound >= 0);

    const types = new Set(result.assets.map((a) => a.type));
    assert.ok(types.has("script"));
    assert.ok(types.has("shot-list"));
    assert.ok(types.has("brand-identity"));
    assert.ok(types.has("storyboard-frame"));
    assert.ok(types.has("video-clip"));
    assert.ok(types.has("voiceover"));
    assert.ok(types.has("background-music"));
    assert.ok(types.has("sound-effect"));
    assert.ok(types.has("final-composition"));
    assert.ok(types.has("qa-report"));
  });
});
