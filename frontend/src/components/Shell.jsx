import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Sun,
  Moon,
  Bell,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileClock,
  LayoutDashboard,
  LogOut,
  Menu,
  PackagePlus,
  Search,
  ShoppingBag,
  ShieldCheck,
  X,
} from "lucide-react";
import { useApp } from "../lib/context.js";
import { canAccess, age } from "../lib/domain.js";
import { Badge, Confirm, IconButton, Modal } from "./Ui.jsx";

const links = [
  { id: "dashboard", label: "Dashboard / Métricas", icon: LayoutDashboard },
  { id: "orders", label: "Reservas & Despachos", icon: ShoppingBag },
  { id: "audit", label: "Auditoría de Recetas", icon: ClipboardCheck },
  { id: "inventory", label: "Inventario Multisede", icon: PackagePlus },
  { id: "settings", label: "Configuración Sedes", icon: Building2 },
];

export default function Shell({ page, navigate, children }) {
  const { data, user, prefs, savePrefs, signOut, notify, mode } = useApp();
  const [menu, setMenu] = useState(false);
  const [panel, setPanel] = useState(null);
  const search = useRef(null);
  const employee = canAccess(user, "dashboard");
  const pending = data.orders.filter((o) => o.status === "pending").length;
  const branch =
    data.branches.find((b) => b.id === prefs.branchId) || data.branches[0];
  useEffect(() => {
    function key(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        search.current?.focus();
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const go = (target, params) => {
    navigate(target, params);
    setMenu(false);
  };
  const nav = employee
    ? links
    : [
        { id: "catalog", label: "Catálogo de medicamentos", icon: PackagePlus },
        { id: "orders", label: "Mis reservas", icon: ShoppingBag },
      ];
  return (
    <div className="app-shell">
      {menu && <div className="nav-scrim" onClick={() => setMenu(false)} />}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <div className="brand">
          <img src="/logo.png" alt="PharmaFlow" />
          <div className="brand-version">
            PharmaFlow{" "}
            <span>
              OS <b>v1.0.0</b>
            </span>
            <small>Enterprise</small>
          </div>
          <IconButton label="Cerrar menú" onClick={() => setMenu(false)}>
            <X size={18} />
          </IconButton>
        </div>
        <div className="branch-status">
          <span className="status-dot" />
          <div>
            <small>{branch.active ? "Sede operativa" : "Sede inactiva"}</small>
            <strong>
              {branch.name} - {branch.city}
            </strong>
          </div>
          <CheckCircle2 size={14} />
        </div>
        <nav aria-label="Navegación principal">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              className={`nav-link ${page === id || (page === "catalog" && id === "orders" && employee) ? "active" : ""}`}
              aria-current={page === id ? "page" : undefined}
              key={id}
              onClick={() => go(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {employee && id === "orders" && (
                <Badge tone="warning">
                  {
                    data.orders.filter((o) =>
                      ["pending", "ready"].includes(o.status),
                    ).length
                  }
                </Badge>
              )}
              {id === "audit" && (
                <>
                  <span className="status-dot red" />
                  <Badge tone="critical">Rx</Badge>
                </>
              )}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="sync">
            <span className="status-dot" />
            {mode === "demo" ? "Datos locales" : "API PHP / MySQL"}
            <span>{mode === "demo" ? "Demo" : "Conectada"}</span>
          </div>
          <button className="nav-link" onClick={() => setPanel("protocol")}>
            <BookOpen size={18} />
            <span>Docs Protocolo</span>
            <ChevronDown className="turn" size={16} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <IconButton label="Abrir menú" onClick={() => setMenu(true)}>
            <Menu size={20} />
          </IconButton>
          <div className="branch-select">
            <Building2 size={19} />
            <select
              aria-label="Sede operativa"
              value={branch.id}
              onChange={(e) =>
                savePrefs({ branchId: Number(e.target.value) }).catch((e) =>
                  notify(e.message, "error"),
                )
              }
            >
              {data.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  Sede {b.name} ({b.city})
                </option>
              ))}
            </select>
            <ChevronDown size={15} />
          </div>
          <form
            className="global-search"
            onSubmit={(e) => {
              e.preventDefault();
              const query = new FormData(e.currentTarget).get("query");
              go(employee ? "inventory" : "catalog", { query });
            }}
          >
            <Search size={18} />
            <input
              ref={search}
              name="query"
              aria-label="Buscar medicamento"
              placeholder="Buscar fármaco, principio activo o código..."
            />
            <kbd>⌘ K</kbd>
          </form>
          {employee && (
            <button className="pending-banner" onClick={() => go("audit")}>
              <span className="status-dot amber" />
              {pending} recetas por auditar
            </button>
          )}
          <div className="top-actions">
            <label className="theme-switch" title="Cambiar apariencia">
              <Sun size={16} aria-hidden="true" />
              <input
                type="checkbox"
                role="switch"
                aria-label={prefs.theme === "dark" ? "Modo noche" : "Modo claro"}
                checked={prefs.theme === "dark"}
                onChange={(e) =>
                  savePrefs({ theme: e.target.checked ? "dark" : "light" }).catch((e) =>
                    notify(e.message, "error"),
                  )
                }
              />
              <span className="theme-track" />
              <Moon size={16} aria-hidden="true" />
            </label>
            <IconButton
              label="Ver notificaciones"
              onClick={() => setPanel("notifications")}
            >
              <Bell size={20} />
              {pending > 0 && <span className="notification-dot" />}
            </IconButton>
            <div className="top-divider" />
            <button className="profile" onClick={() => setPanel("profile")}>
              <span className="avatar">{employee ? "DC" : "EM"}</span>
              <div>
                <strong>
                  {user.name}
                  {employee ? ", PharmD" : ""}
                </strong>
                <div>
                  <Badge tone="info">{employee ? "Regente" : "Cliente"}</Badge>
                  <span className="mono">
                    ID {employee ? "8042" : user.id.toString().padStart(4, "0")}
                  </span>
                </div>
              </div>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>
        <main className="content" id="main-content">
          {children}
        </main>
        <footer className="app-footer">
          <span>PharmaFlow OS · Gestión farmacéutica</span>
          <span>
            <span className="status-dot" />
            {mode === "demo"
              ? "Demostración · datos ficticios"
              : "Conectado a PHP / MySQL"}
          </span>
        </footer>
      </div>
      {panel === "logout" && (
        <Confirm
          title="Cerrar sesión"
          message="Tu información guardada estará disponible cuando vuelvas a ingresar."
          label="Cerrar sesión"
          onClose={() => setPanel(null)}
          onConfirm={signOut}
        />
      )}
      {panel === "profile" && (
        <Modal title="Mi cuenta" onClose={() => setPanel(null)}>
          <div className="modal-body profile-details">
            <span className="avatar large">{employee ? "DC" : "EM"}</span>
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <Badge tone="info">
              {employee ? "Empleado · Regente farmacéutico" : "Cliente"}
            </Badge>
            <div className="info-line">
              <ShieldCheck size={17} />
              {employee
                ? "Acceso a operaciones y auditoría"
                : "Acceso a catálogo y reservas propias"}
            </div>
          </div>
          <footer>
            <button
              className="btn secondary"
              onClick={() => setPanel("logout")}
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </footer>
        </Modal>
      )}
      {panel === "notifications" && (
        <Modal title="Notificaciones" onClose={() => setPanel(null)}>
          <div className="modal-body notifications">
            {employee
              ? data.events.slice(0, 8).map((e) => (
                  <div className="event" key={e.id}>
                    <span className={`event-icon ${e.kind}`}>
                      <Activity size={17} />
                    </span>
                    <div>
                      <strong>{e.title}</strong>
                      <p>{e.detail}</p>
                      <small className="mono">{age(e.createdAt)}</small>
                    </div>
                  </div>
                ))
              : data.orders
                  .filter((o) => o.userId === user.id)
                  .map((o) => (
                    <button
                      className="notification-order"
                      key={o.id}
                      onClick={() => {
                        setPanel(null);
                        go("orders");
                      }}
                    >
                      <FileClock size={18} />
                      <span>
                        Orden #ORD-{o.id}
                        <small>
                          {o.status === "ready"
                            ? "Lista para retiro"
                            : o.status === "pending"
                              ? "En revisión"
                              : "Consulta el estado de tu reserva"}
                        </small>
                      </span>
                    </button>
                  ))}
          </div>
        </Modal>
      )}
      {panel === "protocol" && (
        <Modal title="Protocolo de operación" onClose={() => setPanel(null)}>
          <div className="modal-body protocol">
            <div className="callout info">
              <ShieldCheck size={20} />
              <p>
                La revisión es manual y debe realizarla personal autorizado. Los
                datos de demostración no tienen validez clínica.
              </p>
            </div>
            <h3>Validación de recetas</h3>
            <ol>
              <li>
                Confirmar identidad del paciente y legibilidad del documento.
              </li>
              <li>Comprobar datos del prescriptor y vigencia de la receta.</li>
              <li>
                Revisar medicamentos, cantidades y condiciones de entrega.
              </li>
              <li>
                Registrar el dictamen con su motivo. Retener el original cuando
                corresponda.
              </li>
            </ol>
            <h3>Entrega y trazabilidad</h3>
            <p>
              Las reservas descuentan las unidades disponibles. Rechazar o
              cancelar libera esas unidades. El despacho requiere el código de
              retiro y solo se registra una vez.
            </p>
            <div className="callout warning">
              OCR, firmas digitales y verificación normativa externa no están
              integrados.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
