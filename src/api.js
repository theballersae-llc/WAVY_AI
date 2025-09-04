// src/api.js
const API_BASE = "http://47.236.164.215"; // adjust to your domain if you deploy

async function request(method, path, body, isForm = false) {
  const opts = { method, headers: {} };
  if (body) {
    opts.headers["Content-Type"] = isForm ? undefined : "application/json";
    opts.body = isForm ? body : JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    const message = await res.text();
    throw new Error(`${res.status} ${message}`);
  }
  return res.json();
}

export const Api = {
  health: () => request("GET", "/health"),
  alerts: () => request("GET", "/api/alerts"),
  risk: (payload) => request("POST", "/api/risk", payload),
  chat: (payload) => request("POST", "/api/chat", payload),
  upload: async (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("POST", "/api/upload", form, true);
  },
  analytics: () => request("GET", "/api/analytics"),
};

// risk label to self‑risk map
export const RISK_MAP = {
  Conservative: 0.2,
  Moderate: 0.5,
  Aggressive: 0.8,
};
