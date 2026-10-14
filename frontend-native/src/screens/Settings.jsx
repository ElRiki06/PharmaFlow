import React, { useState } from "react";
import { View, Text, Switch } from "react-native";
import { useApp } from "../lib/context.js";
import {
  Badge,
  Button,
  Card,
  Confirm,
  Field,
  Icon,
  Modal,
  PageHead,
  Select,
  useTheme,
  fonts,
} from "../components/Ui.jsx";

export default function Settings() {
  const { data, prefs, savePrefs, reset, run, notify, mode, busy } = useApp();
  const { colors } = useTheme();
  const [branch, setBranch] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [width, setWidth] = useState(1100);
  const text = { color: colors.text, fontFamily: fonts.regular, fontSize: 12 };
  const muted = { ...text, color: colors.muted, fontSize: 11, lineHeight: 17 };
  const row = {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  };
  const preference = (values) =>
    savePrefs(values).catch((e) => notify(e.message, "error"));
  function review() {
    if (
      branch.name.trim().length < 2 ||
      branch.address.trim().length < 5 ||
      !/^[\d+\s-]{7,20}$/.test(branch.phone)
    )
      return notify(
        "Completa un nombre, dirección y teléfono válidos.",
        "error",
      );
    if (
      !branch.active &&
      data.orders.some(
        (o) =>
          o.branchId === branch.id && ["pending", "ready"].includes(o.status),
      )
    )
      return notify("Hay reservas activas en esta sede.", "error");
    if (
      !branch.active &&
      !data.branches.some((b) => b.id !== branch.id && b.active)
    )
      return notify("Debe quedar al menos una sede activa.", "error");
    setConfirm({
      type: "branch",
      id: branch.id,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      active: branch.active,
    });
  }
  async function commit() {
    if (confirm.type === "reset") await reset();
    else {
      await run(confirm);
      notify("Sede actualizada.");
    }
    setConfirm(null);
    setBranch(null);
  }
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ gap: 24 }}
    >
      <PageHead
        tag="Administración de la red"
        title="Configuración de Sedes"
        subtitle="Gestiona datos de contacto, disponibilidad y preferencias del espacio de trabajo."
      />
      <View style={{ flexDirection: width < 650 ? "column" : "row", gap: 18 }}>
        {data.branches.map((b) => (
          <View key={b.id} style={{ flex: 1 }}>
            <Card style={{ padding: 20, gap: 0 }}>
              <View
                style={{
                  ...row,
                  justifyContent: "space-between",
                  marginBottom: 18,
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 4,
                    backgroundColor: colors.primary + "0c",
                  }}
                >
                  <Icon name="Building2" size={24} color={colors.primary} />
                </View>
                <Badge tone={b.active ? "success" : "neutral"} dot>
                  {b.active ? "Operativa" : "Inactiva"}
                </Badge>
              </View>
              <Text
                style={{ ...text, fontFamily: fonts.semibold, fontSize: 18 }}
              >
                Sede {b.name}
              </Text>
              <Text
                style={{
                  ...muted,
                  fontSize: 12,
                  marginTop: 4,
                  marginBottom: 20,
                }}
              >
                {b.city}
              </Text>
              <View
                style={{ ...row, alignItems: "flex-start", marginBottom: 12 }}
              >
                <Icon name="MapPin" size={17} color={colors.muted} />
                <Text style={{ ...muted, flex: 1 }}>{b.address}</Text>
              </View>
              <View style={row}>
                <Icon name="Phone" size={16} color={colors.muted} />
                <Text style={muted}>{b.phone}</Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  gap: 20,
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                  borderColor: colors.border,
                  marginVertical: 20,
                  paddingVertical: 16,
                }}
              >
                <View style={{ flex: 1, gap: 5 }}>
                  <Text
                    style={{ ...text, fontFamily: fonts.mono, fontSize: 19 }}
                  >
                    {data.stock
                      .filter((s) => s.branchId === b.id)
                      .reduce((n, s) => n + s.quantity, 0)
                      .toLocaleString()}
                  </Text>
                  <Text style={{ ...muted, fontSize: 9 }}>
                    Unidades disponibles
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 5 }}>
                  <Text
                    style={{ ...text, fontFamily: fonts.mono, fontSize: 19 }}
                  >
                    {
                      data.orders.filter(
                        (o) =>
                          o.branchId === b.id &&
                          ["ready", "pending"].includes(o.status),
                      ).length
                    }
                  </Text>
                  <Text style={{ ...muted, fontSize: 9 }}>
                    Reservas activas
                  </Text>
                </View>
              </View>
              <Button
                title="Editar sede"
                icon="Pencil"
                tone="secondary"
                size="small"
                disabled={busy}
                onPress={() => setBranch({ ...b })}
              />
            </Card>
          </View>
        ))}
      </View>
      <Card style={{ padding: 24, gap: 0 }}>
        <Text
          style={{
            ...text,
            fontFamily: fonts.semibold,
            fontSize: 16,
            marginBottom: 8,
          }}
        >
          Preferencias de operación
        </Text>
        <View
          style={{
            ...row,
            paddingVertical: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.surfaceAlt,
          }}
        >
          <View style={{ flex: 1, gap: 6 }}>
            <View style={row}>
              <Icon name="Volume2" size={18} color={colors.primary} />
              <Text style={{ ...text, fontFamily: fonts.semibold }}>
                Alertas sonoras
              </Text>
            </View>
            <Text style={{ ...muted, marginLeft: width < 600 ? 0 : 26 }}>
              Reproducir una señal breve al registrar una operación.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Activar alertas sonoras"
            value={Boolean(prefs.sound)}
            disabled={busy}
            onValueChange={(sound) => preference({ sound })}
          />
        </View>
        <View
          style={{
            ...row,
            paddingVertical: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.surfaceAlt,
          }}
        >
          <View style={{ flex: 1, gap: 6 }}>
            <View style={row}>
              <Icon name="ShieldCheck" size={18} color={colors.primary} />
              <Text style={{ ...text, fontFamily: fonts.semibold }}>
                Control de acceso
              </Text>
            </View>
            <Text style={{ ...muted, marginLeft: width < 600 ? 0 : 26 }}>
              Clientes: catálogo y reservas propias. Empleados: operaciones y
              auditoría.
            </Text>
          </View>
          <Badge tone="success" dot>
            Roles activos
          </Badge>
        </View>
        <View
          style={{
            ...row,
            paddingVertical: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.surfaceAlt,
          }}
        >
          <View style={{ flex: 1, gap: 6 }}>
            <View style={row}>
              <Icon name="Building2" size={18} color={colors.primary} />
              <Text style={{ ...text, fontFamily: fonts.semibold }}>
                Fuente de datos
              </Text>
            </View>
            <Text style={{ ...muted, marginLeft: width < 600 ? 0 : 26 }}>
              {mode === "demo"
                ? "Datos ficticios guardados en este dispositivo con AsyncStorage."
                : "API PHP con persistencia en MySQL. Preferencias locales en AsyncStorage."}
            </Text>
          </View>
          <Badge tone="info">
            {mode === "demo" ? "Demostración" : "PHP / MySQL"}
          </Badge>
        </View>
        <View style={{ ...row, paddingTop: 20, alignItems: "flex-start" }}>
          <View style={{ flex: 1, minWidth: 140 }}>
            <Select
              label="Tema visual"
              value={prefs.theme}
              onChange={(theme) => preference({ theme })}
              options={[
                { value: "dark", label: "Oscuro" },
                { value: "light", label: "Claro" },
              ]}
            />
          </View>
          <View style={{ flex: 1, minWidth: 140 }}>
            <Select
              label="Sede predeterminada"
              value={String(prefs.branchId)}
              onChange={(branchId) =>
                preference({ branchId: Number(branchId) })
              }
              options={data.branches
                .filter((b) => b.active)
                .map((b) => ({ value: String(b.id), label: b.name }))}
            />
          </View>
        </View>
      </Card>
      {mode === "demo" && (
        <Card style={{ padding: 22, borderColor: colors.danger + "50" }}>
          <View style={{ ...row, gap: 24 }}>
            <View style={{ flex: 1, minWidth: 230, gap: 8 }}>
              <Text
                style={{ ...text, fontFamily: fonts.semibold, fontSize: 14 }}
              >
                Restablecer entorno de prueba
              </Text>
              <Text style={{ ...muted, maxWidth: 620 }}>
                Vuelve a los medicamentos, reservas y sedes iniciales. Borra los
                cambios y carritos locales de las dos cuentas de prueba.
              </Text>
            </View>
            <Button
              title="Restablecer datos de prueba"
              icon="RotateCcw"
              size="small"
              tone="danger"
              disabled={busy}
              onPress={() => setConfirm({ type: "reset" })}
            />
          </View>
        </Card>
      )}
      {branch && !confirm && (
        <Modal
          title={`Editar Sede ${branch.name}`}
          onClose={() => setBranch(null)}
        >
          <Field
            label="Nombre de la sede"
            value={branch.name}
            maxLength={80}
            onChangeText={(name) => setBranch({ ...branch, name })}
          />
          <Field
            label="Dirección"
            value={branch.address}
            maxLength={200}
            onChangeText={(address) => setBranch({ ...branch, address })}
          />
          <Field
            label="Teléfono"
            value={branch.phone}
            keyboardType="phone-pad"
            maxLength={20}
            onChangeText={(phone) => setBranch({ ...branch, phone })}
          />
          <View style={row}>
            <Text style={text}>Sede operativa</Text>
            <Switch
              accessibilityLabel="Sede operativa"
              value={Boolean(branch.active)}
              onValueChange={(active) => setBranch({ ...branch, active })}
            />
          </View>
          <Text style={muted}>
            Una sede con reservas activas no puede deshabilitarse.
          </Text>
          <Button title="Revisar cambios" disabled={busy} onPress={review} />
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
              ? "Se eliminarán los cambios locales de inventario, reservas y dictámenes. Confirma que deseas volver a los datos iniciales."
              : `Se actualizará Sede ${confirm.name}, que quedará ${confirm.active ? "operativa" : "inactiva"}.`
          }
          onClose={() => setConfirm(null)}
          onConfirm={commit}
        />
      )}
    </View>
  );
}
