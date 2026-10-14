import React, { useEffect, useState } from "react";
import { View, Text, Switch, TextInput, Pressable } from "react-native";
import { useApp } from "../lib/context.js";
import { isExpired, money, stockState } from "../lib/domain.js";
import { csv, download, parseStock, pickDocument } from "../lib/files.js";
import {
  Badge,
  Button,
  Card,
  Confirm,
  Empty,
  Field,
  DataTable,
  Icon,
  Metric,
  Modal,
  Select,
  useTheme,
  fonts,
} from "../components/Ui.jsx";

const categories = [
  "Todos",
  "Antibióticos",
  "Analgésicos",
  "Psicotrópicos",
  "Cardiovasculares",
  "Refrigerados",
  "Respiratorios",
  "Otros",
  "Venta Libre",
];
const labels = {
  available: "Disponible",
  low: "Stock bajo",
  critical: "Stock crítico",
  expired: "Vencido",
};
const options = (values) => values.map((value) => ({ value, label: value }));
const integer = (value, minimum = 0) =>
  String(value).trim() !== "" &&
  Number.isInteger(Number(value)) &&
  Number(value) >= minimum &&
  Number(value) <= 1000000;

function StockForm({ dialog, onClose }) {
  const { data, run, notify, busy } = useApp();
  const { colors } = useTheme();
  const [stockId, setStockId] = useState(
    String(dialog.row?.id || data.stock[0]?.id || ""),
  );
  const stock = data.stock.find((s) => s.id === Number(stockId));
  const drug = data.drugs.find((d) => d.id === stock?.drugId);
  const destinations = data.branches.filter(
    (b) => b.active && b.id !== stock?.branchId,
  );
  const [branchId, setBranchId] = useState(String(destinations[0]?.id || ""));
  const [quantity, setQuantity] = useState(
    String(dialog.type === "adjust" ? (stock?.quantity ?? 0) : 1),
  );
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(null);
  function selectStock(value) {
    setStockId(String(value));
    const next = data.stock.find((s) => s.id === Number(value));
    setBranchId(
      String(
        data.branches.find((b) => b.active && b.id !== next?.branchId)?.id ||
          "",
      ),
    );
    if (dialog.type === "adjust") setQuantity(String(next?.quantity ?? 0));
  }
  function review() {
    if (!stock) return notify("Selecciona un lote.", "error");
    if (!integer(quantity, dialog.type === "adjust" ? 0 : 1))
      return notify(
        "La cantidad debe ser un entero válido, máximo 1,000,000.",
        "error",
      );
    if (note.trim().length < 3)
      return notify("Escribe un motivo de al menos 3 caracteres.", "error");
    if (dialog.type === "transfer") {
      if (!destinations.some((b) => b.id === Number(branchId)))
        return notify("Selecciona otra sede activa.", "error");
      if (isExpired(stock.expiry))
        return notify("El lote está vencido.", "error");
      if (Number(quantity) > stock.quantity)
        return notify("No hay suficientes existencias.", "error");
    }
    setConfirm({
      type: dialog.type,
      id: stock.id,
      quantity: Number(quantity),
      branchId: Number(branchId),
      note: note.trim(),
    });
  }
  if (confirm)
    return (
      <Confirm
        title={
          dialog.type === "adjust"
            ? "Confirmar ajuste"
            : "Confirmar transferencia"
        }
        message={
          dialog.type === "adjust"
            ? `${drug?.name}: cambiar de ${stock?.quantity} a ${confirm.quantity} unidades. Motivo: ${confirm.note}`
            : `Transferir ${confirm.quantity} unidades de ${drug?.name}, lote ${stock?.lot}, a Sede ${data.branches.find((b) => b.id === confirm.branchId)?.name}. Motivo: ${confirm.note}`
        }
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await run(confirm);
          notify(
            dialog.type === "adjust"
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
        dialog.type === "adjust"
          ? "Ajustar existencias"
          : "Transferencia entre sedes"
      }
      onClose={onClose}
    >
      {!dialog.row && (
        <Select
          label="Medicamento / sede de origen / lote"
          value={stockId}
          onChange={selectStock}
          options={data.stock.map((s) => ({
            value: String(s.id),
            label: `${data.drugs.find((d) => d.id === s.drugId)?.name} · ${data.branches.find((b) => b.id === s.branchId)?.name} · ${s.lot}`,
          }))}
        />
      )}
      <Text style={{ color: colors.text, fontWeight: "700" }}>
        {drug?.name || "No hay lotes disponibles"}
      </Text>
      <Text style={{ color: colors.muted }}>
        {stock?.lot} · Sede{" "}
        {data.branches.find((b) => b.id === stock?.branchId)?.name} ·{" "}
        {stock?.quantity ?? 0} uds
      </Text>
      {dialog.type === "transfer" && (
        <Select
          label="Sede de destino"
          value={branchId}
          onChange={setBranchId}
          options={destinations.map((b) => ({
            value: String(b.id),
            label: `${b.name} · ${b.city}`,
          }))}
        />
      )}
      <Field
        label={
          dialog.type === "adjust"
            ? "Nueva cantidad disponible"
            : "Unidades a transferir"
        }
        keyboardType="number-pad"
        value={quantity}
        onChangeText={setQuantity}
        maxLength={7}
      />
      <Field
        label="Motivo del movimiento"
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={1000}
        placeholder="Conteo físico / Reposición de sede"
      />
      <Button
        title="Revisar movimiento"
        disabled={busy || !stock}
        onPress={review}
      />
    </Modal>
  );
}

