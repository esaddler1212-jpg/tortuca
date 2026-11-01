/** Ask the settings drawer to open (it owns its own open state). */
export const OPEN_SETTINGS_EVENT = "alfred:open-settings";

export function openSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}
