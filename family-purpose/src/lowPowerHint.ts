import { isLikelyLowPowerDevice } from "./yieldMain";

export const PDF_PREP_HINT = isLikelyLowPowerDevice()
  ? "On older Chromebooks the first PDF can take a few seconds — the screen may look frozen briefly."
  : null;
