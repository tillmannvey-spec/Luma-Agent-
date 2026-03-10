/**
 * ElevenLabs API Client
 *
 * Text-to-speech via ElevenLabs for voiceover narration.
 *
 * Required env: ELEVENLABS_API_KEY
 */

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

const VOICE_PRESETS = {
  "deep-authoritative": {
    description: "Deep, measured, authoritative — luxury/premium",
    settings: { stability: 0.7, similarity_boost: 0.8, style: 0.3 },
  },
  "warm-conversational": {
    description: "Warm, friendly, conversational — general purpose",
    settings: { stability: 0.5, similarity_boost: 0.7, style: 0.5 },
  },
  "upbeat-dynamic": {
    description: "Energetic, upbeat — fun/action content",
    settings: { stability: 0.4, similarity_boost: 0.6, style: 0.8 },
  },
};

export class ElevenLabsClient {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.ELEVENLABS_API_KEY;
    if (!this.apiKey) {
      console.warn("[ElevenLabs] No ELEVENLABS_API_KEY set — running in dry-run mode");
    }
    this.voiceId = null;
  }

  /**
   * List available voices and pick the best match.
   */
  async findVoice(preset = "warm-conversational") {
    if (!this.apiKey) {
      return { voice_id: "dry-run-voice", name: `[DRY-RUN] ${preset}` };
    }

    const res = await fetch(`${ELEVENLABS_BASE}/voices`, {
      headers: { "xi-api-key": this.apiKey },
    });

    if (!res.ok) {
      throw new Error(`ElevenLabs voices failed: ${res.status}`);
    }

    const { voices } = await res.json();

    // Pick first available voice (user can configure specific voice_id later)
    const voice = voices[0];
    if (!voice) {
      throw new Error("No voices available in ElevenLabs account");
    }

    this.voiceId = voice.voice_id;
    return voice;
  }

  /**
   * Generate speech from text.
   *
   * @param {object} options
   * @param {string} options.text - Text to synthesize
   * @param {string} options.voiceId - ElevenLabs voice ID (or uses default)
   * @param {string} options.preset - Voice preset name
   * @param {string} options.outputPath - Where to save the audio file
   * @returns {object} Result with audio data/path
   */
  async textToSpeech({ text, voiceId, preset = "warm-conversational", outputPath }) {
    const vid = voiceId || this.voiceId;
    const presetConfig = VOICE_PRESETS[preset] || VOICE_PRESETS["warm-conversational"];

    if (!this.apiKey) {
      return this.dryRunResult(text, preset);
    }

    if (!vid) {
      await this.findVoice(preset);
    }

    const finalVoiceId = vid || this.voiceId;

    const res = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${finalVoiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": this.apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: presetConfig.settings,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`ElevenLabs TTS failed (${res.status}): ${err}`);
    }

    const audioBuffer = await res.arrayBuffer();

    if (outputPath) {
      const fs = await import("node:fs/promises");
      await fs.writeFile(outputPath, Buffer.from(audioBuffer));
      return { path: outputPath, size: audioBuffer.byteLength, format: "mp3" };
    }

    return { buffer: audioBuffer, size: audioBuffer.byteLength, format: "mp3" };
  }

  dryRunResult(text, preset) {
    return {
      path: `[DRY-RUN] elevenlabs/${preset} — "${text.slice(0, 60)}"`,
      size: 0,
      format: "mp3",
      dryRun: true,
    };
  }
}

export { VOICE_PRESETS };
