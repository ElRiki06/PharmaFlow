import { useState } from "react";
import { ArrowRightLeft, PackagePlus } from "lucide-react";
import { useApp } from "../lib/context.js";
import { Confirm, Field, Modal } from "./Ui.jsx";

export default function StockDialog({ type, row, onClose }) {
  const { data, run, notify, prefs } = useApp();
  const [stockId, setStockId] = useState(row?.id || data.stock[0]?.id || 0);
  const stock = data.stock.find((s) => s.id === Number(stockId));
  const drug = data.drugs.find((d) => d.id === stock?.drugId);
  const [quantity, setQuantity] = useState(
    type === "adjust" ? row?.quantity || 0 : 1,
  );
  const [branchId, setBranchId] = useState(
    data.branches.find((b) => b.active && b.id !== stock?.branchId)?.id ||
      prefs.branchId,
  );
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(null);
  function submit(e) {
    e.preventDefault();
    setConfirm({
      type,
      id: stock.id,
      quantity: Number(quantity),
      branchId: Number(branchId),
      note,
    });
  }
  if (confirm)
    return (
      <Confirm
        title={
          type === "adjust"
            ? "Confirmar ajuste de existencias"
            : "Confirmar transferencia"
        }
        message={
          type === "adjust"
            ? `${drug.name}: cambiar las unidades disponibles de ${stock.quantity} a ${quantity}. Motivo: ${note}`
            : `Transferir ${quantity} unidades de ${drug.name} a Sede ${data.branches.find((b) => b.id === Number(branchId))?.name}.`
        }
        label={type === "adjust" ? "Guardar ajuste" : "Transferir unidades"}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await run(confirm);
          notify(
            type === "adjust"
              ? "Existencias actualizadas."
              : "Transferencia completada.",
          );
          onClose();
        }}
      />
    );
  return (
    <Modal
      title={
        type === "adjust" ? "Ajustar existencias" : "Transferencia entre sedes"
      }
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="modal-body form-grid">
          {!row && (
            <Field label="Medicamento / sede de origen">
              <select
                value={stockId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setStockId(id);
                  const s = data.stock.find((s) => s.id === id);
                  setBranchId(
                    data.branches.find((b) => b.active && b.id !== s.branchId)
                      ?.id || "",
                  );
                }}
              >
                {data.stock.map((s) => (
                  <option value={s.id} key={s.id}>
                    {data.drugs.find((d) => d.id === s.drugId)?.name} ·{" "}
                    {data.branches.find((b) => b.id === s.branchId)?.name} ·{" "}
                    {s.lot}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <div className="stock-summary">
            <span className="section-icon info">
              {type === "adjust" ? (
                <PackagePlus size={22} />
              ) : (
                <ArrowRightLeft size={22} />
              )}
            </span>
            <div>
              <strong>{drug?.name}</strong>
              <small>
                {stock?.lot} · Sede{" "}
                {data.branches.find((b) => b.id === stock?.branchId)?.name}
              </small>
            </div>
            <b className="mono">{stock?.quantity} uds</b>
          </div>
          {type === "transfer" && (
            <Field label="Sede de destino">
              <select
                value={branchId}
                onChange={(e) => setBranchId(Number(e.target.value))}
                required
              >
                <option value="">Seleccionar sede</option>
                {data.branches
                  .filter((b) => b.active && b.id !== stock?.branchId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} · {b.city}
                    </option>
                  ))}
              </select>
            </Field>
          )}
          <Field
            label={
              type === "adjust"
                ? "Nueva cantidad disponible"
                : "Unidades a transferir"
            }
            help={
              type === "adjust"
                ? "Introduce el conteo físico final del lote."
                : `Máximo disponible: ${stock?.quantity} unidades.`
            }
          >
            <input
              type="number"
              min={type === "adjust" ? 0 : 1}
              max={type === "adjust" ? 1000000 : stock?.quantity}
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </Field>
          <Field label="Motivo del movimiento">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Conteo físico de cierre / Reposición de sede"
              minLength={3}
              maxLength={1000}
              required
              rows={3}
            />
          </Field>
        </div>
        <footer>
          <button className="btn secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary">
            Revisar {type === "adjust" ? "ajuste" : "transferencia"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
