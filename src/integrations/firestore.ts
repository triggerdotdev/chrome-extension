import invariant from "tiny-invariant";
import { ContentScriptResponse } from "./@types";

export function tryFirestoreConsole():
  | Array<ContentScriptResponse>
  | undefined {
  console.log(`[content-script] trying firestore console`);

  return getFirestoreDocuments();
}

function getFirestoreTitle() {
  const lastCrumbLink = document.querySelectorAll(".crumb-link")[
    document.querySelectorAll(".crumb-link").length - 1
  ] as HTMLAnchorElement;

  const href = lastCrumbLink.href;
  const matches = href.match(
    /console\.firebase\.google\.com\/project\/([A-Z-a-z0-9]+)\/firestore\/data\/(.*)/
  );

  if (matches && matches.length > 2) {
    return matches[2];
  }
}

function getFirestoreDocuments() {
  return Array.from(document.querySelectorAll(".f7e-field-list"))
    .map((fieldList, index) => {
      return extractFirestoreDocument(fieldList as HTMLElement, index);
    })
    .filter((doc) => doc)
    .reverse() as Array<{ json: any; title: string }>;
}

function extractFirestoreDocument(
  element: HTMLElement,
  index: number
):
  | {
      json: any;
      title: string;
    }
  | undefined {
  const title = getFirestoreTitle();

  if (!title) {
    return;
  }

  const dataTreeNodes = Array.from(element.children)
    .filter((node) => node.tagName === "FS-ANIMATE-CHANGES")
    .map((node) => node.children[0]);

  const json = dataTreeNodes.reduce(
    (acc, node) => ({
      ...acc,
      [extractFirestoreDocumentNodeKey(node)]:
        extractFirestoreDocumentNode(node),
    }),
    {}
  );

  return {
    json,
    title: extractTitle(title, index),
  };

  function extractTitle(title: string, index: number) {
    if (index === 1) {
      return title;
    }

    const titleParts = title.split("/");
    // Remove the last two parts of the title
    return titleParts.slice(0, titleParts.length - 2).join("/");
  }
}

function extractFirestoreDocumentNodeKey(node: Element) {
  const firstDatabaseNode = node.querySelector(".database-node");

  invariant(firstDatabaseNode, "no firstDatabaseNode");

  const keyValueNode = firstDatabaseNode.querySelector(".database-key-value");

  invariant(keyValueNode, "no keyValueNode");

  const keyNode = keyValueNode.querySelector(".database-key");

  return keyNode?.textContent ?? "";
}

function extractFirestoreDocumentNode(node: Element): any {
  const firstDatabaseNode = node.querySelector(".database-node");

  invariant(firstDatabaseNode, "no firstDatabaseNode");

  const firestoreType = firestoreNodeType(firstDatabaseNode);

  switch (firestoreType) {
    case "string": {
      return extractFirestoreString(firstDatabaseNode);
    }
    case "number": {
      return extractFirestoreNumber(firstDatabaseNode);
    }
    case "timestamp": {
      return extractFirestoreTimestamp(firstDatabaseNode);
    }
    case "boolean": {
      return extractFirestoreBoolean(firstDatabaseNode);
    }
    case "map": {
      return extractFirestoreMap(firstDatabaseNode);
    }
    case "array": {
      return extractFirestoreArray(firstDatabaseNode);
    }
    default:
      return undefined;
  }
}

function extractFirestoreMap(node: Element) {
  const childrenNode = node.querySelector(".database-children");

  invariant(childrenNode, "no childrenNode");

  const childrenNodes = Array.from(childrenNode.children).filter(
    (n) => n.tagName === "F7E-DATA-TREE"
  );

  return childrenNodes.reduce(
    (acc, node) => ({
      ...acc,
      [extractFirestoreDocumentNodeKey(node)]:
        extractFirestoreDocumentNode(node),
    }),
    {}
  );
}

function extractFirestoreArray(node: Element) {
  const childrenNode = node.querySelector(".database-children");

  invariant(childrenNode, "no childrenNode");

  const childrenNodes = Array.from(childrenNode.children).filter(
    (n) => n.tagName === "F7E-DATA-TREE"
  );

  return childrenNodes.map(extractFirestoreDocumentNode);
}

function extractFirestoreString(node: Element) {
  const keyValueNode = node.querySelector(".database-key-value");

  invariant(keyValueNode, "no keyValueNode");

  const valueNode = keyValueNode.querySelector(".database-leaf-value");

  invariant(valueNode, "no valueNode");

  const value = valueNode.textContent?.slice(1, -1);

  return value;
}

function extractFirestoreTimestamp(node: Element) {
  const keyValueNode = node.querySelector(".database-key-value");

  invariant(keyValueNode, "no keyValueNode");

  const valueNode = keyValueNode.querySelector(".database-leaf-value");

  invariant(valueNode, "no valueNode");

  const value = valueNode.textContent;

  // May 19, 2022 at 5:09:39 PM UTC+1
  console.log(`[content-script] extractFirestoreTimestamp: ${value}`);

  invariant(value, "no value");

  const matches = value.match(
    /^([A-Za-z]{3}) ([0-9]{1,2}), ([0-9]{4}) at ([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}) ([APM]{2}) UTC(\+[0-9]{1,2})$/
  );

  if (matches && matches.length > 0) {
    const [, month, day, year, hour, minute, second, amPm, timezoneHour] =
      matches;

    const date = new Date(
      Date.parse(
        `${month} ${day} ${year} ${hour}:${minute}:${second} ${amPm} UTC${timezoneHour}`
      )
    );

    if (date) {
      console.log(`[content-script] parsedDate: ${date}`);

      return date.toISOString();
    }
  }

  console.log(`[content-script] fallback date: ${value}`);

  return value;
}

function extractFirestoreNumber(node: Element) {
  const keyValueNode = node.querySelector(".database-key-value");

  invariant(keyValueNode, "no keyValueNode");

  const valueNode = keyValueNode.querySelector(".database-leaf-value");

  invariant(valueNode, "no valueNode");

  const value = Number(valueNode.textContent);

  return value;
}

function extractFirestoreBoolean(node: Element) {
  const keyValueNode = node.querySelector(".database-key-value");

  invariant(keyValueNode, "no keyValueNode");

  const valueNode = keyValueNode.querySelector(".database-leaf-value");

  invariant(valueNode, "no valueNode");

  const value = valueNode.textContent;

  return value === "true";
}

function firestoreNodeType(
  node: Element
):
  | "string"
  | "number"
  | "timestamp"
  | "undefined"
  | "map"
  | "array"
  | "boolean" {
  const classList = Array.from(node.classList);
  const typeClass = classList.find((className) =>
    className.startsWith("type-")
  );
  // Extract the type from the class name
  const result = typeClass ? typeClass.split("-")[1] : "undefined";

  return result as ReturnType<typeof firestoreNodeType>;
}
