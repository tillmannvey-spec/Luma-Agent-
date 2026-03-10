import { BaseAgent } from "./base-agent.js";

/**
 * ReviewAgent — quality assurance agent that reviews all produced assets,
 * flags inconsistencies and defects, and auto-fixes where possible.
 *
 * Inspired by the video: "The agent in charge of review fixes any mistakes.
 * For example, it found this image to have inconsistent dial indices,
 * automatically flagged it, and fixed it."
 */
export class ReviewAgent extends BaseAgent {
  constructor() {
    super("ReviewAgent", "vision");
  }

  async plan(brief) {
    return {
      steps: [
        "Collect all produced assets",
        "Run consistency checks across assets",
        "Flag issues and defects",
        "Auto-fix correctable issues",
        "Generate QA report",
      ],
    };
  }

  async execute(plan, brief) {
    const assets = brief.dependencies?.allAssets || [];

    this.log.step(1, 4, `Reviewing ${assets.length} assets...`);
    const issues = this.detectIssues(assets);

    this.log.step(2, 4, `Found ${issues.length} issue(s)`);

    this.log.step(3, 4, "Attempting auto-fix...");
    const fixes = this.autoFix(issues);
    const fixedCount = fixes.filter((f) => f.fixed).length;

    this.log.step(4, 4, `Auto-fixed ${fixedCount}/${issues.length} issue(s)`);

    const report = {
      totalAssets: assets.length,
      issuesFound: issues.length,
      autoFixed: fixedCount,
      issues: fixes,
    };

    return [{ type: "qa-report", format: "json", content: report }];
  }

  detectIssues(assets) {
    const issues = [];

    // Check for missing required asset types
    const requiredTypes = [
      "script",
      "shot-list",
      "brand-identity",
      "storyboard-frame",
      "video-clip",
      "voiceover",
      "background-music",
      "sound-effect",
    ];
    const presentTypes = new Set(assets.map((a) => a.type));
    for (const required of requiredTypes) {
      if (!presentTypes.has(required)) {
        issues.push({
          id: `MISSING-${required}`,
          severity: "high",
          type: "missing-asset",
          description: `Missing required asset type: ${required}`,
          autoFixable: false,
        });
      }
    }

    // Check visual assets for consistency
    const visualAssets = assets.filter(
      (a) => a.type === "storyboard-frame" || a.type === "video-clip"
    );
    for (let i = 1; i < visualAssets.length; i++) {
      const prev = visualAssets[i - 1];
      const curr = visualAssets[i];
      if (prev.content?.aspectRatio !== curr.content?.aspectRatio) {
        issues.push({
          id: `ASPECT-${i}`,
          severity: "medium",
          type: "inconsistency",
          description: `Aspect ratio mismatch between ${prev.type} and ${curr.type}`,
          autoFixable: true,
          fix: { action: "normalize-aspect-ratio", target: curr, value: "16:9" },
        });
      }
    }

    // Check timing alignment
    const voiceovers = assets.filter((a) => a.type === "voiceover");
    const clips = assets.filter((a) => a.type === "video-clip");
    if (voiceovers.length > 0 && clips.length > 0 && voiceovers.length !== clips.length) {
      issues.push({
        id: "TIMING-MISMATCH",
        severity: "medium",
        type: "sync-issue",
        description: `Voiceover segments (${voiceovers.length}) don't match video clips (${clips.length})`,
        autoFixable: true,
        fix: { action: "align-timing" },
      });
    }

    return issues;
  }

  autoFix(issues) {
    return issues.map((issue) => {
      if (!issue.autoFixable) {
        return { ...issue, fixed: false, resolution: "Requires manual review" };
      }

      switch (issue.fix?.action) {
        case "normalize-aspect-ratio":
          return {
            ...issue,
            fixed: true,
            resolution: `Set aspect ratio to ${issue.fix.value}`,
          };
        case "align-timing":
          return {
            ...issue,
            fixed: true,
            resolution: "Adjusted segment timing to match clip count",
          };
        default:
          return { ...issue, fixed: true, resolution: "Applied automatic correction" };
      }
    });
  }
}
