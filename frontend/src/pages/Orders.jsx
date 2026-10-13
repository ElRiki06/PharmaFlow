import { useState } from "react";
import {
  ArrowDownToLine,
  ClipboardCheck,
  FileClock,
  PackageCheck,
  Plus,
  Search,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { useApp } from "../lib/context.js";
import { age, canAccess, money, total } from "../lib/domain.js";
import { download } from "../lib/files.js";
import {
  Badge,
  Confirm,
  Empty,
  Field,
  Modal,
  PageHead,
} from "../components/Ui.jsx";

const statuses = {
  pending: ["En revisión", "warning"],
  ready: ["Lista para retiro", "info"],
  completed: ["Entregada", "success"],
  rejected: ["Rechazada", "critical"],
  cancelled: ["Cancelada", "neutral"],
};

export default function Orders({ navigate }) {
  const { data, user, run, notify } = useApp();
  const employee = canAccess(user, "audit");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("all");
  const [dialog, setDialog] = useState(null);
  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState(null);
  const orders = data.orders.filter((o) => employee || o.userId === user.id);
  const visible = orders.filter(
    (o) =>
      (status === "all" || o.status === status) &&
      `${o.id} ${o.patient} ${o.dui}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (branch === "all" || o.branchId === Number(branch)),
  );
  const selected = dialog ? data.orders.find((o) => o.id === dialog.id) : null;
  const receipt = (o) =>
    download(
      `pharmaflow-orden-${o.id}.txt`,
      `PharmaFlow · Comprobante de reserva\nOrden #ORD-${o.id}\nPaciente: ${o.patient}\nSede: ${data.branches.find((b) => b.id === o.branchId)?.name}\nEstado: ${statuses[o.status][0]}\n${o.items.map((i) => `${i.quantity} x ${data.drugs.find((d) => d.id === i.drugId)?.name} · ${money(i.price * i.quantity)}`).join("\n")}\nTotal: ${money(total(o))}\nCódigo de retiro: ${o.pickupCode}\nPresenta tu documento de identidad al retirar.`,
      "text/plain;charset=utf-8",
    );
  return (
    <>
      <PageHead
        tag="Reservas y atención en mostrador"
        title={employee ? "Reservas & Despachos" : "Mis Reservas"}
        actions={
          <button className="btn primary" onClick={() => navigate("catalog")}>
            <Plus size={17} />
            {employee ? "Nueva Orden Asistida" : "Nueva reserva"}
          </button>
        }
      >
        {employee
          ? "Gestiona solicitudes, revisa su estado y confirma las entregas."
          : "Consulta el estado de tus pedidos y tu código de retiro."}
      </PageHead>
      <div className="order-summary">
        {[
          ["pending", FileClock],
          ["ready", ShoppingBag],
          ["completed", PackageCheck],
        ].map(([key, Icon]) => (
          <button className="card" key={key} onClick={() => setStatus(key)}>
            <span className={`section-icon ${statuses[key][1]}`}>
              <Icon size={20} />
            </span>
            <div>
              <strong className="mono">
                {orders.filter((o) => o.status === key).length}
              </strong>
              <p>{statuses[key][0]}</p>
            </div>
          </button>
        ))}
      </div>
      <section className="card filters">
        <div className="filter-search">
          <div className="search-input">
            <Search size={17} />
            <input
              placeholder="Buscar por orden, paciente o DUI..."
              aria-label="Buscar reservas"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            aria-label="Sede de las reservas"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          >
            <option value="all">Todas las sedes</option>
            {data.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="tabs">
          <button
            className={status === "all" ? "selected" : ""}
            onClick={() => setStatus("all")}
          >
            Todas <b>{orders.length}</b>
          </button>
          {Object.entries(statuses).map(([key, [name]]) => (
            <button
              key={key}
              className={status === key ? "selected" : ""}
              onClick={() => setStatus(key)}
            >
              {name} <b>{orders.filter((o) => o.status === key).length}</b>
            </button>
          ))}
        </div>
      </section>
      <section className="card">
        <div className="table-scroll">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Orden / Fecha</th>
                <th>Paciente</th>
                <th>Medicamentos</th>
                <th>Sede</th>
                <th>Estado</th>
                <th className="right">Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => (
                <tr key={o.id}>
                  <td>
                    <button
                      className="table-link mono"
                      onClick={() => setDialog({ type: "detail", id: o.id })}
                    >
                      #ORD-{o.id}
                    </button>
                    <small>{age(o.createdAt)}</small>
                  </td>
                  <td>
                    <strong>{o.patient}</strong>
                    <small className="mono">
                      {o.dui || "Documento por verificar"}
                    </small>
                  </td>
                  <td>
                    {o.items.map((i) => (
                      <small className="order-item" key={i.stockId}>
                        <b>{i.quantity}×</b>{" "}
                        {data.drugs.find((d) => d.id === i.drugId)?.name}
                      </small>
                    ))}
                  </td>
                  <td>
                    {data.branches.find((b) => b.id === o.branchId)?.name}
                  </td>
                  <td>
                    <Badge tone={statuses[o.status][1]} dot>
                      {statuses[o.status][0]}
                    </Badge>
                  </td>
                  <td className="right mono">{money(total(o))}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn tiny secondary"
                        onClick={() => setDialog({ type: "detail", id: o.id })}
                      >
                        Ver detalle
                      </button>
                      {employee && o.status === "pending" && (
                        <button
                          className="btn tiny primary"
                          onClick={() => navigate("audit", { id: o.id })}
                        >
                          <ClipboardCheck size={13} />
                          Auditar
                        </button>
                      )}
                      {employee && o.status === "ready" && (
                        <button
                          className="btn tiny primary"
                          onClick={() => {
                            setCode("");
                            setDialog({ type: "dispatch", id: o.id });
                          }}
                        >
                          Despachar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <Empty title="No hay reservas en esta vista" icon={ShoppingBag}>
              Cambia los filtros o crea tu primera reserva desde el catálogo.
            </Empty>
          )}
        </div>
        <footer className="table-foot">
          {visible.length} reservas · Las cancelaciones y los rechazos liberan
          las unidades reservadas.
        </footer>
      </section>
      {selected && dialog.type === "detail" && (
        <Modal
          title={`Detalle de Orden #ORD-${selected.id}`}
          onClose={() => setDialog(null)}
          wide
        >
          <div className="modal-body">
            <div className="detail-top">
              <div>
                <h3>{selected.patient}</h3>
                <p className="muted">
                  {selected.dui} · Sede{" "}
                  {data.branches.find((b) => b.id === selected.branchId)?.name}
                </p>
              </div>
              <Badge tone={statuses[selected.status][1]} dot>
                {statuses[selected.status][0]}
              </Badge>
            </div>
            <div className="detail-items">
              {selected.items.map((i) => (
                <div key={i.stockId}>
                  <span>
                    {i.quantity}×{" "}
                    {data.drugs.find((d) => d.id === i.drugId)?.name}
                  </span>
                  <strong className="mono">
                    {money(i.quantity * i.price)}
                  </strong>
                </div>
              ))}
              <div className="detail-total">
                <strong>Total de la reserva</strong>
                <strong className="mono">{money(total(selected))}</strong>
              </div>
            </div>
            {selected.status === "ready" && (
              <div className="pickup-code">
                <small>Código de retiro</small>
                <strong className="mono">{selected.pickupCode}</strong>
                <p>
                  Presenta este código y tu documento de identidad en la sede
                  seleccionada.
                </p>
              </div>
            )}
            {selected.note && (
              <div className="callout info">
                <FileClock size={16} />
                <p>{selected.note}</p>
              </div>
            )}
            {selected.status === "pending" && (
              <div className="callout warning">
                Tu receta está pendiente de revisión. Podrás retirar cuando sea
                aprobada.
              </div>
            )}
          </div>
          <footer>
            <button className="btn secondary" onClick={() => receipt(selected)}>
              <ArrowDownToLine size={16} />
              Comprobante
            </button>
            {["pending", "ready"].includes(selected.status) && (
              <button
                className="btn danger"
                onClick={() => {
                  setConfirm({ type: "cancel", id: selected.id });
                  setDialog(null);
                }}
              >
                <XCircle size={16} />
                Cancelar reserva
              </button>
            )}
            <button className="btn secondary" onClick={() => setDialog(null)}>
              Cerrar
            </button>
          </footer>
        </Modal>
      )}
      {selected && dialog.type === "dispatch" && (
        <Modal
          title={`Confirmar retiro #ORD-${selected.id}`}
          onClose={() => setDialog(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setConfirm({ type: "dispatch", id: selected.id, code });
              setDialog(null);
            }}
          >
            <div className="modal-body">
              <p>
                Verifica el documento de <strong>{selected.patient}</strong> y
                solicita su código de retiro.
              </p>
              <Field label="Código de retiro">
                <input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoComplete="off"
                  placeholder="PF-..."
                  maxLength={60}
                />
              </Field>
            </div>
            <footer>
              <button
                className="btn secondary"
                type="button"
                onClick={() => setDialog(null)}
              >
                Volver
              </button>
              <button className="btn primary">Revisar entrega</button>
            </footer>
          </form>
        </Modal>
      )}
      {confirm && (
        <Confirm
          title={
            confirm.type === "cancel" ? "Cancelar reserva" : "Registrar entrega"
          }
          message={
            confirm.type === "cancel"
              ? `La orden #ORD-${confirm.id} se cancelará y sus unidades volverán al inventario. Confirma la cancelación.`
              : `Confirma que verificaste la identidad y entregarás los medicamentos de la orden #ORD-${confirm.id}.`
          }
          danger={confirm.type === "cancel"}
          label={
            confirm.type === "cancel" ? "Cancelar reserva" : "Confirmar entrega"
          }
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            await run(confirm);
            notify(
              confirm.type === "cancel"
                ? "Reserva cancelada. Existencias liberadas."
                : "Entrega registrada.",
            );
          }}
        />
      )}
    </>
  );
}
