# OpenWorldJS tooling (cherry-picked)

Vendored from [OpenWorldJS](https://github.com/obecerra3/OpenWorldJS) (ISC).

## `genmaze.py`

Converts a 2×2-block-per-cell maze PNG (white = open) into a packed `maze.bin` bitmask.

```bash
python3 tools/openworldjs/genmaze.py path/to/maze.png
```

Output: `maze.bin` next to the PNG. Copy into `drive-world/public/openworldjs/maze.bin` when you change the source art.

Requirements: `pip install pillow numpy bitarray`
