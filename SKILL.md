# Luma Creative Agent Workflow Skill

## Overview

An AI-powered creative production pipeline inspired by Luma's Creative Agents. From a single text prompt, the workflow orchestrates multiple specialized sub-agents running in parallel to produce a comprehensive library of production assets.

## Providers & APIs

| Task | Provider | Model | Cost |
|------|----------|-------|------|
| **Images** | fal.ai | Nano Banana 2 (`fal-media-generator`) | Low |
| **Videos** | fal.ai | Kling 2.6 / 3.0 / 3.0 Omni | Low-High |
| **Voice** | ElevenLabs | `eleven_multilingual_v2` | Per-character |
| **Editing** | Remotion | Local render | Free |

### Image Generation (fal.ai Nano Banana 2)
- **First keyframe**: Text-to-image (fresh generation)
- **Subsequent keyframes**: Image-to-image using the previous generated image for **visual consistency** (same style, characters, lighting)
- Strength parameter: 0.65 (balances consistency vs. variation)

### Video Generation (Kling via fal.ai)
- **Kling 2.6**: Default, cheapest. No lip-sync support.
- **Kling 3.0**: Mid-tier. Used when lip-sync is detected.
- **Kling 3.0 Omni**: Premium. Only when explicitly requested.
- **IMPORTANT**: Videos are only generated after user approval (`--approve-videos`)

### Voice (ElevenLabs)
- Uses `eleven_multilingual_v2` model
- Auto-selects voice preset based on brief tone (luxury → deep-authoritative, etc.)
- Requires `ELEVENLABS_API_KEY` environment variable

### Video Editing (Remotion)
- ComposerAgent outputs a Remotion-compatible composition config
- Render with: `npx remotion render src/remotion/index.tsx MainComp out/final.mp4`

## Architecture

```
                    ┌─────────────────┐
                    │   User Prompt   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Orchestrator   │
                    └────────┬────────┘
                             │
        Phase 1 ─────────────┤ (parallel)
        ┌────────────────────┼──────────────────┐
        │                    │                  │
 ┌──────▼──────┐      ┌─────▼──────┐           │
 │ ScriptAgent │      │ BrandAgent │           │
 └──────┬──────┘      └─────┬──────┘           │
        │                    │                  │
        Phase 2 ─────────────┤ (parallel)       │
        ┌──────┬─────────────┼──────┐           │
        │      │             │      │           │
 ┌──────▼───┐ ┌▼─────────┐ ┌▼────┐ ┌▼──┐       │
 │Storyboard│ │Voiceover  │ │Music│ │SFX│       │
 │fal.ai    │ │ElevenLabs │ │     │ │   │       │
 │NanoBan.2 │ │           │ │     │ │   │       │
 └──────┬───┘ └┬──────────┘ └┬────┘ └┬──┘       │
        │      │              │      │           │
        Phase 3 ──────────────┤ [APPROVAL GATE]  │
        ┌─────────────────────┤                  │
 ┌──────▼──────┐              │                  │
 │ VideoAgent  │              │                  │
 │ Kling 2.6/  │              │                  │
 │ 3.0/Omni    │              │                  │
 └──────┬──────┘              │                  │
        │                     │                  │
        Phase 4 ──────────────┤ (sequential)     │
 ┌──────▼──────┐       ┌─────▼──────┐           │
 │  Composer   │──────▶│  Review    │           │
 │  (Remotion) │       │   Agent    │           │
 └─────────────┘       └────────────┘
```

## Setup

```bash
# 1. Set API keys
export FAL_KEY="your_fal_key"
export ELEVENLABS_API_KEY="your_elevenlabs_key"

# 2. Run (without API keys = dry-run mode)
node src/index.js --prompt "Create an ad for a luxury watch brand"
```

## Usage

```bash
# Dry run — show execution plan only
node src/index.js --prompt "Your brief" --dry-run

# Full run — generates images + voice, videos pending approval
node src/index.js --prompt "Your brief"

# With video generation approved
node src/index.js --prompt "Your brief" --approve-videos

# Custom output directory
node src/index.js --prompt "Your brief" --output ./my-output
```

## CLI Options

| Flag | Default | Description |
|------|---------|-------------|
| `--prompt` | (required) | Creative brief / text prompt |
| `--output` | `./output` | Output directory for assets |
| `--approve-videos` | `false` | **Must set to generate videos** (costs money) |
| `--parallel` | `5` | Max concurrent agents |
| `--review` | `true` | Enable auto-review & fix |
| `--dry-run` | `false` | Show execution plan only |

## Environment Variables

| Variable | Required For | Description |
|----------|-------------|-------------|
| `FAL_KEY` | Images + Videos | fal.ai API key |
| `ELEVENLABS_API_KEY` | Voice | ElevenLabs API key |

Without API keys, all agents run in **dry-run mode** (no API calls, simulated results).

## Project Structure

```
src/
├── index.js                  # CLI entry point
├── orchestrator.js            # 4-phase pipeline with approval gate
├── agents/
│   ├── base-agent.js          # Base class for all agents
│   ├── script-agent.js        # Script & shot list generation
│   ├── brand-agent.js         # Brand identity & style guide
│   ├── storyboard-agent.js    # Keyframes via fal.ai Nano Banana 2 (img2img)
│   ├── video-agent.js         # Video via Kling 2.6/3.0 (approval required)
│   ├── voiceover-agent.js     # Voice via ElevenLabs API
│   ├── music-agent.js         # Background music & score
│   ├── sfx-agent.js           # Sound effects
│   ├── composer-agent.js      # Remotion composition config
│   └── review-agent.js        # QA, flagging & auto-fix
├── clients/
│   ├── fal-client.js          # fal.ai API (Nano Banana 2 txt2img/img2img)
│   ├── kling-client.js        # Kling 2.6/3.0/Omni video API
│   └── elevenlabs-client.js   # ElevenLabs TTS API
├── models/
│   └── registry.js            # Provider & model registry
├── utils/
│   ├── args.js                # CLI argument parser
│   └── logger.js              # Structured logging
└── tests/
    └── workflow.test.js       # Test suite
```