function DrugForm({ onClose }) {
  const { data, prefs, run, notify, busy } = useApp();
  const { colors } = useTheme();
  const active = data.branches.filter((b) => b.active);
  const [form, setForm] = useState({
    name: "",
    ingredient: "",
    code: "",
    form: "",
    category: "Antibióticos",
    price: "",
    branchId: String(
      active.find((b) => b.id === prefs.branchId)?.id || active[0]?.id || "",
    ),
    lot: "",
    expiry: "",
    quantity: "0",
    minimum: "10",
    rx: false,
    controlled: false,
  });
  const [confirm, setConfirm] = useState(null);
  const update = (key, value) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  function review() {
    if (
      form.name.trim().length < 3 ||
      !form.ingredient.trim() ||
      !form.code.trim() ||
      !form.form.trim()
    )
      return notify(
        "Completa nombre, principio activo, código y presentación.",
        "error",
      );
    if (
      data.drugs.some(
        (d) => d.code.toLowerCase() === form.code.trim().toLowerCase(),
      )
    )
      return notify("El código ATC ya existe.", "error");
    if (
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) <= 0 ||
      Number(form.price) > 100000
    )
      return notify("Indica un precio válido, hasta $100,000.", "error");
    if (!integer(form.quantity) || !integer(form.minimum, 1))
      return notify(
        "Las existencias y el umbral deben ser enteros válidos.",
        "error",
      );
    const date = new Date(`${form.expiry}T12:00:00Z`);
    if (
      !form.lot.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(form.expiry) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== form.expiry ||
      isExpired(form.expiry)
    )
      return notify(
        "Indica un lote y vencimiento vigente (AAAA-MM-DD).",
        "error",
      );
    if (!active.some((b) => b.id === Number(form.branchId)))
      return notify("Selecciona una sede activa.", "error");
    setConfirm({
      type: "drug",
      drug: {
        name: form.name.trim(),
        ingredient: form.ingredient.trim(),
        code: form.code.trim(),
        form: form.form.trim(),
        category: form.category,
        price: Number(form.price),
        rx: form.rx || form.controlled,
        controlled: form.controlled,
      },
      branchId: Number(form.branchId),
      quantity: Number(form.quantity),
      minimum: Number(form.minimum),
      lot: form.lot.trim(),
      expiry: form.expiry,
    });
  }
  if (confirm)
    return (
      <Confirm
        title="Registrar medicamento"
        message={`Se añadirá ${confirm.drug.name} con ${confirm.quantity} unidades en Sede ${data.branches.find((b) => b.id === confirm.branchId)?.name}. Lote ${confirm.lot}, vencimiento ${confirm.expiry}.`}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await run(confirm);
          notify("Medicamento registrado.");
          onClose();
        }}
      />
    );
  return (
    <Modal title="Añadir nuevo medicamento" onClose={onClose}>
      {[
        ["name", "Nombre comercial", 120],
        ["ingredient", "Principio activo", 120],
        ["code", "Código ATC", 30],
        ["form", "Presentación", 120],
      ].map(([key, label, maxLength]) => (
        <Field
          key={key}
          label={label}
          value={form[key]}
          maxLength={maxLength}
          onChangeText={(value) => update(key, value)}
        />
      ))}
      <Select
        label="Categoría"
        value={form.category}
        onChange={(value) => update("category", value)}
        options={options(
          categories.filter((c) => !["Todos", "Venta Libre"].includes(c)),
        )}
      />
      <Field
        label="Precio unitario (USD)"
        keyboardType="decimal-pad"
        value={form.price}
        onChangeText={(value) => update("price", value)}
      />
      <Select
        label="Sede de ingreso"
        value={form.branchId}
        onChange={(value) => update("branchId", value)}
        options={active.map((b) => ({ value: String(b.id), label: b.name }))}
      />
      <Field
        label="Lote"
        value={form.lot}
        maxLength={60}
        onChangeText={(value) => update("lot", value)}
      />
      <Field
        label="Fecha de vencimiento (AAAA-MM-DD)"
        value={form.expiry}
        maxLength={10}
        placeholder="2027-12-31"
        onChangeText={(value) => update("expiry", value)}
      />
      <Field
        label="Existencias iniciales"
        value={form.quantity}
        keyboardType="number-pad"
        maxLength={7}
        onChangeText={(value) => update("quantity", value)}
      />
      <Field
        label="Umbral mínimo"
        value={form.minimum}
        keyboardType="number-pad"
        maxLength={7}
        onChangeText={(value) => update("minimum", value)}
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text style={{ color: colors.text, flex: 1 }}>
          Requiere receta (Rx)
        </Text>
        <Switch
          accessibilityLabel="Requiere receta"
          value={form.rx || form.controlled}
          disabled={form.controlled}
          onValueChange={(value) => update("rx", value)}
        />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text style={{ color: colors.text, flex: 1 }}>
          Medicamento controlado
        </Text>
        <Switch
          accessibilityLabel="Medicamento controlado"
          value={form.controlled}
          onValueChange={(value) => update("controlled", value)}
        />
      </View>
      <Button
        title="Revisar medicamento"
        disabled={busy || !active.length}
        onPress={review}
      />
    </Modal>
  );
}

