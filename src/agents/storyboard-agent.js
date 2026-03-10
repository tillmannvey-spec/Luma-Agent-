import { BaseAgent } from "./base-agent.js";
import { FalClient } from "../clients/fal-client.js";

/**
 * StoryboardAgent — generates visual keyframes using fal.ai Nano Banana 2.
 *
 * Consistency logic:
 *   - First keyframe: text-to-image (fresh generation)
 *   - Subsequent keyframes: image-to-image using previous keyframe
 *     to maintain visual consistency (same style, characters, colors)
 */
export class StoryboardAgent extends BaseAgent {
  constructor() {
    super("StoryboardAgent", "image");
    this.fal = new FalClient();
  }

  async plan(brief) {
    return {
      steps: [
        "Receive shot list from ScriptAgent",
        "Generate first keyframe via text-to-image (Nano Banana 2)",
        "Generate remaining keyframes via image-to-image for consistency",
        "Output storyboard with image URLs",
      ],
    };
  }

  async execute(plan, brief) {
    const shotList = brief.dependencies?.shotList || this.defaultShotList();
    const brand = brief.dependencies?.brand;

    this.log.step(1, 2, `Generating ${shotList.length} keyframes via fal.ai Nano Banana 2...`);

    const keyframes = [];
    let previousImageUrl = null;

    for (let i = 0; i < shotList.length; i++) {
      const shot = shotList[i];
      const prompt = this.buildPrompt(shot, i, brief, brand);
      const needsConsistency = i > 0 && previousImageUrl;

      this.log.info(`  KF-${i + 1}: ${needsConsistency ? "img2img (consistent)" : "txt2img (fresh)"}`);

      let result;
      if (needsConsistency) {
        result = await this.fal.imageToImage({
          prompt,
          imageUrl: previousImageUrl,
          strength: 0.65,
          aspectRatio: "16:9",
        });
      } else {
        result = await this.fal.textToImage({
          prompt,
          aspectRatio: "16:9",
        });
      }

      const imageUrl = result.images?.[0]?.url || null;
      previousImageUrl = imageUrl;

      keyframes.push({
        frameId: `KF-${i + 1}`,
        shotRef: shot.shotId || `SHOT-${i + 1}`,
        description: shot.description,
        visualPrompt: prompt,
        imageUrl,
        generationMode: needsConsistency ? "img2img" : "txt2img",
        model: "fal-ai/fal-media-generator (Nano Banana 2)",
        aspectRatio: "16:9",
        duration: shot.duration || "3s",
        seed: result.seed,
      });
    }

    this.log.step(2, 2, "Storyboard complete");

    return keyframes.map((kf) => ({
      type: "storyboard-frame",
      format: "json",
      content: kf,
    }));
  }

  buildPrompt(shot, index, brief, brand) {
    const moods = ["mysterious", "dramatic", "elegant", "powerful"];
    const lightings = [
      "low-key chiaroscuro",
      "golden hour warm",
      "studio rim light",
      "high contrast spotlight",
    ];

    let prompt = `${shot.description}, cinematic, ${moods[index % moods.length]} mood, ${lightings[index % lightings.length]}, 4K, photorealistic`;

    if (brand?.palette) {
      prompt += `, color palette: ${brand.palette.primary} and ${brand.palette.secondary}`;
    }

    return prompt;
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
