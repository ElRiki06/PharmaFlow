import { seed, users } from "../data/seed.js";

export function canAccess(user, page) {
  if (!user) return false;
  if (["catalog", "orders"].includes(page)) return true;
  if (!["dashboard", "inventory", "audit", "settings"].includes(page))
    return false;
  return (
    user.role === "employee" && /^[^@\s]+@farmacia\.com$/i.test(user.email)
  );
}

export function login(email, password) {
  const user = users.find((u) => u.email === email.trim().toLowerCase());
  if (!user || password !== "Pharma123!")
    throw new Error(
      "Credenciales incorrectas. Revisa el correo y la contraseña.",
    );
  return { ...user };
}

export const stockState = (quantity, minimum) =>
  quantity <= minimum * 0.3
    ? "critical"
    : quantity < minimum
      ? "low"
      : "available";
export const isExpired = (expiry) =>
  expiry < new Date().toISOString().slice(0, 10);
export const total = (order) =>
  order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
export const money = (value) =>
  new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(
    value,
  );
export const age = (value) => {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000),
  );
  return minutes < 60
    ? `Hace ${minutes} min`
    : minutes < 1440
      ? `Hace ${Math.floor(minutes / 60)} h`
      : `Hace ${Math.floor(minutes / 1440)} días`;
};

export function validState(value) {
  if (
    !value ||
    value.version !== 1 ||
    !["branches", "drugs", "stock", "orders", "events"].every((key) =>
      Array.isArray(value[key]),
    )
  )
    return false;
  if (
    !value.branches.length ||
    !value.drugs.length ||
    value.branches.some(
      (b) => !b || !Number.isInteger(b.id) || typeof b.name !== "string",
    ) ||
    value.drugs.some(
      (d) =>
        !d ||
        !Number.isInteger(d.id) ||
        typeof d.name !== "string" ||
        typeof d.code !== "string" ||
        !Number.isFinite(d.price) ||
        d.price <= 0,
    )
  )
    return false;
  if (
    value.stock.some(
      (s) =>
        !s ||
        !Number.isInteger(s.id) ||
        !Number.isInteger(s.quantity) ||
        s.quantity < 0 ||
        !Number.isInteger(s.minimum) ||
        s.minimum < 1 ||
        typeof s.expiry !== "string" ||
        !value.drugs.some((d) => d.id === s.drugId) ||
        !value.branches.some((b) => b.id === s.branchId),
    )
  )
    return false;
  if (
    value.orders.some(
      (o) =>
        !o ||
        !Number.isInteger(o.id) ||
        !["pending", "ready", "completed", "rejected", "cancelled"].includes(
          o.status,
        ) ||
        typeof o.patient !== "string" ||
        !Array.isArray(o.items) ||
        !value.branches.some((b) => b.id === o.branchId) ||
        o.items.some(
          (i) =>
            !i ||
            !Number.isInteger(i.quantity) ||
            i.quantity < 1 ||
            i.quantity > 1000000 ||
            !Number.isFinite(i.price) ||
            i.price < 0 ||
            !value.stock.some(
              (s) => s.id === i.stockId && s.drugId === i.drugId,
            ) ||
            !value.drugs.some((d) => d.id === i.drugId),
        ),
    )
  )
    return false;
  if (
    value.events.some(
      (e) => !e || typeof e.title !== "string" || typeof e.detail !== "string",
    )
  )
    return false;
  return true;
}

export function normalize(value) {
  return validState(value) ? value : seed();
}

function check(ok, message) {
  if (!ok) throw new Error(message);
}
function quantity(value, allowZero = false) {
  check(
    Number.isInteger(value) && value >= (allowZero ? 0 : 1) && value <= 1000000,
    "La cantidad debe ser un entero válido.",
  );
}
function note(value) {
  check(
    typeof value === "string" &&
      value.trim().length >= 3 &&
      value.length <= 1000,
    "Escribe un motivo de al menos 3 caracteres.",
  );
}
const nextId = (rows) => Math.max(0, ...rows.map((row) => row.id)) + 1;
const activeBranch = (state, id) =>
  state.branches.some((b) => b.id === id && b.active);

