import { BaseAgent } from "./base-agent.js";

/**
 * VideoAgent — generates video clips for each storyboard keyframe.
 * Selects the optimal video generation model based on shot requirements.
 */
export class VideoAgent extends BaseAgent {
  constructor() {
    super("VideoAgent", "video");
  }

  async plan(brief) {
    return {
      steps: [
        "Receive keyframes from StoryboardAgent",
        "Select optimal model per shot type",
        "Generate video clip for each keyframe",
        "Apply transitions between clips",
      ],
    };
  }

  async execute(plan, brief) {
    const keyframes = brief.dependencies?.keyframes || this.defaultKeyframes();

    this.log.step(1, 3, `Processing ${keyframes.length} keyframes...`);
    const clips = keyframes.map((kf, i) => {
      this.log.info(`  Generating clip ${i + 1}/${keyframes.length}: ${kf.frameId || `KF-${i + 1}`}`);
      return this.generateClip(kf, i);
    });

    this.log.step(2, 3, "Adding transitions...");
    const transitions = this.generateTransitions(clips);

    this.log.step(3, 3, "Video generation complete");

    return [
      ...clips.map((clip) => ({
        type: "video-clip",
        format: "mp4",
        content: clip,
      })),
      { type: "transitions", format: "json", content: transitions },
    ];
  }

  generateClip(keyframe, index) {
    const modelChoice = this.selectModel(keyframe);
    return {
      clipId: `CLIP-${index + 1}`,
      keyframeRef: keyframe.frameId || `KF-${index + 1}`,
      prompt: keyframe.visualPrompt || keyframe.description,
      duration: keyframe.duration || "3s",
      resolution: "1920x1080",
      fps: 24,
      model: modelChoice,
      status: "generated",
    };
  }

  selectModel(keyframe) {
    const prompt = (keyframe.visualPrompt || "").toLowerCase();
    if (prompt.includes("motion") || prompt.includes("action")) {
      return { id: "video-gen-motion", reason: "High-motion content" };
    }
    if (prompt.includes("photorealistic") || prompt.includes("cinematic")) {
      return { id: "video-gen-cinematic", reason: "Cinematic realism" };
    }
    return { id: "video-gen-standard", reason: "General purpose" };
  }

  generateTransitions(clips) {
    const transitions = [];
    for (let i = 0; i < clips.length - 1; i++) {
      transitions.push({
        from: clips[i].clipId,
        to: clips[i + 1].clipId,
        type: i === 0 ? "fade" : "cut",
        duration: "0.5s",
      });
    }
    return transitions;
  }

  defaultKeyframes() {
    return [
      { frameId: "KF-1", description: "Opening shot", duration: "3s" },
      { frameId: "KF-2", description: "Main subject", duration: "5s" },
      { frameId: "KF-3", description: "Product close-up", duration: "4s" },
      { frameId: "KF-4", description: "End card", duration: "3s" },
    ];
  }
}
