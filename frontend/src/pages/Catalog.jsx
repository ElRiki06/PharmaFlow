import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  FileImage,
  LoaderCircle,
  LockKeyhole,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Upload,
} from "lucide-react";
import { useApp } from "../lib/context.js";
import { canAccess, isExpired, money } from "../lib/domain.js";
import { imageFile } from "../lib/files.js";
import { read, remove, write } from "../lib/storage.js";
import {
  Badge,
  Confirm,
  Empty,
  Field,
  IconButton,
  PageHead,
} from "../components/Ui.jsx";

export default function Catalog({ navigate, initialQuery = "" }) {
  const { data, user, prefs, run, notify, mode } = useApp();
  const [branchId, setBranchId] = useState(prefs.branchId);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState(null);
  const [doctor, setDoctor] = useState("");
  const [license, setLicense] = useState("");
  const [confirm, setConfirm] = useState(null);
  const key = `cart-${mode}-${user.id}`;
  const employee = canAccess(user, "audit");
  useEffect(() => {
    let active = true;
    read(key, [])
      .then((saved) => {
        if (!active) return;
        const valid = Array.isArray(saved)
          ? saved.filter(
              (i) =>
                Number.isInteger(i.stockId) &&
                Number.isInteger(i.quantity) &&
                i.quantity > 0,
            )
          : [];
        setCart(valid);
        setLoaded(true);
      })
      .catch((e) => {
        if (active) {
          notify(e.message, "error");
          setLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [key, notify]);
  const items = cart
    .map((i) => {
      const stock = data.stock.find((s) => s.id === i.stockId);
      return stock
        ? { ...i, stock, drug: data.drugs.find((d) => d.id === stock.drugId) }
        : null;
    })
    .filter(Boolean);
  const cartBranch = items[0]?.stock.branchId;
  const rx = items.some((i) => i.drug.rx);
  const cartTotal = items.reduce((n, i) => n + i.quantity * i.drug.price, 0);
  const rows = data.stock
    .filter((s) => s.branchId === Number(branchId) && !isExpired(s.expiry))
    .map((s) => ({ ...s, drug: data.drugs.find((d) => d.id === s.drugId) }))
    .filter(
      (s) =>
        `${s.drug.name} ${s.drug.ingredient} ${s.drug.code}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (category === "all" || (category === "otc" ? !s.drug.rx : s.drug.rx)),
    );
  async function save(next) {
    if (saving) return;
    setSaving(true);
    try {
      await write(key, next);
      setCart(next);
    } finally {
      setSaving(false);
    }
  }
  async function change(stock, delta) {
    if (saving || !loaded) return;
    try {
      if (cartBranch && stock.branchId !== cartBranch && delta > 0) {
        setConfirm({ type: "replace", stock });
        return;
      }
      const next = [...cart];
      const index = next.findIndex((i) => i.stockId === stock.id);
      const count = (index === -1 ? 0 : next[index].quantity) + delta;
      if (count > stock.quantity)
        throw new Error("La cantidad supera las existencias disponibles.");
      if (count <= 0 && index !== -1) next.splice(index, 1);
      else if (index === -1 && count > 0)
        next.push({ stockId: stock.id, quantity: count });
      else if (index !== -1)
        next[index] = { stockId: stock.id, quantity: count };
      await save(next);
    } catch (e) {
      notify(e.message, "error");
    }
  }
  async function attach(e) {
    try {
      setImage(await imageFile(e.target.files[0]));
    } catch (e) {
      notify(e.message, "error");
    }
  }
  function checkout(e) {
    e.preventDefault();
    if (!items.length) return;
    if (rx && !image) {
      notify("Adjunta la receta para reservar estos medicamentos.", "error");
      return;
    }
    setConfirm({ type: "reserve" });
  }
  return (
    <>
      <PageHead
        tag={employee ? "Atención en mostrador" : "Tu farmacia, más cerca"}
        title={employee ? "Nueva Orden Asistida" : "Catálogo de Medicamentos"}
        actions={
          !employee && (
            <button
              className="btn secondary"
              onClick={() => navigate("orders")}
            >
              <ShoppingBag size={16} />
              Mis reservas
              <ArrowRight size={16} />
            </button>
          )
        }
      >
        {employee
          ? "Crea una reserva bajo tu cuenta de empleado y registra su receta cuando corresponda."
          : "Selecciona una sede, añade tus medicamentos y reserva para retirar en farmacia."}
      </PageHead>
      <div className="catalog-layout">
        <section>
          <div className="card filters catalog-filters">
            <div className="filter-search">
              <div className="search-input">
                <Search size={17} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar medicamento o principio activo..."
                  aria-label="Buscar en el catálogo"
                />
              </div>
            </div>
            <div className="filter-selects">
              <select
                aria-label="Sede de retiro del catálogo"
                value={branchId}
                onChange={(e) => setBranchId(Number(e.target.value))}
              >
                {data.branches
                  .filter((b) => b.active)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      Sede {b.name} · {b.city}
                    </option>
                  ))}
              </select>
              <select
                aria-label="Tipo de medicamento"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">Todos los medicamentos</option>
                <option value="otc">Venta libre</option>
                <option value="rx">Con receta</option>
              </select>
            </div>
          </div>
          <div className="catalog-grid">
            {rows.map((s) => {
              const count =
                items.find((i) => i.stockId === s.id)?.quantity || 0;
              return (
                <article className="card product" key={s.id}>
                  <div className="product-top">
                    <span className="product-icon">
                      <Package size={27} />
                    </span>
                    <div className="badge-stack">
                      <Badge tone={s.drug.rx ? "dark" : "success"}>
                        {s.drug.controlled
                          ? "Rx Controlado"
                          : s.drug.rx
                            ? "Con receta"
                            : "Venta libre"}
                      </Badge>
                      <Badge tone={s.quantity > 0 ? "success" : "critical"} dot>
                        {s.quantity > 0 ? "Disponible" : "Agotado"}
                      </Badge>
                    </div>
                  </div>
                  <small>{s.drug.category}</small>
                  <h2>{s.drug.name}</h2>
                  <p>
                    {s.drug.ingredient} · {s.drug.form}
                  </p>
                  <div className="product-meta">
                    <span className="mono">{s.drug.code}</span>
                    <span>{s.quantity} unidades disponibles</span>
                  </div>
                  <div className="product-bottom">
                    <strong className="mono">{money(s.drug.price)}</strong>
                    {count ? (
                      <div className="qty">
                        <IconButton
                          label={`Quitar una unidad de ${s.drug.name}`}
                          disabled={saving}
                          onClick={() => change(s, -1)}
                        >
                          <Minus size={14} />
                        </IconButton>
                        <span className="mono">{count}</span>
                        <IconButton
                          label={`Añadir una unidad de ${s.drug.name}`}
                          disabled={saving || count >= s.quantity}
                          onClick={() => change(s, 1)}
                        >
                          <Plus size={14} />
                        </IconButton>
                      </div>
                    ) : (
                      <button
                        className="btn primary"
                        disabled={!s.quantity || saving || !loaded}
                        onClick={() => change(s, 1)}
                      >
                        <Plus size={15} />
                        Añadir
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {!rows.length && (
            <section className="card">
              <Empty
                title="No hay medicamentos disponibles en esta vista"
                icon={Package}
              >
                Prueba otra sede o cambia la búsqueda.
              </Empty>
            </section>
          )}
          <div className="callout info catalog-note">
            <LockKeyhole size={19} />
            <p>
              Los medicamentos con receta quedan sujetos a revisión del regente.
              El inventario se confirma al guardar la reserva.
            </p>
          </div>
        </section>
        <aside className="card cart">
          <header>
            <h2>
              <ShoppingBag size={20} />
              Tu Reserva
            </h2>
            <Badge>{items.reduce((n, i) => n + i.quantity, 0)} unidades</Badge>
          </header>
          {items.length ? (
            <form onSubmit={checkout}>
              <div className="cart-body">
                <small className="cart-branch">
                  Retiro en Sede{" "}
                  {data.branches.find((b) => b.id === cartBranch)?.name}
                </small>
                {items.map((i) => (
                  <div className="cart-item" key={i.stockId}>
                    <div>
                      <strong>{i.drug.name}</strong>
                      <small>
                        {i.quantity} × {money(i.drug.price)}
                      </small>
                    </div>
                    <strong className="mono">
                      {money(i.quantity * i.drug.price)}
                    </strong>
                    <IconButton
                      label={`Eliminar ${i.drug.name} de la reserva`}
                      disabled={saving}
                      onClick={() =>
                        save(cart.filter((c) => c.stockId !== i.stockId)).catch(
                          (e) => notify(e.message, "error"),
                        )
                      }
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  </div>
                ))}
                {rx && (
                  <div className="cart-rx">
                    <div className="callout warning">
                      <AlertTriangle size={17} />
                      <p>
                        Tu reserva incluye medicamentos que requieren receta.
                      </p>
                    </div>
                    <Field
                      label="Adjuntar receta"
                      help="PNG, JPG o WebP · máximo 2 MB"
                    >
                      <div className="upload">
                        <Upload size={20} />
                        <span>
                          {image ? (
                            <>
                              <Check size={15} />
                              Receta adjunta
                            </>
                          ) : (
                            "Seleccionar imagen de receta"
                          )}
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={attach}
                          aria-label="Imagen de la receta"
                          required={!image}
                        />
                      </div>
                    </Field>
                    {image && (
                      <img
                        className="attachment-preview"
                        src={image}
                        alt="Receta adjunta"
                      />
                    )}
                    <Field label="Médico prescriptor (opcional)">
                      <input
                        value={doctor}
                        onChange={(e) => setDoctor(e.target.value)}
                        maxLength={120}
                        placeholder="Nombre del médico"
                      />
                    </Field>
                    <Field label="Cédula profesional (opcional)">
                      <input
                        value={license}
                        onChange={(e) => setLicense(e.target.value)}
                        maxLength={60}
                      />
                    </Field>
                  </div>
                )}
                <div className="cart-total">
                  <span>Total</span>
                  <strong className="mono">{money(cartTotal)}</strong>
                </div>
                <p className="cart-help">
                  El pago se realiza en la farmacia al retirar.
                </p>
                <button className="btn primary full" disabled={saving}>
                  {saving ? (
                    <LoaderCircle className="spin" size={16} />
                  ) : (
                    <ShoppingBag size={16} />
                  )}
                  Revisar reserva
                </button>
              </div>
            </form>
          ) : (
            <Empty title="Tu reserva está vacía" icon={ShoppingBag}>
              Añade medicamentos para preparar tu pedido.
            </Empty>
          )}
        </aside>
      </div>
      {confirm?.type === "replace" && (
        <Confirm
          title="Cambiar sede de retiro"
          message="Solo puedes reservar productos de una sede por pedido. Se reemplazará tu selección actual por el medicamento de la nueva sede."
          label="Cambiar sede"
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            await save([{ stockId: confirm.stock.id, quantity: 1 }]);
          }}
        />
      )}
      {confirm?.type === "reserve" && (
        <Confirm
          title="Confirmar reserva"
          message={`Reserva ${items.reduce((n, i) => n + i.quantity, 0)} unidades por ${money(cartTotal)} en Sede ${data.branches.find((b) => b.id === cartBranch)?.name}. ${rx ? "La receta quedará pendiente de auditoría." : "Tu pedido quedará listo para retiro."}`}
          label="Guardar reserva"
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            await run({
              type: "reserve",
              branchId: cartBranch,
              items: cart,
              image,
              doctor,
              license,
            });
            try {
              await remove(key);
            } catch {
              notify(
                "Reserva guardada. No fue posible limpiar el carrito local.",
                "error",
              );
            }
            setCart([]);
            notify("Reserva guardada. Consulta tu código en Mis reservas.");
            navigate("orders");
          }}
        />
      )}
    </>
  );
}
