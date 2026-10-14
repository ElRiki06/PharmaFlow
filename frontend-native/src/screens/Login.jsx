import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useApp } from "../lib/context";
import {
  Field,
  Button,
  Icon,
  IconButton,
  Badge,
  useTheme,
  fonts,
} from "../components/Ui";
export default function Login() {
  const { signIn, mode, error: loadError } = useApp();
  const { colors: c } = useTheme();
  const { width, height } = useWindowDimensions();
  const wide = width > 800;
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [register, setRegister] = useState(false),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  async function submit(account) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (!account && (!email.trim() || !password))
        throw new Error("Completa el correo y la contraseña.");
      if (register && name.trim().length < 3)
        throw new Error("Ingresa tu nombre completo.");
      await signIn(
        account || email,
        account ? "Pharma123!" : password,
        register ? { name } : undefined,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const text = { fontFamily: fonts.regular, color: c.text };
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1, backgroundColor: c.panel }}
    >
      <View style={{ flex: 1, minHeight: height, flexDirection: "row" }}>
        {wide && (
          <View
            style={{
              flex: 1.08,
              padding: width > 1050 ? 50 : 30,
              paddingTop: 40,
              backgroundColor: "#eff4fa",
              borderRightWidth: 1,
              borderRightColor: "#e2e8f0",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
            >
              <Image
                source={require("../../assets/logo.png")}
                style={{ width: 150, height: 36 }}
                resizeMode="contain"
              />
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 11,
                  color: "#64748b",
                  borderLeftWidth: 1,
                  borderLeftColor: "#cbd5e1",
                  paddingLeft: 16,
                }}
              >
                Operaciones farmacéuticas
              </Text>
            </View>
            <View
              style={{ flex: 1, justifyContent: "center", paddingVertical: 80 }}
            >
              <View
                style={{
                  alignSelf: "flex-start",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: "#cbd5e1",
                  borderRadius: 4,
                  marginBottom: 24,
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
                    fontFamily: fonts.regular,
                    fontSize: 11,
                    color: "#64748b",
                  }}
                >
                  Un solo sistema. Todas tus sedes.
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: width > 1050 ? 42 : 34,
                  lineHeight: width > 1050 ? 51 : 42,
                  letterSpacing: -1.5,
                  color: "#0f172a",
                }}
              >
                Precisión en cada{"\n"}operación.{"\n"}
                <Text style={{ color: "#0369a1" }}>
                  Cuidado en cada entrega.
                </Text>
              </Text>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 14,
                  lineHeight: 25,
                  color: "#64748b",
                  maxWidth: 405,
                  marginTop: 22,
                }}
              >
                Inventario conectado, reservas organizadas y recetas bajo
                revisión. Todo lo que tu farmacia necesita, en un mismo lugar.
              </Text>
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: "#cbd5e1",
                  marginTop: 36,
                  paddingTop: 16,
                  maxWidth: 400,
                }}
              >
                {[
                  ["Layers", "Inventario multisede"],
                  ["ShieldCheck", "Auditoría de recetas"],
                  ["Building2", "Reservas y despachos"],
                ].map(([icon, label]) => (
                  <View
                    key={label}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 12,
                    }}
                  >
                    <Icon name={icon} color="#0369a1" size={20} />
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 12,
                        color: "#64748b",
                        flex: 1,
                      }}
                    >
                      {label}
                    </Text>
                    <Icon name="Check" size={16} color="#059669" />
                  </View>
                ))}
              </View>
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 10,
                  color: "#64748b",
                }}
              >
                PharmaFlow OS
              </Text>
              <Text
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 10,
                  color: "#64748b",
                }}
              >
                v1.0.0 · El Salvador
              </Text>
            </View>
          </View>
        )}
        <View
          style={{
            flex: 1,
            padding: wide ? 44 : 30,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {!wide && (
            <Image
              source={require("../../assets/logo.png")}
              resizeMode="contain"
              style={{ width: 144, height: 36, marginBottom: 40 }}
            />
          )}
          <View style={{ width: "100%", maxWidth: 360 }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderWidth: 1,
                borderColor: "#bfdbfe",
                backgroundColor: "#eff6ff",
                borderRadius: 8,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 22,
              }}
            >
              <Icon name="LockKeyhole" color="#0369a1" size={26} />
            </View>
            <Text
              style={{
                ...text,
                fontFamily: fonts.semibold,
                fontSize: 23,
                letterSpacing: -0.7,
              }}
            >
              {register ? "Crea tu cuenta" : "Bienvenido a PharmaFlow"}
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 12,
                color: c.muted,
                marginTop: 8,
                marginBottom: 26,
              }}
            >
              {register
                ? "Consulta medicamentos y gestiona tus reservas."
                : "Inicia sesión para acceder a tu espacio de trabajo."}
            </Text>
            {mode === "demo" && (
              <View style={{ marginBottom: 18 }}>
                <Badge tone="warning" dot>
                  Entorno de demostración · datos ficticios
                </Badge>
              </View>
            )}
            {register && (
              <Field
                label="Nombre completo"
                value={name}
                onChangeText={setName}
                maxLength={100}
              />
            )}
            <Field
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@correo.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              maxLength={190}
            />
            <View>
              <Field
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="Ingresa tu contraseña"
                secureTextEntry={!show}
                maxLength={128}
                onSubmitEditing={() => submit()}
                inputStyle={{ paddingRight: 38 }}
              />
              <View style={{ position: "absolute", right: 2, top: 20 }}>
                <IconButton
                  name={show ? "EyeOff" : "Eye"}
                  label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onPress={() => setShow(!show)}
                />
              </View>
            </View>
            {Boolean(error || loadError) && (
              <Text
                accessibilityRole="alert"
                style={{
                  color: "#dc2626",
                  fontFamily: fonts.regular,
                  fontSize: 12,
                  marginBottom: 16,
                }}
              >
                {error || loadError}
              </Text>
            )}
            <Button
              title={
                busy
                  ? "Conectando…"
                  : register
                    ? "Crear cuenta"
                    : "Iniciar sesión"
              }
              disabled={busy}
              icon="ArrowRight"
              onPress={() => submit()}
              style={{ marginTop: 8, minHeight: 42 }}
            />
            {mode === "api" ? (
              <View style={{ marginTop: 16 }}>
                <Button
                  title={
                    register
                      ? "Ya tengo una cuenta"
                      : "Crear una cuenta de cliente"
                  }
                  tone="ghost"
                  onPress={() => {
                    setRegister(!register);
                    setError("");
                  }}
                />
              </View>
            ) : (
              <View style={{ gap: 10, marginTop: 24 }}>
                <Text
                  style={{
                    ...text,
                    fontSize: 11,
                    color: c.muted,
                    textAlign: "center",
                    marginBottom: 6,
                  }}
                >
                  Acceso rápido de prueba
                </Text>
                <Button
                  title="Entrar como empleado"
                  icon="ShieldCheck"
                  tone="secondary"
                  disabled={busy}
                  onPress={() => submit("empleado@farmacia.com")}
                />
                <Button
                  title="Entrar como cliente"
                  icon="Building2"
                  tone="secondary"
                  disabled={busy}
                  onPress={() => submit("cliente@correo.com")}
                />
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 10,
                    color: c.muted,
                    textAlign: "center",
                  }}
                >
                  Ambas cuentas usan la contraseña Pharma123!
                </Text>
              </View>
            )}
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: c.border,
                marginTop: 28,
                paddingTop: 18,
                flexDirection: "row",
                gap: 6,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Icon name="ShieldCheck" size={15} />
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 10,
                  color: c.muted,
                }}
              >
                Acceso a herramientas según tu rol
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
