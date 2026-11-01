"""Fish Audio text-to-speech backend for OpenJarvis (Alfred's voice).

Registers the TTS backend key "fish". personalize.sh installs this file into the
OpenJarvis virtualenv together with a one-line ``zzz_alfred_fish_tts.pth``
(named so it runs after OpenJarvis's own .pth path entries). Python runs that ``.pth`` at startup, so the backend is registered in every ``jarvis``
process without editing OpenJarvis's own files, and survives ``git pull``
updates of OpenJarvis.

Environment (set in ~/.zshrc on the iMac, never in the repo):
  FISH_API_KEY        required
  FISH_VOICE_ID       optional Fish Audio voice model id (``reference_id``)
  FISH_MODEL          optional model header, default "s2.1-pro-free"

Startup cost is kept near zero: only the tiny registry module is imported
eagerly; httpx and OpenJarvis's speech types load on first synthesis.
"""

from __future__ import annotations

import os
from typing import Any, List

_API_URL = "https://api.fish.audio/v1/tts"
_DEFAULT_MODEL = "s2.1-pro-free"
_FORMATS = {"mp3", "wav", "pcm", "opus"}


def _clean_key(value: str) -> str:
    key = value.strip()
    if any(not 33 <= ord(ch) <= 126 for ch in key):
        # Never echo the credential.
        raise ValueError("FISH_API_KEY contains unsupported characters")
    return key


class FishAudioTTSBackend:
    """Fish Audio REST TTS. Implements OpenJarvis's TTSBackend interface."""

    backend_id = "fish"

    def __init__(self, *, api_key: str = "", model: str = "", voice_id: str = "") -> None:
        self._api_key = _clean_key(api_key or os.environ.get("FISH_API_KEY", ""))
        self._model = model or os.environ.get("FISH_MODEL", "") or _DEFAULT_MODEL
        self._voice_id = voice_id or os.environ.get("FISH_VOICE_ID", "")
        self._api_url = os.environ.get("FISH_API_URL", "") or _API_URL  # tests only

    def synthesize(
        self,
        text: str,
        *,
        voice_id: str = "",
        speed: float = 1.0,
        output_format: str = "mp3",
    ) -> Any:
        import httpx

        from openjarvis.speech.tts import TTSResult

        if not self._api_key:
            raise RuntimeError("FISH_API_KEY not set")
        fmt = output_format if output_format in _FORMATS else "mp3"
        # Voice ids from other backends (Kokoro "bm_george", ElevenLabs ids)
        # are meaningless to Fish; only use one that came from Fish config.
        voice = self._voice_id if not voice_id or "_" in voice_id else voice_id

        body: dict[str, Any] = {"text": text, "format": fmt}
        if voice:
            body["reference_id"] = voice
        if speed and speed != 1.0:
            body["prosody"] = {"speed": max(0.5, min(2.0, float(speed)))}

        try:
            resp = httpx.post(
                self._api_url,
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                    "model": self._model,
                },
                json=body,
                timeout=120.0,
            )
            resp.raise_for_status()
            audio = resp.content
        except httpx.HTTPStatusError as exc:
            raise RuntimeError(
                f"Fish Audio request failed (HTTP {exc.response.status_code})"
            ) from None
        except Exception as exc:
            # Keep the error category, never headers/body that carry the key.
            raise RuntimeError(f"Fish Audio request failed ({type(exc).__name__})") from None

        if not audio:
            raise RuntimeError("Fish Audio returned no audio")

        return TTSResult(
            audio=audio,
            format=fmt,
            voice_id=voice,
            sample_rate=44100,
            metadata={"backend": "fish", "model": self._model},
        )

    def available_voices(self) -> List[str]:
        return [self._voice_id] if self._voice_id else []

    def health(self) -> bool:
        return bool(self._api_key)


def _register() -> None:
    try:
        from openjarvis.core.registry import TTSRegistry
    except Exception:
        return  # OpenJarvis not importable in this interpreter; do nothing
    if not TTSRegistry.contains("fish"):
        TTSRegistry.register_value("fish", FishAudioTTSBackend)


_register()
