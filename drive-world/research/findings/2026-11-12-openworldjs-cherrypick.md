# OpenWorldJS cherry-pick (2026-11-12)

Upstream: https://github.com/obecerra3/OpenWorldJS (ISC).

Integrated into City Nights (PlayCanvas):

- Bitmask maze at Vallejo yard (`maze.bin`, wall merger, static colliders)
- Ground snap helper for traffic/drones
- Animation state ids for future on-foot / hero clips
- Debug command bar (`?openworldDebug=1` or `?cnDebug=1`)

Full file-by-file disposition: `docs/third-party/OPENWORLDJS_FILEMAP.md`.

Skipped: vendored Three.js, GPGPU terrain, PHP multiplayer, Mixamo assets.

Test: `npm run test:openworldjs`
