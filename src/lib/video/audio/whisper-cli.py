"""
src/lib/video/audio/whisper-cli.py
Lightweight OpenAI Whisper / Faster-Whisper CLI runner for local CPU inference.
Executes on CPU using int8 quantization to respect 8GB RAM / 4GB VRAM limits.
Outputs structured JSON to stdout.
"""

import sys
import os
import json
import argparse


def transcribe(audio_path, model_name="base", language="auto", temperature=0.0):
    if not os.path.exists(audio_path):
        return {"success": False, "error": f"Audio file not found: {audio_path}"}

    try:
        from faster_whisper import WhisperModel

        lang_arg = None if (not language or language == "auto") else language

        # Run on CPU with int8 quantization (consumes ~300MB memory, zero GPU VRAM impact)
        model = WhisperModel(model_name, device="cpu", compute_type="int8")

        segments_generator, info = model.transcribe(
            audio_path,
            language=lang_arg,
            temperature=temperature,
            beam_size=5,
            word_timestamps=False,
            vad_filter=True, # Voice Activity Detection filter removes silence and hallucinations
        )

        segments = []
        raw_text_parts = []

        for seg in segments_generator:
            text = seg.text.strip()
            if text:
                segments.append({
                    "start": round(seg.start, 2),
                    "end": round(seg.end, 2),
                    "text": text,
                    "confidence": round(seg.avg_logprob, 3) if hasattr(seg, "avg_logprob") else None,
                })
                raw_text_parts.append(text)

        detected_lang = info.language if info and hasattr(info, "language") else None
        prob = round(info.language_probability, 3) if info and hasattr(info, "language_probability") else None

        return {
            "success": True,
            "language": detected_lang,
            "language_probability": prob,
            "duration": round(info.duration, 2) if info and hasattr(info, "duration") else None,
            "segments": segments,
            "text": " ".join(raw_text_parts),
        }

    except Exception as exc:
        return {"success": False, "error": str(exc)}


def main():
    parser = argparse.ArgumentParser(description="Whisper transcription runner")
    parser.add_argument("audio_path", help="Path to input audio file (WAV/MP3)")
    parser.add_argument("--model", default="base", help="Whisper model (tiny, base, small)")
    parser.add_argument("--language", default="auto", help="Spoken language code or auto")
    parser.add_argument("--temperature", type=float, default=0.0, help="Sampling temperature")

    args = parser.parse_args()

    result = transcribe(
        audio_path=args.audio_path,
        model_name=args.model,
        language=args.language,
        temperature=args.temperature,
    )

    print(json.dumps(result))


if __name__ == "__main__":
    main()

