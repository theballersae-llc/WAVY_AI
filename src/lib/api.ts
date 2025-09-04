// src/lib/api.ts

/**
 * API base resolution:
 * - DEV (npm run dev): default to "" so requests go through Vite proxy (/api, /health).
 * - PROD: default to same-origin unless VITE_API_BASE is set to a full URL.
 */
const raw = (import.meta as any)?.env?.VITE_API_BASE;
export const API_BASE =
  typeof raw === "string" ? raw.trim().replace(/\/+$/, "") : "";

/** Build a safe URL respecting API_BASE (works with proxy or full base). */
function buildUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

/** Generic request with timeout and improved error messages. */
async function request<T>(
  method: "GET" | "POST",
  path: string,
  body?: any,
  isForm?: boolean,
  timeoutMs = 20000
): Promise<T> {
  const url = buildUrl(path);
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);

  const headers: Record<string, string> = {};
  const opts: RequestInit = { method, headers, signal: ctrl.signal };

  if (body) {
    if (isForm) {
      opts.body = body as FormData; // let browser set boundary
    } else {
      headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
  }

  try {
    const res = await fetch(url, opts);
    clearTimeout(id);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `HTTP ${res.status} ${res.statusText} @ ${path}${
          text ? ` — ${text}` : ""
        }`
      );
    }

    const ctype = res.headers.get("content-type") || "";
    if (!ctype.includes("application/json")) {
      const t = await res.text();
      try {
        return JSON.parse(t) as T;
      } catch {
        return {} as T;
      }
    }

    return (await res.json()) as T;
  } catch (err: any) {
    clearTimeout(id);
    if (err?.name === "AbortError") {
      throw new Error(
        `Request timeout after ${timeoutMs}ms for ${path}. Check network or server load.`
      );
    }
    if (err?.message?.toLowerCase().includes("failed to fetch")) {
      throw new Error(
        `Network error calling ${path}. If you are on localhost:
 - Ensure your backend is reachable via Vite proxy (/api) pointing to your ECS IP.
 - Or set VITE_API_BASE to a full URL if not using proxy.
`
      );
    }
    throw err;
  }
}

/* ------------------------ Public Types ------------------------ */
export interface RiskPayload {
  income: number;
  expenses: number;
  horizon_years: number;
  self_risk: number; // 0..1
}
export interface RiskResponse {
  risk_score: number; // 0..1
}
export interface AlertsResponse {
  alerts: { title: string; note: string }[];
}
export interface ChatPayload {
  message: string;
  profile: any;
}
export interface ChatResponse {
  answer: string;
}
export interface UploadResponse {
  ok: boolean;
  key?: string;
  error?: string;
}
export interface AnalyticsResponse {
  chat: number;
  upload: number;
}

/* -------------------- Local profile helpers -------------------- */
export type StoredProfile = {
  income: number;
  expenses: number;
  goal: string;
  horizon: number;
  riskTolerance: number; // 0..1
  self_risk?: number;
  risk_score?: number;
};

export const ProfileStore = {
  key: "wavy_profile",
  load(): StoredProfile | null {
    try {
      const s = localStorage.getItem(this.key);
      return s ? (JSON.parse(s) as StoredProfile) : null;
    } catch {
      return null;
    }
  },
  save(p: StoredProfile) {
    localStorage.setItem(this.key, JSON.stringify(p));
  },
};

/** Convert StoredProfile -> RiskPayload for /api/risk */
export function toRiskPayload(p: StoredProfile): RiskPayload {
  return {
    income: Number(p.income) || 0,
    expenses: Number(p.expenses) || 0,
    horizon_years: Number(p.horizon) || 0,
    self_risk:
      typeof p.riskTolerance === "number"
        ? p.riskTolerance
        : Number(p.riskTolerance) || 0.5,
  };
}

/** Normalize profile for /api/chat */
export function mergeProfileForChat(
  profile: StoredProfile | null | undefined
): Record<string, any> {
  if (!profile) return {};
  return {
    income: Number(profile.income) || 0,
    expenses: Number(profile.expenses) || 0,
    horizon_years: Number(profile.horizon) || 0,
    goal: profile.goal || "",
    self_risk:
      typeof profile.riskTolerance === "number"
        ? profile.riskTolerance
        : Number(profile.riskTolerance) || 0.5,
  };
}

/* ------------------------ API Facade ------------------------ */
export const Api = {
  health: () => request<{ ok: boolean; time: string }>("GET", "/health"),
  alerts: () => request<AlertsResponse>("GET", "/api/alerts"),
  risk: (payload: RiskPayload) =>
    request<RiskResponse>("POST", "/api/risk", payload),
  chat: (payload: ChatPayload) =>
    request<ChatResponse>("POST", "/api/chat", payload),
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<UploadResponse>("POST", "/api/upload", form, true);
  },
  analytics: () => request<AnalyticsResponse>("GET", "/api/analytics"),
};
