# Luma Creative Agent Workflow Skill

## Overview

An AI-powered creative production pipeline inspired by [Luma's Creative Agents](https://lumalabs.ai). From a single text prompt, the workflow orchestrates multiple specialized sub-agents running in parallel to produce a comprehensive library of production assets.

## What It Does

Given a creative brief like:
> "Create an ad for a luxury watch brand around the concept of borrowed time"

The skill automatically produces:

| Asset | Agent | Description |
|-------|-------|-------------|
| Script | ScriptAgent | Narrative arc with scenes and dialogue |
| Shot List | ScriptAgent | Detailed camera directions per shot |
| Brand Identity | BrandAgent | Logo direction, color palette, typography, style guide |
| Storyboard | StoryboardAgent | Visual keyframe descriptions with generation prompts |
| Video Clips | VideoAgent | Video for each keyframe (model auto-selected) |
| Voiceover | VoiceoverAgent | Narration segments synced to timeline |
| Background Music | MusicAgent | Contextual score with mood-matched parameters |
| Sound Effects | SFXAgent | Foley, ambient, impact, and transition sounds |
| Final Composition | ComposerAgent | Assembled timeline with layered audio mix |
| QA Report | ReviewAgent | Consistency checks with auto-fix for flagged issues |

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
            Phase 1 ─────────┤ (parallel)
            ┌────────────────┼────────────────┐
            │                │                │
     ┌──────▼──────┐  ┌─────▼──────┐         │
     │ ScriptAgent │  │ BrandAgent │         │
     └──────┬──────┘  └─────┬──────┘         │
            │                │                │
            Phase 2 ─────────┤ (parallel)     │
            ┌───────┬────────┼───────┐        │
            │       │        │       │        │
     ┌──────▼┐ ┌────▼──┐ ┌──▼───┐ ┌─▼──┐    │
     │Story- │ │Voice- │ │Music │ │SFX │    │
     │board  │ │over   │ │Agent │ │    │    │
     └──────┬┘ └────┬──┘ └──┬───┘ └─┬──┘    │
            │       │        │       │        │
            Phase 3 ─────────┤ (sequential)   │
            ┌────────────────┤                │
     ┌──────▼──────┐         │                │
     │ VideoAgent  │         │                │
     └──────┬──────┘         │                │
            │                │                │
            Phase 4 ─────────┤ (sequential)   │
     ┌──────▼──────┐  ┌─────▼──────┐         │
     │  Composer   │──▶  Review    │         │
     │   Agent     │  │   Agent    │         │
     └─────────────┘  └────────────┘
```

## Smart Model Selection

Different models have different specialties. Each agent automatically selects the optimal AI model for its task:

- **Text tasks** → text-generation model (scripts, copy)
- **Image tasks** → image-generation model (storyboards, brand visuals)
- **Video tasks** → video-generation model (cinematic vs. motion variants)
- **Voice tasks** → voice-synthesis model (tone-matched narration)
- **Music tasks** → music-generation model (mood-appropriate scores)
- **SFX tasks** → sfx-generation model (contextual sound design)
- **QA tasks** → vision-analysis model (consistency & defect detection)

## Auto-Review & Fix

The ReviewAgent inspects all produced assets for:
- Missing required asset types
- Aspect ratio inconsistencies across visual assets
- Timing mismatches between voiceover and video
- Visual defects (inconsistent details, artifacts)

Correctable issues are auto-fixed and logged in the QA report.

## Usage

```bash
# Full workflow
node src/index.js --prompt "Create an ad for a luxury watch brand around the concept of borrowed time"

# Dry run (show plan only)
node src/index.js --prompt "Your creative brief" --dry-run

# Custom output directory
node src/index.js --prompt "Your creative brief" --output ./my-output

# Run tests
npm test
```

## CLI Options

| Flag | Default | Description |
|------|---------|-------------|
| `--prompt` | (required) | Creative brief / text prompt |
| `--output` | `./output` | Output directory for assets |
| `--parallel` | `5` | Max concurrent agents |
| `--review` | `true` | Enable auto-review & fix |
| `--dry-run` | `false` | Show execution plan only |

## Project Structure

```
src/
├── index.js              # CLI entry point
├── orchestrator.js        # Multi-phase pipeline coordinator
├── agents/
│   ├── base-agent.js      # Base class for all agents
│   ├── script-agent.js    # Script & shot list generation
│   ├── brand-agent.js     # Brand identity & style guide
│   ├── storyboard-agent.js# Visual keyframe descriptions
│   ├── video-agent.js     # Video clip generation
│   ├── voiceover-agent.js # Voice narration
│   ├── music-agent.js     # Background music & score
│   ├── sfx-agent.js       # Sound effects
│   ├── composer-agent.js  # Final composition assembly
│   └── review-agent.js    # QA, flagging & auto-fix
├── models/
│   └── registry.js        # Model registry & task mapping
├── utils/
│   ├── args.js            # CLI argument parser
│   └── logger.js          # Structured logging
└── tests/
    └── workflow.test.js   # Test suite
```
