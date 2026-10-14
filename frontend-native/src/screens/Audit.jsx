import { useEffect, useRef, useState } from "react";
import {
  Image,
  PanResponder,
  Platform,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useApp } from "../lib/context.js";
import { age, canAccess } from "../lib/domain.js";
import {
  Badge,
  Button,
  Card,
  Confirm,
  Empty,
  Field,
  Icon,
  Modal,
  Select,
  fonts,
  useTheme,
} from "../components/Ui.jsx";

const reasons = [
  "Documento ilegible",
  "Datos del paciente incompletos",
  "Credenciales del médico no verificables",
  "Receta vencida",
  "Cantidad o medicamento no coincide",
  "Otros requisitos no cumplidos",
];

function Review({ order, onDone }) {
  const { data, user, run, notify, busy, mode } = useApp();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const desktop = width >= 1250;
  const text = {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 18,
  };
  const muted = { ...text, color: colors.muted, fontSize: 10 };
  const mono = { ...text, fontFamily: fonts.mono, fontSize: 10 };
  const ledgerTitle = {
    ...text,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primary,
  };
  function heading(icon, title, accessory) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 7,
          marginBottom: 4,
        }}
      >
        <Icon name={icon} size={19} color={colors.primary} />
        <Text style={[ledgerTitle, { flex: 1 }]}>{title}</Text>
        {accessory}
      </View>
    );
  }
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [contrast, setContrast] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const position = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStart.current = { ...position.current };
      },
      onPanResponderMove: (_, gesture) => {
        const next = {
          x: dragStart.current.x + gesture.dx,
          y: dragStart.current.y + gesture.dy,
        };
        position.current = next;
        setOffset(next);
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [decision, setDecision] = useState(null);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);
  const branch = data.branches.find((b) => b.id === order.branchId);
  const sample = !order.image || order.image === "/prescription.svg";
  const source = sample
    ? require("../../assets/prescription.png")
    : { uri: order.image };
  function reset() {
    setZoom(100);
    setRotation(0);
    setContrast(false);
    position.current = { x: 0, y: 0 };
    setOffset(position.current);
  }
  function decide(value) {
    if (note.trim().length < 3) {
      setError("Registra una nota de auditoría de al menos 3 caracteres.");
      return;
    }
    if (value === "rejected" && !reason) {
      setError("Selecciona el motivo del rechazo.");
      return;
    }
    if (imageError && value === "ready") {
      setError(
        "No se pudo cargar la receta. Revisa el documento antes de aprobar.",
      );
      return;
    }
    setError("");
    setDecision(value);
  }
  const tools = (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Button
        size="small"
        icon="Minus"
        title=""
        accessibilityLabel="Reducir zoom"
        tone="ghost"
        disabled={zoom <= 50}
        onPress={() => setZoom((v) => Math.max(50, v - 25))}
      />
      <Text style={mono}>{zoom}%</Text>
      <Button
        size="small"
        icon="Plus"
        title=""
        accessibilityLabel="Aumentar zoom"
        tone="ghost"
        disabled={zoom >= 250}
        onPress={() => setZoom((v) => Math.min(250, v + 25))}
      />
      <View
        style={{ width: 1, height: 20, backgroundColor: colors.borderStrong }}
      />
      <Button
        size="small"
        icon="RotateCw"
        title=""
        accessibilityLabel="Girar receta 90 grados"
        tone="ghost"
        onPress={() => setRotation((v) => (v + 90) % 360)}
      />
      {Platform.OS === "web" && (
        <Button
          size="small"
          icon="Contrast"
          title={contrast ? "Contraste normal" : "Contraste Clínico"}
          tone="ghost"
          onPress={() => setContrast((v) => !v)}
        />
      )}
      <Button
        size="small"
        icon="Maximize2"
        title=""
        accessibilityLabel="Ampliar documento"
        tone="ghost"
        onPress={() => setExpanded(true)}
      />
      <View style={{ flex: 1 }} />
      <Button size="small" title="Restablecer" tone="ghost" onPress={reset} />
    </View>
  );
  function viewer(height) {
    return (
      <View
        {...pan.panHandlers}
        accessibilityLabel="Documento de receta. Arrastra para moverlo."
        style={{
          height,
          overflow: "hidden",
          backgroundColor: "#213145",
          alignItems: "center",
          justifyContent: "center",
          ...(Platform.OS === "web"
            ? {
                touchAction: "none",
                backgroundImage:
                  "radial-gradient(#43536c 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                cursor: "grab",
              }
            : {}),
        }}
      >
        <View
          pointerEvents="none"
          style={{ position: "absolute", top: 16, left: 16, zIndex: 2, gap: 5 }}
        >
          <Badge tone="dark">Inspección visual manual</Badge>
          <Badge tone="success">
            {sample ? "Documento de ejemplo" : "Imagen disponible"}
          </Badge>
        </View>
        <Image
          source={source}
          resizeMode="contain"
          accessibilityLabel={`Receta de la orden ${order.id}${sample ? ", documento de demostración" : ""}`}
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
          style={{
            width: "75%",
            height: "85%",
            maxWidth: 530,
            transform: [
              { translateX: offset.x },
              { translateY: offset.y },
              { scale: zoom / 100 },
              { rotate: `${rotation}deg` },
            ],
            ...(Platform.OS === "web" && contrast
              ? { filter: "contrast(1.5) grayscale(1)" }
              : {}),
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 16,
            padding: 10,
            backgroundColor: "#0b1c30a1",
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <Text style={[mono, { color: "#c0c7d1", fontSize: 8 }]}>
            ● Escala: {zoom}%
          </Text>
          <Text style={[mono, { color: "#c0c7d1", fontSize: 8 }]}>
            Arrastra para mover el documento
          </Text>
          <Text style={[mono, { color: "#c0c7d1", fontSize: 8 }]}>RGB</Text>
        </View>
      </View>
    );
  }
  return (
    <View
      style={{
        flexDirection: desktop ? "row" : "column",
        gap: 20,
        alignItems: "flex-start",
      }}
    >
      <Card
        padded={false}
        style={{
          flex: desktop ? 1 : undefined,
          width: desktop ? undefined : "100%",
          backgroundColor: colors.surfaceAlt,
          borderRadius: 5,
          gap: 0,
        }}
      >
        <View
          style={{
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Icon name="FileImage" size={23} color={colors.primary} />
          <View>
            <Text style={[mono, { fontSize: 11 }]}>
              {sample ? "receta_demostracion.svg" : `receta_orden_${order.id}`}
            </Text>
            <Text style={muted}>
              {sample
                ? "Documento de muestra · sin validez clínica"
                : "Imagen adjunta por el solicitante"}
            </Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
          {tools}
        </View>
        {viewer(desktop ? 700 : 460)}
        {imageError && (
          <Text accessibilityRole="alert" style={{ color: "#c63948" }}>
            No se pudo cargar la imagen de la receta.
          </Text>
        )}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: colors.panel,
            borderTopWidth: 1,
            borderColor: colors.borderStrong,
            padding: 12,
          }}
        >
          <View style={{ flexDirection: "row", gap: 7, alignItems: "center" }}>
            <Icon name="FileImage" size={15} color={colors.primary} />
            <Text style={muted}>
              {sample
                ? "Datos ficticios de prueba"
                : "Documento aportado por cliente"}
            </Text>
          </View>
          <Text style={[mono, { color: colors.muted }]}>#RX-{order.id}</Text>
        </View>
        {Platform.OS !== "web" && (
          <Text style={[muted, { padding: 12 }]}>
            El ajuste de contraste de imagen está disponible en la versión web.
          </Text>
        )}
      </Card>
      <View
        style={{
          width: desktop ? "40%" : "100%",
          minWidth: desktop ? 420 : undefined,
          gap: 12,
        }}
      >
        <Card
          style={{ padding: 16, borderRadius: 4, marginBottom: 0, gap: 10 }}
        >
          {heading(
            "UserRound",
            "Ficha del Paciente",
            <Badge tone="success">
              {
                data.orders.filter(
                  (o) => o.userId === order.userId && o.status === "completed",
                ).length
              }{" "}
              retiros registrados
            </Badge>,
          )}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              backgroundColor: colors.surfaceAlt,
              padding: 10,
              gap: 12,
            }}
          >
            {[
              ["Nombre completo", order.patient],
              ["Documento ID", `DUI ${order.dui || "Por verificar"}`],
              ["Teléfono contacto", order.phone || "Por verificar"],
              ["Recepción de receta", age(order.createdAt)],
            ].map(([label, value], i) => (
              <View key={label} style={{ width: "47%" }}>
                <Text
                  style={[
                    muted,
                    {
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                    },
                  ]}
                >
                  {label}
                </Text>
                <Text style={i === 1 || i === 2 ? mono : text}>{value}</Text>
              </View>
            ))}
          </View>
        </Card>
        <Card style={{ padding: 16, borderRadius: 4, marginBottom: 0, gap: 6 }}>
          {heading(
            "Stethoscope",
            "Médico Prescriptor",
            <Badge tone="warning">Revisión manual</Badge>,
          )}
          <Text
            style={[
              text,
              { fontSize: 13, fontFamily: fonts.semibold, marginTop: 4 },
            ]}
          >
            {order.doctor || "Por verificar"}
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <Text style={muted}>Cédula profesional:</Text>
            <Text style={mono}>{order.license || "Por verificar"}</Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <Text style={muted}>Estado de credenciales:</Text>
            <Text style={text}>Por verificar con el registro</Text>
          </View>
        </Card>
        <Card style={{ padding: 16, borderRadius: 4, marginBottom: 0, gap: 8 }}>
          {heading(
            "ClipboardCheck",
            "Fármacos Solicitados en la Orden",
            <Text style={[mono, { color: colors.muted }]}>
              {order.items.length} ítems
            </Text>,
          )}
          {order.items.map((item, index) => {
            const drug = data.drugs.find((d) => d.id === item.drugId);
            return (
              <View
                key={item.stockId}
                style={{
                  gap: 5,
                  padding: 10,
                  borderRadius: 3,
                  backgroundColor: drug?.controlled
                    ? "#fef2f2"
                    : colors.surfaceAlt,
                }}
              >
                <View style={{ flexDirection: "row", gap: 7 }}>
                  <Text
                    style={[
                      text,
                      {
                        fontSize: 12,
                        fontFamily: fonts.medium,
                        flex: 1,
                        color: drug?.controlled ? "#991b1b" : colors.text,
                      },
                    ]}
                  >
                    {index + 1}. {drug?.name || "Medicamento"}
                  </Text>
                  {drug?.controlled && <Badge tone="dark">Rx controlado</Badge>}
                  <Text style={mono}>{item.quantity} unidades</Text>
                </View>
                <Text style={muted}>
                  Presentación: {drug?.form || "Por verificar"}
                </Text>
                <View style={{ flexDirection: "row", gap: 5 }}>
                  <Icon
                    name={drug?.controlled ? "AlertTriangle" : "Check"}
                    size={14}
                    color={drug?.controlled ? "#991b1b" : "#065f46"}
                  />
                  <Text
                    style={[
                      muted,
                      {
                        flex: 1,
                        color: drug?.controlled ? "#991b1b" : "#065f46",
                      },
                    ]}
                  >
                    {drug?.controlled
                      ? "Medicamento controlado: comprobar requisitos y retener el original cuando corresponda."
                      : "Verificar cantidad y condiciones indicadas."}
                  </Text>
                </View>
              </View>
            );
          })}
          <View style={{ backgroundColor: "#eff4ff", padding: 10, gap: 7 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Icon name="Store" size={17} color="#64748b" />
              <Text style={[muted, { width: 95 }]}>Sede de retiro:</Text>
              <Text style={[text, { flex: 1, color: "#0b1c30" }]}>
                Sucursal {branch?.name} · {branch?.city}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Icon name="Clock3" size={17} color="#64748b" />
              <Text style={[muted, { width: 95 }]}>Estado de reserva:</Text>
              <Text style={[text, { flex: 1, color: "#0b1c30" }]}>
                En revisión farmacéutica
              </Text>
            </View>
          </View>
        </Card>
        <Card
          style={{ padding: 16, borderRadius: 4, marginBottom: 0, gap: 10 }}
        >
          {heading(
            "Gavel",
            "Dictamen del Regente Farmacéutico",
            <Text style={[mono, { fontSize: 8, color: colors.muted }]}>
              {user.name}
            </Text>,
          )}
          <Field
            label="Notas de auditoría"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={5}
            maxLength={900}
            placeholder="Registra la revisión y el fundamento de tu decisión…"
          />
          <Select
            label="Motivo de rechazo"
            value={reason}
            onChange={setReason}
            options={[
              { label: "Selecciona una causal (si aplica)", value: "" },
              ...reasons.map((value) => ({ label: value, value })),
            ]}
          />
          <View
            style={{
              flexDirection: "row",
              gap: 6,
              padding: 10,
              backgroundColor: "#eff6ff",
            }}
          >
            <Icon name="ShieldCheck" size={16} color="#1e40af" />
            <Text style={[mono, { color: "#1e40af", flex: 1, fontSize: 9 }]}>
              Responsable: {user.name} ·{" "}
              {mode === "demo"
                ? "registro local de prueba"
                : "registro de auditoría"}
            </Text>
          </View>
          {error ? (
            <Text accessibilityRole="alert" style={{ color: "#c63948" }}>
              {error}
            </Text>
          ) : null}
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              borderTopWidth: 1,
              borderColor: colors.surfaceAlt,
              paddingTop: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Button
                size="small"
                icon="XCircle"
                title="Rechazar Receta"
                tone="danger"
                disabled={busy}
                onPress={() => decide("rejected")}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                size="small"
                icon="CheckCircle2"
                title="Aprobar y Habilitar"
                tone="approve"
                disabled={busy}
                onPress={() => decide("ready")}
              />
            </View>
          </View>
        </Card>
      </View>
      {expanded && (
        <Modal
          title={`Documento #RX-${order.id}`}
          onClose={() => setExpanded(false)}
        >
          {tools}
          {viewer(500)}
          <Text style={text}>Arrastra para mover la receta.</Text>
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
          onClose={() => setDecision(null)}
          onConfirm={async () => {
            await run({
              type: "review",
              id: order.id,
              decision,
              note: [decision === "rejected" ? reason : "", note]
                .filter(Boolean)
                .join(". "),
            });
            setDecision(null);
            notify(
              decision === "ready"
                ? "Receta aprobada. Retiro habilitado."
                : "Receta rechazada. Existencias liberadas.",
            );
            onDone();
          }}
        />
      )}
    </View>
  );
}

export default function Audit({ initialId, navigate }) {
  const { data, user } = useApp();
  const { colors } = useTheme();
  const queue = data.orders.filter((o) => o.status === "pending");
  const { width } = useWindowDimensions();
  const [id, setId] = useState(Number(initialId) || queue[0]?.id);
  useEffect(() => {
    if (initialId) setId(Number(initialId));
  }, [initialId]);
  if (!canAccess(user, "audit"))
    return <Empty title="No tienes acceso a la auditoría de recetas." />;
  const order = queue.find((o) => o.id === id) || queue[0];
  const index = queue.findIndex((o) => o.id === order?.id);
  if (!order)
    return (
      <Card>
        <Empty title="La cola de auditoría está al día" />
        <Text style={{ color: colors.text }}>
          No hay recetas pendientes. Consulta los dictámenes en Reservas &
          Despachos.
        </Text>
        <Button title="Ver reservas" onPress={() => navigate("orders")} />
      </Card>
    );
  return (
    <View style={{ gap: 16 }}>
      <View
        style={{
          paddingBottom: 20,
          borderBottomWidth: 1,
          borderColor: colors.border,
          gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            gap: 6,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Text
            style={{
              color: colors.muted,
              fontFamily: fonts.regular,
              fontSize: 11,
            }}
          >
            Operaciones
          </Text>
          <Icon name="ChevronRight" size={14} color={colors.muted} />
          <Text
            style={{
              color: colors.muted,
              fontFamily: fonts.regular,
              fontSize: 11,
            }}
          >
            Recetas Pendientes
          </Text>
          <Icon name="ChevronRight" size={14} color={colors.muted} />
          <Text
            style={{ color: colors.text, fontFamily: fonts.mono, fontSize: 11 }}
          >
            Orden #RX-{order.id}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center",
          }}
        >
          <Text
            accessibilityRole="header"
            style={{
              color: colors.text,
              fontFamily: fonts.bold,
              fontSize: width < 700 ? 20 : 23,
              letterSpacing: -0.4,
            }}
          >
            Auditoría Médica y Validación de Recetas
          </Text>
          <Badge tone="warning">En Revisión Farmacéutica</Badge>
        </View>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surfaceAlt,
              borderRadius: 3,
            }}
          >
            <Button
              size="small"
              icon="ArrowLeft"
              title="Anterior"
              tone="ghost"
              disabled={index === 0}
              onPress={() => setId(queue[index - 1].id)}
            />
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.mono,
                fontSize: 10,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderColor: colors.borderStrong,
                paddingHorizontal: 10,
              }}
            >
              {index + 1} de {queue.length} pendientes
            </Text>
            <Button
              size="small"
              icon="ArrowRight"
              title="Siguiente"
              tone="ghost"
              disabled={index >= queue.length - 1}
              onPress={() => setId(queue[index + 1].id)}
            />
          </View>
          <View
            style={{ marginLeft: "auto", width: width < 700 ? "100%" : 210 }}
          >
            <Select
              label=""
              value={order.id}
              onChange={(value) => setId(Number(value))}
              options={queue.map((o) => ({
                label: `#RX-${o.id} · ${o.patient}`,
                value: o.id,
              }))}
            />
          </View>
          <Button
            size="small"
            icon="X"
            title="Cerrar / Volver"
            tone="secondary"
            onPress={() => navigate("dashboard")}
          />
        </View>
      </View>
      <Review key={order.id} order={order} onDone={() => setId(undefined)} />
    </View>
  );
}
