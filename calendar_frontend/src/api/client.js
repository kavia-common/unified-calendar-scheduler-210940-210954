/**
 * Minimal fetch wrapper for the calendar backend.
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

function getToken() {
  return localStorage.getItem("access_token");
}

// PUBLIC_INTERFACE
export async function apiRequest(path, { method = "GET", body, auth = true } = {}) {
  /** Perform an API request with optional bearer auth. */
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

// PUBLIC_INTERFACE
export async function signup(email, password) {
  /** Signup and store token. */
  const data = await apiRequest("/auth/signup", { method: "POST", auth: false, body: { email, password } });
  localStorage.setItem("access_token", data.access_token);
  return data;
}

// PUBLIC_INTERFACE
export async function login(email, password) {
  /** Login and store token. */
  const data = await apiRequest("/auth/login", { method: "POST", auth: false, body: { email, password } });
  localStorage.setItem("access_token", data.access_token);
  return data;
}

// PUBLIC_INTERFACE
export async function getMe() {
  /** Get current user info. */
  return apiRequest("/auth/me");
}

// PUBLIC_INTERFACE
export async function listEvents() {
  /** List all events. */
  return apiRequest("/events");
}

// PUBLIC_INTERFACE
export async function createEvent(payload) {
  /** Create event. */
  return apiRequest("/events", { method: "POST", body: payload });
}

// PUBLIC_INTERFACE
export async function updateEvent(id, payload) {
  /** Update event. */
  return apiRequest(`/events/${id}`, { method: "PUT", body: payload });
}

// PUBLIC_INTERFACE
export async function deleteEvent(id) {
  /** Delete event. */
  return apiRequest(`/events/${id}`, { method: "DELETE" });
}

// PUBLIC_INTERFACE
export async function viewMonth(year, month) {
  /** Month view events. */
  return apiRequest(`/views/month?year=${year}&month=${month}`);
}

// PUBLIC_INTERFACE
export async function viewWeek(weekStartIso) {
  /** Week view events. */
  return apiRequest(`/views/week?week_start=${encodeURIComponent(weekStartIso)}`);
}

// PUBLIC_INTERFACE
export async function viewDay(dayIso) {
  /** Day view events. */
  return apiRequest(`/views/day?day=${encodeURIComponent(dayIso)}`);
}
