import { BaseAgent } from "./base-agent.js";

/**
 * ComposerAgent — assembles all individual assets (video clips, voiceover,
 * music, SFX) into a final composed version with a complete timeline.
 */
export class ComposerAgent extends BaseAgent {
  constructor() {
    super("ComposerAgent", "video");
  }

  async plan(brief) {
    return {
      steps: [
        "Collect all video, audio, and text assets",
        "Build master timeline",
        "Layer audio tracks (voiceover, music, SFX)",
        "Render final composition",
      ],
    };
  }

  async execute(plan, brief) {
    const allAssets = brief.dependencies?.allAssets || [];

    const clips = allAssets.filter((a) => a.type === "video-clip");
    const voiceovers = allAssets.filter((a) => a.type === "voiceover");
    const music = allAssets.filter((a) => a.type === "background-music");
    const sfx = allAssets.filter((a) => a.type === "sound-effect");

    this.log.step(1, 3, "Building master timeline...");
    const timeline = this.buildTimeline(clips, voiceovers, music, sfx);

    this.log.step(2, 3, "Layering audio tracks...");
    const audioMix = this.mixAudio(voiceovers, music, sfx);

    this.log.step(3, 3, "Rendering final composition...");
    const composition = {
      id: "FINAL-COMP",
      totalDuration: timeline.totalDuration,
      resolution: "1920x1080",
      fps: 24,
      timeline,
      audioMix,
      exportFormats: ["mp4", "mov"],
    };

    return [
      { type: "final-composition", format: "json", content: composition },
      { type: "timeline", format: "json", content: timeline },
    ];
  }

  buildTimeline(clips, voiceovers, music, sfx) {
    let currentTime = 0;
    const entries = [];

    clips.forEach((clip, i) => {
      const duration = this.parseDuration(clip.content?.duration || "3s");
      entries.push({
        track: "video",
        id: clip.content?.clipId || `CLIP-${i + 1}`,
        startTime: `${currentTime}s`,
        duration: `${duration}s`,
      });

      if (voiceovers[i]) {
        entries.push({
          track: "voiceover",
          id: voiceovers[i].content?.segmentId || `VO-${i + 1}`,
          startTime: `${currentTime}s`,
          duration: `${duration}s`,
        });
      }

      const matchingSfx = sfx.filter(
        (s) => s.content?.shotRef === (clip.content?.keyframeRef || `KF-${i + 1}`)
      );
      matchingSfx.forEach((s) => {
        entries.push({
          track: "sfx",
          id: s.content?.sfxId,
          startTime: `${currentTime + this.parseDuration(s.content?.timing || "0s")}s`,
          duration: s.content?.duration || "1s",
        });
      });

      currentTime += duration;
    });

    if (music.length > 0) {
      entries.push({
        track: "music",
        id: "BGM-1",
        startTime: "0s",
        duration: `${currentTime}s`,
      });
    }

    return { totalDuration: `${currentTime}s`, entries };
  }

  mixAudio(voiceovers, music, sfx) {
    return {
      tracks: [
        { name: "voiceover", volume: 1.0, count: voiceovers.length },
        { name: "music", volume: 0.3, count: music.length },
        { name: "sfx", volume: 0.7, count: sfx.length },
      ],
      masterVolume: 1.0,
      normalization: true,
    };
  }

  parseDuration(str) {
    return parseFloat(str) || 3;
  }
}
