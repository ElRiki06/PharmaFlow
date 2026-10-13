import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Contrast,
  FileImage,
  Gavel,
  Maximize2,
  Minus,
  Plus,
  RotateCw,
  ShieldCheck,
  Stethoscope,
  Store,
  UserRound,
  XCircle,
} from "lucide-react";
import { useApp } from "../lib/context.js";
import { age } from "../lib/domain.js";
import {
  Badge,
  Confirm,
  Empty,
  Field,
  IconButton,
  Modal,
} from "../components/Ui.jsx";

function Review({ order, navigate }) {
  const { data, user, run, notify, mode } = useApp();
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [contrast, setContrast] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [decision, setDecision] = useState(null);
  const [error, setError] = useState("");
  const branch = data.branches.find((b) => b.id === order.branchId);
  const sample = order.image === "/prescription.svg";
  function decide(value) {
    if (note.trim().length < 3) {
      setError("Registra una nota de auditoría de al menos 3 caracteres.");
      return;
    }
    if (value === "rejected" && !reason) {
      setError("Selecciona el motivo del rechazo.");
      return;
    }
    setError("");
    setDecision(value);
  }
  return (
    <>
      <div className="audit-split">
        <section className="viewer card">
          <div className="viewer-head">
            <FileImage size={23} />
            <div>
              <strong className="mono">
                {sample
                  ? "receta_demostracion.svg"
                  : `receta_orden_${order.id}`}
              </strong>
              <small>
                {sample
                  ? "Documento de muestra · sin validez clínica"
                  : "Imagen adjunta por el solicitante"}
              </small>
            </div>
          </div>
          <div className="viewer-tools">
            <IconButton
              label="Reducir zoom"
              disabled={zoom <= 50}
              onClick={() => setZoom(Math.max(50, zoom - 25))}
            >
              <Minus size={17} />
            </IconButton>
            <span className="mono">{zoom}%</span>
            <IconButton
              label="Aumentar zoom"
              disabled={zoom >= 250}
              onClick={() => setZoom(Math.min(250, zoom + 25))}
            >
              <Plus size={17} />
            </IconButton>
            <span className="tool-divider" />
            <IconButton
              label="Girar receta 90 grados"
              onClick={() => setRotation(rotation + 90)}
            >
              <RotateCw size={18} />
            </IconButton>
            <button
              className={`text-btn ${contrast ? "active-text" : ""}`}
              aria-pressed={contrast}
              onClick={() => setContrast(!contrast)}
            >
              <Contrast size={18} />
              Contraste Clínico
            </button>
            <IconButton
              label="Ampliar documento"
              onClick={() => setExpanded(true)}
            >
              <Maximize2 size={18} />
            </IconButton>
            <button
              className="text-btn reset-view"
              onClick={() => {
                setZoom(100);
                setRotation(0);
                setOffset({ x: 0, y: 0 });
              }}
            >
              Restablecer
            </button>
          </div>
          <div
            className="rx-canvas"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setDrag({ x: e.clientX - offset.x, y: e.clientY - offset.y });
            }}
            onPointerMove={(e) => {
              if (drag)
                setOffset({ x: e.clientX - drag.x, y: e.clientY - drag.y });
            }}
            onPointerUp={() => setDrag(null)}
            onPointerCancel={() => setDrag(null)}
          >
            <div className="viewer-flags">
              <Badge tone="dark">Inspección visual manual</Badge>
              <Badge tone="success">
                <ShieldCheck size={13} />
                {sample ? "Documento de ejemplo" : "Imagen disponible"}
              </Badge>
            </div>
            <img
              className="rx-image"
              src={order.image || "/prescription.svg"}
              alt={`Receta para revisión de la orden ${order.id}${sample ? ", documento de demostración" : ""}`}
              draggable="false"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
                filter: contrast ? "contrast(1.5) grayscale(1)" : "none",
              }}
            />
            <div className="canvas-status">
              <span>
                <span className="status-dot" />
                Escala: {zoom}%
              </span>
              <span>Arrastra para mover el documento</span>
              <span>RGB</span>
            </div>
          </div>
          <footer className="viewer-footer">
            <span>
              <FileImage size={15} />
              {sample
                ? "Datos ficticios de prueba"
                : "Documento aportado por cliente"}
            </span>
            <span className="mono">#RX-{order.id}</span>
          </footer>
        </section>
        <div className="decision-ledger">
          <section className="card ledger-card">
            <header>
              <h2>
                <UserRound size={19} />
                Ficha del Paciente
              </h2>
              <Badge tone="success">
                {
                  data.orders.filter(
                    (o) =>
                      o.userId === order.userId && o.status === "completed",
                  ).length
                }{" "}
                retiros registrados
              </Badge>
            </header>
            <div className="patient-grid">
              <div>
                <small>Nombre completo</small>
                <strong>{order.patient}</strong>
              </div>
              <div>
                <small>Documento ID</small>
                <strong className="mono">
                  DUI {order.dui || "Por verificar"}
                </strong>
              </div>
              <div>
                <small>Teléfono contacto</small>
                <strong className="mono">
                  {order.phone || "Por verificar"}
                </strong>
              </div>
              <div>
                <small>Recepción de receta</small>
                <strong>{age(order.createdAt)}</strong>
              </div>
            </div>
          </section>
          <section className="card ledger-card">
            <header>
              <h2>
                <Stethoscope size={20} />
                Médico Prescriptor
              </h2>
              <Badge tone="warning">Revisión manual</Badge>
            </header>
            <strong className="doctor-name">
              {order.doctor || "Por verificar"}
            </strong>
            <div className="info-pair">
              <span>Cédula profesional:</span>
              <strong className="mono">
                {order.license || "Por verificar"}
              </strong>
            </div>
            <div className="info-pair">
              <span>Estado de credenciales:</span>
              <span>Por verificar con el registro</span>
            </div>
            {sample && (
              <small className="muted">
                Datos del documento de demostración.
              </small>
            )}
          </section>
          <section className="card ledger-card medicines">
            <header>
              <h2>
                <ClipboardCheck size={19} />
                Fármacos Solicitados en la Orden
              </h2>
              <span className="mono muted">{order.items.length} ítems</span>
            </header>
            {order.items.map((i, index) => {
              const drug = data.drugs.find((d) => d.id === i.drugId);
              return (
                <div
                  className={`rx-drug ${drug.controlled ? "controlled" : ""}`}
                  key={i.stockId}
                >
                  <div>
                    <h3>
                      {index + 1}. {drug.name}
                    </h3>
                    {drug.controlled && (
                      <Badge tone="dark">Rx controlado</Badge>
                    )}
                    <strong className="mono">
                      {i.quantity} {i.quantity === 1 ? "unidad" : "unidades"}
                    </strong>
                  </div>
                  <p>Presentación: {drug.form}</p>
                  <p>
                    {drug.controlled ? (
                      <>
                        <AlertTriangle size={15} />
                        Medicamento controlado: comprobar requisitos y retener
                        el original cuando corresponda.
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        Verificar cantidad y condiciones indicadas.
                      </>
                    )}
                  </p>
                </div>
              );
            })}
            <div className="pickup-info">
              <Store size={17} />
              <span>Sede de retiro:</span>
              <strong>
                Sucursal {branch?.name} – {branch?.city}
              </strong>
              <Clock3 size={17} />
              <span>Estado de reserva:</span>
              <strong>En revisión farmacéutica</strong>
            </div>
          </section>
          <section className="card ledger-card verdict">
            <header>
              <h2>
                <Gavel size={21} />
                Dictamen del Regente Farmacéutico
              </h2>
              <small className="mono">
                {user.name}
                <br />
                (ID 8042)
              </small>
            </header>
            <Field label="Notas de auditoría">
              <textarea
                rows={4}
                placeholder="Registra la revisión y el fundamento de tu decisión..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={900}
              />
            </Field>
            <Field label="Motivo rápido en caso de rechazo">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">
                  Seleccionar causal de objeción (si aplica)
                </option>
                <option>Documento ilegible</option>
                <option>Datos del paciente incompletos</option>
                <option>Credenciales del médico no verificables</option>
                <option>Receta vencida</option>
                <option>Cantidad o medicamento no coincide</option>
                <option>Otros requisitos no cumplidos</option>
              </select>
            </Field>
            <div className="callout info">
              <ShieldCheck size={16} />
              <span>
                Responsable: {user.name} ·{" "}
                {mode === "demo"
                  ? "registro local de prueba"
                  : "registro de auditoría"}
              </span>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="verdict-actions">
              <button className="btn danger" onClick={() => decide("rejected")}>
                <XCircle size={18} />
                Rechazar Receta
              </button>
              <button className="btn approve" onClick={() => decide("ready")}>
                <CheckCircle2 size={18} />
                Aprobar y Habilitar
              </button>
            </div>
          </section>
        </div>
      </div>
      {expanded && (
        <Modal
          title={`Documento de la orden #RX-${order.id}`}
          onClose={() => setExpanded(false)}
          wide
        >
          <div className="expanded-rx">
            <img
              src={order.image || "/prescription.svg"}
              alt="Documento de receta ampliado"
            />
          </div>
        </Modal>
      )}
      {decision && (
        <Confirm
          title={
            decision === "ready"
              ? "Aprobar receta y habilitar retiro"
              : "Rechazar receta"
          }
          message={
            decision === "ready"
              ? `La orden #RX-${order.id} de ${order.patient} quedará lista para retirar. Confirma que completaste la revisión.`
              : `La orden #RX-${order.id} será rechazada y sus unidades volverán al inventario. Motivo: ${reason}.`
          }
          label={decision === "ready" ? "Aprobar receta" : "Rechazar receta"}
          danger={decision === "rejected"}
          onClose={() => setDecision(null)}
          onConfirm={async () => {
            await run({
              type: "review",
              id: order.id,
              decision,
              note: [reason, note].filter(Boolean).join(". "),
            });
            notify(
              decision === "ready"
                ? "Receta aprobada. Retiro habilitado."
                : "Receta rechazada. Existencias liberadas.",
            );
            navigate("audit");
          }}
        />
      )}
    </>
  );
}

