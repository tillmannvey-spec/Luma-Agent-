import { BaseAgent } from "./base-agent.js";
import { KlingClient, KLING_MODELS } from "../clients/kling-client.js";

/**
 * VideoAgent — generates video clips using Kling models via fal.ai.
 *
 * Model selection (cheapest first):
 *   - Kling 2.6: Default, cheapest. Used when no lip-sync is needed.
 *   - Kling 3.0: Used when lip-sync is required.
 *   - Kling 3.0 Omni: Premium, only when explicitly requested.
 *
 * IMPORTANT: This agent does NOT auto-execute. The orchestrator will
 * pause and wait for user approval before generating videos (they cost money).
 */
export class VideoAgent extends BaseAgent {
  constructor() {
    super("VideoAgent", "video");
    this.kling = new KlingClient();
  }

  async plan(brief) {
    return {
      steps: [
        "Receive keyframes from StoryboardAgent",
        "Select cheapest suitable Kling model per clip",
        "Wait for user approval",
        "Generate video clip for each keyframe",
      ],
    };
  }

  async execute(plan, brief) {
    const keyframes = brief.dependencies?.keyframes || this.defaultKeyframes();
    const approved = brief.dependencies?.videoApproved || false;

    this.log.step(1, 3, `Planning ${keyframes.length} video clips...`);
    const clipPlans = keyframes.map((kf, i) => this.planClip(kf, i, brief));

    const summary = this.costSummary(clipPlans);
    this.log.info(`  Model selection: ${summary}`);

    if (!approved) {
      this.log.warn("Videos NOT generated — waiting for user approval.");
      this.log.info("  Run with --approve-videos or confirm in interactive mode.");
      return clipPlans.map((cp) => ({
        type: "video-clip",
        format: "json",
        content: {
          ...cp,
          status: "pending-approval",
          videoUrl: null,
        },
      }));
    }

    this.log.step(2, 3, `Generating ${keyframes.length} clips via Kling...`);
    const clips = [];

    for (let i = 0; i < clipPlans.length; i++) {
      const cp = clipPlans[i];
      this.log.info(`  Clip ${i + 1}/${clipPlans.length}: ${cp.modelName} — ${cp.keyframeRef}`);

      let result;
      if (cp.imageUrl) {
        result = await this.kling.imageToVideo({
          imageUrl: cp.imageUrl,
          prompt: cp.prompt,
          duration: cp.duration,
          needsLipSync: cp.needsLipSync,
        });
      } else {
        result = await this.kling.textToVideo({
          prompt: cp.prompt,
          duration: cp.duration,
          needsLipSync: cp.needsLipSync,
        });
      }

      clips.push({
        ...cp,
        status: "generated",
        videoUrl: result.video?.url || null,
        modelUsed: result.modelUsed,
      });
    }

    this.log.step(3, 3, "Video generation complete");

    return clips.map((clip) => ({
      type: "video-clip",
      format: "mp4",
      content: clip,
    }));
  }

  planClip(keyframe, index, brief) {
    const prompt = keyframe.visualPrompt || keyframe.description;
    const needsLipSync = this.detectLipSync(prompt, brief);
    const model = this.kling.selectModel({ needsLipSync });

    return {
      clipId: `CLIP-${index + 1}`,
      keyframeRef: keyframe.frameId || `KF-${index + 1}`,
      imageUrl: keyframe.imageUrl || null,
      prompt,
      duration: keyframe.duration || "5s",
      needsLipSync,
      modelId: model.id,
      modelName: model.name,
      costTier: model.costTier,
      resolution: "1920x1080",
      fps: 24,
    };
  }

  detectLipSync(prompt, brief) {
    const text = `${prompt} ${brief.prompt || ""}`.toLowerCase();
    return (
      text.includes("speaking") ||
      text.includes("talking") ||
      text.includes("dialogue") ||
      text.includes("lip sync") ||
      text.includes("lipsync")
    );
  }

  costSummary(clipPlans) {
    const counts = {};
    for (const cp of clipPlans) {
      counts[cp.modelName] = (counts[cp.modelName] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, count]) => `${name} x${count}`)
      .join(", ");
  }

  defaultKeyframes() {
    return [
      { frameId: "KF-1", description: "Opening shot", duration: "5s" },
      { frameId: "KF-2", description: "Main subject", duration: "5s" },
      { frameId: "KF-3", description: "Product close-up", duration: "5s" },
      { frameId: "KF-4", description: "End card", duration: "5s" },
    ];
  }
}
