import { BaseAgent } from "./base-agent.js";

/**
 * MusicAgent — generates contextual background music and score.
 */
export class MusicAgent extends BaseAgent {
  constructor() {
    super("MusicAgent", "music");
  }

  async plan(brief) {
    return {
      steps: [
        "Analyze mood and tone from brief",
        "Define musical parameters (tempo, key, instruments)",
        "Generate background score",
        "Create variations for different scenes",
      ],
    };
  }

  async execute(plan, brief) {
    this.log.step(1, 3, "Analyzing mood...");
    const mood = this.analyzeMood(brief);

    this.log.step(2, 3, "Defining musical parameters...");
    const params = this.defineParams(mood);

    this.log.step(3, 3, "Generating score...");
    const score = {
      mood,
      ...params,
      sections: [
        { id: "intro", duration: "3s", intensity: 0.3 },
        { id: "build", duration: "5s", intensity: 0.6 },
        { id: "climax", duration: "4s", intensity: 1.0 },
        { id: "outro", duration: "3s", intensity: 0.4 },
      ],
    };

    return [
      { type: "background-music", format: "wav", content: score },
      { type: "music-metadata", format: "json", content: params },
    ];
  }

  analyzeMood(brief) {
    const prompt = brief.prompt.toLowerCase();
    if (prompt.includes("luxury") || prompt.includes("elegant")) return "sophisticated";
    if (prompt.includes("action") || prompt.includes("energy")) return "energetic";
    if (prompt.includes("sad") || prompt.includes("emotional")) return "melancholic";
    return "cinematic";
  }

  defineParams(mood) {
    const presets = {
      sophisticated: { tempo: 72, key: "Dm", instruments: ["piano", "strings", "soft synth"] },
      energetic: { tempo: 128, key: "Em", instruments: ["drums", "bass", "synth lead"] },
      melancholic: { tempo: 60, key: "Am", instruments: ["piano", "cello", "ambient pad"] },
      cinematic: { tempo: 90, key: "Cm", instruments: ["orchestra", "percussion", "choir"] },
    };
    return presets[mood] || presets.cinematic;
  }
}
