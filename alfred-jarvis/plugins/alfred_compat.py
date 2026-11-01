"""Compatibility fixes Alfred applies to OpenJarvis at startup.

Loaded by the ``zzz_alfred_tts.pth`` startup hook (with the voice plugins), so
OpenJarvis's own files stay untouched and updates don't undo the fixes. Each
patch is applied lazily, right after its OpenJarvis module is first imported,
so Python startup stays fast.

1. ``openjarvis.engine.cloud``: Claude rejects ``temperature`` (HTTP 400:
   "temperature: Extra inputs are not permitted"). The current Anthropic SDK
   (2.x) talks to API version 2026-10-21, which no longer takes sampling
   parameters, but OpenJarvis still injects ``temperature`` via ``extra_body``
   for Claude models missing from its hard-coded
   ``_ANTHROPIC_FIXED_SAMPLING_PREFIXES``. Widen that to every Claude model.

2. ``openjarvis.cli.digest_cmd``: ``jarvis digest`` starts audio playback in a
   daemon thread and then exits, so the briefing is often cut off before any
   sound plays. Launch the player as its own process immediately instead
   (``afplay`` on macOS), so it keeps playing after ``jarvis`` exits.
"""

from __future__ import annotations

import importlib.abc
import importlib.util
import shutil
import subprocess
import sys


def _patch_cloud(module) -> None:
    prefixes = tuple(getattr(module, "_ANTHROPIC_FIXED_SAMPLING_PREFIXES", ()))
    if "claude" not in prefixes:
        module._ANTHROPIC_FIXED_SAMPLING_PREFIXES = prefixes + ("claude",)


def _play_audio_detached(audio_path: str) -> None:
    """Start the first available player as an independent process and return."""
    for player in (["afplay"], ["ffplay", "-nodisp", "-autoexit"], ["aplay"], ["paplay"]):
        if shutil.which(player[0]):
            subprocess.Popen(
                player + [audio_path],
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True,  # survives `jarvis` exiting
            )
            return


class _ImmediateThread:
    """Stand-in for threading.Thread inside digest_cmd: runs the target at
    start() so the (now non-blocking) player is launched before jarvis exits."""

    def __init__(self, target=None, args=(), kwargs=None, **_ignored) -> None:
        self._target, self._args, self._kwargs = target, args, kwargs or {}

    def start(self) -> None:
        if self._target is not None:
            self._target(*self._args, **self._kwargs)

    def join(self, timeout=None) -> None:
        return None


class _ThreadingShim:
    Thread = _ImmediateThread

    def __getattr__(self, name):
        import threading

        return getattr(threading, name)


def _patch_digest_cmd(module) -> None:
    if getattr(module, "_alfred_patched", False):
        return
    module._play_audio = _play_audio_detached
    module.threading = _ThreadingShim()
    module._alfred_patched = True


_PATCHES = {
    "openjarvis.engine.cloud": _patch_cloud,
    "openjarvis.cli.digest_cmd": _patch_digest_cmd,
}


class _PatchAfterImport(importlib.abc.MetaPathFinder):
    """Lets the normal import run, then applies that module's patch."""

    def __init__(self) -> None:
        self._busy: set[str] = set()

    def find_spec(self, name, path=None, target=None):
        patch = _PATCHES.get(name)
        if patch is None or name in self._busy:
            return None
        self._busy.add(name)  # prevent recursion into ourselves
        try:
            spec = importlib.util.find_spec(name)
        finally:
            self._busy.discard(name)
        if spec is None or spec.loader is None or not hasattr(spec.loader, "exec_module"):
            return spec
        original_exec = spec.loader.exec_module

        def exec_module(module):
            original_exec(module)
            patch(module)

        spec.loader.exec_module = exec_module
        return spec


def _install() -> None:
    pending = False
    for name, patch in _PATCHES.items():
        if name in sys.modules:
            patch(sys.modules[name])
        else:
            pending = True
    if pending and not any(isinstance(f, _PatchAfterImport) for f in sys.meta_path):
        sys.meta_path.insert(0, _PatchAfterImport())


_install()
