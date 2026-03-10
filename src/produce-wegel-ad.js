/**
 * wegel.cloud — Social Media Ad Production Script
 *
 * Generates a 15-20 second cinematic ad with:
 * - 5 keyframe images (fal.ai Nano Banana 2)
 * - 5 video clips (Kling 3.0 via fal.ai, 3-4s each)
 * - 1 voiceover (ElevenLabs, German, deep-authoritative)
 *
 * Branding: Dark premium (#0A0A0A), Electric blue (#3B82F6), White text
 *
 * Usage: node src/produce-wegel-ad.js
 */

import { FalClient } from "./clients/fal-client.js";
import { KlingClient } from "./clients/kling-client.js";
import { ElevenLabsClient } from "./clients/elevenlabs-client.js";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";

// Load .env manually
try {
  const envContent = await readFile(".env", "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {}

const OUTPUT_DIR = "./output/wegel-ad";

// --- WEGEL.CLOUD BRANDING ---
// Primary: #0A0A0A (dark anthracite), Accent: #3B82F6 (electric blue), Text: #FFFFFF
// Design: dark-mode premium, blue orbs/circles, clean minimalist

// --- AD SCENES ---

const SCENES = [
  {
    id: "SCENE-1",
    duration: "3",
    description: "Das Problem — IT-Chaos",
    imagePrompt:
      "A stressed German businessman in his 30s sitting at a cluttered desk in a dark office, three computer monitors displaying red error messages and warning popups, tangled ethernet cables and blinking server lights in the background, cold blue-tinted lighting with red warning glow from screens, cinematic shallow depth of field, anamorphic lens flare, photorealistic, 4K, dark moody atmosphere",
    motionPrompt:
      "Subtle frustrated head shake, monitor screens flicker with error messages, camera slowly zooms in on the man's worried face, dramatic lighting shifts",
    narration: "IT-Probleme kosten Zeit und Nerven.",
  },
  {
    id: "SCENE-2",
    duration: "3",
    description: "Die Loesung — wegel.cloud Dashboard",
    imagePrompt:
      "A sleek ultrawide curved monitor in a pristine modern office showing a beautiful dark-themed IT management dashboard with electric blue accent elements (#3B82F6), all system status indicators glowing green, clean minimalist desk setup, soft natural daylight streaming through floor-to-ceiling windows, the dashboard has a dark background (#0A0A0A) with blue glowing charts and metrics, cinematic, photorealistic, 4K, shallow depth of field",
    motionPrompt:
      "Smooth cinematic dolly-in towards the monitor, dashboard charts and metrics subtly animate, soft light rays drift through the window, calm professional atmosphere",
    narration: "wegel.cloud übernimmt Ihre komplette IT.",
  },
  {
    id: "SCENE-3",
    duration: "4",
    description: "Features — M365, Security, Backup",
    imagePrompt:
      "Three elegant glowing holographic icons floating in a dark premium space with background color #0A0A0A: a Microsoft 365 logo glowing in electric blue (#3B82F6), a cybersecurity shield with a padlock emitting blue light, and a cloud backup symbol with circular arrows, all three connected by thin luminous blue light beams, large soft blue orb effects in the background like bokeh circles, subtle blue particle effects, futuristic corporate tech aesthetic, cinematic, photorealistic, 4K",
    motionPrompt:
      "Icons slowly rotate and pulse with blue light, connecting light beams shimmer and flow between icons, blue orb bokeh effects drift slowly in background, gentle particle movement",
    narration:
      "Von Microsoft 365 über Cybersecurity bis zum automatisierten Backup.",
  },
  {
    id: "SCENE-4",
    duration: "3",
    description: "Persoenlich — Berater statt Callcenter",
    imagePrompt:
      "A friendly young German IT consultant in his late 20s wearing a dark navy smart casual blazer, having a warm one-on-one conversation with a middle-aged business client across a clean modern meeting table, laptop open showing a dark-themed dashboard with blue accents, bright modern office with warm natural side lighting, both genuinely smiling, atmosphere of trust and professionalism, cinematic, photorealistic, 4K, shallow depth of field with bokeh background",
    motionPrompt:
      "Natural conversational hand gestures from the consultant, warm genuine smile, subtle rack focus shift between the two people, soft natural light movement",
    narration: "Transparent, persönlich, ohne Callcenter.",
  },
  {
    id: "SCENE-5",
    duration: "4",
    description: "CTA — wegel.cloud Branding",
    imagePrompt:
      "A premium minimalist dark gradient background transitioning from #0A0A0A to #111827, the text 'wegel.cloud' displayed prominently in large clean white modern sans-serif typography centered in the frame, below it a smaller elegant tagline 'Ihre IT. Persönlich betreut.' in light gray, two large soft glowing blue orbs (#3B82F6) floating on the left and right sides like the website design, subtle floating cloud-shaped particles, professional tech branding, ultra clean and elegant, 4K",
    motionPrompt:
      "Text elegantly fades in from transparency, blue orbs slowly float and pulse with soft glow, subtle cloud particles drift upward, serene and confident ending",
    narration: "wegel.cloud — Ihre IT, persönlich betreut.",
  },
];

const FULL_VOICEOVER = SCENES.map((s) => s.narration).join(" ");

// --- MAIN ---

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║   wegel.cloud — Social Media Ad Production      ║");
  console.log("║   5 Scenes × Kling 3.0 | ~17 Seconds            ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  await mkdir(OUTPUT_DIR, { recursive: true });

  const fal = new FalClient();
  const kling = new KlingClient();
  const elevenlabs = new ElevenLabsClient();

  // ── PHASE 1: Keyframe Images (fal.ai Nano Banana 2) ──────────
  console.log("━━━ Phase 1/3: Keyframe Images (fal.ai) ━━━\n");

  const keyframes = [];
  let previousImageUrl = null;

  for (const scene of SCENES) {
    console.log(`[IMG] ${scene.id}: ${scene.description}`);

    let result;
    if (!previousImageUrl) {
      result = await fal.textToImage({
        prompt: scene.imagePrompt,
        aspectRatio: "16:9",
      });
    } else {
      result = await fal.imageToImage({
        prompt: scene.imagePrompt,
        imageUrl: previousImageUrl,
        strength: 0.65,
        aspectRatio: "16:9",
      });
    }

    const imageUrl = result.images?.[0]?.url || result.images?.[0];
    previousImageUrl = imageUrl;

    keyframes.push({ sceneId: scene.id, imageUrl, seed: result.seed });
    console.log(`  -> ${imageUrl}\n`);
  }

  // ── PHASE 2: Voiceover (ElevenLabs) ──────────────────────────
  console.log("━━━ Phase 2/3: Voiceover (ElevenLabs) ━━━\n");

  await elevenlabs.findVoice("deep-authoritative");

  const voiceover = await elevenlabs.textToSpeech({
    text: FULL_VOICEOVER,
    preset: "deep-authoritative",
    outputPath: join(OUTPUT_DIR, "voiceover.mp3"),
  });

  console.log(`  -> Saved: ${voiceover.path} (${voiceover.size} bytes)\n`);

  // ── PHASE 3: Video Clips (Kling 3.0) ─────────────────────────
  console.log("━━━ Phase 3/3: Video Clips (Kling 3.0) ━━━\n");
  console.log("  Note: Each clip takes ~1-2 min to generate...\n");

  const videoClips = [];

  for (let i = 0; i < keyframes.length; i++) {
    const scene = SCENES[i];
    const kf = keyframes[i];

    console.log(`[VID] ${scene.id}: ${scene.description} (${scene.duration}s)`);

    // Kling 3.0 uses the motion prompt to guide video generation
    const result = await kling.imageToVideo({
      imageUrl: kf.imageUrl,
      prompt: scene.motionPrompt,
      duration: scene.duration,
      preferredModel: "kling-3.0",
      aspectRatio: "16:9",
    });

    const videoUrl = result.video?.url;
    videoClips.push({
      sceneId: scene.id,
      videoUrl,
      duration: scene.duration,
      model: result.modelUsed?.name,
    });

    console.log(`  -> ${videoUrl}\n`);
  }

  // ── OUTPUT: Manifest ──────────────────────────────────────────
  console.log("━━━ Final Output ━━━\n");

  const manifest = {
    project: "wegel.cloud Social Media Ad",
    brand: {
      name: "wegel.cloud",
      claim: "Moderne IT ohne Ballast",
      tagline: "Ihre IT. Persönlich betreut.",
      colors: {
        primary: "#0A0A0A",
        accent: "#3B82F6",
        text: "#FFFFFF",
      },
    },
    totalDuration: "17s",
    aspectRatio: "16:9",
    scenes: SCENES.map((s, i) => ({
      id: s.id,
      duration: `${s.duration}s`,
      description: s.description,
      narration: s.narration,
      keyframeUrl: keyframes[i]?.imageUrl,
      videoUrl: videoClips[i]?.videoUrl,
      videoModel: videoClips[i]?.model,
    })),
    voiceover: {
      text: FULL_VOICEOVER,
      path: voiceover.path,
      size: voiceover.size,
      preset: "deep-authoritative",
    },
    remotionConfig: {
      compositionId: "WegelCloudAd",
      fps: 30,
      width: 1920,
      height: 1080,
      durationInFrames: 510,
    },
  };

  const manifestPath = join(OUTPUT_DIR, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║              PRODUCTION COMPLETE                 ║");
  console.log("╚══════════════════════════════════════════════════╝\n");
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Assets:   ${OUTPUT_DIR}\n`);

  console.log("── Video Clips ──");
  for (const clip of videoClips) {
    console.log(`  ${clip.sceneId} (${clip.duration}s, ${clip.model}): ${clip.videoUrl}`);
  }

  console.log("\n── Voiceover ──");
  console.log(`  ${voiceover.path} (${voiceover.size} bytes)`);

  console.log("\n── Keyframes ──");
  for (const kf of keyframes) {
    console.log(`  ${kf.sceneId}: ${kf.imageUrl}`);
  }
}

main().catch((err) => {
  console.error("\nProduction failed:", err.message || err);
  process.exit(1);
});
