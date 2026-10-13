import assert from "node:assert/strict";
import { test } from "node:test";

const base = process.env.TEST_API || "http://127.0.0.1:8001/api";
const password = "Pharma123!";
async function request(path, { method = "GET", token, body } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, data: await response.json() };
}
const signIn = async (email) => {
  const r = await request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  assert.equal(r.status, 200);
  return r.data.token;
};
const employee = await signIn("empleado@farmacia.com");
const client = await signIn("cliente@correo.com");
const getState = async (token) =>
  (await request("/state", { token })).data.state;
const post = (path, body, token = employee) =>
  request(path, { method: "POST", body, token });

test("la API responde health y exige autenticación para datos", async () => {
  assert.equal((await request("/health")).status, 200);
  assert.equal((await request("/state")).status, 401);
  assert.equal(
    (
      await request("/auth/login", {
        method: "POST",
        body: { email: "cliente@correo.com", password: "no" },
      })
    ).status,
    401,
  );
});
test("el servidor filtra pacientes y eventos de terceros para clientes", async () => {
  const state = await getState(client);
  assert.equal(state.orders.length, 3);
  assert.ok(
    state.orders.every(
      (o) => o.userId === 1 && o.patient === "Elena Morales Ramos",
    ),
  );
  assert.equal(state.events.length, 0);
  assert.equal((await request("/events", { token: client })).status, 403);
  assert.equal(
    (
      await request("/stock/1", {
        method: "PATCH",
        token: client,
        body: { quantity: 1, note: "Conteo" },
      })
    ).status,
    403,
  );
});
test("registro público no crea empleados aun recibiendo role o un dominio engañoso", async () => {
  assert.equal(
    (
      await post("/auth/register", {
        name: "Cuenta falsa",
        email: "nuevo@farmacia.com",
        password,
        role: "employee",
      })
    ).status,
    422,
  );
  const registered = await post("/auth/register", {
    name: "Cuenta cliente",
    email: "nuevo@farmacia.com.evil.test",
    password,
    role: "employee",
  });
  assert.equal(registered.status, 201);
  assert.equal(registered.data.user.role, "client");
  assert.equal(
    (
      await request("/stock/1", {
        method: "PATCH",
        token: registered.data.token,
        body: { quantity: 1, note: "Conteo" },
      })
    ).status,
    403,
  );
});
test("reserva y cancelación devuelven unidades exactamente una vez", async () => {
  const before = await getState(employee);
  const quantity = before.stock.find((s) => s.id === 3).quantity;
  const saved = await post(
    "/orders",
    { branchId: 2, items: [{ stockId: 3, quantity: 2 }] },
    client,
  );
  assert.equal(saved.status, 201);
  const order = saved.data.state.orders.find(
    (o) => !before.orders.some((b) => b.id === o.id),
  );
  assert.equal(order.status, "ready");
  assert.equal(
    saved.data.state.stock.find((s) => s.id === 3).quantity,
    quantity - 2,
  );
  assert.equal(
    (await post(`/orders/${order.id}/cancel`, {}, client)).status,
    200,
  );
  assert.equal(
    (await getState(employee)).stock.find((s) => s.id === 3).quantity,
    quantity,
  );
  assert.equal(
    (await post(`/orders/${order.id}/cancel`, {}, client)).status,
    409,
  );
});
test("reserva falla de forma atómica al exceder stock duplicado o enviar receta falsa", async () => {
  const before = await getState(employee);
  assert.equal(
    (
      await post(
        "/orders",
        {
          branchId: 1,
          items: [
            { stockId: 1, quantity: 200 },
            { stockId: 1, quantity: 200 },
          ],
          image: "data:image/png;base64,AAAA",
        },
        client,
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await post(
        "/orders",
        {
          branchId: 1,
          items: [{ stockId: 1, quantity: 1 }],
          image: "data:image/png;base64,AAAA",
        },
        client,
      )
    ).status,
    422,
  );
  assert.deepEqual((await getState(employee)).stock, before.stock);
});
test("transferencia conserva unidades y no admite cantidades fraccionarias", async () => {
  const before = await getState(employee);
  const moved = await post("/stock/1/transfer", {
    branchId: 2,
    quantity: 10,
    note: "Reposición",
  });
  assert.equal(moved.status, 200);
  assert.equal(
    moved.data.state.stock.reduce((n, s) => n + s.quantity, 0),
    before.stock.reduce((n, s) => n + s.quantity, 0),
  );
  assert.equal(
    (
      await post("/stock/1/transfer", {
        branchId: 2,
        quantity: 1.5,
        note: "Reposición",
      })
    ).status,
    422,
  );
});
test("importación revierte todas las filas cuando una es inválida", async () => {
  const before = await getState(employee);
  const result = await post("/stock/import", {
    rows: [
      { id: 1, quantity: 9, minimum: 80 },
      { id: 99999, quantity: 3, minimum: 1 },
    ],
  });
  assert.equal(result.status, 404);
  assert.deepEqual((await getState(employee)).stock, before.stock);
});
test("auditoría exige nota, restaura existencias al rechazar y bloquea doble decisión", async () => {
  const before = await getState(employee);
  assert.equal(
    (await post("/orders/9402/review", { decision: "rejected", note: "" }))
      .status,
    422,
  );
  const result = await post("/orders/9402/review", {
    decision: "rejected",
    note: "Documento de prueba ilegible",
  });
  assert.equal(result.status, 200);
  assert.equal(
    result.data.state.stock.find((s) => s.id === 1).quantity,
    before.stock.find((s) => s.id === 1).quantity + 2,
  );
  assert.equal(
    (
      await post("/orders/9402/review", {
        decision: "ready",
        note: "Documento válido",
      })
    ).status,
    409,
  );
});
test("despacho exige código y se registra una sola vez", async () => {
  assert.equal(
    (await post("/orders/8104/dispatch", { code: "NO" })).status,
    422,
  );
  assert.equal(
    (await post("/orders/8104/dispatch", { code: "PF-8104-EM" })).status,
    200,
  );
  assert.equal(
    (await post("/orders/8104/dispatch", { code: "PF-8104-EM" })).status,
    409,
  );
  assert.equal((await post("/orders/9401/cancel", {}, client)).status, 403);
});
test("logout revoca el token en servidor", async () => {
  const token = await signIn("cliente@correo.com");
  assert.equal((await post("/auth/logout", {}, token)).status, 200);
  assert.equal((await request("/state", { token })).status, 401);
});
test("despacho rechaza un lote que venció después de reservar", async () => {
  const before = await getState(employee);
  const result = await post("/orders/8105/dispatch", {
    code: "PF-TEST-EXPIRED",
  });
  assert.equal(result.status, 422);
  const after = await getState(employee);
  assert.equal(after.orders.find((o) => o.id === 8105).status, "ready");
  assert.deepEqual(after.stock, before.stock);
});
test("una receta válida reserva stock y requiere aprobación del empleado", async () => {
  const before = await getState(employee);
  const quantity = before.stock.find((s) => s.id === 1).quantity;
  const saved = await post(
    "/orders",
    {
      branchId: 1,
      items: [{ stockId: 1, quantity: 1 }],
      image:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX1kAAAAASUVORK5CYII=",
    },
    client,
  );
  assert.equal(saved.status, 201);
  const order = saved.data.state.orders.find(
    (o) => !before.orders.some((b) => b.id === o.id),
  );
  assert.equal(order.status, "pending");
  assert.equal(
    saved.data.state.stock.find((s) => s.id === 1).quantity,
    quantity - 1,
  );
  assert.equal(
    (
      await post(
        `/orders/${order.id}/review`,
        { decision: "ready", note: "Receta revisada en entorno de pruebas" },
        client,
      )
    ).status,
    403,
  );
  const approved = await post(`/orders/${order.id}/review`, {
    decision: "ready",
    note: "Receta revisada en entorno de pruebas",
  });
  assert.equal(approved.status, 200);
  assert.equal(
    approved.data.state.orders.find((o) => o.id === order.id).status,
    "ready",
  );
});
