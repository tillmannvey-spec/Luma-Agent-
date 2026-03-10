import { BaseAgent } from "./base-agent.js";

/**
 * SFXAgent — generates contextual sound effects for each scene.
 */
export class SFXAgent extends BaseAgent {
  constructor() {
    super("SFXAgent", "sfx");
  }

  async plan(brief) {
    return {
      steps: [
        "Analyze scenes for sound effect needs",
        "Categorize effects (foley, ambient, impact)",
        "Generate sound effects",
        "Map effects to timeline",
      ],
    };
  }

  async execute(plan, brief) {
    const shotList = brief.dependencies?.shotList || this.defaultShots();

    this.log.step(1, 2, "Analyzing scenes for SFX needs...");
    const effects = shotList.flatMap((shot, i) => this.generateEffects(shot, i));

    this.log.step(2, 2, `Generated ${effects.length} sound effects`);

    return effects.map((fx) => ({
      type: "sound-effect",
      format: "wav",
      content: fx,
    }));
  }

  generateEffects(shot, index) {
    const desc = (shot.description || "").toLowerCase();
    const effects = [];

    // Ambient layer for every scene
    effects.push({
      sfxId: `SFX-${index + 1}-amb`,
      shotRef: shot.shotId || `SHOT-${index + 1}`,
      category: "ambient",
      description: `Ambient atmosphere for: ${shot.description}`,
      timing: "0s",
      duration: shot.duration || "3s",
    });

    // Transition whoosh between scenes
    if (index > 0) {
      effects.push({
        sfxId: `SFX-${index + 1}-trans`,
        shotRef: shot.shotId || `SHOT-${index + 1}`,
        category: "transition",
        description: "Cinematic whoosh transition",
        timing: "0s",
        duration: "0.5s",
      });
    }

    // Impact for reveal/climax scenes
    if (desc.includes("reveal") || desc.includes("climax") || index === 2) {
      effects.push({
        sfxId: `SFX-${index + 1}-impact`,
        shotRef: shot.shotId || `SHOT-${index + 1}`,
        category: "impact",
        description: "Deep impact hit for reveal moment",
        timing: "0.5s",
        duration: "1s",
      });
    }

    return effects;
  }

  defaultShots() {
    return [
      { shotId: "SHOT-1", description: "Opening", duration: "3s" },
      { shotId: "SHOT-2", description: "Build", duration: "5s" },
      { shotId: "SHOT-3", description: "Product reveal", duration: "4s" },
      { shotId: "SHOT-4", description: "Close", duration: "3s" },
    ];
  }
}
