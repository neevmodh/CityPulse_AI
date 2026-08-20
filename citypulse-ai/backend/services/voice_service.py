"""Optional multilingual voice processing with a safe demo fallback."""
from __future__ import annotations

import os
from typing import Any

try:
    import whisper
except ImportError:
    whisper = None

_MODEL = None


def transcribe(audio_path: str, language: str = "auto", fallback_text: str = "") -> dict[str, Any]:
    """Transcribe audio when Whisper is installed, otherwise preserve typed text."""
    global _MODEL
    if whisper is not None:
        try:
            if _MODEL is None:
                _MODEL = whisper.load_model(os.getenv("WHISPER_MODEL", "tiny"))
            options = {} if language == "auto" else {"language": language}
            result = _MODEL.transcribe(audio_path, task="transcribe", **options)
            transcript = str(result.get("text", "")).strip()
            detected = result.get("language", language)
            return {
                "transcript": transcript,
                "transcript_language": detected,
                "translated_text": transcript,
                "processing": "whisper",
            }
        except Exception:
            pass

    return {
        "transcript": fallback_text.strip(),
        "transcript_language": language if language != "auto" else "unknown",
        "translated_text": fallback_text.strip(),
        "processing": "demo-fallback",
    }
