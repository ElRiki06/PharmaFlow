import assert from "node:assert/strict";
import { test } from "node:test";

// El único sustituto es la frontera HTTP: se comprueba el tratamiento de datos
// reales/malformados, no el comportamiento de la herramienta de sustitución.
import { request } from "../src/lib/api.js";

test("HTTP 200 con contenido que no es JSON debe rechazarse", async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => {
      throw new SyntaxError("HTML");
    },
  });
  await assert.rejects(request("/state"), /respuesta inválida/i);
});
test("HTTP 200 sin state no debe anunciar una escritura exitosa", async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ ok: true }),
  });
  await assert.rejects(
    request("/orders", { method: "POST", data: {} }),
    /datos incompletos/i,
  );
});
