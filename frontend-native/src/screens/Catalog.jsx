import { useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useApp } from "../lib/context.js";
import { canAccess, isExpired, money } from "../lib/domain.js";
import { pickImage } from "../lib/files.js";
import { read, remove, write } from "../lib/storage.js";
import {
  Badge,
  Button,
  Card,
  Confirm,
  Empty,
  Field,
  Icon,
  PageHead,
  Select,
  fonts,
  useTheme,
} from "../components/Ui.jsx";

export default function Catalog({ navigate, initialQuery = "" }) {
  const { data, user, prefs, run, notify, mode, busy } = useApp();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const desktop = width >= 1120;
  const [branch, setBranch] = useState(prefs.branchId);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const [image, setImage] = useState(null);
  const [doctor, setDoctor] = useState("");
  const [license, setLicense] = useState("");
  const [confirm, setConfirm] = useState(null);
  const key = `cart-${mode}-${user.id}`;
  const employee = canAccess(user, "audit");
  const text = {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
  };
  const muted = { ...text, color: colors.muted, fontSize: 11 };
  const mono = { ...text, fontFamily: fonts.mono };
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);
  useEffect(() => {
    let active = true;
    setLoaded(false);
    setCart([]);
    read(key, [])
      .then((saved) => {
        if (active)
          setCart(
            Array.isArray(saved)
              ? saved.filter(
                  (i) =>
                    Number.isInteger(i.stockId) &&
                    Number.isInteger(i.quantity) &&
                    i.quantity > 0,
                )
              : [],
          );
      })
      .catch((e) => {
        if (active) notify(e.message, "error");
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [key, notify]);
  const items = cart
    .map((i) => {
      const stock = data.stock.find((s) => s.id === i.stockId);
      const drug = stock && data.drugs.find((d) => d.id === stock.drugId);
      return stock && drug ? { ...i, stock, drug } : null;
    })
    .filter(Boolean);
  const cartBranch = items[0]?.stock.branchId;
  const rx = items.some((i) => i.drug.rx);
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const total = items.reduce((n, i) => n + i.quantity * i.drug.price, 0);
  const rows = data.stock
    .filter((s) => s.branchId === Number(branch) && !isExpired(s.expiry))
    .map((s) => ({ ...s, drug: data.drugs.find((d) => d.id === s.drugId) }))
    .filter(
      (s) =>
        s.drug &&
        `${s.drug.name} ${s.drug.ingredient} ${s.drug.code}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (category === "all" || (category === "rx" ? s.drug.rx : !s.drug.rx)),
    );
  async function save(next) {
    if (lock.current || !loaded) return;
    lock.current = true;
    setSaving(true);
    try {
      await write(key, next);
      setCart(next);
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }
  async function change(stock, delta) {
    if (saving || busy || !loaded) return;
    if (delta > 0 && cartBranch && cartBranch !== stock.branchId) {
      setConfirm({ type: "replace", stock });
      return;
    }
    const next = [...cart];
    const index = next.findIndex((i) => i.stockId === stock.id);
    const quantity = (next[index]?.quantity || 0) + delta;
    if (quantity > stock.quantity) {
      notify("La cantidad supera las existencias disponibles.", "error");
      return;
    }
    if (quantity <= 0) {
      if (index >= 0) next.splice(index, 1);
    } else if (index >= 0) next[index] = { stockId: stock.id, quantity };
    else next.push({ stockId: stock.id, quantity });
    try {
      await save(next);
    } catch (e) {
      notify(e.message, "error");
    }
  }
  
  async function attach() {
    try {
      const next = await pickImage(true);
      if (next) setImage(next);
    } catch (e) {
      notify(e.message, "error");
    }
  }
  return (
    <View style={{ gap: 16 }}>
      <PageHead
        tag={employee ? "Atención en mostrador" : "Tu farmacia, más cerca"}
        title={employee ? "Nueva Orden Asistida" : "Catálogo de Medicamentos"}
        subtitle={
          employee
            ? "Crea una reserva bajo tu cuenta de empleado y registra su receta cuando corresponda."
            : "Selecciona una sede, añade tus medicamentos y reserva para retirar en farmacia."
        }
        actions={
          !employee && (
            <Button
              title="Mis reservas"
              icon="ShoppingBag"
              tone="secondary"
              onPress={() => navigate("orders")}
            />
          )
        }
      />
      <View
        style={{
          flexDirection: desktop ? "row" : "column",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        <View
          style={{
            flex: desktop ? 1 : undefined,
            width: desktop ? undefined : "100%",
            minWidth: 0,
          }}
        >
          <Card>
            <Field
              label="Buscar medicamento"
              value={query}
              onChangeText={setQuery}
              placeholder="Nombre, principio activo o código"
            />
            <View
              style={{ flexDirection: width > 700 ? "row" : "column", gap: 12 }}
            >
              <View style={{ flex: 1 }}>
                <Select
                  label="Sede de retiro"
                  value={branch}
                  onChange={(v) => setBranch(Number(v))}
                  options={data.branches
                    .filter((b) => b.active)
                    .map((b) => ({
                      label: `${b.name} · ${b.city}`,
                      value: b.id,
                    }))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Select
                  label="Tipo de medicamento"
                  value={category}
                  onChange={setCategory}
                  options={[
                    { label: "Todos los medicamentos", value: "all" },
                    { label: "Venta libre", value: "otc" },
                    { label: "Con receta", value: "rx" },
                  ]}
                />
              </View>
            </View>
          </Card>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
            {rows.map((s) => {
              const quantity =
                items.find((i) => i.stockId === s.id)?.quantity || 0;
              return (
                <Card
                  key={s.id}
                  style={{
                    width: width > 650 ? "47.8%" : "100%",
                    flexGrow: 0,
                    marginBottom: 0,
                    padding: 20,
                    gap: 5,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 6,
                        backgroundColor: "#eff4ff",
                        borderWidth: 1,
                        borderColor: "#dce9ff",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Icon name="Package" size={27} color={colors.primary} />
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 5 }}>
                      <Badge tone={s.drug.rx ? "dark" : "success"}>
                        {s.drug.controlled
                          ? "Rx controlado"
                          : s.drug.rx
                            ? "Con receta"
                            : "Venta libre"}
                      </Badge>
                      <Badge tone={s.quantity ? "success" : "critical"}>
                        {s.quantity ? "Disponible" : "Agotado"}
                      </Badge>
                    </View>
                  </View>
                  <Text style={muted}>{s.drug.category}</Text>
                  <Text
                    style={[text, { fontSize: 16, fontFamily: fonts.semibold }]}
                  >
                    {s.drug.name}
                  </Text>
                  <Text style={[muted, { marginBottom: 12 }]}>
                    {s.drug.ingredient} · {s.drug.form}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: "auto",
                      gap: 6,
                    }}
                  >
                    <Text style={[mono, { color: colors.muted, fontSize: 9 }]}>
                      {s.drug.code}
                    </Text>
                    <Text style={[muted, { fontSize: 9 }]}>
                      {s.quantity} unidades disponibles
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTopWidth: 1,
                      borderColor: colors.surfaceAlt,
                      paddingTop: 14,
                      marginTop: 9,
                    }}
                  >
                    <Text style={[mono, { fontSize: 19 }]}>
                      {money(s.drug.price)}
                    </Text>
                    {quantity ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Button
                          size="small"
                          title="−"
                          tone="secondary"
                          disabled={saving || busy}
                          onPress={() => change(s, -1)}
                        />
                        <Text style={mono}>{quantity}</Text>
                        <Button
                          size="small"
                          title="+"
                          tone="secondary"
                          disabled={saving || busy || quantity >= s.quantity}
                          onPress={() => change(s, 1)}
                        />
                      </View>
                    ) : (
                      <Button
                        size="small"
                        icon="Plus"
                        title="Añadir"
                        disabled={!s.quantity || saving || busy || !loaded}
                        onPress={() => change(s, 1)}
                      />
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
          {!rows.length && (
            <Empty title="No hay medicamentos en esta vista. Cambia la búsqueda o la sede." />
          )}
          <View
            style={{
              flexDirection: "row",
              gap: 9,
              backgroundColor: "#eff6ff",
              padding: 12,
              marginTop: 20,
            }}
          >
            <Icon name="LockKeyhole" size={19} color={colors.primary} />
            <Text style={[muted, { flex: 1, color: "#1e40af" }]}>
              Los medicamentos con receta quedan sujetos a revisión del regente.
              El inventario se confirma al guardar la reserva.
            </Text>
          </View>
        </View>
        <Card style={{ width: desktop ? 320 : "100%", padding: 18, gap: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              borderBottomWidth: 1,
              borderColor: colors.border,
              paddingBottom: 18,
            }}
          >
            <Icon name="ShoppingBag" size={20} color={colors.primary} />
            <Text
              style={[
                text,
                { fontSize: 15, fontFamily: fonts.semibold, flex: 1 },
              ]}
            >
              Tu Reserva
            </Text>
            <Badge>{count} unidades</Badge>
          </View>
          {items.length ? (
            <>
              <Text
                style={[
                  muted,
                  {
                    backgroundColor: colors.surfaceAlt,
                    padding: 8,
                    borderRadius: 3,
                  },
                ]}
              >
                Retiro en Sede{" "}
                {data.branches.find((b) => b.id === cartBranch)?.name}
              </Text>
              {items.map((i) => (
                <View
                  key={i.stockId}
                  style={{
                    gap: 5,
                    borderBottomWidth: 1,
                    borderColor: colors.surfaceAlt,
                    paddingVertical: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          text,
                          { fontFamily: fonts.medium, fontSize: 11 },
                        ]}
                      >
                        {i.drug.name}
                      </Text>
                      <Text style={[muted, { fontSize: 10 }]}>
                        {i.quantity} × {money(i.drug.price)}
                      </Text>
                    </View>
                    <Text style={[mono, { fontSize: 11 }]}>
                      {money(i.quantity * i.drug.price)}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar ${i.drug.name}`}
                      disabled={saving || busy}
                      onPress={() =>
                        save(cart.filter((c) => c.stockId !== i.stockId)).catch(
                          (e) => notify(e.message, "error"),
                        )
                      }
                      style={{ padding: 5 }}
                    >
                      <Icon name="Trash2" size={15} color={colors.danger} />
                    </Pressable>
                  </View>
                  {(isExpired(i.stock.expiry) ||
                    i.quantity > i.stock.quantity) && (
                    <Text style={{ color: colors.danger || "#d23e4d" }}>
                      Revisa este producto: el lote venció o cambió su
                      disponibilidad.
                    </Text>
                  )}
                </View>
              ))}
              {rx && (
                <>
                  <Text style={text}>
                    Estos medicamentos requieren receta. PNG, JPG o WebP ·
                    máximo 2 MB.
                  </Text>
                  <Button
                    title={image ? "Cambiar receta adjunta" : "Adjuntar receta"}
                    onPress={attach}
                    disabled={saving || busy}
                  />
                  {image && (
                    <Image
                      source={{ uri: image }}
                      accessibilityLabel="Receta adjunta"
                      resizeMode="contain"
                      style={{ height: 180, width: "100%" }}
                    />
                  )}
                  <Field
                    label="Médico prescriptor (opcional)"
                    value={doctor}
                    onChangeText={setDoctor}
                    maxLength={120}
                  />
                  <Field
                    label="Cédula profesional (opcional)"
                    value={license}
                    onChangeText={setLicense}
                    maxLength={60}
                  />
                </>
              )}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  borderTopWidth: 1,
                  borderColor: colors.border,
                  paddingTop: 18,
                }}
              >
                <Text style={[text, { fontSize: 14 }]}>Total</Text>
                <Text style={[mono, { fontSize: 20 }]}>{money(total)}</Text>
              </View>
              <Text style={[muted, { fontSize: 10 }]}>
                El pago se realiza en la farmacia al retirar.
              </Text>
              <Button
                title="Revisar reserva"
                disabled={saving || busy || !loaded}
                onPress={() => {
                  if (rx && !image)
                    notify(
                      "Adjunta la receta para reservar estos medicamentos.",
                      "error",
                    );
                  else setConfirm({ type: "reserve" });
                }}
              />
            </>
          ) : (
            <Empty
              title={loaded ? "Tu reserva está vacía" : "Cargando reserva…"}
            />
          )}
        </Card>
      </View>
      {confirm && (
        <Confirm
          title={
            confirm.type === "replace"
              ? "Cambiar sede de retiro"
              : "Confirmar reserva"
          }
          message={
            confirm.type === "replace"
              ? "Solo puedes reservar en una sede por pedido. Se reemplazará la selección actual por el medicamento de la nueva sede."
              : `Reserva ${count} unidades por ${money(total)} en Sede ${data.branches.find((b) => b.id === cartBranch)?.name}. ${rx ? "La receta quedará pendiente de auditoría." : "Tu pedido quedará listo para retirar."}`
          }
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            if (confirm.type === "replace") {
              await save([{ stockId: confirm.stock.id, quantity: 1 }]);
              setImage(null);
              setDoctor("");
              setLicense("");
              setConfirm(null);
              return;
            }
            await run({
              type: "reserve",
              branchId: cartBranch,
              items: cart,
              image,
              doctor,
              license,
            });
            try {
              await remove(key);
            } catch {
              notify(
                "Reserva guardada. No fue posible limpiar el carrito local.",
                "error",
              );
            }
            setCart([]);
            setConfirm(null);
            notify("Reserva guardada. Consulta tu código en Mis reservas.");
            navigate("orders");
          }}
        />
      )}
    </View>
  );
}
