import { BaseAgent } from "./base-agent.js";

/**
 * ComposerAgent — generates a Remotion project config for video editing.
 *
 * Instead of in-memory composition, this agent produces:
 *   1. A Remotion composition config (timeline, clips, audio layers)
 *   2. A render command for the final output
 *
 * Render with:
 *   npx remotion render src/remotion/index.tsx MainComp out/final.mp4
 */
export class ComposerAgent extends BaseAgent {
  constructor() {
    super("ComposerAgent", "video");
  }

  async plan(brief) {
    return {
      steps: [
        "Collect all video, audio, and text assets",
        "Build Remotion composition config",
        "Generate timeline with transitions",
        "Output render-ready Remotion project",
      ],
    };
  }

  async execute(plan, brief) {
    const allAssets = brief.dependencies?.allAssets || [];

    const clips = allAssets.filter((a) => a.type === "video-clip");
    const voiceovers = allAssets.filter((a) => a.type === "voiceover");
    const music = allAssets.filter((a) => a.type === "background-music");
    const sfx = allAssets.filter((a) => a.type === "sound-effect");

    this.log.step(1, 3, "Building Remotion timeline...");
    const timeline = this.buildTimeline(clips, voiceovers, music, sfx);

    this.log.step(2, 3, "Generating Remotion config...");
    const remotionConfig = this.generateRemotionConfig(timeline, clips);

    this.log.step(3, 3, "Remotion project ready for render");

    return [
      { type: "remotion-config", format: "json", content: remotionConfig },
      { type: "timeline", format: "json", content: timeline },
    ];
  }

  buildTimeline(clips, voiceovers, music, sfx) {
    const fps = 30;
    let currentFrame = 0;
    const entries = [];

    clips.forEach((clip, i) => {
      const durationSec = this.parseDuration(clip.content?.duration || "5s");
      const durationFrames = Math.round(durationSec * fps);

      entries.push({
        track: "video",
        id: clip.content?.clipId || `CLIP-${i + 1}`,
        src: clip.content?.videoUrl || null,
        startFrame: currentFrame,
        durationFrames,
        durationSec,
      });

      if (voiceovers[i]) {
        entries.push({
          track: "voiceover",
          id: voiceovers[i].content?.segmentId || `VO-${i + 1}`,
          src: voiceovers[i].content?.audio?.path || null,
          startFrame: currentFrame,
          durationFrames,
          volume: 1.0,
        });
      }

      const matchingSfx = sfx.filter(
        (s) => s.content?.shotRef === (clip.content?.keyframeRef || `KF-${i + 1}`)
      );
      matchingSfx.forEach((s) => {
        const sfxOffset = this.parseDuration(s.content?.timing || "0s");
        entries.push({
          track: "sfx",
          id: s.content?.sfxId,
          startFrame: currentFrame + Math.round(sfxOffset * fps),
          durationFrames: Math.round(this.parseDuration(s.content?.duration || "1s") * fps),
          volume: 0.7,
        });
      });

      currentFrame += durationFrames;
    });

    if (music.length > 0) {
      entries.push({
        track: "music",
        id: "BGM-1",
        startFrame: 0,
        durationFrames: currentFrame,
        volume: 0.3,
      });
    }

    return { fps, totalFrames: currentFrame, totalDuration: `${currentFrame / fps}s`, entries };
  }

  generateRemotionConfig(timeline, clips) {
    return {
      compositionId: "MainComp",
      fps: timeline.fps,
      width: 1920,
      height: 1080,
      durationInFrames: timeline.totalFrames,
      sequences: timeline.entries.map((entry) => ({
        id: entry.id,
        track: entry.track,
        from: entry.startFrame,
        durationInFrames: entry.durationFrames,
        src: entry.src || null,
        volume: entry.volume,
      })),
      transitions: this.generateTransitions(clips, timeline.fps),
      renderCommand: "npx remotion render src/remotion/index.tsx MainComp out/final.mp4",
    };
  }

  generateTransitions(clips, fps) {
    const transitions = [];
    for (let i = 0; i < clips.length - 1; i++) {
      transitions.push({
        from: clips[i].content?.clipId || `CLIP-${i + 1}`,
        to: clips[i + 1]?.content?.clipId || `CLIP-${i + 2}`,
        type: i === 0 ? "fade" : "cut",
        durationFrames: Math.round(0.5 * fps),
      });
    }
    return transitions;
  }

  parseDuration(str) {
    return parseFloat(str) || 5;
  }
}
