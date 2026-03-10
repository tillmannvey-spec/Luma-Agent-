#!/usr/bin/env node

/**
 * Luma Creative Agent Workflow
 *
 * Orchestrates multiple AI sub-agents in parallel to produce
 * a complete creative production from a single text prompt.
 *
 * Providers:
 *   - Images:  fal.ai → Nano Banana 2 (txt2img + img2img)
 *   - Videos:  fal.ai → Kling 2.6/3.0/3.0 Omni (cheapest first)
 *   - Voice:   ElevenLabs API
 *   - Editing: Remotion
 *
 * Required env vars:
 *   FAL_KEY             — fal.ai API key (images + videos)
 *   ELEVENLABS_API_KEY  — ElevenLabs API key (voiceover)
 */

import { Orchestrator } from "./orchestrator.js";
import { parseArgs } from "./utils/args.js";

async function main() {
  const config = parseArgs(process.argv.slice(2));

  console.log("═══════════════════════════════════════════════════════");
  console.log("  LUMA CREATIVE AGENT WORKFLOW");
  console.log("  AI-Powered Creative Production Pipeline");
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Images:  fal.ai / Nano Banana 2");
  console.log("  Videos:  Kling 2.6 / 3.0 / 3.0 Omni (via fal.ai)");
  console.log("  Voice:   ElevenLabs");
  console.log("  Editing: Remotion");
  console.log("═══════════════════════════════════════════════════════\n");

  if (!config.prompt) {
    console.log("Usage: node src/index.js --prompt \"<your creative brief>\"\n");
    console.log("Options:");
    console.log("  --prompt           Creative brief / text prompt (required)");
    console.log("  --output           Output directory (default: ./output)");
    console.log("  --parallel         Max parallel agents (default: 5)");
    console.log("  --review           Enable auto-review & fix (default: true)");
    console.log("  --approve-videos   Approve video generation (costs money!)");
    console.log("  --dry-run          Show plan without executing\n");
    console.log("Environment variables:");
    console.log("  FAL_KEY            fal.ai API key (images + videos)");
    console.log("  ELEVENLABS_API_KEY ElevenLabs API key (voiceover)\n");
    console.log("Example:");
    console.log('  node src/index.js --prompt "Create an ad for a luxury watch brand"');
    process.exit(0);
  }

  const orchestrator = new Orchestrator(config);

  try {
    const result = await orchestrator.run();

    const pendingVideos = result.assets.filter(
      (a) => a.type === "video-clip" && a.content?.status === "pending-approval"
    );

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("  WORKFLOW COMPLETE");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`\n  Assets produced: ${result.assets.length}`);
    console.log(`  Review issues:  ${result.review.issuesFound}`);
    console.log(`  Auto-fixed:     ${result.review.autoFixed}`);
    console.log(`  Output:         ${config.output}`);

    if (pendingVideos.length > 0) {
      console.log(`\n  >>> ${pendingVideos.length} videos pending approval <<<`);
      console.log("  Re-run with --approve-videos to generate video clips.");
    }

    console.log();
  } catch (err) {
    console.error("\n[ERROR] Workflow failed:", err.message);
    process.exit(1);
  }
}

main();
