import { useState } from "react";
import {
  Building2,
  MapPin,
  Pencil,
  Phone,
  RotateCcw,
  ShieldCheck,
  Volume2,
} from "lucide-react";
import { useApp } from "../lib/context.js";
import { Badge, Confirm, Field, Modal, PageHead } from "../components/Ui.jsx";

export default function Settings() {
  const { data, prefs, savePrefs, reset, run, notify, mode } = useApp();
  const [branch, setBranch] = useState(null);
  const [confirm, setConfirm] = useState(null);
  function submit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setConfirm({
      type: "branch",
      id: branch.id,
      name: form.get("name"),
      address: form.get("address"),
      phone: form.get("phone"),
      active: form.has("active"),
    });
    setBranch(null);
  }
  return (
    <>
      <PageHead tag="Administración de la red" title="Configuración de Sedes">
        Gestiona datos de contacto, disponibilidad y preferencias del espacio de
        trabajo.
      </PageHead>
      <div className="branch-grid">
        {data.branches.map((b) => (
          <section className="card branch-card" key={b.id}>
            <header>
              <span className="section-icon info">
                <Building2 size={24} />
              </span>
              <Badge tone={b.active ? "success" : "neutral"} dot>
                {b.active ? "Operativa" : "Inactiva"}
              </Badge>
            </header>
            <h2>Sede {b.name}</h2>
            <p>{b.city}</p>
            <div className="info-line">
              <MapPin size={17} />
              <span>{b.address}</span>
            </div>
            <div className="info-line">
              <Phone size={16} />
              {b.phone}
            </div>
            <div className="branch-numbers">
              <div>
                <strong className="mono">
                  {data.stock
                    .filter((s) => s.branchId === b.id)
                    .reduce((n, s) => n + s.quantity, 0)
                    .toLocaleString()}
                </strong>
                <small>Unidades disponibles</small>
              </div>
              <div>
                <strong className="mono">
                  {
                    data.orders.filter(
                      (o) =>
                        o.branchId === b.id &&
                        ["ready", "pending"].includes(o.status),
                    ).length
                  }
                </strong>
                <small>Reservas activas</small>
              </div>
            </div>
            <button className="btn secondary full" onClick={() => setBranch(b)}>
              <Pencil size={15} />
              Editar sede
            </button>
          </section>
        ))}
      </div>
      <section className="card settings-card">
        <h2>Preferencias de operación</h2>
        <div className="setting-row">
          <div>
            <h3>
              <Volume2 size={18} />
              Alertas sonoras
            </h3>
            <p>Reproducir una señal breve al registrar una operación.</p>
          </div>
          <label className="switch-label">
            <input
              type="checkbox"
              role="switch"
              aria-label="Activar alertas sonoras"
              checked={prefs.sound}
              onChange={(e) =>
                savePrefs({ sound: e.target.checked }).catch((e) =>
                  notify(e.message, "error"),
                )
              }
            />
            <span className="switch" />
          </label>
        </div>
        <div className="setting-row">
          <div>
            <h3>
              <ShieldCheck size={18} />
              Control de acceso
            </h3>
            <p>
              Clientes: catálogo y reservas propias. Empleados: operaciones y
              auditoría.
            </p>
          </div>
          <Badge tone="success" dot>
            Roles activos
          </Badge>
        </div>
        <div className="setting-row">
          <div>
            <h3>
              <Building2 size={18} />
              Fuente de datos
            </h3>
            <p>
              {mode === "demo"
                ? "Datos ficticios guardados en el navegador con AsyncStorage."
                : "API PHP con persistencia en MySQL. Preferencias locales en AsyncStorage."}
            </p>
          </div>
          <Badge tone="info">
            {mode === "demo" ? "Demostración" : "PHP / MySQL"}
          </Badge>
        </div>
      </section>
      {mode === "demo" && (
        <section className="card reset-card">
          <div>
            <h2>Restablecer entorno de prueba</h2>
            <p>
              Vuelve a los medicamentos, reservas y sedes iniciales. Borra los
              cambios y carritos locales de las dos cuentas de prueba.
            </p>
          </div>
          <button
            className="btn danger"
            onClick={() => setConfirm({ type: "reset" })}
          >
            <RotateCcw size={16} />
            Restablecer datos de prueba
          </button>
        </section>
      )}
      {branch && (
        <Modal
          title={`Editar Sede ${branch.name}`}
          onClose={() => setBranch(null)}
        >
          <form onSubmit={submit}>
            <div className="modal-body form-grid">
              <Field label="Nombre de la sede">
                <input
                  name="name"
                  defaultValue={branch.name}
                  minLength={2}
                  maxLength={80}
                  required
                />
              </Field>
              <Field label="Dirección">
                <input
                  name="address"
                  defaultValue={branch.address}
                  minLength={5}
                  maxLength={200}
                  required
                />
              </Field>
              <Field label="Teléfono">
                <input
                  name="phone"
                  defaultValue={branch.phone}
                  minLength={7}
                  maxLength={20}
                  required
                />
              </Field>
              <label className="check-label">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={branch.active}
                />
                Sede operativa
              </label>
              <small className="muted">
                Una sede con reservas activas no puede deshabilitarse.
              </small>
            </div>
            <footer>
              <button
                className="btn secondary"
                type="button"
                onClick={() => setBranch(null)}
              >
                Cancelar
              </button>
              <button className="btn primary">Revisar cambios</button>
            </footer>
          </form>
        </Modal>
      )}
      {confirm && (
        <Confirm
          title={
            confirm.type === "reset"
              ? "Restablecer datos de prueba"
              : "Guardar configuración de sede"
          }
          message={
            confirm.type === "reset"
              ? "Se eliminarán los cambios locales de inventario, las nuevas reservas y los dictámenes de prueba. Confirma que deseas volver a los datos iniciales."
              : `Se actualizarán los datos de Sede ${confirm.name}. La sede quedará ${confirm.active ? "operativa" : "inactiva"}.`
          }
          label={
            confirm.type === "reset" ? "Restablecer datos" : "Guardar cambios"
          }
          danger={confirm.type === "reset"}
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            if (confirm.type === "reset") await reset();
            else {
              await run(confirm);
              notify("Sede actualizada.");
            }
          }}
        />
      )}
    </>
  );
}
