import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRightLeft,
  Banknote,
  Building2,
  ChevronLeft,
  ChevronRight,
  FilterX,
  LockKeyhole,
  Package,
  PackagePlus,
  Plus,
  Search,
  ShieldCheck,
  Snowflake,
  Upload,
} from "lucide-react";
import { useApp } from "../lib/context.js";
import { isExpired, money, stockState } from "../lib/domain.js";
import { csv, download, parseStock } from "../lib/files.js";
import {
  Badge,
  Confirm,
  Empty,
  Field,
  IconButton,
  Modal,
  PageHead,
  Stat,
} from "../components/Ui.jsx";
import StockDialog from "../components/StockDialog.jsx";
import DrugDialog from "../components/DrugDialog.jsx";

const categories = [
  "Todos",
  "Antibióticos",
  "Analgésicos",
  "Psicotrópicos",
  "Cardiovasculares",
  "Venta Libre",
];
export default function Inventory({ initialQuery = "" }) {
  const { data, run, notify } = useApp();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("Todos");
  const [requirement, setRequirement] = useState("all");
  const [status, setStatus] = useState("all");
  const [branch, setBranch] = useState("all");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(8);
  const [dialog, setDialog] = useState(null);
  const [importData, setImportData] = useState(null);
  const input = useRef(null);
  const rows = data.stock.map((s) => ({
    ...s,
    drug: data.drugs.find((d) => d.id === s.drugId),
    branch: data.branches.find((b) => b.id === s.branchId),
    state: isExpired(s.expiry) ? "expired" : stockState(s.quantity, s.minimum),
  }));
  const filtered = rows.filter((s) => {
    const d = s.drug;
    return (
      `${d.name} ${d.ingredient} ${d.code} ${s.lot}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (category === "Todos" ||
        (category === "Venta Libre" ? !d.rx : d.category === category)) &&
      (requirement === "all" ||
        (requirement === "rx"
          ? d.rx
          : requirement === "controlled"
            ? d.controlled
            : !d.rx)) &&
      (status === "all" || s.state === status) &&
      (branch === "all" || s.branchId === Number(branch))
    );
  });
  const maxPage = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, maxPage);
  const visible = filtered.slice((current - 1) * size, current * size);
  function clear() {
    setQuery("");
    setCategory("Todos");
    setRequirement("all");
    setStatus("all");
    setBranch("all");
    setPage(1);
  }
  function exportStock() {
    download(
      "pharmaflow-inventario.csv",
      csv([
        [
          "Medicamento",
          "Código ATC",
          "Lote",
          "Sede",
          "Cantidad",
          "Mínimo",
          "Vencimiento",
          "Precio USD",
        ],
        ...filtered.map((s) => [
          s.drug.name,
          s.drug.code,
          s.lot,
          s.branch.name,
          s.quantity,
          s.minimum,
          s.expiry,
          s.drug.price,
        ]),
      ]),
    );
    notify("Inventario descargado.");
  }
  async function loadFile(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      if (file.size > 100000)
        throw new Error("El CSV debe pesar menos de 100 KB.");
      setImportData(parseStock(await file.text()));
      setDialog({ type: "importConfirm" });
    } catch (e) {
      notify(e.message, "error");
    }
  }
  return (
    <>
      <div className="breadcrumb">
        <span>
          <Building2 size={13} />
          Red Farmacéutica El Salvador
        </span>
        <i>/</i>
        <strong>Inventario Multisede</strong>
        <Badge tone="info">LIVE_STOCK v1.0</Badge>
        <div className="breadcrumb-end">
          <Badge tone="success" dot>
            {data.branches.filter((b) => b.active).length} sucursales activas
          </Badge>
          <Badge tone="critical" dot>
            {
              rows.filter((s) =>
                ["low", "critical", "expired"].includes(s.state),
              ).length
            }{" "}
            ítems en alerta
          </Badge>
        </div>
      </div>
      <div className="card inventory-head">
        <PageHead
          title="Control de Inventario Multisede y Lotes"
          actions={
            <>
              <button
                className="btn secondary"
                onClick={() => setDialog({ type: "import" })}
              >
                <Upload size={15} />
                Importar Lote CSV
              </button>
              <button
                className="btn secondary"
                onClick={() => setDialog({ type: "transfer" })}
              >
                <ArrowRightLeft size={15} />
                Transferencia entre Sedes
              </button>
              <button
                className="btn primary"
                onClick={() => setDialog({ type: "drug" })}
              >
                <PackagePlus size={16} />
                Añadir Nuevo Medicamento
              </button>
            </>
          }
        >
          Gestión de existencias físicas, umbrales de abastecimiento y
          distribución por farmacias.
        </PageHead>
      </div>
      <div className="stats-grid inventory-stats">
        <Stat
          label="SKUs totales activos"
          icon={PackagePlus}
          value={data.drugs.length.toLocaleString()}
          detail={`Distribuidos en ${data.branches.length} sedes metropolitanas`}
        />
        <Stat
          label="Unidades en mano"
          icon={Package}
          value={data.stock
            .reduce((n, s) => n + s.quantity, 0)
            .toLocaleString()}
          detail="Unidades disponibles después de reservas"
          tone="success"
        />
        <Stat
          label="Umbral crítico / agotado"
          icon={AlertTriangle}
          value={rows.filter((s) => s.state === "critical").length}
          detail={`${rows.filter((s) => s.state === "low").length} lotes adicionales con stock bajo`}
          tone="warning"
        />
        <Stat
          label="Valorización de stock"
          icon={Banknote}
          value={money(rows.reduce((n, s) => n + s.quantity * s.drug.price, 0))}
          detail="Precio de venta · USD"
        />
      </div>
      <section className="card filters">
        <div className="filter-search">
          <div className="search-input">
            <Search size={17} />
            <input
              aria-label="Filtrar inventario"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Filtrar por principio activo, código ATC o nombre comercial..."
            />
            {query && (
              <IconButton label="Borrar búsqueda" onClick={() => setQuery("")}>
                <FilterX size={15} />
              </IconButton>
            )}
          </div>
          <span className="mono">
            Mostrando {filtered.length} de {rows.length} lotes registrados
          </span>
          <IconButton
            label="Descargar inventario filtrado"
            onClick={exportStock}
          >
            <ArrowDownToLine size={18} />
          </IconButton>
        </div>
        <div className="tabs" aria-label="Categoría de medicamentos">
          {categories.map((c) => (
            <button
              aria-pressed={category === c}
              className={category === c ? "selected" : ""}
              key={c}
              onClick={() => {
                setCategory(c);
                setPage(1);
              }}
            >
              {c === "Psicotrópicos"
                ? "Psicotrópicos (Controlados)"
                : c === "Venta Libre"
                  ? "Venta Libre (OTC)"
                  : c}
            </button>
          ))}
        </div>
        <div className="filter-selects">
          <select
            aria-label="Requisito"
            value={requirement}
            onChange={(e) => {
              setRequirement(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Todos los Requisitos</option>
            <option value="rx">Requiere receta</option>
            <option value="controlled">Rx controlado</option>
            <option value="otc">Venta libre</option>
          </select>
          <select
            aria-label="Estado de existencias"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Todos los Estados</option>
            <option value="available">Disponible</option>
            <option value="low">Stock bajo</option>
            <option value="critical">Stock crítico</option>
            <option value="expired">Vencido</option>
          </select>
          <select
            aria-label="Sucursal de inventario"
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Todas las Sucursales</option>
            {data.branches.map((b) => (
              <option key={b.id} value={b.id}>
                Sede {b.name}
              </option>
            ))}
          </select>
          <button className="text-btn" onClick={clear}>
            <FilterX size={14} />
            Limpiar Filtros
          </button>
        </div>
      </section>
      <section className="card stock-table">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>
                  Medicamento /<br />
                  Principio activo
                </th>
                <th>Código ATC / Lote</th>
                <th>Categoría / Requisito</th>
                <th>Sucursal</th>
                <th className="right">Stock físico</th>
                <th className="right">Umbral mínimo</th>
                <th className="center">Estado</th>
                <th>Acciones rápidas</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr
                  key={s.id}
                  className={
                    s.state === "critical" || s.state === "expired"
                      ? "critical-row"
                      : s.state === "low"
                        ? "warning-row"
                        : ""
                  }
                >
                  <td>
                    <div className="drug-name">
                      <strong>{s.drug.name}</strong>
                      {s.drug.controlled ? (
                        <LockKeyhole size={13} />
                      ) : s.drug.category === "Refrigerados" ? (
                        <Snowflake size={14} />
                      ) : null}
                    </div>
                    <small>
                      {s.drug.ingredient} · {s.drug.form}
                    </small>
                  </td>
                  <td className="mono">
                    <strong>{s.drug.code}</strong>
                    <small>
                      Lote #{s.lot}
                      <br />
                      Exp:{" "}
                      {new Date(s.expiry + "T12:00:00").toLocaleDateString(
                        "es-SV",
                        { month: "2-digit", year: "numeric" },
                      )}
                    </small>
                  </td>
                  <td>
                    <div className="badge-stack">
                      <Badge
                        tone={
                          s.drug.controlled
                            ? "warning"
                            : s.drug.category === "Antibióticos"
                              ? "info"
                              : "neutral"
                        }
                      >
                        {s.drug.category}
                      </Badge>
                      <Badge tone={s.drug.rx ? "dark" : "success"}>
                        {s.drug.controlled
                          ? "Rx Controlado"
                          : s.drug.rx
                            ? "Rx"
                            : "Venta Libre"}
                      </Badge>
                    </div>
                  </td>
                  <td>
                    <span className="branch-tag">
                      Sede
                      <br />
                      {s.branch.name}
                    </span>
                  </td>
                  <td className="right">
                    <span className="mono">
                      {s.quantity.toLocaleString()}{" "}
                      <small className="unit">uds</small>
                    </span>
                    <div className={`stock-bar ${s.state}`}>
                      <i
                        style={{
                          width: `${Math.min(100, (s.quantity / (s.minimum * 5)) * 100)}%`,
                        }}
                      />
                    </div>
                  </td>
                  <td className="right mono">
                    {s.minimum} <small className="unit">uds</small>
                  </td>
                  <td className="center">
                    <Badge
                      tone={
                        s.state === "available"
                          ? "success"
                          : s.state === "low"
                            ? "warning"
                            : "critical"
                      }
                      dot
                    >
                      {
                        {
                          available: "Disponible",
                          low: "Stock Bajo",
                          critical: "Stock Crítico",
                          expired: "Vencido",
                        }[s.state]
                      }
                    </Badge>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn tiny secondary"
                        onClick={() => setDialog({ type: "adjust", row: s })}
                      >
                        +/- Ajustar
                      </button>
                      <button
                        className={`btn tiny ${s.state === "critical" ? "primary" : "secondary"}`}
                        onClick={() => setDialog({ type: "transfer", row: s })}
                      >
                        {s.state === "critical" ? "Transferir" : "Transferir"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <Empty title="No hay medicamentos que coincidan">
              Prueba otra búsqueda o limpia los filtros.
            </Empty>
          )}
        </div>
        <footer className="pagination">
          <label>
            Filas por página:
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option>8</option>
              <option>16</option>
              <option>24</option>
            </select>
          </label>
          <span>
            Página {current} de {maxPage} ({filtered.length} lotes)
          </span>
          <div>
            <button
              className="btn tiny secondary"
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft size={14} />
              Anterior
            </button>
            {Array.from({ length: Math.min(5, maxPage) }, (_, i) => i + 1).map(
              (p) => (
                <button
                  className={`page-btn ${current === p ? "selected" : ""}`}
                  key={p}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ),
            )}
            <button
              className="btn tiny secondary"
              disabled={current === maxPage}
              onClick={() => setPage(current + 1)}
            >
              Siguiente
              <ChevronRight size={14} />
            </button>
          </div>
        </footer>
      </section>
      <div className="inventory-bottom">
        <section className="card">
          <h3>
            <ArrowRightLeft size={18} />
            Distribución entre sedes<Badge tone="success">Activa</Badge>
          </h3>
          <p>
            Traslada unidades del mismo lote conservando fecha de vencimiento y
            trazabilidad.
          </p>
          <button
            className="text-btn"
            onClick={() => setDialog({ type: "transfer" })}
          >
            Nueva transferencia
            <Plus size={14} />
          </button>
        </section>
        <section className="card">
          <h3>
            <Snowflake size={18} />
            Productos refrigerados<Badge tone="info">2–8 °C</Badge>
          </h3>
          <p>
            Las condiciones de conservación deben comprobarse antes de la
            entrega.
          </p>
          <small>Monitoreo de sensores no conectado.</small>
        </section>
        <section className="card">
          <h3>
            <ShieldCheck size={18} />
            Control de medicamentos Rx
          </h3>
          <p>
            Los productos restringidos requieren receta y dictamen del regente
            para ser retirados.
          </p>
          <small>Auditoría manual con registro de decisiones.</small>
        </section>
      </div>
      <input
        ref={input}
        hidden
        type="file"
        accept=".csv,text/csv"
        onChange={loadFile}
      />
      {dialog && ["adjust", "transfer"].includes(dialog.type) && (
        <StockDialog
          type={dialog.type}
          row={dialog.row}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "drug" && (
        <DrugDialog onClose={() => setDialog(null)} />
      )}
      {dialog?.type === "import" && (
        <Modal title="Importar Lote CSV" onClose={() => setDialog(null)}>
          <div className="modal-body">
            <p>
              Actualiza las unidades y los umbrales de lotes existentes. Todos
              los cambios se guardan juntos después de confirmar.
            </p>
            <div className="callout info mono">
              id,quantity,minimum
              <br />
              1,340,80
              <br />
              2,14,25
            </div>
            <Field
              label="Formato de archivo"
              help="Hasta 500 filas · CSV UTF-8 · máximo 100 KB"
            >
              <button
                className="btn secondary"
                onClick={() =>
                  download(
                    "plantilla-stock.csv",
                    csv([
                      ["id", "quantity", "minimum"],
                      ...data.stock.map((s) => [s.id, s.quantity, s.minimum]),
                    ]),
                  )
                }
              >
                <ArrowDownToLine size={16} />
                Descargar plantilla actual
              </button>
            </Field>
          </div>
          <footer>
            <button className="btn secondary" onClick={() => setDialog(null)}>
              Cancelar
            </button>
            <button
              className="btn primary"
              onClick={() => input.current.click()}
            >
              <Upload size={16} />
              Seleccionar CSV
            </button>
          </footer>
        </Modal>
      )}
      {dialog?.type === "importConfirm" && (
        <Confirm
          title="Confirmar importación"
          message={`Se actualizarán las existencias y los umbrales de ${importData.length} lotes. Esta operación reemplaza los conteos actuales.`}
          label="Guardar importación"
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await run({ type: "import", rows: importData });
            notify("Importación completada.");
          }}
        />
      )}
    </>
  );
}
