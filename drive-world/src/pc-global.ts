import {
  Entity,
  KEY_A,
  KEY_D,
  KEY_DOWN,
  KEY_LEFT,
  KEY_RIGHT,
  KEY_S,
  KEY_UP,
  KEY_W,
  createScript,
  math,
  platform
} from 'playcanvas';

// public/scripts/vehicle.js is a classic PlayCanvas script that reads the `pc` global.
// Keep this list in sync with the `pc.*` names it uses; a full namespace import defeats tree-shaking.
(globalThis as unknown as { pc: Record<string, unknown> }).pc = {
  Entity,
  KEY_A,
  KEY_D,
  KEY_DOWN,
  KEY_LEFT,
  KEY_RIGHT,
  KEY_S,
  KEY_UP,
  KEY_W,
  createScript,
  math,
  platform
};
