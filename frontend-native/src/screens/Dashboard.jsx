import React, { useState } from "react";
import { View, Text, Switch, Pressable } from "react-native";
import { useApp } from "../lib/context.js";
import { age, money, stockState, total } from "../lib/domain.js";
import { csv, download } from "../lib/files.js";
import {
  Badge,
  Button,
  Card,
  DataTable,
  Empty,
  Icon,
  Metric,
  PageHead,
  Select,
  fonts,
  useTheme,
} from "../components/Ui.jsx";

export default function Dashboard({ navigate }) {
  const { data, prefs, savePrefs, notify, mode, busy } = useApp();
  const { colors } = useTheme();
  const [feed, setFeed] = useState("all");
  const [width, setWidth] = useState(1100);
  const text = { color: colors.text, fontFamily: fonts.regular, fontSize: 12 };
  const muted = { ...text, color: colors.muted, fontSize: 11, lineHeight: 17 };
  const heading = { ...text, fontFamily: fonts.semibold, fontSize: 14 };
  const row = { flexDirection: "row", gap: 10, alignItems: "center" };
  const sectionHead = {
    ...row,
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  };
  const link = { ...text, color: colors.primary, fontSize: 11 };
  const pending = data.orders.filter((o) => o.status === "pending");
  const active = data.orders.filter((o) =>
    ["pending", "ready"].includes(o.status),
  );
  const completed = data.orders.filter((o) => o.status === "completed");
  const critical = data.stock.filter(
    (s) => stockState(s.quantity, s.minimum) === "critical",
  );
  const events = data.events.filter(
    (e) => feed === "all" || e.branchId === Number(feed),
  );
  async function report() {
    try {
      await download(
        "pharmaflow-reporte-" + new Date().toISOString().slice(0, 10) + ".csv",
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
      notify("Reporte exportado.");
    } catch (e) {
      notify(e.message, "error");
    }
  }
  const tableColumns = [
    { key: "id", label: "ID orden", width: 82 },
    { key: "patient", label: "Paciente / DUI", width: 140, flex: 1 },
    { key: "items", label: "Medicamento restringido", width: 140, flex: 1 },
    { key: "time", label: "Tiempo", width: 82 },
    { key: "branch", label: "Sucursal", width: 80 },
    { key: "priority", label: "Prioridad", width: 85 },
    { key: "open", label: "", width: 28 },
  ];
  function cell(order, column) {
    switch (column.key) {
      case "id":
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigate("audit", { id: order.id })}
          >
            <Text style={{ ...link, fontFamily: fonts.mono }}>
              #RX-{order.id}
            </Text>
          </Pressable>
        );
      case "patient":
        return (
          <View style={{ gap: 4 }}>
            <Text style={{ ...text, fontFamily: fonts.medium }}>
              {order.patient}
            </Text>
            <Text style={{ ...muted, fontFamily: fonts.mono, fontSize: 10 }}>
              {order.dui}
            </Text>
          </View>
        );
      case "items":
        return (
          <View style={{ gap: 5 }}>
            {order.items.map((item) => {
              const drug = data.drugs.find((d) => d.id === item.drugId);
              return (
                <View
                  key={item.stockId}
                  style={{
                    backgroundColor: drug?.controlled
                      ? colors.danger + "0c"
                      : colors.surfaceAlt,
                    paddingHorizontal: 6,
                    paddingVertical: 3,
                    borderRadius: 2,
                    borderWidth: drug?.controlled ? 1 : 0,
                    borderColor: colors.danger + "40",
                  }}
                >
                  <Text
                    style={{
                      ...text,
                      color: drug?.controlled ? colors.danger : colors.text,
                      fontSize: 11,
                      lineHeight: 16,
                    }}
                  >
                    {drug?.name || "Medicamento"}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      case "time":
        return (
          <Text style={{ ...muted, fontFamily: fonts.mono, fontSize: 10 }}>
            {age(order.createdAt)}
          </Text>
        );
      case "branch":
        return (
          <Text style={text}>
            {data.branches.find((b) => b.id === order.branchId)?.name}
          </Text>
        );
      case "priority":
        return (
          <Badge tone={order.priority === "high" ? "critical" : "warning"} dot>
            {order.priority === "high" ? "Alta" : "Normal"}
          </Badge>
        );
      default:
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={"Revisar receta " + order.id}
            onPress={() => navigate("audit", { id: order.id })}
          >
            <Icon name="ArrowRight" size={15} color={colors.primary} />
          </Pressable>
        );
    }
  }
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ gap: 24 }}
    >
      <PageHead
        tag="Consola operacional  •  Información de tus sedes"
        title="Panel General de Operaciones Farmacéuticas"
        subtitle="Monitoreo de reservas, auditoría de recetas y estado de existencias en sucursales."
        actions={
          <>
            <Button
              title="Descargar Reporte Diario"
              icon="ArrowDownToLine"
              tone="secondary"
              onPress={report}
            />
            <Button
              title="Nueva Orden Asistida"
              icon="Plus"
              onPress={() => navigate("catalog")}
            />
          </>
        }
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {[
          [
            "Reservas activas",
            active.length.toString().padStart(2, "0"),
            data.orders.length + " órdenes registradas",
            "ShoppingBag",
            "success",
          ],
          [
            "Recetas pendientes de auditoría",
            pending.length.toString().padStart(2, "0"),
            pending.length
              ? "Requieren revisión del regente"
              : "Cola de revisión al día",
            "ClipboardCheck",
            "warning",
          ],
          [
            "Fármacos stock crítico",
            critical.length.toString().padStart(2, "0"),
            "Umbral bajo · Reposición",
            "Package",
            "critical",
          ],
          [
            "Despachos completados",
            completed.length.toString().padStart(2, "0"),
            "Retiros registrados",
            "QrCode",
            "info",
          ],
        ].map(([label, value, detail, icon, tone]) => (
          <View
            key={label}
            style={{ width: width < 650 ? (width - 14) / 2 : (width - 42) / 4 }}
          >
            <Metric
              label={label}
              value={value}
              detail={detail}
              icon={icon}
              tone={tone}
            />
          </View>
        ))}
      </View>
      <View
        style={{
          flexDirection: width >= 820 ? "row" : "column",
          gap: 24,
          alignItems: "stretch",
        }}
      >
        <View style={{ flex: width >= 820 ? 2.05 : undefined, minWidth: 0 }}>
          <Card padded={false} style={{ flex: 1 }}>
            <View style={sectionHead}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#fffbeb",
                  borderColor: "#fde68a",
                  borderWidth: 1,
                  borderRadius: 3,
                }}
              >
                <Icon name="ClipboardCheck" size={22} color="#b45309" />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ ...row, flexWrap: "wrap" }}>
                  <Text style={heading}>
                    Cola de Auditoría Urgente de Recetas
                  </Text>
                  <Badge>{pending.length} pendientes</Badge>
                </View>
                <Text style={muted}>
                  Medicamentos sujetos a validación del regente farmacéutico.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => navigate("audit")}
                style={row}
              >
                <Icon name="Filter" size={14} color={colors.primary} />
                <Text style={link}>Ver todas</Text>
                <Icon name="ArrowRight" size={15} color={colors.primary} />
              </Pressable>
            </View>
            <DataTable
              columns={tableColumns}
              rows={pending.slice(0, 4)}
              renderCell={cell}
              minWidth={737}
              onRowPress={(order) => navigate("audit", { id: order.id })}
            />
            {!pending.length && (
              <Empty title="Todas las recetas están revisadas" />
            )}
            <View
              style={{
                ...row,
                flexWrap: "wrap",
                padding: 14,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: colors.canvas,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.success,
                }}
              />
              <Text style={{ ...muted, flex: 1 }}>
                {mode === "demo"
                  ? "Cola de demostración. Las decisiones se guardan en este dispositivo."
                  : "Cada dictamen queda registrado con el usuario responsable."}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => navigate("audit")}
                style={row}
              >
                <Text style={link}>Revisar siguiente</Text>
                <Icon name="ArrowRight" size={14} color={colors.primary} />
              </Pressable>
            </View>
          </Card>
        </View>
        <View style={{ flex: width >= 820 ? 1 : undefined, minWidth: 0 }}>
          <Card padded={false} style={{ flex: 1 }}>
            <View style={sectionHead}>
              <View
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 6,
                  backgroundColor: colors.success,
                  borderWidth: 3,
                  borderColor: "#a7f3d0",
                }}
              />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={heading}>Actividad Reciente</Text>
                <Text style={{ ...muted, fontSize: 10 }}>
                  Operaciones de tus sucursales
                </Text>
              </View>
              <Badge tone="success">{mode === "demo" ? "Local" : "API"}</Badge>
            </View>
            <View style={{ padding: 16, gap: 24, flex: 1 }}>
              {events.slice(0, 5).map((event) => (
                <View
                  key={event.id}
                  style={{ ...row, alignItems: "flex-start" }}
                >
                  <View
                    style={{
                      width: 29,
                      height: 29,
                      borderWidth: 1,
                      borderRadius: 3,
                      alignItems: "center",
                      justifyContent: "center",
                      borderColor:
                        (event.kind === "critical"
                          ? colors.danger
                          : event.kind === "success"
                            ? colors.success
                            : colors.primary) + "50",
                      backgroundColor:
                        (event.kind === "critical"
                          ? colors.danger
                          : event.kind === "success"
                            ? colors.success
                            : colors.primary) + "0c",
                    }}
                  >
                    <Icon
                      name={
                        event.kind === "critical"
                          ? "Package"
                          : event.kind === "success"
                            ? "QrCode"
                            : "ShieldCheck"
                      }
                      size={17}
                      color={
                        event.kind === "critical"
                          ? colors.danger
                          : event.kind === "success"
                            ? colors.success
                            : colors.primary
                      }
                    />
                  </View>
                  <View style={{ flex: 1, gap: 5 }}>
                    <View style={{ ...row, alignItems: "flex-start" }}>
                      <Text
                        style={{
                          ...text,
                          fontFamily: fonts.semibold,
                          fontSize: 11,
                          lineHeight: 16,
                          flex: 1,
                        }}
                      >
                        {event.title}
                      </Text>
                      <Text
                        style={{
                          ...muted,
                          fontFamily: fonts.mono,
                          fontSize: 8,
                        }}
                      >
                        {age(event.createdAt).replace("Hace ", "")}
                      </Text>
                    </View>
                    <Text style={muted}>{event.detail}</Text>
                  </View>
                </View>
              ))}
              {!events.length && (
                <Text style={muted}>No hay actividad en esta sede.</Text>
              )}
            </View>
            <View
              style={{
                padding: 12,
                backgroundColor: colors.canvas,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <Select
                label="Filtro de sede"
                value={feed}
                onChange={setFeed}
                options={[
                  { value: "all", label: "Todas las sucursales" },
                  ...data.branches.map((b) => ({
                    value: String(b.id),
                    label: b.name,
                  })),
                ]}
              />
            </View>
          </Card>
        </View>
      </View>
      <Card style={{ padding: 18 }}>
        <View style={{ ...row, flexWrap: "wrap", gap: 18 }}>
          <Icon name="ShieldCheck" size={26} color={colors.primary} />
          <View style={{ flex: 1, minWidth: 210, gap: 5 }}>
            <View style={{ ...row, flexWrap: "wrap" }}>
              <Text style={{ ...heading, fontSize: 13 }}>
                Trazabilidad & Control Farmacéutico
              </Text>
              <Badge tone="success">Activo</Badge>
            </View>
            <Text style={muted}>
              Dictámenes, ajustes y movimientos registrados.{" "}
              <Text style={{ fontFamily: fonts.semibold }}>
                {money(
                  data.stock.reduce(
                    (sum, s) =>
                      sum +
                      s.quantity *
                        (data.drugs.find((d) => d.id === s.drugId)?.price || 0),
                    0,
                  ),
                )}
              </Text>{" "}
              en existencias disponibles.
            </Text>
          </View>
          <View style={{ ...row, gap: 7 }}>
            <Switch
              accessibilityLabel="Alertas sonoras"
              value={Boolean(prefs.sound)}
              disabled={busy}
              onValueChange={(value) =>
                savePrefs({ sound: value }).catch((e) =>
                  notify(e.message, "error"),
                )
              }
            />
            <Icon name="Volume2" size={16} color={colors.muted} />
            <Text style={muted}>Alertas sonoras</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigate("audit")}
            style={{
              ...row,
              borderLeftWidth: 1,
              borderLeftColor: colors.border,
              paddingLeft: 14,
            }}
          >
            <Icon name="FileClock" size={16} color={colors.primary} />
            <Text style={link}>Ver auditoría</Text>
            <Icon name="ArrowUpRight" size={15} color={colors.primary} />
          </Pressable>
        </View>
      </Card>
    </View>
  );
}
