import { createNewDocument } from "./services/jsonHero";
import { getSettings } from "./settings";

let defaultTheme = "dark";
let defaultServerUrl = "https://jsonhero.io";

chrome.runtime.onInstalled.addListener(async function () {
  console.log("onInstalled: Setting default settings");

  await chrome.storage.sync.set({
    theme: defaultTheme,
    serverUrl: defaultServerUrl,
    autoMode: false,
    defaultView: "column",
  });
});

chrome.action.onClicked.addListener(async function (tab) {
  console.log(`[background] onClicked: ${tab.id}`);

  if (!tab.id) {
    return;
  }

  chrome.tabs.sendMessage(
    tab.id,
    { action: "extractJson" },
    async (response) => {
      console.log(
        `[background] response after clicked: ${JSON.stringify(response)}`
      );

      const { options, success } = response;

      if (!success) {
        return;
      }

      const { title, json } = options[0];

      const settings = await getSettings();

      console.log(`[background] creating doc with title: ${title}`);

      const doc = await createNewDocument(title, json, settings.serverUrl);

      console.log(`[background] doc: ${JSON.stringify(doc)}`);

      const jsonHeroUrl = new URL(doc.location);

      jsonHeroUrl.searchParams.append("theme", settings.theme ?? "dark");

      if (settings?.defaultView !== "column") {
        jsonHeroUrl.pathname =
          jsonHeroUrl.pathname + "/" + settings.defaultView;
      }

      // Open the new tab
      chrome.tabs.create({
        url: jsonHeroUrl.href,
        openerTabId: tab.id,
        active: true,
      });
    }
  );
});

chrome.webRequest.onHeadersReceived.addListener(
  (h) => {
    h.responseHeaders?.forEach((e, i) => {
      if (e.name.toLowerCase() === "content-security-policy") {
        console.log(`[content-script]${h.url} CSP: ${e.value}`);

        if (e.value?.match(/sandbox/)) {
          chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
              // since only one tab should be active and in the current window at once
              // the return variable should only have one entry
              let activeTab = tabs[0];
              let activeTabId = activeTab.id; // or do whatever you need

              if (activeTabId) {
                chrome.tabs.sendMessage(activeTabId, {
                  action: "disableAutoMode",
                });
              }
            }
          );
        }
      }
    });
  },
  { urls: ["*://*/*"] },
  ["responseHeaders"]
);
