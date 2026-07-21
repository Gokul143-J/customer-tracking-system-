const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";
const PREFIX = `${API_BASE}/api/v1`;

function getToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return localStorage.getItem("jwt_token") || undefined;
}

export function setToken(token: string | null) {
  if (typeof document === "undefined") return;
  if (token) localStorage.setItem("jwt_token", token);
  else localStorage.removeItem("jwt_token");
}

export function getStoredUser<T = any>(): T | null {
  if (typeof document === "undefined") return null;
  const raw = localStorage.getItem("jwt_user");
  return raw ? (JSON.parse(raw) as T) : null;
}

export function setStoredUser(user: any | null) {
  if (typeof document === "undefined") return;
  if (user) localStorage.setItem("jwt_user", JSON.stringify(user));
  else localStorage.removeItem("jwt_user");
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined | null>;
}

export async function api<T = any>(
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const { params, ...init } = opts;
  let url = path.startsWith("http") ? path : `${PREFIX}${path}`;
  if (params) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) q.append(k, String(v));
    });
    const qs = q.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      data?.error?.message ||
      data?.detail ||
      (typeof data === "string" ? data : "Request failed");
    throw new Error(msg);
  }
  return data as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => api("/auth/me"),
  logout: () => api("/auth/logout", { method: "POST" }),
};

export const ticketsApi = {
  list: (status?: string) => api<any[]>(`/tickets/`, { params: { status_filter: status } }),
  get: (idOrNumber: string) => api<any>(`/tickets/${encodeURIComponent(idOrNumber)}`),
  getByNumber: (num: string) => api<any>(`/tickets/by-number/${encodeURIComponent(num)}`),
  create: (payload: any) => api("/tickets/", { method: "POST", body: JSON.stringify(payload) }),
  close: (id: string, reason?: string) =>
    api(`/tickets/${id}/close`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  movements: (idOrNumber: string) =>
    api<any[]>(`/tickets/${encodeURIComponent(idOrNumber)}/movements`),
};

export const movementsApi = {
  create: (ticket_number: string, to_section: string, reason?: string, notes?: string) =>
    api("/movements/", {
      method: "POST",
      body: JSON.stringify({ ticket_number, to_section, reason, notes }),
    }),
  list: (limit = 50) => api<any[]>(`/movements/`, { params: { limit } }),
};

export const salesApi = {
  create: (payload: any) => api("/sales/", { method: "POST", body: JSON.stringify(payload) }),
  list: () => api<any[]>(`/sales/`),
};

export const customersApi = {
  list: (search?: string) => api<any[]>(`/customers/`, { params: { search } }),
  byPhone: (phone: string) => api<any>(`/customers/by-phone/${encodeURIComponent(phone)}`),
  create: (payload: any) => api("/customers/", { method: "POST", body: JSON.stringify(payload) }),
  get: (id: string) => api<any>(`/customers/${id}`),
};

export const sectionsApi = {
  list: () => api<any[]>(`/sections/`),
};

export const analyticsApi = {
  dashboard: () => api<any>(`/analytics/dashboard`),
};

export const invoicesApi = {
  list: () => api<any[]>(`/invoices/`),
  byNumber: (num: string) => api<any>(`/invoices/by-number/${encodeURIComponent(num)}`),
};

export const auditLogsApi = {
  list: () => api<any[]>(`/audit-logs/`),
};

export const usersApi = {
  list: () => api<any[]>(`/users/`),
  create: (payload: any) =>
    api(`/users/`, { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: any) =>
    api(`/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
};

export const rolesApi = {
  list: () => api<any[]>(`/roles/`),
};

export const storesApi = {
  list: () => api<any[]>(`/stores/`),
};
