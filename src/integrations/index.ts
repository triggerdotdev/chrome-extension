import { ContentScriptResponse } from "./@types";
import { tryFirestoreConsole } from "./firestore";
import { tryGitHub } from "./github";
import { tryOpenGraph } from "./openGraph";

export async function tryThirdPartyIntegrations(): Promise<
  Array<ContentScriptResponse> | undefined
> {
  // Check to see if they are on the firestore console by matching the document.location.href against the regex
  if (
    document.location.href.match(
      /console\.firebase\.google\.com\/project\/([A-Z-a-z0-9]+)\/firestore\/data\/(.*)/
    )
  ) {
    console.log("[content-script] firestore console detected");

    return await tryFirestoreConsole();
  }

  const github = tryGitHub();

  if (github) {
    console.log("[content-script] github detected");

    return github;
  }

  return tryOpenGraph();
}
