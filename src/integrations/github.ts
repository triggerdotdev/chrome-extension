import { ContentScriptResponse } from "./@types";

const REGEX =
  /github\.com\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+)\/blob\/([A-Za-z0-9_-]+)\/([A-Za-z0-9-_\/.]+)/;

export function tryGitHub(): Array<ContentScriptResponse> | undefined {
  const match = document.location.href.match(REGEX);
  if (!match) {
    return;
  }

  const [, org, repo, branch, path] = match;

  if (!path.endsWith(".json")) {
    return;
  }

  const json = extractJson();

  if (!json) {
    return;
  }

  const title = `${org}/${repo}/${branch}/${path}`;

  return [{ title, json }];
}

function extractJson(): any | undefined {
  const rawJson = Array.from(document.querySelectorAll(".blob-code-inner"))
    .map((n) => (n as HTMLElement).innerText)
    .join("");

  try {
    return JSON.parse(rawJson);
  } catch (e) {
    return;
  }
}
