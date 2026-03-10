/**
 * Model Registry
 *
 * Maps task types to optimal AI models / providers.
 *
 * Providers:
 *   - Images:  fal.ai → Nano Banana 2 (fal-media-generator) — cheapest option
 *   - Videos:  fal.ai → Kling 2.6 (default, cheapest), 3.0, 3.0 Omni
 *   - Voice:   ElevenLabs API (eleven_multilingual_v2)
 *   - Editing: Remotion (local render)
 */

const MODEL_REGISTRY = {
  text: {
    id: "text-generation",
    description: "Script writing, copywriting, creative text",
    capabilities: ["script", "shotlist", "voiceover-text", "brand-copy"],
  },
  image: {
    id: "fal-ai/fal-media-generator",
    provider: "fal.ai",
    name: "Nano Banana 2",
    description: "Image generation via fal.ai — txt2img + img2img for consistency",
    capabilities: ["storyboard", "keyframe", "brand-logo", "brand-palette"],
    costTier: "low",
  },
  video: {
    id: "fal-ai/kling-video/v2",
    provider: "fal.ai",
    name: "Kling 2.6 (default)",
    description: "Video via Kling — auto-selects cheapest model, Kling 2.6 when no lip-sync",
    variants: {
      "kling-2.6": { id: "fal-ai/kling-video/v2", lipSync: false, costTier: "low" },
      "kling-3.0": { id: "fal-ai/kling-video/v3", lipSync: true, costTier: "medium" },
      "kling-3.0-omni": { id: "fal-ai/kling-video/v3/omni", lipSync: true, costTier: "high" },
    },
    capabilities: ["keyframe-video", "transition", "motion-graphics"],
  },
  voice: {
    id: "elevenlabs",
    provider: "ElevenLabs",
    name: "ElevenLabs TTS (eleven_multilingual_v2)",
    description: "Voiceover narration via ElevenLabs API",
    capabilities: ["narration", "dialogue", "character-voice"],
  },
  music: {
    id: "music-generation",
    description: "Contextual background music and scores",
    capabilities: ["background-score", "jingle", "ambient"],
  },
  sfx: {
    id: "sfx-generation",
    description: "Sound effects and foley",
    capabilities: ["foley", "ambient-sfx", "impact", "transition-sfx"],
  },
  editing: {
    id: "remotion",
    provider: "Remotion (local)",
    name: "Remotion Video Editor",
    description: "Video composition and editing via Remotion",
    capabilities: ["composition", "timeline", "transitions", "audio-mix"],
  },
  vision: {
    id: "vision-analysis",
    description: "Image QA, consistency checks, defect detection",
    capabilities: ["qa-check", "consistency", "defect-detection"],
  },
};

export function getModelForTask(taskType) {
  return MODEL_REGISTRY[taskType] || null;
}

export function listModels() {
  return Object.entries(MODEL_REGISTRY).map(([key, val]) => ({
    type: key,
    ...val,
  }));
}