export default function Inventory({ initialQuery = "" }) {
  const { data, run, notify, busy } = useApp();
  const { colors } = useTheme();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("Todos");
  const [requirement, setRequirement] = useState("all");
  const [status, setStatus] = useState("all");
  const [branch, setBranch] = useState("all");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(8);
  const [dialog, setDialog] = useState(null);
  const [importData, setImportData] = useState(null);
  const [picking, setPicking] = useState(false);
  const [width, setWidth] = useState(1100);
  useEffect(() => {
    setQuery(initialQuery);
    setPage(1);
  }, [initialQuery]);
  const text = { color: colors.text, fontFamily: fonts.regular, fontSize: 11 };
  const muted = { ...text, color: colors.muted, fontSize: 10, lineHeight: 15 };
  const rowStyle = {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  };
  const rows = data.stock
    .map((s) => ({
      ...s,
      drug: data.drugs.find((d) => d.id === s.drugId),
      branch: data.branches.find((b) => b.id === s.branchId),
      state: isExpired(s.expiry)
        ? "expired"
        : stockState(s.quantity, s.minimum),
    }))
    .filter((s) => s.drug && s.branch);
  const filtered = rows.filter(
    (s) =>
      `${s.drug.name} ${s.drug.ingredient} ${s.drug.code} ${s.lot}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (category === "Todos" ||
        (category === "Venta Libre"
          ? !s.drug.rx
          : s.drug.category === category)) &&
      (requirement === "all" ||
        (requirement === "rx"
          ? s.drug.rx
          : requirement === "controlled"
            ? s.drug.controlled
            : !s.drug.rx)) &&
      (status === "all" || s.state === status) &&
      (branch === "all" || s.branchId === Number(branch)),
  );
  const maxPage = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, maxPage);
  const visible = filtered.slice((current - 1) * size, current * size);
  const filter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };
  function clear() {
    setQuery("");
    setCategory("Todos");
    setRequirement("all");
    setStatus("all");
    setBranch("all");
    setPage(1);
  }
  async function exportRows(template = false) {
    try {
      await download(
        template ? "plantilla-stock.csv" : "pharmaflow-inventario.csv",
        csv(
          template
            ? [
                ["id", "quantity", "minimum"],
                ...data.stock.map((s) => [s.id, s.quantity, s.minimum]),
              ]
            : [
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
              ],
        ),
      );
      notify(template ? "Plantilla exportada." : "Inventario exportado.");
    } catch (e) {
      notify(e.message, "error");
    }
  }
  async function importFile() {
    setPicking(true);
    try {
      const content = await pickDocument();
      if (content === null || content === undefined) return;
      // UTF-8 byte length without relying on browser-only Blob or TextEncoder.
      const bytes = encodeURIComponent(content).replace(
        /%[A-F\d]{2}/gi,
        "x",
      ).length;
      if (bytes > 100000) throw new Error("El CSV debe pesar menos de 100 KB.");
      const parsed = parseStock(content);
      if (!parsed.length || parsed.length > 500)
        throw new Error("El archivo debe contener entre 1 y 500 filas.");
      if (new Set(parsed.map((s) => s.id)).size !== parsed.length)
        throw new Error("El archivo contiene filas duplicadas.");
      for (const s of parsed) {
        if (!data.stock.some((row) => row.id === s.id))
          throw new Error(`Existencia #${s.id} no encontrada.`);
        if (!integer(s.quantity) || !integer(s.minimum, 1))
          throw new Error(`Cantidades inválidas en existencia #${s.id}.`);
      }
      setImportData(parsed);
      setDialog({ type: "importConfirm" });
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setPicking(false);
    }
  }
  const columns = [
    {
      key: "drug",
      label: "Medicamento /\nPrincipio activo",
      width: 200,
      flex: 1.5,
    },
    { key: "lot", label: "Código ATC / Lote", width: 116 },
    { key: "category", label: "Categoría /\nRequisito", width: 122 },
    { key: "branch", label: "Sucursal", width: 82 },
    { key: "quantity", label: "Stock físico", width: 88, align: "right" },
    { key: "minimum", label: "Umbral mínimo", width: 86, align: "right" },
    { key: "state", label: "Estado", width: 104, align: "center" },
    { key: "actions", label: "Acciones rápidas", width: 180 },
  ];
  function cell(s, column) {
    const mono = { ...text, fontFamily: fonts.mono, fontSize: 10 };
    switch (column.key) {
      case "drug":
        return (
          <View style={{ gap: 4 }}>
            <View style={{ ...rowStyle, flexWrap: "nowrap" }}>
              <Text
                style={{
                  ...text,
                  fontFamily: fonts.medium,
                  fontSize: 12,
                  flex: 1,
                }}
              >
                {s.drug.name}
              </Text>
              {s.drug.controlled ? (
                <Icon name="LockKeyhole" size={13} color={colors.primary} />
              ) : s.drug.category === "Refrigerados" ? (
                <Icon name="Snowflake" size={14} color={colors.primary} />
              ) : null}
            </View>
            <Text style={muted}>
              {s.drug.ingredient} · {s.drug.form}
            </Text>
          </View>
        );
      case "lot":
        return (
          <View style={{ gap: 4 }}>
            <Text style={mono}>{s.drug.code}</Text>
            <Text style={{ ...muted, fontFamily: fonts.mono, fontSize: 9 }}>
              Lote #{s.lot}
              {"\n"}Exp:{" "}
              {new Date(s.expiry + "T12:00:00").toLocaleDateString("es-SV", {
                month: "2-digit",
                year: "numeric",
              })}
            </Text>
          </View>
        );
      case "category":
        return (
          <View style={{ gap: 4, alignItems: "flex-start" }}>
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
          </View>
        );
      case "branch":
        return (
          <Text
            style={{
              ...text,
              backgroundColor: colors.surfaceAlt,
              alignSelf: "flex-start",
              paddingHorizontal: 5,
              paddingVertical: 3,
              fontSize: 10,
              lineHeight: 15,
            }}
          >
            Sede{"\n"}
            {s.branch.name}
          </Text>
        );
      case "quantity":
        return (
          <View style={{ alignItems: "flex-end", gap: 7 }}>
            <Text style={mono}>
              {s.quantity.toLocaleString()}{" "}
              <Text style={{ ...muted, fontFamily: fonts.mono, fontSize: 9 }}>
                uds
              </Text>
            </Text>
            <View
              style={{
                width: 65,
                height: 4,
                backgroundColor: colors.surfaceAlt,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: 4,
                  minWidth: 3,
                  width:
                    Math.min(100, (s.quantity / (s.minimum * 5)) * 100) + "%",
                  backgroundColor:
                    s.state === "available"
                      ? colors.success
                      : s.state === "low"
                        ? "#d97706"
                        : colors.danger,
                }}
              />
            </View>
          </View>
        );
      case "minimum":
        return (
          <Text style={mono}>
            {s.minimum}{" "}
            <Text style={{ ...muted, fontFamily: fonts.mono, fontSize: 9 }}>
              uds
            </Text>
          </Text>
        );
      case "state":
        return (
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
            {labels[s.state]}
          </Badge>
        );
      default:
        return (
          <View style={{ flexDirection: "row", gap:12}}>
            <Button
              title="+/- Ajustar"
              size="small"
              disabled={busy}
              tone="secondary"
              onPress={() => setDialog({ type: "adjust", row: s, })}
            />
            <Button
              title="Transferir"
              size="small"
              disabled={busy || s.state === "expired" || !s.quantity}
              tone={s.state === "critical" ? "primary" : "secondary"}
              onPress={() => setDialog({ type: "transfer", row: s })}
            />
          </View>
        );
    }
  }
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ gap: 16 }}
    >
      <View style={{ ...rowStyle, marginBottom: 2 }}>
        <Icon name="Building2" size={13} color={colors.muted} />
        <Text style={muted}>Red Farmacéutica El Salvador</Text>
        <Text style={muted}>/</Text>
        <Text style={{ ...text, fontFamily: fonts.medium }}>
          Inventario Multisede
        </Text>
        <Badge tone="info">LIVE_STOCK v1.0</Badge>
        <View style={{ flex: 1 }} />
        <Badge tone="success" dot>
          {data.branches.filter((b) => b.active).length} sucursales activas
        </Badge>
        <Badge tone="critical" dot>
          {rows.filter((s) => s.state !== "available").length} ítems en alerta
        </Badge>
      </View>
      <Card style={{ padding: 22 }}>
        <View
          style={{
            flexDirection: width > 640 ? "row" : "column",
            alignItems: width > 640 ? "center" : "stretch",
            gap: 22,
          }}
        >
          <View style={{ flex: 1, gap: 8 }}>
            <Text
              accessibilityRole="header"
              style={{
                color: colors.text,
                fontFamily: fonts.bold,
                fontSize: width < 600 ? 20 : 23,
                lineHeight: 30,
                maxWidth: 530,
                letterSpacing: -0.5,
              }}
            >
              Control de Inventario Multisede y Lotes
            </Text>
            <Text
              style={{ ...muted, fontSize: 11, lineHeight: 17, maxWidth: 570 }}
            >
              Gestión de existencias físicas, umbrales de abastecimiento y
              distribución por farmacias.
            </Text>
          </View>
          <View style={{ gap: 5, alignItems: "flex-start" }}>
            <Button
              title="Importar Lote CSV"
              size="small"
              icon="Upload"
              tone="secondary"
              disabled={busy}
              onPress={() => setDialog({ type: "import" })}
            />
            <Button
              title="Transferencia entre Sedes"
              size="small"
              icon="ArrowRightLeft"
              tone="secondary"
              disabled={busy || !rows.length}
              onPress={() => setDialog({ type: "transfer" })}
            />
            <Button
              title="Añadir Nuevo Medicamento"
              size="small"
              icon="PackagePlus"
              disabled={busy}
              onPress={() => setDialog({ type: "drug" })}
            />
          </View>
        </View>
      </Card>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {[
          [
            "SKUs totales activos",
            data.drugs.length.toLocaleString(),
            "Distribuidos en " + data.branches.length + " sedes metropolitanas",
            "PackagePlus",
            "neutral",
          ],
          [
            "Unidades en mano",
            data.stock.reduce((sum, s) => sum + s.quantity, 0).toLocaleString(),
            "Unidades disponibles después de reservas",
            "Package",
            "success",
          ],
          [
            "Umbral crítico / agotado",
            rows.filter((s) => s.state === "critical").length,
            rows.filter((s) => s.state === "low").length +
              " lotes adicionales con stock bajo",
            "AlertTriangle",
            "warning",
          ],
          [
            "Valorización de stock",
            money(rows.reduce((sum, s) => sum + s.quantity * s.drug.price, 0)),
            "Precio de venta · USD",
            "Banknote",
            "neutral",
          ],
        ].map(([label, value, detail, icon, tone]) => (
          <View
            key={label}
            style={{ width: width < 820 ? (width - 14) / 2 : (width - 42) / 4 }}
          >
            <Metric
              label={label}
              value={value}
              detail={detail}
              icon={icon}
              tone={tone}
              compact
            />
          </View>
        ))}
      </View>
      <Card style={{ padding: 14, gap: 8 }}>
        <View style={{ ...rowStyle, marginBottom: 4 }}>
          <View
            style={{
              flex: 1,
              minWidth: 180,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 10,
              backgroundColor: colors.surfaceAlt,
              borderRadius: 3,
              gap: 8,
            }}
          >
            <Icon name="Search" size={17} color={colors.muted} />
            <TextInput
              accessibilityLabel="Filtrar inventario"
              placeholder="Filtrar por principio activo, código ATC o nombre comercial..."
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={filter(setQuery)}
              style={{ ...text, flex: 1, minHeight: 36 }}
            />
            {Boolean(query) && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Borrar búsqueda"
                onPress={filter(setQuery).bind(null, "")}
              >
                <Icon name="FilterX" size={15} color={colors.muted} />
              </Pressable>
            )}
          </View>
          <Text style={{ ...muted, fontFamily: fonts.mono, fontSize: 9 }}>
            Mostrando {filtered.length} de {rows.length} lotes registrados
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Descargar inventario filtrado"
            onPress={() => exportRows()}
            style={{ padding: 8, backgroundColor: colors.surfaceAlt }}
          >
            <Icon name="ArrowDownToLine" size={18} color={colors.muted} />
          </Pressable>
        </View>
        <View
          style={{
            ...rowStyle,
            gap: 4,
            backgroundColor: colors.surfaceAlt,
            padding: 3,
            borderRadius: 3,
            alignSelf: "flex-start",
          }}
        >
          {[
            "Todos",
            "Antibióticos",
            "Analgésicos",
            "Psicotrópicos",
            "Cardiovasculares",
            "Venta Libre",
          ].map((c) => (
            <Pressable
              key={c}
              accessibilityRole="button"
              accessibilityState={{ selected: category === c }}
              onPress={() => filter(setCategory)(c)}
              style={{
                minHeight: 29,
                justifyContent: "center",
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: 3,
                borderWidth: 1,
                borderColor: category === c ? colors.border : "transparent",
                backgroundColor: category === c ? colors.panel : "transparent",
              }}
            >
              <Text
                style={{
                  ...text,
                  color: category === c ? colors.text : colors.muted,
                  fontSize: 10,
                }}
              >
                {c === "Psicotrópicos"
                  ? "Psicotrópicos (Controlados)"
                  : c === "Venta Libre"
                    ? "Venta Libre (OTC)"
                    : c}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={rowStyle}>
          <View style={{ width: width < 600 ? (width - 44) / 2 : 190 }}>
            <Select
              accessibilityLabel="Requisito"
              value={requirement}
              onChange={filter(setRequirement)}
              options={[
                { value: "all", label: "Todos los Requisitos" },
                { value: "rx", label: "Requiere receta" },
                { value: "controlled", label: "Rx controlado" },
                { value: "otc", label: "Venta libre" },
              ]}
            />
          </View>
          <View style={{ width: width < 600 ? (width - 44) / 2 : 190 }}>
            <Select
              accessibilityLabel="Estado de existencias"
              value={status}
              onChange={filter(setStatus)}
              options={[
                { value: "all", label: "Todos los Estados" },
                ...Object.entries(labels).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
          </View>
          <View style={{ width: width < 600 ? (width - 44) / 2 : 210 }}>
            <Select
              accessibilityLabel="Sucursal de inventario"
              value={branch}
              onChange={filter(setBranch)}
              options={[
                { value: "all", label: "Todas las Sucursales" },
                ...data.branches.map((b) => ({
                  value: String(b.id),
                  label: "Sede " + b.name,
                })),
              ]}
            />
          </View>
          <View style={{ flex: 1 }} />
          <Pressable
            accessibilityRole="button"
            onPress={clear}
            style={rowStyle}
          >
            <Icon name="FilterX" size={14} color={colors.muted} />
            <Text style={{ ...muted, fontSize: 10 }}>Limpiar Filtros</Text>
          </Pressable>
        </View>
      </Card>
      <Card padded={false}>
        <DataTable
          columns={columns}
          rows={visible}
          renderCell={cell}
          minWidth={1036}
        />
        {!visible.length && <Empty title="No hay medicamentos que coincidan" />}
        <View
          style={{
            ...rowStyle,
            padding: 12,
            backgroundColor: colors.surfaceAlt,
          }}
        >
          <Text style={muted}>Filas por página:</Text>
          <View style={{ width: 80 }}>
            <Select
              accessibilityLabel="Filas por página"
              value={String(size)}
              options={[8, 16, 24].map((value) => ({
                value: String(value),
                label: String(value),
              }))}
              onChange={(value) => {
                setSize(Number(value));
                setPage(1);
              }}
            />
          </View>
          <Text style={muted}>
            Página {current} de {maxPage} ({filtered.length} lotes)
          </Text>
          <View style={{ flex: 1 }} />
          <Button
            title="Anterior"
            icon="ChevronLeft"
            size="small"
            tone="secondary"
            disabled={current === 1}
            onPress={() => setPage(current - 1)}
          />
          {Array.from({ length: Math.min(5, maxPage) }, (_, i) => i + 1).map(
            (p) => (
              <Button
                key={p}
                title={String(p)}
                size="small"
                tone={current === p ? "primary" : "secondary"}
                onPress={() => setPage(p)}
              />
            ),
          )}
          <Button
            title="Siguiente"
            icon="ChevronRight"
            size="small"
            tone="secondary"
            disabled={current === maxPage}
            onPress={() => setPage(current + 1)}
          />
        </View>
      </Card>
      <View style={{ flexDirection: width < 650 ? "column" : "row", gap: 14 }}>
        <View style={{ flex: 1 }}>
          <Card>
            <View style={rowStyle}>
              <Icon name="ArrowRightLeft" size={18} color={colors.primary} />
              <Text style={{ ...text, fontFamily: fonts.semibold }}>
                Distribución entre sedes
              </Text>
              <Badge tone="success">Activa</Badge>
            </View>
            <Text style={muted}>
              Traslada unidades del mismo lote conservando fecha de vencimiento
              y trazabilidad.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDialog({ type: "transfer" })}
              style={rowStyle}
            >
              <Text style={{ ...text, color: colors.primary }}>
                Nueva transferencia
              </Text>
              <Icon name="Plus" size={14} color={colors.primary} />
            </Pressable>
          </Card>
        </View>
        <View style={{ flex: 1 }}>
          <Card>
            <View style={rowStyle}>
              <Icon name="Snowflake" size={18} color={colors.primary} />
              <Text style={{ ...text, fontFamily: fonts.semibold }}>
                Productos refrigerados
              </Text>
              <Badge tone="info">2–8 °C</Badge>
            </View>
            <Text style={muted}>
              Las condiciones de conservación deben comprobarse antes de la
              entrega.
            </Text>
            <Text style={muted}>Monitoreo de sensores no conectado.</Text>
          </Card>
        </View>
        <View style={{ flex: 1 }}>
          <Card>
            <View style={rowStyle}>
              <Icon name="ShieldCheck" size={18} color={colors.primary} />
              <Text style={{ ...text, fontFamily: fonts.semibold }}>
                Control de medicamentos Rx
              </Text>
            </View>
            <Text style={muted}>
              Los productos restringidos requieren receta y dictamen del regente
              para ser retirados.
            </Text>
            <Text style={muted}>
              Auditoría manual con registro de decisiones.
            </Text>
          </Card>
        </View>
      </View>
      {dialog && ["adjust", "transfer"].includes(dialog.type) && (
        <StockForm
          key={`${dialog.type}-${dialog.row?.id || "new"}`}
          dialog={dialog}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "drug" && <DrugForm onClose={() => setDialog(null)} />}
      {dialog?.type === "import" && (
        <Modal title="Importar lote CSV" onClose={() => setDialog(null)}>
          <Text style={text}>
            Actualiza cantidades y umbrales de lotes existentes. Los cambios
            reemplazan los conteos actuales después de confirmar.
          </Text>
          <Text style={muted}>
            Columnas: id,quantity,minimum · Hasta 500 filas · UTF-8 · máximo 100
            KB.
          </Text>
          <Button
            title="Descargar plantilla actual"
            tone="secondary"
            onPress={() => exportRows(true)}
          />
          <Button
            title={picking ? "Leyendo archivo…" : "Seleccionar CSV"}
            disabled={picking || busy}
            onPress={importFile}
          />
        </Modal>
      )}
      {dialog?.type === "importConfirm" && (
        <Confirm
          title="Confirmar importación"
          message={`Se actualizarán cantidades y umbrales de ${importData?.length || 0} lotes. Esta operación reemplaza los conteos actuales.`}
          onClose={() => {
            setDialog(null);
            setImportData(null);
          }}
          onConfirm={async () => {
            await run({ type: "import", rows: importData });
            notify("Importación completada.");
            setDialog(null);
            setImportData(null);
          }}
        />
      )}
    </View>
  );
}
