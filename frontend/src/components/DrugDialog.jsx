import { useState } from "react";
import { useApp } from "../lib/context.js";
import { Confirm, Field, Modal } from "./Ui.jsx";

export default function DrugDialog({ onClose }) {
  const { data, prefs, run, notify } = useApp();
  const [confirm, setConfirm] = useState(null);
  function submit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setConfirm({
      type: "drug",
      drug: {
        name: form.get("name"),
        ingredient: form.get("ingredient"),
        code: form.get("code"),
        form: form.get("form"),
        category: form.get("category"),
        price: Number(form.get("price")),
        rx: form.has("rx"),
        controlled: form.has("controlled"),
      },
      branchId: Number(form.get("branch")),
      quantity: Number(form.get("quantity")),
      minimum: Number(form.get("minimum")),
      lot: form.get("lot"),
      expiry: form.get("expiry"),
    });
  }
  if (confirm)
    return (
      <Confirm
        title="Registrar medicamento"
        message={`Se añadirá ${confirm.drug.name} con ${confirm.quantity} unidades en Sede ${data.branches.find((b) => b.id === confirm.branchId)?.name}.`}
        label="Guardar medicamento"
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await run(confirm);
          notify("Medicamento registrado.");
          onClose();
        }}
      />
    );
  return (
    <Modal title="Añadir Nuevo Medicamento" onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="modal-body form-grid two">
          <Field label="Nombre comercial">
            <input
              name="name"
              minLength={3}
              maxLength={120}
              required
              placeholder="Ej. Loratadina 10mg"
            />
          </Field>
          <Field label="Principio activo">
            <input name="ingredient" maxLength={120} required />
          </Field>
          <Field label="Código ATC">
            <input name="code" maxLength={30} required />
          </Field>
          <Field label="Presentación">
            <input
              name="form"
              maxLength={120}
              required
              placeholder="Tabletas (caja x10)"
            />
          </Field>
          <Field label="Categoría">
            <select name="category">
              {[
                "Antibióticos",
                "Analgésicos",
                "Psicotrópicos",
                "Cardiovasculares",
                "Refrigerados",
                "Respiratorios",
                "Otros",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Precio unitario (USD)">
            <input
              type="number"
              name="price"
              step="0.01"
              min="0.01"
              max="100000"
              required
            />
          </Field>
          <Field label="Sede de ingreso">
            <select name="branch" defaultValue={prefs.branchId}>
              {data.branches
                .filter((b) => b.active)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Lote">
            <input name="lot" maxLength={60} required />
          </Field>
          <Field label="Fecha de vencimiento">
            <input
              type="date"
              name="expiry"
              min={new Date().toISOString().slice(0, 10)}
              required
            />
          </Field>
          <Field label="Existencias iniciales">
            <input
              type="number"
              name="quantity"
              min="0"
              max="1000000"
              step="1"
              defaultValue="0"
              required
            />
          </Field>
          <Field label="Umbral mínimo">
            <input
              type="number"
              name="minimum"
              min="1"
              max="1000000"
              step="1"
              defaultValue="10"
              required
            />
          </Field>
          <div className="checks">
            <label>
              <input type="checkbox" name="rx" />
              Requiere receta (Rx)
            </label>
            <label>
              <input type="checkbox" name="controlled" />
              Medicamento controlado
            </label>
          </div>
        </div>
        <footer>
          <button className="btn secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary">Revisar medicamento</button>
        </footer>
      </form>
    </Modal>
  );
}
