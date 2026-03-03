export type SteamIdType = "steam3" | "steam2_new" | "steam2_old";

export interface Server {
  url: string;
  selector: string;
  selectorIndex: number;
  example: string;
  domain: string;
  steamIdType?: SteamIdType;
  selectorText?: string;
  country?: string;
  region?: string;
  version?: string;
}

export interface ServersData {
  servers: Server[];
}

export type BanResult =
  | "Banned"
  | "Not banned"
  | "loading"
  | "error"
  | "fail";

export interface SearchItem {
  domain: string;
  url: string | null;
  status: string | null;
  result: string | null;
}

export interface PerformFetchOptions {
  url: string;
  xpath: string;
  selectorIndex: number;
  selectorText?: string;
}

export type TestResult = "pass" | "fail";
