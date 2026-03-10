import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Orchestrator } from "../orchestrator.js";
import { ScriptAgent } from "../agents/script-agent.js";
import { BrandAgent } from "../agents/brand-agent.js";
import { ReviewAgent } from "../agents/review-agent.js";
import { parseArgs } from "../utils/args.js";
import { FalClient } from "../clients/fal-client.js";
import { KlingClient, KLING_MODELS } from "../clients/kling-client.js";
import { ElevenLabsClient } from "../clients/elevenlabs-client.js";

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
    assert.equal(config.approveVideos, false);
  });

  it("parses --approve-videos", () => {
    const config = parseArgs(["--prompt", "x", "--approve-videos"]);
    assert.equal(config.approveVideos, true);
  });

  it("parses --dry-run", () => {
    const config = parseArgs(["--prompt", "x", "--dry-run"]);
    assert.equal(config.dryRun, true);
  });
});

describe("FalClient (dry-run)", () => {
  it("returns dry-run result for textToImage", async () => {
    const fal = new FalClient();
    const result = await fal.textToImage({ prompt: "test image" });
    assert.ok(result.images);
    assert.equal(result.images.length, 1);
    assert.ok(result.images[0].url.includes("DRY-RUN"));
  });

  it("returns dry-run result for imageToImage", async () => {
    const fal = new FalClient();
    const result = await fal.imageToImage({
      prompt: "consistent image",
      imageUrl: "https://example.com/prev.png",
    });
    assert.ok(result.images);
    assert.ok(result.images[0].url.includes("DRY-RUN"));
  });
});

describe("KlingClient model selection", () => {
  it("selects Kling 2.6 when no lip-sync needed (cheapest)", () => {
    const kling = new KlingClient();
    const model = kling.selectModel({ needsLipSync: false });
    assert.equal(model.name, "Kling 2.6");
    assert.equal(model.costTier, "low");
    assert.equal(model.lipSync, false);
  });

  it("selects Kling 3.0 when lip-sync needed", () => {
    const kling = new KlingClient();
    const model = kling.selectModel({ needsLipSync: true });
    assert.equal(model.name, "Kling 3.0");
    assert.equal(model.costTier, "medium");
    assert.equal(model.lipSync, true);
  });

  it("allows forcing a specific model", () => {
    const kling = new KlingClient();
    const model = kling.selectModel({ preferredModel: "kling-3.0-omni" });
    assert.equal(model.name, "Kling 3.0 Omni");
    assert.equal(model.costTier, "high");
  });
});

describe("ElevenLabsClient (dry-run)", () => {
  it("returns dry-run result for textToSpeech", async () => {
    const el = new ElevenLabsClient();
    const result = await el.textToSpeech({ text: "Hello world", preset: "deep-authoritative" });
    assert.ok(result.dryRun);
    assert.equal(result.format, "mp3");
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
  it("runs without errors and shows providers", async () => {
    const orch = new Orchestrator({
      prompt: "luxury watch ad",
      dryRun: true,
      review: true,
    });
    const result = await orch.run();
    assert.deepEqual(result.assets, []);
  });
});

describe("Orchestrator full run (dry-run APIs)", () => {
  it("produces assets with pending video approval", async () => {
    const orch = new Orchestrator({
      prompt: "Create an ad for a luxury watch brand around the concept of borrowed time",
      output: "./output",
      parallel: 5,
      review: true,
      dryRun: false,
      approveVideos: false,
    });
    const result = await orch.run();
    assert.ok(result.assets.length > 10);

    const types = new Set(result.assets.map((a) => a.type));
    assert.ok(types.has("script"));
    assert.ok(types.has("shot-list"));
    assert.ok(types.has("brand-identity"));
    assert.ok(types.has("storyboard-frame"));
    assert.ok(types.has("video-clip"));
    assert.ok(types.has("voiceover"));
    assert.ok(types.has("background-music"));
    assert.ok(types.has("sound-effect"));
    assert.ok(types.has("remotion-config"));
    assert.ok(types.has("qa-report"));

    // Videos should be pending approval
    const videoClips = result.assets.filter((a) => a.type === "video-clip");
    assert.ok(videoClips.every((v) => v.content.status === "pending-approval"));

    // Storyboard frames should have imageUrl from fal.ai dry-run
    const frames = result.assets.filter((a) => a.type === "storyboard-frame");
    assert.ok(frames[0].content.model.includes("Nano Banana 2"));
    assert.equal(frames[0].content.generationMode, "txt2img");
    if (frames.length > 1) {
      assert.equal(frames[1].content.generationMode, "img2img");
    }
  });
});
