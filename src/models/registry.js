/**
 * Model Registry
 *
 * Maps task types to optimal AI models. Different models have different
 * specialties — the agents determine the best model depending on the task.
 */

const MODEL_REGISTRY = {
  text: {
    id: "text-generation",
    description: "Script writing, copywriting, creative text",
    capabilities: ["script", "shotlist", "voiceover-text", "brand-copy"],
  },
  image: {
    id: "image-generation",
    description: "Storyboard frames, brand visuals, keyframes",
    capabilities: ["storyboard", "keyframe", "brand-logo", "brand-palette"],
  },
  video: {
    id: "video-generation",
    description: "Video clips from keyframes or text prompts",
    capabilities: ["keyframe-video", "transition", "motion-graphics"],
  },
  voice: {
    id: "voice-synthesis",
    description: "Voiceover narration from script text",
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
