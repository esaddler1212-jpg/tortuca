"""Compatibility fixes Alfred applies to OpenJarvis at startup.

Loaded by the ``zzz_alfred_tts.pth`` startup hook (with the voice plugins), so
OpenJarvis's own files stay untouched and updates don't undo the fix.

1. Claude rejects ``temperature`` (HTTP 400: "temperature: Extra inputs are not
   permitted"). The current Anthropic SDK (2.x) talks to API version 2026-10-21,
   which no longer takes sampling parameters, but OpenJarvis still injects
   ``temperature`` via ``extra_body`` for any Claude model missing from its
   hard-coded ``_ANTHROPIC_FIXED_SAMPLING_PREFIXES``. Widen that list to every
   Claude model. All three Anthropic call sites read this module global.

The patch is applied lazily, right after ``openjarvis.engine.cloud`` is first
imported, so Python startup stays fast and nothing else is touched.
"""

from __future__ import annotations

import importlib.abc
import importlib.util
import sys

_TARGET = "openjarvis.engine.cloud"


def _patch_cloud(module) -> None:
    prefixes = tuple(getattr(module, "_ANTHROPIC_FIXED_SAMPLING_PREFIXES", ()))
    if "claude" not in prefixes:
        module._ANTHROPIC_FIXED_SAMPLING_PREFIXES = prefixes + ("claude",)


class _PatchAfterImport(importlib.abc.MetaPathFinder):
    """One-shot finder: lets the normal import run, then applies the patch."""

    def find_spec(self, name, path=None, target=None):
        if name != _TARGET:
            return None
        sys.meta_path.remove(self)  # one-shot; also prevents recursion below
        spec = importlib.util.find_spec(name)
        if spec is None or spec.loader is None or not hasattr(spec.loader, "exec_module"):
            return spec
        original_exec = spec.loader.exec_module

        def exec_module(module):
            original_exec(module)
            _patch_cloud(module)

        spec.loader.exec_module = exec_module
        return spec


def _install() -> None:
    if _TARGET in sys.modules:
        _patch_cloud(sys.modules[_TARGET])
    elif not any(isinstance(f, _PatchAfterImport) for f in sys.meta_path):
        sys.meta_path.insert(0, _PatchAfterImport())


_install()
