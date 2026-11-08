#!/usr/bin/env npx tsx
import { existsSync } from 'node:fs';

const required = [
  'docs/UPSTREAM_GAME_TOOLCHAIN.md',
  'tools/ace-step/README.md',
  'tools/ace-step/CHERRY_PICK.md',
  'tools/ace-step/bootstrap.sh',
  'tools/unreal-claude/README.md',
  'tools/unreal-claude/CHERRY_PICK.md',
  'tools/unreal-claude/bootstrap.sh',
  'tools/claude-code-game-studios/README.md',
  'tools/claude-code-game-studios/CHERRY_PICK.md',
  'tools/claude-code-game-studios/bootstrap.sh',
  'tools/audio2face-3d/README.md',
  'tools/audio2face-3d/CHERRY_PICK.md',
  'tools/audio2face-3d/bootstrap.sh',
  'drive-world/CLAUDE.md'
];

for (const p of required) {
  if (!existsSync(p)) {
    console.error(`✗ missing ${p}`);
    process.exit(1);
  }
}

console.log(`✓ upstream game toolchain docs (${required.length} paths)`);