export function apply(state, action, user) {
  check(user, "Inicia sesión para continuar.");
  const employee = canAccess(user, "inventory");
  if (!["reserve", "cancel"].includes(action.type))
    check(employee, "No tienes permiso para esta operación.");
  const next = structuredClone(state);
  let title = "";
  let branchId = action.branchId || 1;
  let kind = "info";

  if (action.type === "adjust") {
    quantity(action.quantity, true);
    note(action.note);
    const row = next.stock.find((s) => s.id === action.id);
    check(row, "Existencia no encontrada.");
    row.quantity = action.quantity;
    branchId = row.branchId;
    title = "Ajuste de inventario registrado";
  } else if (action.type === "transfer") {
    quantity(action.quantity);
    note(action.note);
    const row = next.stock.find((s) => s.id === action.id);
    check(row, "Existencia no encontrada.");
    check(
      row.branchId !== action.branchId && activeBranch(next, action.branchId),
      "Selecciona otra sede activa.",
    );
    check(!isExpired(row.expiry), "El lote está vencido.");
    check(row.quantity >= action.quantity, "No hay suficientes existencias.");
    row.quantity -= action.quantity;
    let target = next.stock.find(
      (s) =>
        s.drugId === row.drugId &&
        s.branchId === action.branchId &&
        s.lot === row.lot &&
        s.expiry === row.expiry,
    );
    if (!target) {
      target = {
        ...row,
        id: nextId(next.stock),
        branchId: action.branchId,
        quantity: 0,
      };
      next.stock.push(target);
    }
    target.quantity += action.quantity;
    title = "Transferencia entre sedes completada";
  } else if (action.type === "reserve") {
    check(activeBranch(next, action.branchId), "La sede está inactiva.");
    check(
      Array.isArray(action.items) &&
        action.items.length > 0 &&
        action.items.length <= 50,
      "Añade al menos un medicamento.",
    );
    const grouped = new Map();
    action.items.forEach((i) => {
      quantity(i.quantity);
      grouped.set(i.stockId, (grouped.get(i.stockId) || 0) + i.quantity);
    });
    let rx = false;
    const items = [...grouped].map(([stockId, count]) => {
      quantity(count);
      const row = next.stock.find((s) => s.id === stockId);
      check(
        row && row.branchId === action.branchId,
        "Todos los productos deben pertenecer a la sede de retiro.",
      );
      check(!isExpired(row.expiry), "El lote está vencido.");
      check(row.quantity >= count, "No hay suficientes existencias.");
      const drug = next.drugs.find((d) => d.id === row.drugId);
      rx ||= drug.rx;
      row.quantity -= count;
      return { stockId, drugId: drug.id, quantity: count, price: drug.price };
    });
    if (rx)
      check(
        typeof action.image === "string" &&
          /^data:image\/(png|jpeg|webp);base64,/.test(action.image) &&
          action.image.length <= 2800000,
        "Adjunta una receta en PNG, JPG o WebP (máximo 2 MB).",
      );
    const id = Math.max(9402, nextId(next.orders));
    next.orders.push({
      id,
      userId: user.id,
      patient: user.name,
      dui: user.dui || "",
      phone: user.phone || "",
      branchId: action.branchId,
      status: rx ? "pending" : "ready",
      priority: items.some(
        (i) => next.drugs.find((d) => d.id === i.drugId).controlled,
      )
        ? "high"
        : "normal",
      items,
      image: rx ? action.image : null,
      doctor: action.doctor?.trim() || "Por verificar",
      license: action.license?.trim() || "Por verificar",
      createdAt: new Date().toISOString(),
      pickupCode: `PF-${id}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      note: "",
    });
    title = `Nueva reserva #ORD-${id}`;
    kind = "success";
  } else if (["cancel", "review", "dispatch"].includes(action.type)) {
    const order = next.orders.find((o) => o.id === action.id);
    check(order, "Reserva no encontrada.");
    branchId = order.branchId;
    if (action.type === "cancel") {
      check(
        employee || order.userId === user.id,
        "No tienes permiso para cancelar esta reserva.",
      );
      check(
        ["pending", "ready"].includes(order.status),
        "El estado actual no permite cancelar.",
      );
      order.status = "cancelled";
      title = `Reserva #ORD-${order.id} cancelada`;
    } else if (action.type === "review") {
      check(
        order.status === "pending",
        "El estado actual no permite otro dictamen.",
      );
      check(
        ["ready", "rejected"].includes(action.decision),
        "Dictamen inválido.",
      );
      note(action.note);
      order.status = action.decision;
      order.note = action.note.trim();
      order.reviewer = user.name;
      title = `Receta #RX-${order.id} ${action.decision === "ready" ? "aprobada" : "rechazada"}`;
      kind = action.decision === "ready" ? "success" : "critical";
    } else {
      check(order.status === "ready", "El estado actual no permite despachar.");
      check(
        action.code?.trim() === order.pickupCode,
        "El código de retiro no coincide.",
      );
      check(
        order.items.every((i) => {
          const stock = next.stock.find((s) => s.id === i.stockId);
          return stock && !isExpired(stock.expiry);
        }),
        "No se puede despachar un lote vencido. Cancela la reserva y selecciona un lote vigente.",
      );
      order.status = "completed";
      title = `Retiro completado #ORD-${order.id}`;
      kind = "success";
    }
    if (["cancelled", "rejected"].includes(order.status))
      order.items.forEach((i) => {
        const row = next.stock.find((s) => s.id === i.stockId);
        check(row, "Lote de la reserva no encontrado.");
        row.quantity += i.quantity;
      });
  } else if (action.type === "drug") {
    const drug = action.drug;
    check(
      drug &&
        drug.name?.trim().length >= 3 &&
        drug.ingredient?.trim() &&
        drug.code?.trim() &&
        drug.form?.trim(),
      "Completa nombre, principio activo, código y presentación.",
    );
    check(
      Number.isFinite(drug.price) && drug.price > 0 && drug.price <= 100000,
      "Precio inválido.",
    );
    check(
      !next.drugs.some(
        (d) => d.code.toLowerCase() === drug.code.trim().toLowerCase(),
      ),
      "El código ATC ya existe.",
    );
    quantity(action.quantity, true);
    quantity(action.minimum);
    check(activeBranch(next, action.branchId), "Selecciona una sede activa.");
    check(
      action.lot?.trim() &&
        /^\d{4}-\d{2}-\d{2}$/.test(action.expiry) &&
        !isExpired(action.expiry),
      "Indica lote y vencimiento vigentes.",
    );
    const id = nextId(next.drugs);
    next.drugs.push({
      ...drug,
      id,
      name: drug.name.trim(),
      code: drug.code.trim().toUpperCase(),
      rx: Boolean(drug.rx || drug.controlled),
      controlled: Boolean(drug.controlled),
    });
    next.stock.push({
      id: nextId(next.stock),
      drugId: id,
      branchId: action.branchId,
      lot: action.lot.trim(),
      expiry: action.expiry,
      quantity: action.quantity,
      minimum: action.minimum,
    });
    title = "Nuevo medicamento registrado";
  } else if (action.type === "branch") {
    const branch = next.branches.find((b) => b.id === action.id);
    check(branch, "Sede no encontrada.");
    check(
      action.name?.trim().length >= 2 &&
        action.address?.trim().length >= 5 &&
        /^[\d+\s-]{7,20}$/.test(action.phone),
      "Completa un nombre, dirección y teléfono válidos.",
    );
    if (!action.active) {
      check(
        next.branches.some((b) => b.id !== branch.id && b.active),
        "Debe quedar al menos una sede activa.",
      );
      check(
        !next.orders.some(
          (o) =>
            o.branchId === branch.id && ["pending", "ready"].includes(o.status),
        ),
        "Hay reservas activas en esta sede.",
      );
    }
    Object.assign(branch, {
      name: action.name.trim(),
      address: action.address.trim(),
      phone: action.phone.trim(),
      active: Boolean(action.active),
    });
    branchId = branch.id;
    title = "Configuración de sede actualizada";
  } else if (action.type === "import") {
    check(
      Array.isArray(action.rows) &&
        action.rows.length > 0 &&
        action.rows.length <= 500,
      "El archivo debe contener entre 1 y 500 filas.",
    );
    action.rows.forEach((item) => {
      quantity(item.quantity, true);
      quantity(item.minimum);
      const row = next.stock.find((s) => s.id === item.id);
      check(row, `Existencia #${item.id} no encontrada.`);
      row.quantity = item.quantity;
      row.minimum = item.minimum;
    });
    check(
      new Set(action.rows.map((r) => r.id)).size === action.rows.length,
      "El archivo contiene filas duplicadas.",
    );
    title = `Importación de ${action.rows.length} existencias completada`;
  } else throw new Error("Operación desconocida.");
  next.events.unshift({
    id: crypto.randomUUID(),
    title,
    detail: `${action.note?.trim() || "Operación registrada"} · ${user.name}`,
    branchId,
    kind,
    createdAt: new Date().toISOString(),
  });
  next.events = next.events.slice(0, 200);
  return next;
}
