import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { useApp } from "./lib/context.js";
import { canAccess } from "./lib/domain.js";
import Shell from "./components/Shell.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Inventory from "./pages/Inventory.jsx";
import Audit from "./pages/Audit.jsx";
import Orders from "./pages/Orders.jsx";
import Catalog from "./pages/Catalog.jsx";
import Settings from "./pages/Settings.jsx";

function location() {
  const [page, query = ""] = window.location.hash.slice(1).split("?");
  return { page, params: Object.fromEntries(new URLSearchParams(query)) };
}

export default function App() {
  const { ready, user, toast } = useApp();
  const [route, setRoute] = useState(location);
  const [hidden, setHidden] = useState(null);
  useEffect(() => {
    const update = () => setRoute(location());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  function navigate(page, params = {}) {
    const query = new URLSearchParams(params).toString();
    const hash = `${page}${query ? "?" + query : ""}`;
    if (window.location.hash.slice(1) === hash) setRoute({ page, params });
    else window.location.hash = hash;
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  if (!ready)
    return (
      <div className="loading">
        <LoaderCircle size={28} className="spin" />
        <p>Preparando PharmaFlow...</p>
      </div>
    );
  const page = canAccess(user, route.page)
    ? route.page
    : canAccess(user, "dashboard")
      ? "dashboard"
      : "catalog";
  const props = {
    navigate,
    initialQuery: route.params.query || "",
    initialId: route.params.id,
  };
  const screens = {
    dashboard: Dashboard,
    inventory: Inventory,
    audit: Audit,
    orders: Orders,
    catalog: Catalog,
    settings: Settings,
  };
  const Screen = screens[page] || Dashboard;
  return (
    <>
      {user ? (
        <Shell page={page} navigate={navigate}>
          <Screen
            key={`${page}-${route.params.id || ""}-${route.params.query || ""}`}
            {...props}
          />
        </Shell>
      ) : (
        <Login />
      )}
      {toast && toast !== hidden && (
        <div
          className={`toast ${toast.kind}`}
          role={toast.kind === "error" ? "alert" : "status"}
        >
          {toast.kind === "error" ? (
            <TriangleAlert size={19} />
          ) : (
            <CheckCircle2 size={19} />
          )}
          <span>{toast.message}</span>
          <button
            aria-label="Cerrar notificación"
            onClick={() => setHidden(toast)}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
