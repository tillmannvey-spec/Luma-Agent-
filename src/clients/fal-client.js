/**
 * fal.ai API Client
 *
 * Handles image generation via fal.ai using Nano Banana 2.
 * Supports both text-to-image and image-to-image for consistency.
 *
 * Pricing: Nano Banana 2 is one of the cheapest options on fal.ai.
 *
 * Required env: FAL_KEY
 */

const FAL_BASE_URL = "https://queue.fal.run";
const NANO_BANANA_MODEL = "fal-ai/fal-media-generator";

export class FalClient {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.FAL_KEY;
    if (!this.apiKey) {
      console.warn("[FalClient] No FAL_KEY set — running in dry-run mode");
    }
  }

  /**
   * Text-to-image generation with Nano Banana 2.
   */
  async textToImage({ prompt, aspectRatio = "16:9", seed }) {
    const payload = {
      prompt,
      image_size: this.aspectToSize(aspectRatio),
      num_images: 1,
    };
    if (seed !== undefined) payload.seed = seed;

    return this.submit(NANO_BANANA_MODEL, payload);
  }

  /**
   * Image-to-image generation for consistency.
   * Takes a previously generated image URL and a new prompt to maintain
   * visual consistency across keyframes.
   */
  async imageToImage({ prompt, imageUrl, strength = 0.65, aspectRatio = "16:9" }) {
    const payload = {
      prompt,
      image_url: imageUrl,
      strength,
      image_size: this.aspectToSize(aspectRatio),
      num_images: 1,
    };

    return this.submit(NANO_BANANA_MODEL, payload);
  }

  /**
   * Submit a request to fal.ai queue and poll for result.
   */
  async submit(model, payload) {
    if (!this.apiKey) {
      return this.dryRunResult(payload);
    }

    const submitRes = await fetch(`${FAL_BASE_URL}/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!submitRes.ok) {
      const err = await submitRes.text();
      throw new Error(`fal.ai submit failed (${submitRes.status}): ${err}`);
    }

    const { request_id, status: initialStatus } = await submitRes.json();

    if (initialStatus === "COMPLETED") {
      return this.fetchResult(model, request_id);
    }

    return this.pollResult(model, request_id);
  }

  async pollResult(model, requestId, maxAttempts = 60) {
    const statusUrl = `${FAL_BASE_URL}/${model}/requests/${requestId}/status`;

    for (let i = 0; i < maxAttempts; i++) {
      await this.sleep(2000);

      const res = await fetch(statusUrl, {
        headers: { Authorization: `Key ${this.apiKey}` },
      });

      if (!res.ok) continue;

      const { status } = await res.json();

      if (status === "COMPLETED") {
        return this.fetchResult(model, requestId);
      }
      if (status === "FAILED") {
        throw new Error(`fal.ai request ${requestId} failed`);
      }
    }

    throw new Error(`fal.ai request ${requestId} timed out`);
  }

  async fetchResult(model, requestId) {
    const resultUrl = `${FAL_BASE_URL}/${model}/requests/${requestId}`;
    const res = await fetch(resultUrl, {
      headers: { Authorization: `Key ${this.apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch result: ${res.status}`);
    }

    return res.json();
  }

  aspectToSize(aspectRatio) {
    const sizes = {
      "16:9": { width: 1280, height: 720 },
      "9:16": { width: 720, height: 1280 },
      "1:1": { width: 1024, height: 1024 },
      "4:3": { width: 1024, height: 768 },
    };
    return sizes[aspectRatio] || sizes["16:9"];
  }

  dryRunResult(payload) {
    return {
      images: [
        {
          url: `[DRY-RUN] fal.ai/nano-banana-2 — prompt: "${(payload.prompt || "").slice(0, 80)}"`,
          width: payload.image_size?.width || 1280,
          height: payload.image_size?.height || 720,
        },
      ],
      seed: 12345,
      prompt: payload.prompt,
    };
  }

  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
