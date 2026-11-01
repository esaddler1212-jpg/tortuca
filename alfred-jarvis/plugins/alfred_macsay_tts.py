"""Free, offline text-to-speech for OpenJarvis using macOS's built-in ``say``.

Registers the TTS backend key "macsay". No API key, no account, nothing leaves
the Mac. Works on every macOS version Alfred supports, including Catalina.

Installed by personalize.sh next to alfred_fish_tts.py and loaded by the same
``zzz_alfred_tts.pth`` startup hook.

Environment (optional, set in ~/.zshrc):
  MACSAY_VOICE   voice name, default "Daniel" (British). List voices: say -v '?'
  MACSAY_RATE    words per minute at speed 1.0, default 180
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any, List

_DEFAULT_VOICE = "Daniel"
_DEFAULT_RATE = 180
_SAMPLE_RATE = 22050


class MacSayTTSBackend:
    """macOS ``say`` TTS. Implements OpenJarvis's TTSBackend interface."""

    backend_id = "macsay"

    def __init__(self, *, voice_id: str = "") -> None:
        self._voice = voice_id or os.environ.get("MACSAY_VOICE", "") or _DEFAULT_VOICE
        try:
            self._rate = int(os.environ.get("MACSAY_RATE", "") or _DEFAULT_RATE)
        except ValueError:
            self._rate = _DEFAULT_RATE

    def _say(self, text: str, out: Path, voice: str, rate: int) -> subprocess.CompletedProcess:
        cmd = [
            "say",
            "-r", str(rate),
            "-o", str(out),
            "--file-format=WAVE",
            f"--data-format=LEI16@{_SAMPLE_RATE}",
        ]
        if voice:
            cmd[1:1] = ["-v", voice]
        # Text goes in on stdin so it can't be misread as a flag.
        return subprocess.run(cmd, input=text, text=True, capture_output=True, timeout=300)

    def synthesize(
        self,
        text: str,
        *,
        voice_id: str = "",
        speed: float = 1.0,
        output_format: str = "wav",
    ) -> Any:
        from openjarvis.speech.tts import TTSResult

        if not self.health():
            raise RuntimeError("macOS 'say' is not available on this machine")
        # Voice ids from other backends (Kokoro "bm_george", Fish/ElevenLabs ids)
        # mean nothing to `say`; only accept plain names like "Daniel".
        voice = voice_id if voice_id and voice_id.replace(" ", "").isalpha() else self._voice
        rate = max(90, min(400, int(self._rate * (speed or 1.0))))

        with tempfile.TemporaryDirectory(prefix="alfred-say-") as tmp:
            out = Path(tmp) / "speech.wav"
            proc = self._say(text, out, voice, rate)
            if proc.returncode != 0 and voice:
                # Voice not installed: fall back to the system default voice.
                voice = ""
                proc = self._say(text, out, voice, rate)
            if proc.returncode != 0 or not out.exists():
                raise RuntimeError(f"say failed (exit {proc.returncode})")
            audio = out.read_bytes()

        return TTSResult(
            audio=audio,
            format="wav",
            voice_id=voice or "system-default",
            sample_rate=_SAMPLE_RATE,
            metadata={"backend": "macsay", "rate_wpm": rate},
        )

    def available_voices(self) -> List[str]:
        if not self.health():
            return []
        proc = subprocess.run(["say", "-v", "?"], capture_output=True, text=True, timeout=30)
        return [line.split("  ")[0].strip() for line in proc.stdout.splitlines() if line.strip()]

    def health(self) -> bool:
        return sys.platform == "darwin" and shutil.which("say") is not None


def _register() -> None:
    try:
        from openjarvis.core.registry import TTSRegistry
    except Exception:
        return
    if not TTSRegistry.contains("macsay"):
        TTSRegistry.register_value("macsay", MacSayTTSBackend)


_register()
