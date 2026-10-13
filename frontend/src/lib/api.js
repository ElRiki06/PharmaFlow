import { validState } from "./domain.js";

const env = import.meta.env || {};
export const mode = env.VITE_DATA_MODE || "demo";
const url = (env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(
  /\/$/,
  "",
);

export async function request(path, { method = "GET", data, token } = {}) {
  let response;
  try {
    response = await fetch(url + path, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error(
      "No se pudo conectar con la API. Revisa que PHP y MySQL estén activos.",
    );
  }
  let json;
  try {
    json = await response.json();
  } catch {
    throw new Error("La API devolvió una respuesta inválida.");
  }
  if (!response.ok) {
    const error = new Error(
      json?.error || "No se pudo completar la solicitud.",
    );
    error.status = response.status;
    throw error;
  }
  const needsState =
    path === "/state" || (method !== "GET" && !path.startsWith("/auth/"));
  if (needsState && !validState(json?.state))
    throw new Error(
      "La API devolvió datos incompletos. No se confirmó la operación.",
    );
  if (
    path.startsWith("/auth/") &&
    path !== "/auth/logout" &&
    (!json?.user ||
      !Number.isInteger(json.user.id) ||
      !["client", "employee"].includes(json.user.role) ||
      typeof json.user.email !== "string" ||
      (method === "POST" && typeof json.token !== "string"))
  )
    throw new Error("La API devolvió datos de sesión incompletos.");
  return json;
}

export function mutate(action, token) {
  const routes = {
    adjust: ["PATCH", `/stock/${action.id}`],
    transfer: ["POST", `/stock/${action.id}/transfer`],
    drug: ["POST", "/drugs"],
    import: ["POST", "/stock/import"],
    branch: ["PATCH", `/branches/${action.id}`],
    reserve: ["POST", "/orders"],
    cancel: ["POST", `/orders/${action.id}/cancel`],
    review: ["POST", `/orders/${action.id}/review`],
    dispatch: ["POST", `/orders/${action.id}/dispatch`],
  };
  const [method, path] = routes[action.type];
  return request(path, { method, data: action, token });
}
