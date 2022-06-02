export type ContentScriptResponse = {
  json: any;
  title?: string;
};

export type Settings = {
  autoMode?: boolean;
  serverUrl?: string;
  theme?: "dark" | "light";
  defaultView?: "column" | "editor" | "tree";
};
