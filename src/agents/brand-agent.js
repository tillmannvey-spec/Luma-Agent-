import { BaseAgent } from "./base-agent.js";

/**
 * BrandAgent — creates brand identity assets:
 * logo concept, color palette, typography, and style guide.
 */
export class BrandAgent extends BaseAgent {
  constructor() {
    super("BrandAgent", "image");
  }

  async plan(brief) {
    return {
      steps: [
        "Define brand personality from brief",
        "Generate color palette",
        "Select typography direction",
        "Create brand style guide",
      ],
    };
  }

  async execute(plan, brief) {
    this.log.step(1, 4, "Defining brand personality...");
    const personality = this.defineBrandPersonality(brief);

    this.log.step(2, 4, "Generating color palette...");
    const palette = this.generatePalette(personality);

    this.log.step(3, 4, "Selecting typography...");
    const typography = this.selectTypography(personality);

    this.log.step(4, 4, "Compiling style guide...");
    const styleGuide = {
      personality,
      palette,
      typography,
      logoDirection: `Minimalist mark reflecting: ${personality.values.join(", ")}`,
    };

    return [
      { type: "brand-identity", format: "json", content: styleGuide },
      { type: "color-palette", format: "json", content: palette },
      { type: "typography", format: "json", content: typography },
    ];
  }

  defineBrandPersonality(brief) {
    const prompt = brief.prompt.toLowerCase();
    if (prompt.includes("luxury") || prompt.includes("premium")) {
      return {
        archetype: "Ruler",
        values: ["excellence", "authority", "sophistication"],
        tone: "refined and authoritative",
      };
    }
    if (prompt.includes("fun") || prompt.includes("play")) {
      return {
        archetype: "Jester",
        values: ["joy", "humor", "connection"],
        tone: "playful and energetic",
      };
    }
    return {
      archetype: "Creator",
      values: ["innovation", "vision", "expression"],
      tone: "bold and inspiring",
    };
  }

  generatePalette(personality) {
    const palettes = {
      Ruler: {
        primary: "#1a1a2e",
        secondary: "#c9a84c",
        accent: "#e8d5a3",
        background: "#0f0f1a",
        text: "#f5f5f5",
      },
      Jester: {
        primary: "#ff6b6b",
        secondary: "#4ecdc4",
        accent: "#ffe66d",
        background: "#2c2c54",
        text: "#ffffff",
      },
      Creator: {
        primary: "#2d3436",
        secondary: "#6c5ce7",
        accent: "#a29bfe",
        background: "#dfe6e9",
        text: "#2d3436",
      },
    };
    return palettes[personality.archetype] || palettes.Creator;
  }

  selectTypography(personality) {
    const typo = {
      Ruler: {
        heading: "Playfair Display",
        body: "Inter",
        style: "serif + sans-serif contrast",
      },
      Jester: {
        heading: "Poppins",
        body: "Nunito",
        style: "rounded, friendly sans-serif",
      },
      Creator: {
        heading: "Space Grotesk",
        body: "DM Sans",
        style: "geometric, modern sans-serif",
      },
    };
    return typo[personality.archetype] || typo.Creator;
  }
}
