#!/usr/bin/env node

/**
 * Luma Creative Agent Workflow
 *
 * Orchestrates multiple AI sub-agents in parallel to produce
 * a complete creative production from a single text prompt.
 *
 * Workflow:
 *   1. Parse creative brief from user prompt
 *   2. Launch parallel sub-agents:
 *      - ScriptAgent       → script + shot list
 *      - BrandAgent        → brand identity + style guide
 *      - StoryboardAgent   → keyframe storyboards
 *      - VideoAgent        → video for each keyframe
 *      - VoiceoverAgent    → voiceover narration
 *      - MusicAgent        → contextual music
 *      - SFXAgent          → sound effects
 *   3. ComposerAgent       → assemble final composition
 *   4. ReviewAgent         → QA, flag issues, auto-fix
 */

import { Orchestrator } from "./orchestrator.js";
import { parseArgs } from "./utils/args.js";

async function main() {
  const config = parseArgs(process.argv.slice(2));

  console.log("═══════════════════════════════════════════════════════");
  console.log("  LUMA CREATIVE AGENT WORKFLOW");
  console.log("  AI-Powered Creative Production Pipeline");
  console.log("═══════════════════════════════════════════════════════\n");

  if (!config.prompt) {
    console.log("Usage: node src/index.js --prompt \"<your creative brief>\"\n");
    console.log("Options:");
    console.log("  --prompt    Creative brief / text prompt (required)");
    console.log("  --output    Output directory (default: ./output)");
    console.log("  --parallel  Max parallel agents (default: 5)");
    console.log("  --review    Enable auto-review & fix (default: true)");
    console.log("  --dry-run   Show plan without executing\n");
    console.log('Example:');
    console.log('  node src/index.js --prompt "Create an ad for a luxury watch brand around the concept of borrowed time"');
    process.exit(0);
  }

  const orchestrator = new Orchestrator(config);

  try {
    const result = await orchestrator.run();
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("  WORKFLOW COMPLETE");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`\n  Assets produced: ${result.assets.length}`);
    console.log(`  Review issues:  ${result.review.issuesFound}`);
    console.log(`  Auto-fixed:     ${result.review.autoFixed}`);
    console.log(`  Output:         ${config.output}\n`);
  } catch (err) {
    console.error("\n[ERROR] Workflow failed:", err.message);
    process.exit(1);
  }
}

main();
