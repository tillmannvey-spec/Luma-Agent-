import { BaseAgent } from "./base-agent.js";

/**
 * StoryboardAgent — generates visual keyframe descriptions
 * for each shot in the shot list, ready for image/video generation.
 */
export class StoryboardAgent extends BaseAgent {
  constructor() {
    super("StoryboardAgent", "image");
  }

  async plan(brief) {
    return {
      steps: [
        "Receive shot list from ScriptAgent",
        "Generate visual description for each keyframe",
        "Define composition, lighting, and mood per frame",
        "Output storyboard with generation prompts",
      ],
    };
  }

  async execute(plan, brief) {
    const shotList = brief.dependencies?.shotList || this.defaultShotList();

    this.log.step(1, 2, `Generating ${shotList.length} keyframes...`);
    const keyframes = shotList.map((shot, i) => this.generateKeyframe(shot, i, brief));

    this.log.step(2, 2, "Storyboard complete");

    return keyframes.map((kf) => ({
      type: "storyboard-frame",
      format: "json",
      content: kf,
    }));
  }

  generateKeyframe(shot, index, brief) {
    const moods = ["mysterious", "dramatic", "elegant", "powerful"];
    const lightings = [
      "low-key chiaroscuro",
      "golden hour warm",
      "studio rim light",
      "high contrast spotlight",
    ];

    return {
      frameId: `KF-${index + 1}`,
      shotRef: shot.shotId || `SHOT-${index + 1}`,
      description: shot.description,
      visualPrompt: `${shot.description}, cinematic, ${moods[index % moods.length]} mood, ${lightings[index % lightings.length]}, 4K, photorealistic`,
      composition: index === 0 ? "rule-of-thirds" : "centered",
      aspectRatio: "16:9",
      duration: shot.duration || "3s",
    };
  }

  defaultShotList() {
    return [
      { shotId: "SHOT-1", description: "Opening establishing shot", duration: "3s" },
      { shotId: "SHOT-2", description: "Subject introduction", duration: "5s" },
      { shotId: "SHOT-3", description: "Product reveal", duration: "4s" },
      { shotId: "SHOT-4", description: "Brand close", duration: "3s" },
    ];
  }
}
