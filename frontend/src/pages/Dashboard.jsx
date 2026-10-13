import { useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileClock,
  Filter,
  Package,
  Plus,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Volume2,
} from "lucide-react";
import { useApp } from "../lib/context.js";
import { age, money, stockState, total } from "../lib/domain.js";
import { csv, download } from "../lib/files.js";
import { Badge, PageHead, Stat } from "../components/Ui.jsx";

function Spark({ color, points }) {
  return (
    <svg className="spark" viewBox="0 0 92 38" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Dashboard({ navigate }) {
  const { data, prefs, savePrefs, notify, mode } = useApp();
  const [feed, setFeed] = useState("all");
  const pending = data.orders.filter((o) => o.status === "pending");
  const active = data.orders.filter((o) =>
    ["pending", "ready"].includes(o.status),
  );
  const critical = data.stock.filter(
    (s) => stockState(s.quantity, s.minimum) === "critical",
  );
  const completed = data.orders.filter((o) => o.status === "completed");
  const events = data.events.filter(
    (e) => feed === "all" || e.branchId === Number(feed),
  );
  function report() {
    download(
      `pharmaflow-reporte-${new Date().toISOString().slice(0, 10)}.csv`,
      csv([
        ["Orden", "Paciente", "Sede", "Estado", "Total USD", "Fecha"],
        ...data.orders.map((o) => [
          o.id,
          o.patient,
          data.branches.find((b) => b.id === o.branchId)?.name,
          o.status,
          total(o).toFixed(2),
          o.createdAt,
        ]),
      ]),
    );
    notify("Reporte descargado.");
  }
  return (
    <>
      <PageHead
        tag={
          <>
            <span>Consola operacional</span>
            <i />
            Información de tus sedes
          </>
        }
        title="Panel General de Operaciones Farmacéuticas"
        actions={
          <>
            <button className="btn secondary" onClick={report}>
              <ArrowDownToLine size={16} />
              Descargar Reporte Diario
            </button>
            <button className="btn primary" onClick={() => navigate("catalog")}>
              <Plus size={18} />
              Nueva Orden Asistida
            </button>
          </>
        }
      >
        Monitoreo de reservas, auditoría de recetas y estado de existencias en
        sucursales.
      </PageHead>
      <div className="stats-grid dashboard-stats">
        <Stat
          label="Reservas activas"
          value={active.length.toString().padStart(2, "0")}
          icon={ShoppingBag}
          detail={
            <>
              <span className="status-dot" />
              {data.orders.length} órdenes registradas
            </>
          }
          tone="success"
          badge="En operación"
        >
          <Spark
            color="#059669"
            points="2,32 18,25 32,28 48,16 62,20 78,10 90,7"
          />
        </Stat>
        <Stat
          label="Recetas pendientes de auditoría"
          value={pending.length.toString().padStart(2, "0")}
          icon={ClipboardCheck}
          detail={
            <>
              <Clock3 size={13} />
              {pending.length
                ? "Requieren revisión del regente"
                : "Cola de revisión al día"}
            </>
          }
          tone="warning"
          badge="Revisión manual"
        >
          <span className="stat-unit">en cola</span>
        </Stat>
        <Stat
          label="Fármacos stock crítico"
          value={critical.length.toString().padStart(2, "0")}
          icon={Package}
          detail={
            <>
              <span className="status-dot red" />
              Umbral bajo · Reposición
            </>
          }
          tone="critical"
          badge="Atención"
        >
          <div className="mini-bars" aria-hidden="true">
            {[26, 18, 24, 34, 16].map((v, i) => (
              <i key={i} style={{ height: v }} />
            ))}
          </div>
        </Stat>
        <Stat
          label="Despachos completados"
          value={completed.length.toString().padStart(2, "0")}
          icon={QrCode}
          detail={
            <>
              <CheckCircle2 size={14} />
              Retiros registrados
            </>
          }
          tone="info"
          badge="Entregado"
        >
          <Spark
            color="#0369a1"
            points="2,26 15,33 29,13 45,20 60,10 78,6 90,2"
          />
        </Stat>
      </div>
      <div className="dashboard-grid">
        <section className="card audit-queue">
          <header className="card-head">
            <span className="section-icon warning">
              <ClipboardCheck size={22} />
            </span>
            <div>
              <h2>
                Cola de Auditoría Urgente de Recetas{" "}
                <Badge>{pending.length} pendientes</Badge>
              </h2>
              <p>Medicamentos sujetos a validación del regente farmacéutico.</p>
            </div>
            <button className="text-btn" onClick={() => navigate("audit")}>
              <Filter size={15} />
              Ver todas
              <ArrowRight size={17} />
            </button>
          </header>
          <div className="table-scroll">
            <table className="queue-table">
              <thead>
                <tr>
                  <th>ID orden</th>
                  <th>Paciente / DUI</th>
                  <th>Medicamento restringido</th>
                  <th>Tiempo</th>
                  <th>Sucursal</th>
                  <th>Prioridad</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pending.slice(0, 4).map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => navigate("audit", { id: o.id })}
                  >
                    <td>
                      <button
                        className="table-link mono"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("audit", { id: o.id });
                        }}
                      >
                        #RX-{o.id}
                      </button>
                    </td>
                    <td>
                      <strong>{o.patient}</strong>
                      <small className="mono">{o.dui}</small>
                    </td>
                    <td className="drug-stack">
                      {o.items.map((i) => {
                        const d = data.drugs.find((d) => d.id === i.drugId);
                        return (
                          <span
                            className={`drug-label ${d.controlled ? "restricted" : ""}`}
                            key={i.stockId}
                          >
                            {d.name}
                          </span>
                        );
                      })}
                    </td>
                    <td className="mono muted nowrap">{age(o.createdAt)}</td>
                    <td>
                      {data.branches.find((b) => b.id === o.branchId)?.name}
                    </td>
                    <td>
                      <Badge
                        tone={o.priority === "high" ? "critical" : "warning"}
                        dot
                      >
                        {o.priority === "high" ? "Alta" : "Normal"}
                      </Badge>
                    </td>
                    <td>
                      <ArrowRight size={15} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!pending.length && (
              <div className="empty">
                <CheckCircle2 size={26} />
                <h3>Todas las recetas están revisadas</h3>
                <p>Las nuevas solicitudes aparecerán aquí.</p>
              </div>
            )}
          </div>
          <footer className="queue-footer">
            <span className="status-dot" />
            <p>
              {mode === "demo"
                ? "Cola de demostración. Las decisiones se guardan en este navegador."
                : "Cada dictamen queda registrado con el usuario responsable."}
            </p>
            <button className="text-btn" onClick={() => navigate("audit")}>
              Revisar siguiente
              <ArrowRight size={16} />
            </button>
          </footer>
        </section>
        <section className="card activity-card">
          <header className="card-head">
            <span className="live-dot" />
            <div>
              <h2>Actividad Reciente</h2>
              <p>Operaciones de tus sucursales</p>
            </div>
            <Badge tone="success">{mode === "demo" ? "Local" : "API"}</Badge>
          </header>
          <div className="event-list">
            {events.slice(0, 5).map((e) => (
              <div className="event" key={e.id}>
                <span className={`event-icon ${e.kind}`}>
                  {e.kind === "critical" ? (
                    <Package size={18} />
                  ) : e.kind === "success" ? (
                    <QrCode size={18} />
                  ) : (
                    <ShieldCheck size={18} />
                  )}
                </span>
                <div>
                  <div className="event-title">
                    <strong>{e.title}</strong>
                    <time className="mono">
                      {age(e.createdAt).replace("Hace ", "")}
                    </time>
                  </div>
                  <p>{e.detail}</p>
                </div>
              </div>
            ))}
            {!events.length && (
              <p className="muted">No hay actividad en esta sede.</p>
            )}
          </div>
          <footer className="feed-footer">
            <label>
              Filtro de sede
              <select value={feed} onChange={(e) => setFeed(e.target.value)}>
                <option value="all">Todas las sucursales</option>
                {data.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <Activity size={16} />
          </footer>
        </section>
      </div>
      <div className="operations-strip">
        <div>
          <span className="section-icon info">
            <ShieldCheck size={24} />
          </span>
          <div>
            <h2>
              Trazabilidad & Control Farmacéutico{" "}
              <Badge tone="success">Activo</Badge>
            </h2>
            <p>
              Dictámenes, ajustes y movimientos registrados.{" "}
              <strong>
                {money(
                  data.stock.reduce(
                    (sum, s) =>
                      sum +
                      s.quantity *
                        data.drugs.find((d) => d.id === s.drugId).price,
                    0,
                  ),
                )}
              </strong>{" "}
              en existencias disponibles.
            </p>
          </div>
        </div>
        <label className="switch-label">
          <input
            type="checkbox"
            role="switch"
            checked={prefs.sound}
            onChange={(e) =>
              savePrefs({ sound: e.target.checked }).catch((e) =>
                notify(e.message, "error"),
              )
            }
          />
          <span className="switch" />
          <Volume2 size={16} />
          Alertas sonoras
        </label>
        <button className="text-btn" onClick={() => navigate("audit")}>
          <FileClock size={17} />
          Ver auditoría
          <ArrowUpRight size={15} />
        </button>
      </div>
    </>
  );
}
