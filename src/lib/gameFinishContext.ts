import statusJson from "../../shared/game-finish-status.json";
import tasksJson from "../../shared/game-studio-tasks.json";
import {
  type GameFinishStatusFile,
  gameFinishContextForAsk,
  gameFinishTeamBlurb,
} from "../../shared/gameFinishProgram";
import { type GameStudioTasksFile, gameStudioTasksContextForAsk } from "../../shared/gameStudioTasks";

const status = statusJson as GameFinishStatusFile;
const tasks = tasksJson as GameStudioTasksFile;

export function gameFinishForAskExtra(): string {
  const parts = [gameFinishContextForAsk(status), gameStudioTasksContextForAsk(tasks)].filter(Boolean);
  return parts.join(" ");
}

export function gameFinishTeamSummary(): string {
  return gameFinishTeamBlurb(status);
}

export function gameFinishStatus(): GameFinishStatusFile {
  return status;
}

export function gameStudioTasks(): GameStudioTasksFile {
  return tasks;
}
