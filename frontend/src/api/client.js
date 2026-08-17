// Thin fetch wrapper
// In dev: Vite proxies /api -> http://localhost:5000 (see vite.config.js)
// In production: Uses VITE_API_URL from .env (e.g., https://api.example.com)
const BASE = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options, // options.signal (AbortController) flows through here for cancellable requests
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    // Session expired / cookie invalid mid-use (not the initial /auth/me
    // check, which handles its own 401 quietly) — let AuthContext know so
    // it can clear the logged-in state and bounce to /login instead of the
    // page just silently failing every request from here on.
    if (res.status === 401 && path !== "/auth/me") {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    throw new Error(message);
  }
  return data;
}

export const api = {
  get: (path, options) => request(path, options),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  del: (path) => request(path, { method: "DELETE" }),
};

// One factory -> full CRUD client (list/create/update/remove) per resource.
// Resources that also support payments (students, employees, teachers, loans, projects)
// extend this with addPayment/removePayment in resources.js.
export function resourceClient(resource) {
  return {
    list: () => api.get(`/${resource}`),
    create: (body) => api.post(`/${resource}`, body),
    update: (id, body) => api.put(`/${resource}/${id}`, body),
    remove: (id) => api.del(`/${resource}/${id}`),
  };
}
