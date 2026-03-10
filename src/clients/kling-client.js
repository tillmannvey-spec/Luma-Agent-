/**
 * Kling Video API Client
 *
 * Supports Kling 2.6, 3.0, and 3.0 Omni via fal.ai.
 *
 * Model selection logic (cheapest first):
 *   - Kling 2.6: Default, cheapest. No lip-sync support.
 *   - Kling 3.0: Mid-tier. Better quality, lip-sync capable.
 *   - Kling 3.0 Omni: Premium. Best quality + lip-sync.
 *
 * Required env: FAL_KEY
 */

const FAL_BASE_URL = "https://queue.fal.run";

const KLING_MODELS = {
  "kling-2.6": {
    id: "fal-ai/kling-video/v2",
    name: "Kling 2.6",
    lipSync: false,
    costTier: "low",
    quality: "good",
  },
  "kling-3.0": {
    id: "fal-ai/kling-video/v3",
    name: "Kling 3.0",
    lipSync: true,
    costTier: "medium",
    quality: "high",
  },
  "kling-3.0-omni": {
    id: "fal-ai/kling-video/v3/omni",
    name: "Kling 3.0 Omni",
    lipSync: true,
    costTier: "high",
    quality: "best",
  },
};

export class KlingClient {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.FAL_KEY;
    if (!this.apiKey) {
      console.warn("[KlingClient] No FAL_KEY set — running in dry-run mode");
    }
  }

  /**
   * Select the cheapest suitable Kling model.
   *
   * @param {object} options
   * @param {boolean} options.needsLipSync - Whether lip-sync is required
   * @param {string}  options.preferredModel - Force a specific model
   * @returns {object} Model config from KLING_MODELS
   */
  selectModel({ needsLipSync = false, preferredModel } = {}) {
    if (preferredModel && KLING_MODELS[preferredModel]) {
      return KLING_MODELS[preferredModel];
    }

    // Cheapest first: Kling 2.6 if no lip-sync needed
    if (!needsLipSync) {
      return KLING_MODELS["kling-2.6"];
    }

    // Lip-sync needed → Kling 3.0 (cheaper than Omni)
    return KLING_MODELS["kling-3.0"];
  }

  /**
   * Generate video from an image (image-to-video).
   */
  async imageToVideo({
    imageUrl,
    prompt,
    duration = "5s",
    needsLipSync = false,
    preferredModel,
    aspectRatio = "16:9",
  }) {
    const model = this.selectModel({ needsLipSync, preferredModel });

    const payload = {
      prompt,
      image_url: imageUrl,
      duration: this.parseDuration(duration),
      aspect_ratio: aspectRatio,
    };

    const result = await this.submit(model, payload);
    return { ...result, modelUsed: model };
  }

  /**
   * Generate video from text only (text-to-video).
   */
  async textToVideo({
    prompt,
    duration = "5s",
    needsLipSync = false,
    preferredModel,
    aspectRatio = "16:9",
  }) {
    const model = this.selectModel({ needsLipSync, preferredModel });

    const payload = {
      prompt,
      duration: this.parseDuration(duration),
      aspect_ratio: aspectRatio,
    };

    const result = await this.submit(model, payload);
    return { ...result, modelUsed: model };
  }

  async submit(model, payload) {
    if (!this.apiKey) {
      return this.dryRunResult(model, payload);
    }

    const submitRes = await fetch(`${FAL_BASE_URL}/${model.id}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!submitRes.ok) {
      const err = await submitRes.text();
      throw new Error(`Kling submit failed (${submitRes.status}): ${err}`);
    }

    const { request_id, status: initialStatus } = await submitRes.json();

    if (initialStatus === "COMPLETED") {
      return this.fetchResult(model.id, request_id);
    }

    return this.pollResult(model.id, request_id);
  }

  async pollResult(modelId, requestId, maxAttempts = 120) {
    const statusUrl = `${FAL_BASE_URL}/${modelId}/requests/${requestId}/status`;

    for (let i = 0; i < maxAttempts; i++) {
      await this.sleep(5000);

      const res = await fetch(statusUrl, {
        headers: { Authorization: `Key ${this.apiKey}` },
      });

      if (!res.ok) continue;

      const { status } = await res.json();

      if (status === "COMPLETED") {
        return this.fetchResult(modelId, requestId);
      }
      if (status === "FAILED") {
        throw new Error(`Kling request ${requestId} failed`);
      }
    }

    throw new Error(`Kling request ${requestId} timed out`);
  }

  async fetchResult(modelId, requestId) {
    const resultUrl = `${FAL_BASE_URL}/${modelId}/requests/${requestId}`;
    const res = await fetch(resultUrl, {
      headers: { Authorization: `Key ${this.apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Kling result: ${res.status}`);
    }

    return res.json();
  }

  parseDuration(str) {
    const seconds = parseFloat(str) || 5;
    return Math.min(Math.max(seconds, 2), 10);
  }

  dryRunResult(model, payload) {
    return {
      video: {
        url: `[DRY-RUN] ${model.name} — prompt: "${(payload.prompt || "").slice(0, 80)}"`,
      },
      modelUsed: model,
      duration: payload.duration,
    };
  }

  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

export { KLING_MODELS };
