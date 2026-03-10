import { BaseAgent } from "./base-agent.js";

/**
 * VoiceoverAgent — generates voiceover narration from the script.
 */
export class VoiceoverAgent extends BaseAgent {
  constructor() {
    super("VoiceoverAgent", "voice");
  }

  async plan(brief) {
    return {
      steps: [
        "Extract narration text from script",
        "Select voice profile matching brand tone",
        "Generate voiceover audio segments",
        "Sync timing with shot list",
      ],
    };
  }

  async execute(plan, brief) {
    const script = brief.dependencies?.script || this.defaultScript();

    this.log.step(1, 3, "Extracting narration lines...");
    const lines = this.extractNarration(script);

    this.log.step(2, 3, "Selecting voice profile...");
    const voiceProfile = this.selectVoice(brief);

    this.log.step(3, 3, `Generating ${lines.length} voiceover segments...`);
    const segments = lines.map((line, i) => ({
      segmentId: `VO-${i + 1}`,
      text: line.text,
      sceneRef: line.sceneId,
      voice: voiceProfile,
      duration: line.duration,
      status: "generated",
    }));

    return segments.map((seg) => ({
      type: "voiceover",
      format: "wav",
      content: seg,
    }));
  }

  extractNarration(script) {
    if (script.scenes) {
      return script.scenes.map((s) => ({
        sceneId: s.id,
        text: s.direction,
        duration: s.duration,
      }));
    }
    return [{ sceneId: 1, text: "Default narration", duration: "5s" }];
  }

  selectVoice(brief) {
    const prompt = brief.prompt.toLowerCase();
    if (prompt.includes("luxury") || prompt.includes("elegant")) {
      return { id: "deep-authoritative", gender: "neutral", pace: "measured" };
    }
    if (prompt.includes("energy") || prompt.includes("fun")) {
      return { id: "upbeat-dynamic", gender: "neutral", pace: "fast" };
    }
    return { id: "warm-conversational", gender: "neutral", pace: "moderate" };
  }

  defaultScript() {
    return {
      scenes: [
        { id: 1, direction: "Opening narration", duration: "3s" },
        { id: 2, direction: "Main message", duration: "5s" },
      ],
    };
  }
}
