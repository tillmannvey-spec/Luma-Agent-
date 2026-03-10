import { BaseAgent } from "./base-agent.js";
import { ElevenLabsClient, VOICE_PRESETS } from "../clients/elevenlabs-client.js";

/**
 * VoiceoverAgent — generates voiceover narration using ElevenLabs API.
 *
 * Required: ELEVENLABS_API_KEY environment variable.
 * Automatically selects voice preset based on brief tone.
 */
export class VoiceoverAgent extends BaseAgent {
  constructor() {
    super("VoiceoverAgent", "voice");
    this.elevenlabs = new ElevenLabsClient();
  }

  async plan(brief) {
    return {
      steps: [
        "Extract narration text from script",
        "Select voice preset matching brand tone",
        "Find best matching ElevenLabs voice",
        "Generate voiceover audio via ElevenLabs API",
      ],
    };
  }

  async execute(plan, brief) {
    const script = brief.dependencies?.script || this.defaultScript();

    this.log.step(1, 4, "Extracting narration lines...");
    const lines = this.extractNarration(script);

    this.log.step(2, 4, "Selecting voice preset...");
    const preset = this.selectPreset(brief);
    this.log.info(`  Preset: ${preset} — ${VOICE_PRESETS[preset]?.description || "default"}`);

    this.log.step(3, 4, "Finding ElevenLabs voice...");
    const voice = await this.elevenlabs.findVoice(preset);
    this.log.info(`  Voice: ${voice.name} (${voice.voice_id})`);

    this.log.step(4, 4, `Generating ${lines.length} voiceover segments...`);
    const segments = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      this.log.info(`  VO-${i + 1}: "${line.text.slice(0, 50)}..."`);

      const result = await this.elevenlabs.textToSpeech({
        text: line.text,
        voiceId: voice.voice_id,
        preset,
        outputPath: brief.dependencies?.outputDir
          ? `${brief.dependencies.outputDir}/vo-${i + 1}.mp3`
          : undefined,
      });

      segments.push({
        segmentId: `VO-${i + 1}`,
        text: line.text,
        sceneRef: line.sceneId,
        voice: {
          id: voice.voice_id,
          name: voice.name,
          preset,
        },
        audio: {
          path: result.path,
          format: result.format,
          size: result.size,
        },
        duration: line.duration,
        status: result.dryRun ? "dry-run" : "generated",
      });
    }

    return segments.map((seg) => ({
      type: "voiceover",
      format: "mp3",
      content: seg,
    }));
  }

  selectPreset(brief) {
    const prompt = brief.prompt.toLowerCase();
    if (prompt.includes("luxury") || prompt.includes("elegant") || prompt.includes("premium")) {
      return "deep-authoritative";
    }
    if (prompt.includes("energy") || prompt.includes("fun") || prompt.includes("action")) {
      return "upbeat-dynamic";
    }
    return "warm-conversational";
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

  defaultScript() {
    return {
      scenes: [
        { id: 1, direction: "Opening narration", duration: "3s" },
        { id: 2, direction: "Main message", duration: "5s" },
      ],
    };
  }
}
