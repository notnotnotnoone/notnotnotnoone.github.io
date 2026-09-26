export type PageId =
  | "overview"
  | "providers"
  | "models"
  | "buckets"
  | "requests"
  | "playground"
  | "status"
  | "allowance"
  | "settings";

/** The 2.3 dashboard menu (Status replaces What's broken and Error brain). */
export const PAGES: { id: PageId; label: string; group: "The router" | "Traffic" | "System" }[] = [
  { id: "overview", label: "Overview", group: "The router" },
  { id: "providers", label: "Providers & keys", group: "The router" },
  { id: "models", label: "Models", group: "The router" },
  { id: "buckets", label: "Buckets", group: "The router" },
  { id: "requests", label: "Requests", group: "Traffic" },
  { id: "playground", label: "Playground", group: "Traffic" },
  { id: "status", label: "Status", group: "Traffic" },
  { id: "allowance", label: "Allowance", group: "Traffic" },
  { id: "settings", label: "Settings", group: "System" },
];