export default function Audit({ initialId, navigate }) {
  const { data } = useApp();
  const queue = data.orders.filter((o) => o.status === "pending");
  const [id, setId] = useState(Number(initialId) || queue[0]?.id);
  const order = queue.find((o) => o.id === id) || queue[0];
  const index = queue.findIndex((o) => o.id === order?.id);
  if (!order)
    return (
      <section className="card">
        <Empty title="La cola de auditoría está al día" icon={CheckCircle2}>
          No hay recetas pendientes. Puedes consultar las decisiones en Reservas
          & Despachos.
        </Empty>
        <div className="empty-actions">
          <button className="btn primary" onClick={() => navigate("orders")}>
            Ver reservas
          </button>
        </div>
      </section>
    );
  return (
    <>
      <div className="audit-page-head">
        <div className="breadcrumb">
          Operaciones
          <ChevronRight size={14} />
          Recetas Pendientes
          <ChevronRight size={14} />
          <strong className="mono">Orden #RX-{order.id}</strong>
        </div>
        <div className="audit-title">
          <h1>Auditoría Médica y Validación de Recetas</h1>
          <Badge tone="warning" dot>
            En Revisión Farmacéutica
          </Badge>
        </div>
        <div className="audit-nav">
          <div>
            <button
              className="btn secondary"
              disabled={index === 0}
              onClick={() => setId(queue[index - 1].id)}
            >
              <ArrowLeft size={17} />
              Anterior
            </button>
            <span className="mono">
              {index + 1} de {queue.length} pendientes
            </span>
            <button
              className="btn secondary"
              disabled={index >= queue.length - 1}
              onClick={() => setId(queue[index + 1].id)}
            >
              Siguiente
              <ArrowRight size={17} />
            </button>
          </div>
          <select
            aria-label="Seleccionar receta pendiente"
            value={order.id}
            onChange={(e) => setId(Number(e.target.value))}
          >
            {queue.map((o) => (
              <option key={o.id} value={o.id}>
                #RX-{o.id} · {o.patient}
              </option>
            ))}
          </select>
          <button
            className="btn secondary"
            onClick={() => navigate("dashboard")}
          >
            Cerrar / Volver
          </button>
        </div>
      </div>
      <Review key={order.id} order={order} navigate={navigate} />
    </>
  );
}
