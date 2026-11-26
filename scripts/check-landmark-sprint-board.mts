import {
  SPRINT_BOARD_MAX,
  formatSprintBoardLine,
  recordLandmarkSprintBoard,
} from '../drive-world/src/landmark-sprint-board.ts';
import type { SavedProgress } from '../drive-world/src/game-progress.ts';

let failed = false;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? '✓' : '✗'} ${name}`);
  if (!cond) failed = true;
};

const base = { version: 9 } as SavedProgress;
let p = recordLandmarkSprintBoard(base, 'freeway-i80-east', 5000);
p = recordLandmarkSprintBoard(p, 'freeway-i80-east', 4500);
p = recordLandmarkSprintBoard(p, 'freeway-i80-east', 4800);
p = recordLandmarkSprintBoard(p, 'freeway-i80-east', 6000);
const board = p.landmarkSprintTop3?.['freeway-i80-east'] ?? [];
ok('keeps best three', board.length === SPRINT_BOARD_MAX);
ok('sorted ascending', board[0] === 4500 && board[2] === 5000);
ok('format board', formatSprintBoardLine(board).includes('4.5s'));

if (failed) process.exitCode = 1;
else console.log('check-landmark-sprint-board: ok');