import { Settings } from "./integrations/@types";

export async function getSettings(): Promise<Settings> {
  const settings = await chrome.storage.sync.get([
    "theme",
    "serverUrl",
    "autoMode",
    "defaultView",
  ]);

  return settings;
}
