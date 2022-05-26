import { tryThirdPartyIntegrations } from "./integrations";
import { createNewDocument } from "./services/jsonHero";
import { getSettings } from "./settings";

let autoModeDisabled = false;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    handleContentLoaded();
  });
} else {
  handleContentLoaded();
}

async function handleContentLoaded() {
  const settings = await getSettings();

  if (!settings.autoMode) {
    return;
  }

  if (autoModeDisabled) {
    return;
  }

  const extractedJson = extractJson();

  if (!extractedJson) {
    return;
  }

  if (document.location.href.match(/^https?:\/\/jsonhero\.io/)) {
    return;
  }

  const doc = await createNewDocument(
    document.location.href,
    extractedJson,
    settings.serverUrl
  );

  const jsonHeroUrl = new URL(doc.location);
  jsonHeroUrl.searchParams.append("theme", settings.theme ?? "dark");

  // Replace the contents of body with a single iframe pointing to doc.location
  const iframe = document.createElement("iframe");
  iframe.src = jsonHeroUrl.href;
  iframe.style.position = "fixed";
  iframe.style.top = "0";
  iframe.style.left = "0";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.border = "none";
  iframe.style.width = "100%";
  iframe.style.height = "100%";

  document.body.innerHTML = "";
  document.body.style.margin = "0";
  document.body.style.padding = "0";
  document.body.appendChild(iframe);
}

async function handleAction(sendResponse: (response: any) => void) {
  const extractedJson = extractJson();

  if (extractedJson) {
    sendResponse({
      success: true,
      options: [{ title: document.location.href, json: extractedJson }],
    });

    return;
  }

  const options = await tryThirdPartyIntegrations();

  if (!options) {
    sendResponse({ success: false });
    return;
  }

  sendResponse({
    success: true,
    options,
  });
}

function extractJson() {
  const firstChild = document.body.children[0] as HTMLElement;

  if (!firstChild || firstChild.tagName !== "PRE") {
    return;
  }

  const rawJson = firstChild.innerText;

  try {
    const json = JSON.parse(rawJson);
    return json;
  } catch (error) {
    return;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request && request.action === "disableAutoMode") {
    autoModeDisabled = true;
  } else {
    handleAction(sendResponse);
  }
});
