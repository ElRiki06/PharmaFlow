import { useEffect, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useApp } from "../lib/context.js";
import { age, canAccess, money, total } from "../lib/domain.js";
import { download } from "../lib/files.js";
import {
  Badge,
  Button,
  Card,
  Confirm,
  DataTable,
  Empty,
  Field,
  Icon,
  Modal,
  PageHead,
  Select,
  fonts,
  useTheme,
} from "../components/Ui.jsx";

const statuses = {
  pending: ["En revisión", "warning"],
  ready: ["Lista para retiro", "info"],
  completed: ["Entregada", "success"],
  rejected: ["Rechazada", "critical"],
  cancelled: ["Cancelada", "neutral"],
};

export default function Orders({ navigate, initialId, initialQuery = "" }) {
  const { data, user, run, notify, busy } = useApp();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const text = {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  };
  const muted = { ...text, color: colors.muted, fontSize: 11 };
  const mono = { ...text, fontFamily: fonts.mono };
  const employee = canAccess(user, "audit");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState(initialQuery);
  const [branch, setBranch] = useState("all");
  const [dialog, setDialog] = useState(
    initialId ? { type: "detail", id: Number(initialId) } : null,
  );
  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState(null);
  useEffect(() => {
    if (initialId) setDialog({ type: "detail", id: Number(initialId) });
  }, [initialId]);
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);
  const orders = data.orders.filter((o) => employee || o.userId === user.id);
  const visible = orders.filter(
    (o) =>
      (status === "all" || o.status === status) &&
      `${o.id} ${o.patient} ${o.dui}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (branch === "all" || o.branchId === Number(branch)),
  );
  const selected = dialog && orders.find((o) => o.id === dialog.id);
  const branchName = (o) =>
    data.branches.find((b) => b.id === o.branchId)?.name;
  const drugName = (i) =>
    data.drugs.find((d) => d.id === i.drugId)?.name || "Medicamento";
  async function receipt(o) {
    try {
      await download(
        `pharmaflow-orden-${o.id}.txt`,
        `PharmaFlow · Comprobante de reserva\nOrden #ORD-${o.id}\nPaciente: ${o.patient}\nSede: ${branchName(o)}\nEstado: ${statuses[o.status][0]}\n${o.items.map((i) => `${i.quantity} x ${drugName(i)} · ${money(i.price * i.quantity)}`).join("\n")}\nTotal: ${money(total(o))}\nCódigo de retiro: ${o.pickupCode}\nPresenta tu documento de identidad al retirar.`,
        "text/plain;charset=utf-8",
      );
    } catch (e) {
      notify(e.message, "error");
    }
  }
  return (
    <View style={{ gap: 16 }}>
      <PageHead
        tag="Reservas y atención en mostrador"
        title={employee ? "Reservas & Despachos" : "Mis Reservas"}
        subtitle={
          employee
            ? "Gestiona solicitudes, revisa su estado y confirma las entregas."
            : "Consulta el estado de tus pedidos y tu código de retiro."
        }
        actions={
          <Button
            icon="Plus"
            title={employee ? "Nueva Orden Asistida" : "Nueva reserva"}
            onPress={() => navigate("catalog")}
          />
        }
      />
      <View style={{ flexDirection: "row", gap: 16 }}>
        {["pending", "ready", "completed"].map((key, i) => (
          <Pressable
            accessibilityRole="button"
            key={key}
            onPress={() => setStatus(key)}
            style={{ flex: 1 }}
          >
            <Card
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                padding: width < 600 ? 12 : 18,
                marginBottom: 0,
              }}
            >
              <View
                style={{
                  backgroundColor:
                    key === "pending"
                      ? "#fffbeb"
                      : key === "ready"
                        ? "#eff6ff"
                        : "#ecfdf5",
                  width: width < 600 ? 32 : 42,
                  height: width < 600 ? 32 : 42,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                }}
              >
                <Icon
                  name={["FileClock", "ShoppingBag", "PackageCheck"][i]}
                  size={20}
                  color={
                    key === "pending"
                      ? "#d97706"
                      : key === "ready"
                        ? "#2563eb"
                        : "#059669"
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[mono, { fontSize: 24, lineHeight: 31 }]}>
                  {orders.filter((o) => o.status === key).length}
                </Text>
                <Text style={[muted, { fontSize: width < 600 ? 9 : 12 }]}>
                  {statuses[key][0]}
                </Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
      <Card>
        <View
          style={{ flexDirection: width > 700 ? "row" : "column", gap: 12 }}
        >
          <View style={{ flex: 1 }}>
            <Field
              label="Buscar reservas"
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por orden, paciente o DUI..."
            />
          </View>
          <View style={{ width: width > 700 ? 180 : "100%" }}>
            <Select
              label="Sede"
              value={branch}
              onChange={setBranch}
              options={[
                { label: "Todas las sedes", value: "all" },
                ...data.branches.map((b) => ({ label: b.name, value: b.id })),
              ]}
            />
          </View>
        </View>
        <Select
          tabs
          label=""
          value={status}
          onChange={setStatus}
          options={[
            { label: `Todas (${orders.length})`, value: "all" },
            ...Object.entries(statuses).map(([value, [label]]) => ({
              value,
              label: `${label} (${orders.filter((o) => o.status === value).length})`,
            })),
          ]}
        />
      </Card>
      <Card padded={false}>
        <DataTable
          minWidth={1045}
          columns={[
            { key: "order", label: "Orden / Fecha", width: 140 },
            { key: "patient", label: "Paciente", width: 160 },
            { key: "items", label: "Medicamentos", width: 210, flex: 1 },
            { key: "branch", label: "Sede", width: 95 },
            { key: "status", label: "Estado", width: 145 },
            { key: "total", label: "Total", width: 85, align: "right" },
            { key: "actions", label: "Acciones", width: 210 },
          ]}
          rows={visible}
          renderCell={(o, col) => {
            if (col.key === "order")
              return (
                <View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setDialog({ type: "detail", id: o.id })}
                  >
                    <Text
                      style={[
                        mono,
                        { color: colors.primary, fontFamily: fonts.mono },
                      ]}
                    >
                      #ORD-{o.id}
                    </Text>
                  </Pressable>
                  <Text style={[muted, { fontSize: 10 }]}>
                    {age(o.createdAt)}
                  </Text>
                </View>
              );
            if (col.key === "patient")
              return (
                <View>
                  <Text style={[text, { fontFamily: fonts.medium }]}>
                    {o.patient}
                  </Text>
                  <Text style={[mono, { color: colors.muted, fontSize: 10 }]}>
                    {o.dui || "Documento por verificar"}
                  </Text>
                </View>
              );
            if (col.key === "items")
              return (
                <View>
                  {o.items.map((i) => (
                    <Text key={i.stockId} style={[muted, { fontSize: 10 }]}>
                      <Text style={{ color: colors.text }}>{i.quantity}× </Text>
                      {drugName(i)}
                    </Text>
                  ))}
                </View>
              );
            if (col.key === "branch")
              return <Text style={text}>{branchName(o)}</Text>;
            if (col.key === "status")
              return (
                <Badge tone={statuses[o.status][1]}>
                  {statuses[o.status][0]}
                </Badge>
              );
            if (col.key === "total")
              return (
                <Text style={[mono, { textAlign: "right" }]}>
                  {money(total(o))}
                </Text>
              );
            return (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                <Button
                  size="small"
                  title="Ver detalle"
                  tone="secondary"
                  onPress={() => setDialog({ type: "detail", id: o.id })}
                />
                {employee && o.status === "pending" && (
                  <Button
                    size="small"
                    title="Auditar"
                    icon="ClipboardCheck"
                    onPress={() => navigate("audit", { id: o.id })}
                  />
                )}
                {employee && o.status === "ready" && (
                  <Button
                    size="small"
                    title="Despachar"
                    disabled={busy}
                    onPress={() => {
                      setCode("");
                      setDialog({ type: "dispatch", id: o.id });
                    }}
                  />
                )}
              </View>
            );
          }}
        />
        {!visible.length && <Empty title="No hay reservas en esta vista" />}
        <Text
          style={[
            muted,
            {
              padding: 14,
              borderTopWidth: 1,
              borderColor: colors.border,
              fontSize: 10,
            },
          ]}
        >
          {visible.length} reservas · Las cancelaciones y los rechazos liberan
          las unidades reservadas.
        </Text>
      </Card>
      {selected && dialog.type === "detail" && (
        <Modal
          title={`Detalle #ORD-${selected.id}`}
          onClose={() => setDialog(null)}
        >
          <Text style={[text, { fontWeight: "700", fontSize: 20 }]}>
            {selected.patient}
          </Text>
          <Text style={text}>
            {selected.dui || "Documento por verificar"} · Sede{" "}
            {branchName(selected)}
          </Text>
          <Badge tone={statuses[selected.status][1]}>
            {statuses[selected.status][0]}
          </Badge>
          {selected.items.map((i) => (
            <Text key={i.stockId} style={text}>
              {i.quantity} × {drugName(i)} · {money(i.quantity * i.price)}
            </Text>
          ))}
          <Text style={[text, { fontWeight: "700" }]}>
            Total: {money(total(selected))}
          </Text>
          {selected.status === "ready" && (
            <Card>
              <Text style={text}>Código de retiro</Text>
              <Text
                selectable
                style={[text, { fontSize: 22, fontWeight: "700" }]}
              >
                {selected.pickupCode}
              </Text>
              <Text style={text}>
                Presenta este código y tu documento de identidad en la sede
                seleccionada.
              </Text>
            </Card>
          )}
          {selected.note ? (
            <Text style={text}>Dictamen: {selected.note}</Text>
          ) : null}
          {selected.status === "pending" && (
            <Text style={text}>
              Receta pendiente de revisión. Podrás retirar cuando sea aprobada.
            </Text>
          )}
          <Button
            title="Comprobante"
            tone="secondary"
            onPress={() => receipt(selected)}
          />
          {["pending", "ready"].includes(selected.status) && (
            <Button
              title="Cancelar reserva"
              tone="danger"
              disabled={busy}
              onPress={() => {
                setConfirm({ type: "cancel", id: selected.id });
                setDialog(null);
              }}
            />
          )}
        </Modal>
      )}
      {selected && employee && dialog.type === "dispatch" && (
        <Modal
          title={`Confirmar retiro #ORD-${selected.id}`}
          onClose={() => setDialog(null)}
        >
          <Text style={text}>
            Verifica el documento de {selected.patient} y solicita su código de
            retiro.
          </Text>
          <Field
            label="Código de retiro"
            value={code}
            onChangeText={setCode}
            placeholder="PF-…"
            maxLength={60}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Button
            title="Revisar entrega"
            disabled={!code.trim() || busy}
            onPress={() => {
              if (code.trim() !== selected.pickupCode) {
                notify("El código de retiro no coincide.", "error");
                return;
              }
              setConfirm({ type: "dispatch", id: selected.id, code });
              setDialog(null);
            }}
          />
        </Modal>
      )}
      {confirm && (
        <Confirm
          title={
            confirm.type === "cancel" ? "Cancelar reserva" : "Registrar entrega"
          }
          message={
            confirm.type === "cancel"
              ? `La orden #ORD-${confirm.id} se cancelará y sus unidades volverán al inventario.`
              : `Confirma que verificaste la identidad y entregarás los medicamentos de la orden #ORD-${confirm.id}.`
          }
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            await run(confirm);
            notify(
              confirm.type === "cancel"
                ? "Reserva cancelada. Existencias liberadas."
                : "Entrega registrada.",
            );
            setConfirm(null);
          }}
        />
      )}
    </View>
  );
}
