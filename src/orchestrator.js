import { ScriptAgent } from "./agents/script-agent.js";
import { BrandAgent } from "./agents/brand-agent.js";
import { StoryboardAgent } from "./agents/storyboard-agent.js";
import { VideoAgent } from "./agents/video-agent.js";
import { VoiceoverAgent } from "./agents/voiceover-agent.js";
import { MusicAgent } from "./agents/music-agent.js";
import { SFXAgent } from "./agents/sfx-agent.js";
import { ComposerAgent } from "./agents/composer-agent.js";
import { ReviewAgent } from "./agents/review-agent.js";
import { Logger } from "./utils/logger.js";

/**
 * Orchestrator — coordinates all sub-agents to produce a complete
 * creative production from a single text prompt.
 *
 * Pipeline:
 *   Phase 1 (parallel): ScriptAgent + BrandAgent
 *   Phase 2 (parallel): StoryboardAgent + VoiceoverAgent + MusicAgent + SFXAgent
 *   Phase 3 (depends on Phase 2): VideoAgent
 *   Phase 4 (sequential): ComposerAgent → ReviewAgent
 */
export class Orchestrator {
  constructor(config) {
    this.config = config;
    this.log = new Logger("Orchestrator");
  }

  async run() {
    const brief = { prompt: this.config.prompt, dependencies: {} };

    if (this.config.dryRun) {
      return this.dryRun(brief);
    }

    // ── Phase 1: Foundation (parallel) ──────────────────────────
    this.log.info("Phase 1/4: Foundation — Script & Brand Identity");
    const [scriptResult, brandResult] = await this.parallel([
      new ScriptAgent().run(brief),
      new BrandAgent().run(brief),
    ]);

    const script = scriptResult.assets.find((a) => a.type === "script")?.content;
    const shotList = scriptResult.assets.find((a) => a.type === "shot-list")?.content;
    brief.dependencies.script = script;
    brief.dependencies.shotList = shotList;
    brief.dependencies.brand = brandResult.assets.find(
      (a) => a.type === "brand-identity"
    )?.content;

    // ── Phase 2: Production (parallel) ──────────────────────────
    this.log.info("Phase 2/4: Production — Storyboard, Voice, Music, SFX");
    const [storyboardResult, voiceoverResult, musicResult, sfxResult] =
      await this.parallel([
        new StoryboardAgent().run(brief),
        new VoiceoverAgent().run(brief),
        new MusicAgent().run(brief),
        new SFXAgent().run(brief),
      ]);

    const keyframes = storyboardResult.assets
      .filter((a) => a.type === "storyboard-frame")
      .map((a) => a.content);
    brief.dependencies.keyframes = keyframes;

    // ── Phase 3: Video Generation ───────────────────────────────
    this.log.info("Phase 3/4: Video Generation");
    const videoResult = await new VideoAgent().run(brief);

    // ── Collect all assets ──────────────────────────────────────
    const allAssets = [
      ...scriptResult.assets,
      ...brandResult.assets,
      ...storyboardResult.assets,
      ...voiceoverResult.assets,
      ...musicResult.assets,
      ...sfxResult.assets,
      ...videoResult.assets,
    ];
    brief.dependencies.allAssets = allAssets;

    // ── Phase 4: Compose & Review ───────────────────────────────
    this.log.info("Phase 4/4: Composition & Quality Review");
    const composerResult = await new ComposerAgent().run(brief);
    allAssets.push(...composerResult.assets);
    brief.dependencies.allAssets = allAssets;

    let review = { issuesFound: 0, autoFixed: 0 };
    if (this.config.review !== false) {
      const reviewResult = await new ReviewAgent().run(brief);
      const qaReport = reviewResult.assets.find((a) => a.type === "qa-report")?.content;
      if (qaReport) {
        review = qaReport;
      }
      allAssets.push(...reviewResult.assets);
    }

    return { assets: allAssets, review };
  }

  async parallel(promises) {
    return Promise.all(promises);
  }

  dryRun(brief) {
    this.log.info("DRY RUN — showing execution plan:\n");
    const phases = [
      {
        name: "Phase 1: Foundation",
        agents: ["ScriptAgent", "BrandAgent"],
        mode: "parallel",
      },
      {
        name: "Phase 2: Production",
        agents: ["StoryboardAgent", "VoiceoverAgent", "MusicAgent", "SFXAgent"],
        mode: "parallel",
      },
      {
        name: "Phase 3: Video Generation",
        agents: ["VideoAgent"],
        mode: "sequential",
      },
      {
        name: "Phase 4: Compose & Review",
        agents: ["ComposerAgent", "ReviewAgent"],
        mode: "sequential",
      },
    ];

    for (const phase of phases) {
      console.log(`  ${phase.name} [${phase.mode}]`);
      for (const agent of phase.agents) {
        console.log(`    -> ${agent}`);
      }
      console.log();
    }

    return {
      assets: [],
      review: { issuesFound: 0, autoFixed: 0 },
    };
  }
}
