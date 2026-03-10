import { BaseAgent } from "./base-agent.js";

/**
 * ScriptAgent — generates a creative script and detailed shot list
 * from the user's text prompt / creative brief.
 */
export class ScriptAgent extends BaseAgent {
  constructor() {
    super("ScriptAgent", "text");
  }

  async plan(brief) {
    return {
      steps: [
        "Analyze creative brief and extract themes",
        "Generate narrative arc and script",
        "Break script into individual shots",
        "Create detailed shot list with descriptions",
      ],
    };
  }

  async execute(plan, brief) {
    this.log.step(1, 4, "Analyzing creative brief...");
    const themes = this.extractThemes(brief);

    this.log.step(2, 4, "Generating script...");
    const script = this.generateScript(brief, themes);

    this.log.step(3, 4, "Breaking into shots...");
    const shots = this.generateShotList(script);

    this.log.step(4, 4, "Finalizing shot list...");

    return [
      { type: "script", format: "text", content: script },
      { type: "shot-list", format: "json", content: shots },
      { type: "themes", format: "json", content: themes },
    ];
  }

  extractThemes(brief) {
    const keywords = brief.prompt.toLowerCase().split(/\s+/);
    const themeMap = {
      luxury: ["elegance", "premium", "exclusive"],
      time: ["urgency", "fleeting", "precious"],
      watch: ["craftsmanship", "precision", "heritage"],
      brand: ["identity", "recognition", "trust"],
      ad: ["persuasion", "emotion", "call-to-action"],
    };
    const themes = [];
    for (const [key, vals] of Object.entries(themeMap)) {
      if (keywords.some((w) => w.includes(key))) {
        themes.push({ keyword: key, associations: vals });
      }
    }
    return themes.length > 0
      ? themes
      : [{ keyword: "creative", associations: ["original", "bold", "fresh"] }];
  }

  generateScript(brief, themes) {
    const themeWords = themes.flatMap((t) => t.associations);
    return {
      title: `Creative Script: ${brief.prompt.slice(0, 50)}`,
      concept: brief.prompt,
      tone: themeWords.slice(0, 3).join(", "),
      scenes: [
        {
          id: 1,
          direction: "Opening — establish mood and setting",
          duration: "3s",
        },
        {
          id: 2,
          direction: "Build tension — introduce the core concept",
          duration: "5s",
        },
        {
          id: 3,
          direction: "Climax — reveal the product / message",
          duration: "4s",
        },
        {
          id: 4,
          direction: "Resolution — brand logo and call to action",
          duration: "3s",
        },
      ],
    };
  }

  generateShotList(script) {
    return script.scenes.map((scene) => ({
      shotId: `SHOT-${scene.id}`,
      scene: scene.id,
      description: scene.direction,
      duration: scene.duration,
      camera: scene.id === 1 ? "wide" : scene.id === 4 ? "close-up" : "medium",
      movement: scene.id <= 2 ? "slow dolly" : "static",
    }));
  }
}
