import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  ScrollView,
  Modal as NativeModal,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useApp } from "../lib/context";
import { canAccess, age } from "../lib/domain";
import {
  Icon,
  IconButton,
  Button,
  Badge,
  Select,
  Modal,
  Confirm,
  useTheme,
  fonts,
} from "./Ui";
const links = [
  ["dashboard", "Dashboard / Métricas", "LayoutDashboard"],
  ["orders", "Reservas & Despachos", "ShoppingBag"],
  ["audit", "Auditoría de Recetas", "ClipboardCheck"],
  ["inventory", "Inventario Multisede", "PackagePlus"],
  ["settings", "Configuración Sedes", "Building2"],
];
export default function Shell({ page, navigate, children }) {
  const { data, user, prefs, savePrefs, signOut, notify, mode } = useApp();
  const { colors: c } = useTheme();
  const { width } = useWindowDimensions();
  const desktop = width > 800,
    sideWidth = width <= 1050 ? 220 : 256;
  const [menu, setMenu] = useState(false),
    [panel, setPanel] = useState(null),
    [query, setQuery] = useState("");
  const employee = canAccess(user, "dashboard"),
    pending = data.orders.filter((o) => o.status === "pending").length;
  const branch =
    data.branches.find((b) => b.id === prefs.branchId) || data.branches[0];
  const go = (p, params) => {
    navigate(p, params);
    setMenu(false);
  };
  const pref = (values) =>
    savePrefs(values).catch((e) => notify(e.message, "error"));
  const text = { fontFamily: fonts.regular, color: c.text };
  function sidebar() {
    return (
      <View
        style={{
          width: desktop ? sideWidth : 256,
          flexShrink: 0,
          backgroundColor: c.panel,
          borderRightWidth: 1,
          borderRightColor: c.border,
        }}
      >
        <View
          style={{
            height: 72,
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: c.border,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Image
            source={require("../../assets/logo.png")}
            resizeMode="contain"
            style={{ width: 124, height: 32 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ ...text, fontFamily: fonts.semibold, fontSize: 12 }}>
              PharmaFlow
            </Text>
            <Text style={{ ...text, fontFamily: fonts.mono, fontSize: 10 }}>
              OS v1.0.0
            </Text>
            <Text style={{ ...text, fontFamily: fonts.mono, fontSize: 9 }}>
              Enterprise
            </Text>
          </View>
          {!desktop && (
            <IconButton
              name="X"
              label="Cerrar menú"
              onPress={() => setMenu(false)}
            />
          )}
        </View>
        <View
          style={{
            marginHorizontal: 12,
            marginTop: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: "#a7f3d0",
            backgroundColor: "#ecfdf5",
            borderRadius: 3,
            padding: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
          }}
        >
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: "#059669",
            }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 9,
                letterSpacing: 0.7,
                color: "#065f46",
              }}
            >
              {branch.active ? "SEDE OPERATIVA" : "SEDE INACTIVA"}
            </Text>
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 12,
                color: "#0f172a",
                marginTop: 3,
              }}
            >
              {branch.name} - {branch.city}
            </Text>
          </View>
          <Icon name="CircleCheck" size={14} color="#065f46" />
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 10, gap: 5 }}>
          {(employee
            ? links
            : [
                ["catalog", "Catálogo de medicamentos", "PackagePlus"],
                ["orders", "Mis reservas", "ShoppingBag"],
              ]
          ).map(([id, label, icon]) => {
            const active =
              page === id ||
              (employee && page === "catalog" && id === "orders");
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: active }}
                onPress={() => go(id)}
                style={({ hovered }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 44,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: active ? "#00507d" : "transparent",
                  backgroundColor: active
                    ? c.primary
                    : hovered
                      ? c.surfaceAlt
                      : "transparent",
                })}
              >
                <Icon
                  name={icon}
                  size={19}
                  color={active ? "#fff" : c.textSecondary}
                />
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    color: active ? "#fff" : c.textSecondary,
                    fontSize: 13,
                    flex: 1,
                    lineHeight: 20,
                  }}
                >
                  {label}
                </Text>
                {employee && id === "orders" && (
                  <Badge tone="warning">
                    {
                      data.orders.filter((o) =>
                        ["pending", "ready"].includes(o.status),
                      ).length
                    }
                  </Badge>
                )}
                {id === "audit" && (
                  <Badge tone="critical" dot>
                    Rx
                  </Badge>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
        <View
          style={{ padding: 12, borderTopWidth: 1, borderTopColor: c.border }}
        >
          <View
            style={{
              padding: 8,
              backgroundColor: c.surfaceAlt,
              flexDirection: "row",
              gap: 6,
              alignItems: "center",
              borderRadius: 3,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#059669",
              }}
            />
            <Text
              style={{
                fontFamily: fonts.mono,
                fontSize: 9,
                color: c.textSecondary,
                flex: 1,
              }}
            >
              {mode === "demo" ? "Datos locales" : "API PHP / MySQL"}
            </Text>
            <Text
              style={{ fontFamily: fonts.mono, fontSize: 9, color: "#059669" }}
            >
              {mode === "demo" ? "Demo" : "Conectada"}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setPanel("protocol")}
            style={{
              flexDirection: "row",
              gap: 10,
              paddingTop: 16,
              paddingBottom: 4,
            }}
          >
            <Icon name="BookOpen" size={18} />
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 12,
                color: c.textSecondary,
                flex: 1,
              }}
            >
              Docs Protocolo
            </Text>
            <Icon name="ChevronsLeft" size={16} />
          </Pressable>
        </View>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: c.canvas }}>
      {desktop && sidebar()}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            height: desktop ? 72 : 64,
            backgroundColor: c.panel,
            borderBottomWidth: 1,
            borderBottomColor: c.border,
            flexDirection: "row",
            alignItems: "center",
            gap: width > 1280 ? 16 : 10,
            paddingHorizontal: desktop ? 24 : 12,
          }}
        >
          {!desktop && (
            <IconButton
              name="Menu"
              label="Abrir menú"
              onPress={() => setMenu(true)}
            />
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sede operativa"
            onPress={() => setPanel("branch")}
            style={{
              height: desktop ? 48 : 40,
              width: desktop ? (width >= 1600 ? 250 : 210) : 150,
              borderWidth: 1,
              borderColor: c.borderStrong,
              borderRadius: 3,
              paddingHorizontal: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Icon name="Building2" size={19} />
            <Text
              numberOfLines={2}
              style={{
                ...text,
                fontSize: 12,
                fontFamily: fonts.medium,
                flex: 1,
              }}
            >
              Sede {branch.name} ({branch.city})
            </Text>
            <Icon name="ChevronDown" size={14} />
          </Pressable>
          {width > 580 && (
            <View
              style={{
                flex: 1,
                height: 36,
                borderWidth: 1,
                borderColor: c.borderStrong,
                borderRadius: 3,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 10,
                gap: 9,
              }}
            >
              <Icon name="Search" size={17} />
              <TextInput
                accessibilityLabel="Buscar medicamento"
                placeholder="Buscar fármaco, principio activo o código..."
                placeholderTextColor={c.muted}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() =>
                  go(employee ? "inventory" : "catalog", { query })
                }
                style={{
                  flex: 1,
                  fontSize: 12,
                  fontFamily: fonts.regular,
                  color: c.text,
                  padding: 0,
                  outlineStyle: "none",
                }}
                returnKeyType="search"
              />
              {width > 1280 && (
                <Text
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 9,
                    color: c.muted,
                    backgroundColor: c.surfaceAlt,
                    padding: 4,
                  }}
                >
                  ⌘ K
                </Text>
              )}
            </View>
          )}
          {employee && width > 1280 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Recetas por auditar"
              onPress={() => go("audit")}
              style={{
                padding: 10,
                borderRadius: 3,
                backgroundColor: "#fffbeb",
                borderWidth: 1,
                borderColor: "#fde68a",
                maxWidth: 160,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 10,
                  letterSpacing: 0.4,
                  color: "#92400e",
                }}
              >
                {pending} RECETAS POR AUDITAR
              </Text>
            </Pressable>
          )}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginLeft: "auto",
            }}
          >
            {width > 650 && (
              <IconButton
                name={prefs.theme === "dark" ? "Sun" : "Moon"}
                label="Cambiar apariencia"
                onPress={() =>
                  pref({ theme: prefs.theme === "dark" ? "light" : "dark" })
                }
              />
            )}
            <IconButton
              name="Bell"
              label="Ver notificaciones"
              onPress={() => setPanel("notifications")}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mi cuenta"
              onPress={() => setPanel("profile")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 9,
                borderLeftWidth: desktop ? 1 : 0,
                borderLeftColor: c.border,
                paddingLeft: desktop ? 14 : 0,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: c.border,
                  backgroundColor: c.surfaceAlt,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 10,
                    color: c.muted,
                  }}
                >
                  {user.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(-2)
                    .map((n) => n[0])
                    .join("")}
                </Text>
              </View>
              {width > 1050 && (
                <View style={{ maxWidth: 150, gap: 3 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      ...text,
                      fontFamily: fonts.semibold,
                      fontSize: 11,
                    }}
                  >
                    {user.name}
                    {employee ? ", PharmD" : ""}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 6,
                      alignItems: "center",
                    }}
                  >
                    <Badge tone="info">
                      {employee ? "Regente" : "Cliente"}
                    </Badge>
                    <Text
                      style={{
                        fontFamily: fonts.mono,
                        fontSize: 9,
                        color: c.muted,
                      }}
                    >
                      ID {user.id.toString().padStart(4, "0")}
                    </Text>
                  </View>
                </View>
              )}
            </Pressable>
          </View>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: width >= 1600 ? 32 : desktop ? 24 : 16,
            flexGrow: 1,
          }}
        >
          {children}
          <View
            style={{
              marginTop: 32,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: c.border,
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 10,
                color: c.muted,
              }}
            >
              PharmaFlow OS · Gestión farmacéutica
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 10,
                color: c.muted,
              }}
            >
              {mode === "demo"
                ? "Demostración · datos ficticios"
                : "Conectado a PHP / MySQL"}
            </Text>
          </View>
        </ScrollView>
      </View>
      {!desktop && (
        <NativeModal
          visible={menu}
          transparent
          animationType="fade"
          onRequestClose={() => setMenu(false)}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              backgroundColor: "#0f172a66",
            }}
          >
            {sidebar()}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar menú"
              style={{ flex: 1 }}
              onPress={() => setMenu(false)}
            />
          </View>
        </NativeModal>
      )}
      {panel === "branch" && (
        <Modal title="Sede operativa" onClose={() => setPanel(null)}>
          <Select
            value={branch.id}
            onChange={(v) => {
              pref({ branchId: Number(v) });
              setPanel(null);
            }}
            options={data.branches.map((b) => ({
              label: `Sede ${b.name} (${b.city})`,
              value: b.id,
            }))}
          />
        </Modal>
      )}
      {panel === "profile" && (
        <Modal title="Mi cuenta" onClose={() => setPanel(null)}>
          <View style={{ gap: 16 }}>
            <Text style={{ ...text, fontFamily: fonts.semibold, fontSize: 16 }}>
              {user.name}
            </Text>
            <Text style={text}>{user.email}</Text>
            <Badge tone="info">
              {employee ? "Empleado · Regente farmacéutico" : "Cliente"}
            </Badge>
            <Text style={{ ...text, fontSize: 12 }}>
              {employee
                ? "Acceso a operaciones y auditoría"
                : "Acceso a catálogo y reservas propias"}
            </Text>
            <Button
              title="Cerrar sesión"
              icon="LogOut"
              tone="secondary"
              onPress={() => setPanel("logout")}
            />
          </View>
        </Modal>
      )}
      {panel === "logout" && (
        <Confirm
          title="Cerrar sesión"
          message="Tu información guardada estará disponible cuando vuelvas a ingresar."
          onClose={() => setPanel(null)}
          onConfirm={signOut}
        />
      )}
      {panel === "notifications" && (
        <Modal title="Notificaciones" onClose={() => setPanel(null)}>
          {(employee
            ? data.events.slice(0, 8)
            : data.orders
                .filter((o) => o.userId === user.id)
                .map((o) => ({
                  id: o.id,
                  title: `Orden #ORD-${o.id}`,
                  detail:
                    o.status === "ready"
                      ? "Lista para retiro"
                      : "Consulta el estado de tu reserva",
                  createdAt: o.createdAt,
                }))
          ).map((e) => (
            <View
              key={e.id}
              style={{
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: c.border,
                gap: 6,
              }}
            >
              <Text
                style={{ ...text, fontFamily: fonts.semibold, fontSize: 12 }}
              >
                {e.title}
              </Text>
              <Text style={{ ...text, fontSize: 12, color: c.muted }}>
                {e.detail}
              </Text>
              <Text
                style={{ fontFamily: fonts.mono, fontSize: 10, color: c.muted }}
              >
                {age(e.createdAt)}
              </Text>
            </View>
          ))}
        </Modal>
      )}
      {panel === "protocol" && (
        <Modal title="Protocolo de operación" onClose={() => setPanel(null)}>
          <View style={{ gap: 16 }}>
            <Text style={text}>
              La revisión es manual y debe realizarla personal autorizado. Los
              datos de demostración no tienen validez clínica.
            </Text>
            <Text style={{ ...text, fontFamily: fonts.semibold }}>
              Validación de recetas
            </Text>
            {[
              "Confirmar identidad del paciente y legibilidad del documento.",
              "Comprobar datos del prescriptor y vigencia de la receta.",
              "Revisar medicamentos, cantidades y condiciones de entrega.",
              "Registrar el dictamen con su motivo. Retener el original cuando corresponda.",
            ].map((t, i) => (
              <Text key={t} style={{ ...text, fontSize: 13, lineHeight: 22 }}>
                {i + 1}. {t}
              </Text>
            ))}
            <Text style={{ ...text, fontSize: 13, lineHeight: 22 }}>
              Las reservas descuentan las unidades disponibles. Rechazar o
              cancelar libera esas unidades. El despacho requiere el código de
              retiro y solo se registra una vez.
            </Text>
          </View>
        </Modal>
      )}
    </View>
  );
}
