import statusJson from "../../shared/game-finish-status.json";
import {
  type GameFinishStatusFile,
  gameFinishContextForAsk,
  gameFinishTeamBlurb,
} from "../../shared/gameFinishProgram";

const status = statusJson as GameFinishStatusFile;

export function gameFinishForAskExtra(): string {
  return gameFinishContextForAsk(status);
}

export function gameFinishTeamSummary(): string {
  return gameFinishTeamBlurb(status);
}

export function gameFinishStatus(): GameFinishStatusFile {
  return status;
}
