import assert from "node:assert/strict";
import { test } from "node:test";
import { seed } from "../src/data/seed.js";
import {
  apply,
  canAccess,
  login,
  normalize,
  stockState,
} from "../src/lib/domain.js";

const employee = {
  id: 2,
  role: "employee",
  email: "empleado@farmacia.com",
  name: "David Chen",
};
const client = {
  id: 1,
  role: "client",
  email: "cliente@correo.com",
  name: "Elena Morales Ramos",
};
const run = (state, action, user = employee) => apply(state, action, user);

test("solo un empleado provisionado con dominio exacto accede a auditoría", () => {
  assert.equal(canAccess(employee, "audit"), true);
  assert.equal(canAccess(client, "audit"), false);
  assert.equal(
    canAccess({ ...employee, email: "e@farmacia.com.evil.test" }, "audit"),
    false,
  );
  assert.equal(
    canAccess({ ...client, email: "e@farmacia.com" }, "inventory"),
    false,
  );
});
test("login valida contraseña y normaliza correo", () => {
  assert.equal(login(" EMPLEADO@FARMACIA.COM ", "Pharma123!").role, "employee");
  assert.throws(() => login(employee.email, "incorrecta"), /credenciales/i);
});
test("stock clasifica umbrales y agotados", () => {
  assert.equal(stockState(0, 25), "critical");
  assert.equal(stockState(14, 25), "low");
  assert.equal(stockState(100, 25), "available");
});
test("ajuste rechaza negativos, decimales y clientes", () => {
  for (const quantity of [-1, 1.5, NaN])
    assert.throws(
      () => run(seed(), { type: "adjust", id: 1, quantity, note: "Conteo" }),
      /cantidad/i,
    );
  assert.throws(
    () =>
      run(
        seed(),
        { type: "adjust", id: 1, quantity: 100, note: "Conteo" },
        client,
      ),
    /permiso/i,
  );
});
test("transferencia mueve unidades sin alterar el total y sin mutar entrada", () => {
  const state = seed();
  const before = structuredClone(state);
  const next = run(state, {
    type: "transfer",
    id: 1,
    branchId: 2,
    quantity: 10,
    note: "Reposición",
  });
  assert.deepEqual(state, before);
  assert.equal(
    next.stock.find((s) => s.id === 1).quantity,
    state.stock[0].quantity - 10,
  );
  assert.equal(
    next.stock.reduce((n, s) => n + s.quantity, 0),
    state.stock.reduce((n, s) => n + s.quantity, 0),
  );
});
test("transferencia rechaza misma sede y exceso de unidades", () => {
  assert.throws(
    () =>
      run(seed(), {
        type: "transfer",
        id: 1,
        branchId: 1,
        quantity: 2,
        note: "Conteo",
      }),
    /sede/i,
  );
  assert.throws(
    () =>
      run(seed(), {
        type: "transfer",
        id: 1,
        branchId: 2,
        quantity: 99999,
        note: "Conteo",
      }),
    /existencias/i,
  );
});
test("reserva OTC descuenta stock y cancelar lo restaura exactamente una vez", () => {
  const state = seed();
  const stock = state.stock.find((s) => s.drugId === 3);
  const next = run(
    state,
    {
      type: "reserve",
      branchId: stock.branchId,
      items: [{ stockId: stock.id, quantity: 2 }],
    },
    client,
  );
  const order = next.orders.at(-1);
  assert.equal(order.status, "ready");
  assert.equal(
    next.stock.find((s) => s.id === stock.id).quantity,
    stock.quantity - 2,
  );
  const cancelled = run(next, { type: "cancel", id: order.id }, client);
  assert.equal(
    cancelled.stock.find((s) => s.id === stock.id).quantity,
    stock.quantity,
  );
  assert.throws(
    () => run(cancelled, { type: "cancel", id: order.id }, client),
    /estado/i,
  );
});
test("reserva agrupa duplicados y rechaza insuficiencia y productos vencidos", () => {
  const state = seed();
  assert.throws(
    () =>
      run(
        state,
        {
          type: "reserve",
          branchId: 1,
          items: [
            { stockId: 1, quantity: 200 },
            { stockId: 1, quantity: 200 },
          ],
          image: "data:image/png;base64,AAAA",
        },
        client,
      ),
    /existencias/i,
  );
  state.stock[0].expiry = "2020-01-01";
  assert.throws(
    () =>
      run(
        state,
        {
          type: "reserve",
          branchId: 1,
          items: [{ stockId: 1, quantity: 1 }],
          image: "data:image/png;base64,AAAA",
        },
        client,
      ),
    /vencido/i,
  );
});
test("reserva Rx exige imagen y empieza pendiente de auditoría", () => {
  assert.throws(
    () =>
      run(
        seed(),
        { type: "reserve", branchId: 1, items: [{ stockId: 1, quantity: 1 }] },
        client,
      ),
    /receta/i,
  );
  const next = run(
    seed(),
    {
      type: "reserve",
      branchId: 1,
      items: [{ stockId: 1, quantity: 1 }],
      image: "data:image/png;base64,AAAA",
    },
    client,
  );
  assert.equal(next.orders.at(-1).status, "pending");
});
test("rechazar exige motivo, libera stock y no permite segundo dictamen", () => {
  const state = seed();
  const order = state.orders.find((o) => o.status === "pending");
  assert.throws(
    () =>
      run(state, {
        type: "review",
        id: order.id,
        decision: "rejected",
        note: "",
      }),
    /motivo/i,
  );
  const next = run(state, {
    type: "review",
    id: order.id,
    decision: "rejected",
    note: "Documento ilegible",
  });
  assert.equal(next.orders.find((o) => o.id === order.id).status, "rejected");
  assert.throws(
    () =>
      run(next, {
        type: "review",
        id: order.id,
        decision: "ready",
        note: "Validada",
      }),
    /estado/i,
  );
});
test("cliente no cancela una reserva ajena y no despacha", () => {
  const state = seed();
  const order = state.orders.find((o) => o.userId !== client.id);
  assert.throws(
    () => run(state, { type: "cancel", id: order.id }, client),
    /permiso/i,
  );
  assert.throws(
    () => run(state, { type: "dispatch", id: 8099 }, client),
    /permiso/i,
  );
});
test("despacho requiere estado listo y código de retiro exacto", () => {
  const state = seed();
  const order = state.orders.find((o) => o.status === "ready");
  assert.throws(
    () => run(state, { type: "dispatch", id: order.id, code: "NO" }),
    /código/i,
  );
  const next = run(state, {
    type: "dispatch",
    id: order.id,
    code: order.pickupCode,
  });
  assert.equal(next.orders.find((o) => o.id === order.id).status, "completed");
  assert.throws(
    () => run(next, { type: "dispatch", id: order.id, code: order.pickupCode }),
    /estado/i,
  );
});
test("normalización recupera estructura corrupta sin confiar en sesión local", () => {
  assert.equal(normalize(null).drugs.length, 8);
  assert.equal(normalize({ version: 0 }).branches.length, 3);
});
test("las rutas desconocidas no están autorizadas", () => {
  assert.equal(canAccess(employee, ""), false);
  assert.equal(canAccess(employee, "unknown"), false);
});
test("datos locales con filas nulas o referencias rotas se recuperan", () => {
  const bad = seed();
  bad.stock = [null];
  assert.equal(normalize(bad).stock.length, 8);
  const orphan = seed();
  orphan.stock[0].drugId = 999;
  assert.equal(normalize(orphan).stock[0].drugId, 1);
});
test("despacho de una reserva antigua rechaza cualquier lote vencido", () => {
  const state = seed();
  const order = state.orders.find((o) => o.status === "ready");
  state.stock.find((s) => s.id === order.items[0].stockId).expiry =
    "2020-01-01";
  assert.throws(
    () =>
      run(state, { type: "dispatch", id: order.id, code: order.pickupCode }),
    /vencido/i,
  );
});
test("normalización descarta detalles negativos e inconsistentes", () => {
  const bad = seed();
  bad.orders[0].items[0].quantity = -1000;
  const state = normalize(bad);
  assert.equal(state.orders[0].items[0].quantity, 2);
  const next = run(state, { type: "cancel", id: 9402 });
  assert.ok(next.stock.every((s) => s.quantity >= 0));
  const wrongDrug = seed();
  wrongDrug.orders[0].items[0].drugId = 8;
  assert.equal(normalize(wrongDrug).orders[0].items[0].drugId, 1);
});
