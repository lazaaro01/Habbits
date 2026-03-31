const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("habit-quest-token");

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Erro ao processar a requisicao.");
  }

  return data;
}

export const api = {
  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getDashboard: () => request("/habits/summary/dashboard"),
  createHabit: (payload) =>
    request("/habits", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateHabit: (habitId, payload) =>
    request(`/habits/${habitId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  completeHabit: (habitId) =>
    request(`/habits/${habitId}/complete`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  deleteHabit: (habitId) =>
    request(`/habits/${habitId}`, {
      method: "DELETE",
    }),
  getHistory: () => request("/habits/history"),
};
