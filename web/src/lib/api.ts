// Empty string = same-origin (Coolify / nginx proxies /api → API).
// Local Vite: set VITE_API_URL=http://127.0.0.1:3848
const API_BASE = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!res.ok) {
    const detail =
      typeof data === "object" && data && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : res.statusText;
    throw new ApiError(res.status, detail);
  }
  return data as T;
}

export { API_BASE };
