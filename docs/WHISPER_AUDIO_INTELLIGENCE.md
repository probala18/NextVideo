# Audio Intelligence Integration using OpenAI Whisper in NextVideo

## 1. Overview & Purpose

NextVideo integrates an independent **Audio Intelligence Pipeline** powered by **OpenAI Whisper** alongside the existing Computer Vision pipeline (`qwen2.5vl:3b`).

The system transcribes spoken speech, identifies spoken languages, extracts timestamped segment cues, and fuses audio evidence with visual frame observations before generating YouTube metadata (titles, descriptions, tags, chapters).

---

## 2. Model Selection & Architecture

* **Default Model:** `base` (multilingual speech recognition, ~74M parameters)
* **Runtime:** `faster-whisper` (CTranslate2-accelerated inference)
* **Execution Device:** CPU with `int8` quantization
* **Memory Footprint:** ~300MB RAM, zero impact on GPU VRAM (leaving the 4GB RTX 2050 dedicated to vision analysis)
* **Supported Models:** `tiny`, `base`, `small`

### Capabilities and Honest Boundaries

| Capability | Whisper Support | NextVideo Grounding Policy |
| :--- | :---: | :--- |
| **Spoken Dialogue Transcription** | ✅ Yes | Captured verbatim as raw and normalized speech cues |
| **Spoken Language Identification** | ✅ Yes | Extracted with ISO language code and probability |
| **Timestamped Segments** | ✅ Yes | Preserves exact start and end seconds for each cue |
| **Music / Instrument Recognition** | ❌ No | Marked as `no_speech` or music; never fabricates song credits |
| **Artist / Singer Identification** | ❌ No | Never infers singers or composers absent from verifiable text |
| **Sound Event Classification** | ❌ No | Background sounds are not classified as speech |

---

## 3. Installation & Local Windows Setup

### Prerequisites
1. **Python 3.10+** (Python 3.13 tested)
2. **FFmpeg** on system PATH (for 16kHz mono WAV extraction)

### Installing the Local Runtime
Open PowerShell and run:
```powershell
pip install faster-whisper
```

### Verifying Installation
```powershell
python -c "import faster_whisper; print('Faster-Whisper version:', faster_whisper.__version__)"
```

The model weights (`base`) are automatically downloaded from Hugging Face on first execution and cached in `~/.cache/huggingface/hub/`.

---

## 4. Configuration & Environment Variables

Add or modify in `.env.local`:

```env
# Enable or disable local audio intelligence
WHISPER_ENABLED=true

# Model size: tiny, base, or small (default: base)
WHISPER_MODEL=base

# Provider strategy: local (faster-whisper), openai_api, or auto
WHISPER_PROVIDER=local

# Spoken language: auto (automatic detection) or ISO 639-1 code (e.g. en, ta, hi, es)
WHISPER_LANGUAGE=auto

# Processing timeout in milliseconds (default: 120000ms / 2 minutes)
WHISPER_TIMEOUT_MS=120000

# Optional: Path to custom Python executable if not on system PATH
PYTHON_PATH=python

# Optional: OpenAI API fallback for serverless deployments
OPENAI_API_KEY=
```

---

## 5. Local vs. Vercel Production Deployment

* **Local Windows Development:**
  Executes `faster-whisper` on CPU via child process. Full audio extraction and transcription run entirely locally with zero cloud API costs.
* **Vercel Serverless Production:**
  Vercel serverless environments do not package local Python or heavy CTranslate2 binaries. In production (`process.env.VERCEL`), the local provider reports `isAvailable() === false` gracefully.
  * If `OPENAI_API_KEY` is configured, it falls back to the cloud OpenAI Whisper API (`whisper-1`).
  * If no API key is provided, audio status is reported honestly as `status: "unavailable"`. Visual frame analysis continues uninterrupted without pipeline failures.

---

## 6. Audio Analysis States

The pipeline returns strongly typed status states:

* `completed`: Spoken speech was successfully detected and transcribed with timestamps.
* `no_speech`: Audio track is present, but no spoken dialogue was found (e.g., instrumental music, ambient background).
* `no_audio`: Video container does not contain an audio stream (silent video).
* `unavailable`: Whisper runtime/API is not configured or disabled in this environment.
* `failed`: Extraction or transcription encountered an error (logged with details).

---

## 7. Multimodal Evidence Fusion

Visual and audio evidence streams are analyzed independently and fused in `fuseMultimodalEvidence`:

1. **Cross-modal Confirmation:** When visual subjects (e.g. presenter or topic) align with spoken dialogue, topics are marked confirmed.
2. **Contradiction Detection:** If audio discusses coding/software while visuals depict romantic or outdoor scenes, the system records an explicit contradiction and prevents fabricated merged claims.
3. **No Hallucinated Credits:** Audio without speech will never trigger tutorial or walkthrough titles, preserving scene-accurate metadata.

