import React, { createContext, useContext, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal as NativeModal,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Activity from "lucide-react-native/icons/activity";
import AlertTriangle from "lucide-react-native/icons/triangle-alert";
import ArrowDownToLine from "lucide-react-native/icons/arrow-down-to-line";
import ArrowLeft from "lucide-react-native/icons/arrow-left";
import ArrowRight from "lucide-react-native/icons/arrow-right";
import ArrowRightLeft from "lucide-react-native/icons/arrow-right-left";
import ArrowUpRight from "lucide-react-native/icons/arrow-up-right";
import Banknote from "lucide-react-native/icons/banknote";
import Bell from "lucide-react-native/icons/bell";
import BookOpen from "lucide-react-native/icons/book-open";
import Building2 from "lucide-react-native/icons/building-complex";
import Check from "lucide-react-native/icons/check";
import CheckCircle2 from "lucide-react-native/icons/circle-check";
import ChevronDown from "lucide-react-native/icons/chevron-down";
import ChevronLeft from "lucide-react-native/icons/chevron-left";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import ChevronsLeft from "lucide-react-native/icons/chevrons-left";
import CircleCheck from "lucide-react-native/icons/circle-check";
import ClipboardCheck from "lucide-react-native/icons/clipboard-check";
import Clock3 from "lucide-react-native/icons/clock-3";
import Contrast from "lucide-react-native/icons/contrast";
import Eye from "lucide-react-native/icons/eye";
import EyeOff from "lucide-react-native/icons/eye-off";
import FileClock from "lucide-react-native/icons/file-clock";
import FileImage from "lucide-react-native/icons/file-image";
import Filter from "lucide-react-native/icons/funnel";
import FilterX from "lucide-react-native/icons/funnel-x";
import Gavel from "lucide-react-native/icons/gavel";
import Layers from "lucide-react-native/icons/layers";
import LayoutDashboard from "lucide-react-native/icons/layout-dashboard";
import LockKeyhole from "lucide-react-native/icons/lock-keyhole";
import LogOut from "lucide-react-native/icons/log-out";
import MapPin from "lucide-react-native/icons/map-pin";
import Maximize2 from "lucide-react-native/icons/maximize-2";
import Menu from "lucide-react-native/icons/menu";
import Minus from "lucide-react-native/icons/minus";
import Moon from "lucide-react-native/icons/moon";
import Package from "lucide-react-native/icons/package";
import PackageCheck from "lucide-react-native/icons/package-check";
import PackageOpen from "lucide-react-native/icons/package-open";
import PackagePlus from "lucide-react-native/icons/package-plus";
import Pencil from "lucide-react-native/icons/pencil";
import Phone from "lucide-react-native/icons/phone";
import Plus from "lucide-react-native/icons/plus";
import QrCode from "lucide-react-native/icons/qr-code";
import RotateCcw from "lucide-react-native/icons/rotate-ccw";
import RotateCw from "lucide-react-native/icons/rotate-cw";
import Search from "lucide-react-native/icons/search";
import ShieldCheck from "lucide-react-native/icons/shield-check";
import ShoppingBag from "lucide-react-native/icons/shopping-bag";
import Snowflake from "lucide-react-native/icons/snowflake";
import Stethoscope from "lucide-react-native/icons/stethoscope";
import Store from "lucide-react-native/icons/store";
import Sun from "lucide-react-native/icons/sun";
import Trash2 from "lucide-react-native/icons/trash";
import TriangleAlert from "lucide-react-native/icons/triangle-alert";
import Upload from "lucide-react-native/icons/upload";
import UserRound from "lucide-react-native/icons/user-round";
import Volume2 from "lucide-react-native/icons/volume-2";
import X from "lucide-react-native/icons/x";
import XCircle from "lucide-react-native/icons/circle-x";
const Icons = {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpRight,
  Banknote,
  Bell,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  CircleCheck,
  ClipboardCheck,
  Clock3,
  Contrast,
  Eye,
  EyeOff,
  FileClock,
  FileImage,
  Filter,
  FilterX,
  Gavel,
  Layers,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MapPin,
  Maximize2,
  Menu,
  Minus,
  Moon,
  Package,
  PackageCheck,
  PackageOpen,
  PackagePlus,
  Pencil,
  Phone,
  Plus,
  QrCode,
  RotateCcw,
  RotateCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Snowflake,
  Stethoscope,
  Store,
  Sun,
  Trash2,
  TriangleAlert,
  Upload,
  UserRound,
  Volume2,
  X,
  XCircle,
};
export const fonts = {
  regular: "Inter",
  medium: "InterMedium",
  semibold: "InterSemiBold",
  bold: "InterBold",
  mono: "JetBrainsMono",
};
export const ThemeContext = createContext("light");
export function useTheme() {
  const dark = useContext(ThemeContext) === "dark";
  return {
    colors: {
      primary: "#0369a1",
      text: dark ? "#eaf1ff" : "#0f172a",
      muted: dark ? "#94a3b8" : "#64748b",
      textSecondary: dark ? "#cbd5e1" : "#334155",
      border: dark ? "#334155" : "#e2e8f0",
      borderStrong: dark ? "#475569" : "#cbd5e1",
      canvas: dark ? "#0f172a" : "#f8fafc",
      surfaceAlt: dark ? "#243247" : "#f1f5f9",
      panel: dark ? "#1e293b" : "#fff",
      danger: "#dc2626",
      success: "#059669",
    },
  };
}
export function Icon({
  name = "Activity",
  size = 18,
  color,
  strokeWidth = 1.8,
}) {
  const { colors } = useTheme();
  const C = Icons[name] || Icons.Activity;
  return (
    <C size={size} color={color || colors.muted} strokeWidth={strokeWidth} />
  );
}
export const styles = {
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  muted: { color: "#64748b", fontSize: 12, fontFamily: fonts.regular },
  title: { fontSize: 16, fontFamily: fonts.semibold },
  text: { fontSize: 14, fontFamily: fonts.regular },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
};
export function Button({
  title,
  children,
  onPress,
  disabled,
  tone = "primary",
  icon,
  size,
  style,
  ...rest
}) {
  const { colors: c } = useTheme();
  const small = size === "small",
    secondary = ["secondary", "ghost"].includes(tone),
    danger = tone === "danger";
  const fg = danger ? c.danger : secondary ? c.text : "#fff";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      {...rest}
      style={({ pressed }) => [
        {
          minHeight: Platform.OS === "web" ? (small ? 29 : 36) : 44,
          paddingHorizontal: small ? 8 : 12,
          paddingVertical: small ? 5 : 8,
          borderRadius: small ? 4 : 6,
          borderWidth: 1,
          borderColor:
            tone === "ghost"
              ? "transparent"
              : danger
                ? "#fecaca"
                : secondary
                  ? c.border
                  : tone === "approve"
                    ? "#047857"
                    : "#0284c7",
          backgroundColor:
            tone === "ghost"
              ? pressed
                ? c.surfaceAlt
                : "transparent"
              : danger
                ? pressed
                  ? "#fef2f2"
                  : c.panel
                : secondary
                  ? pressed
                    ? c.surfaceAlt
                    : c.panel
                  : tone === "approve"
                    ? "#059669"
                    : c.primary,
          opacity: disabled ? 0.45 : 1,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 7,
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={small ? 14 : 16} color={fg} />}
      <Text
        style={{
          color: fg,
          fontFamily: fonts.medium,
          fontSize: small ? 11 : 13,
        }}
      >
        {title || children}
      </Text>
    </Pressable>
  );
}
export function IconButton({ name, label, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        minWidth: 36,
        minHeight: 36,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={name} />
    </Pressable>
  );
}
export function Card({ children, style, padded = true }) {
  const { colors: c } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.panel,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 8,
          padding: padded ? 16 : 0,
          gap: padded ? 12 : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  style,
  inputStyle,
  ...rest
}) {
  const { colors: c } = useTheme();
  return (
    <View style={[{ gap: 6, marginBottom: 12 }, style]}>
      {Boolean(label) && (
        <Text
          style={{
            color: c.textSecondary,
            fontSize: 12,
            fontFamily: fonts.medium,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        accessibilityLabel={label}
        value={String(value ?? "")}
        onChangeText={onChangeText}
        placeholderTextColor="#8090a5"
        {...rest}
        style={[
          {
            minHeight: Platform.OS === "web" ? 36 : 44,
            borderWidth: 1,
            borderColor: c.borderStrong,
            borderRadius: 6,
            paddingHorizontal: 10,
            paddingVertical: 8,
            color: c.text,
            backgroundColor: c.panel,
            fontFamily: fonts.regular,
            fontSize: 14,
            textAlignVertical: rest.multiline ? "top" : "center",
          },
          inputStyle,
        ]}
      />
    </View>
  );
}
export function Select({
  label,
  value,
  onChange,
  options = [],
  tabs = false,
  style,
}) {
  const { colors: c } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => String(o.value) === String(value));
  if (Platform.OS === "web" && !tabs)
    return (
      <View style={[{ gap: 6, marginBottom: 8 }, style]}>
        {Boolean(label) && (
          <Text
            style={{ color: c.muted, fontSize: 12, fontFamily: fonts.medium }}
          >
            {label}
          </Text>
        )}
        <Picker
          accessibilityLabel={label || selected?.label || "Seleccionar"}
          selectedValue={value}
          onValueChange={onChange}
          style={{
            height: 36,
            fontSize: 12,
            fontFamily: fonts.regular,
            color: c.text,
            backgroundColor: c.surfaceAlt,
            borderColor: c.border,
            borderWidth: 1,
            borderRadius: 4,
            paddingHorizontal: 10,
          }}
        >
          {options.map((o) => (
            <Picker.Item
              key={String(o.value)}
              label={o.label}
              value={o.value}
            />
          ))}
        </Picker>
      </View>
    );
  if (tabs)
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          backgroundColor: c.surfaceAlt,
          padding: 4,
          borderRadius: 4,
          gap: 3,
        }}
      >
        {options.map((o) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: String(value) === String(o.value) }}
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              minHeight: Platform.OS === "web" ? 28 : 44,
              borderRadius: 3,
              justifyContent: "center",
              backgroundColor:
                String(value) === String(o.value) ? c.panel : "transparent",
            }}
          >
            <Text
              style={{
                color: c.textSecondary,
                fontFamily: fonts.medium,
                fontSize: 11,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    );
  return (
    <View style={[{ gap: 6, marginBottom: 8 }, style]}>
      {Boolean(label) && (
        <Text
          style={{ color: c.muted, fontSize: 12, fontFamily: fonts.medium }}
        >
          {label}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          label
            ? `${label}: ${selected?.label || "Seleccionar"}`
            : selected?.label || "Seleccionar"
        }
        onPress={() => setOpen(true)}
        style={{
          minHeight: Platform.OS === "web" ? 36 : 44,
          backgroundColor: c.surfaceAlt,
          borderRadius: 4,
          paddingHorizontal: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Text
          style={{
            color: c.text,
            fontFamily: fonts.regular,
            fontSize: 12,
            flexShrink: 1,
          }}
        >
          {selected?.label || "Seleccionar"}
        </Text>
        <Icon name="ChevronDown" size={14} />
      </Pressable>
      {open && (
        <Modal title={label || "Seleccionar"} onClose={() => setOpen(false)}>
          {options.map((o) => (
            <Pressable
              accessibilityRole="button"
              key={String(o.value)}
              onPress={() => {
                onChange(o.value);
                setOpen(false);
              }}
              style={{
                minHeight: 44,
                padding: 12,
                backgroundColor:
                  String(value) === String(o.value) ? c.surfaceAlt : c.panel,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text
                style={{ fontFamily: fonts.regular, color: c.text, flex: 1 }}
              >
                {o.label}
              </Text>
              {String(value) === String(o.value) && (
                <Icon name="Check" color={c.primary} />
              )}
            </Pressable>
          ))}
        </Modal>
      )}
    </View>
  );
}
const tones = {
  success: ["#ecfdf5", "#a7f3d0", "#065f46"],
  warning: ["#fffbeb", "#fde68a", "#92400e"],
  critical: ["#fef2f2", "#fecaca", "#991b1b"],
  danger: ["#fef2f2", "#fecaca", "#991b1b"],
  info: ["#eff6ff", "#bfdbfe", "#1e40af"],
  dark: ["#0f172a", "#0f172a", "#fff"],
  neutral: ["#f1f5f9", "#e2e8f0", "#475569"],
};
export function Badge({ children, tone = "neutral", dot = false, style }) {
  const t = tones[tone] || tones.neutral;
  return (
    <View
      style={[
        {
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: 6,
          paddingVertical: 3,
          borderRadius: 3,
          borderWidth: 1,
          borderColor: t[1],
          backgroundColor: t[0],
        },
        style,
      ]}
    >
      {dot && (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: t[2],
          }}
        />
      )}
      <Text style={{ color: t[2], fontSize: 10, fontFamily: fonts.medium }}>
        {children}
      </Text>
    </View>
  );
}
export function PageHead({ title, subtitle, tag, actions }) {
  const { colors: c } = useTheme();
  const wide = useWindowDimensions().width > 1000;
  return (
    <View
      style={{
        flexDirection: wide ? "row" : "column",
        justifyContent: "space-between",
        alignItems: wide ? "center" : "stretch",
        gap: 16,
      }}
    >
      <View style={{ flex: 1, gap: 7 }}>
        {Boolean(tag) && (
          <Text
            style={{
              color: c.primary,
              fontSize: 10,
              fontFamily: fonts.mono,
              letterSpacing: 1.5,
            }}
          >
            {tag}
          </Text>
        )}
        <Text
          accessibilityRole="header"
          style={{
            color: c.text,
            fontSize: wide ? 24 : 20,
            lineHeight: wide ? 32 : 28,
            fontFamily: fonts.bold,
            letterSpacing: -0.5,
          }}
        >
          {title}
        </Text>
        {Boolean(subtitle) && (
          <Text
            style={{
              color: c.muted,
              fontSize: 13,
              lineHeight: 20,
              fontFamily: fonts.regular,
              maxWidth: 690,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {actions && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          {actions}
        </View>
      )}
    </View>
  );
}
export function Metric({
  label,
  value,
  detail,
  icon,
  tone,
  children,
  compact = false,
}) {
  const { colors: c } = useTheme();
  return (
    <Card style={{ padding: 16, minHeight: compact ? 113 : 165, gap: 0 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <Text
          style={{
            fontSize: 10,
            color: c.muted,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            fontFamily: fonts.medium,
            flex: 1,
          }}
        >
          {label}
        </Text>
        {icon && <Icon name={icon} size={17} />}
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: compact ? 12 : 18,
          marginBottom: compact ? 9 : 15,
          gap: 8,
        }}
      >
        <Text
          style={{
            color:
              tone === "critical"
                ? "#991b1b"
                : tone === "warning"
                  ? "#92400e"
                  : c.text,
            fontSize: 25,
            fontFamily: fonts.mono,
            letterSpacing: -1,
          }}
        >
          {value}
        </Text>
        {children}
      </View>
      <Text
        style={{
          fontSize: 11,
          color: c.muted,
          lineHeight: 17,
          fontFamily: fonts.regular,
        }}
      >
        {detail}
      </Text>
    </Card>
  );
}
export function DataTable({
  columns,
  rows,
  renderCell,
  onRowPress,
  minWidth = 700,
}) {
  const { colors: c } = useTheme();
  const [available, setAvailable] = useState(0);
  const base = columns.reduce((n, col) => n + (col.width || 120), 0);
  const total = Math.max(minWidth, available, base);
  const grow = columns.reduce((n, col) => n + (col.flex || 0), 0);
  const cell = (col) => ({
    width:
      (col.width || 120) +
      (grow ? ((total - base) * (col.flex || 0)) / grow : 0),
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems:
      col.align === "right"
        ? "flex-end"
        : col.align === "center"
          ? "center"
          : "flex-start",
  });
  return (
    <View onLayout={(e) => setAvailable(e.nativeEvent.layout.width)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        contentContainerStyle={{ minWidth: "100%" }}
      >
        <View style={{ width: total }}>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: c.canvas,
              borderBottomWidth: 1,
              borderBottomColor: c.border,
            }}
          >
            {columns.map((col) => (
              <View key={col.key} style={cell(col)}>
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: 9,
                    color: c.muted,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  {col.label}
                </Text>
              </View>
            ))}
          </View>
          {rows.map((r, i) => (
            <Pressable
              key={r.id || i}

              onPress={onRowPress ? () => onRowPress(r) : undefined}
              style={({ hovered }) => ({
                flexDirection: "row",
                borderBottomWidth: 1,
                borderBottomColor: c.surfaceAlt,
                backgroundColor: hovered ? c.canvas : c.panel,
                minHeight: 54,
              })}
            >
              {columns.map((col) => (
                <View key={col.key} style={cell(col)}>
                  {renderCell ? (
                    renderCell(r, col)
                  ) : (
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 12,
                        color: c.text,
                      }}
                    >
                      {String(r[col.key] ?? "")}
                    </Text>
                  )}
                </View>
              ))}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
export function Empty({ title }) {
  const { colors: c } = useTheme();
  return (
    <View style={{ padding: 28, alignItems: "center", gap: 12 }}>
      <Icon name="PackageOpen" size={28} />
      <Text
        style={{
          color: c.muted,
          textAlign: "center",
          fontFamily: fonts.regular,
          fontSize: 13,
        }}
      >
        {title}
      </Text>
    </View>
  );
}
export function Modal({ title, onClose, children }) {
  const { colors: c } = useTheme();
  return (
    <NativeModal transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "#0f172a70",
          justifyContent: "center",
          alignItems: "center",
          padding: 18,
        }}
      >
        <View
          accessibilityViewIsModal
          style={{
            width: "100%",
            maxWidth: 650,
            maxHeight: "90%",
            backgroundColor: c.panel,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: c.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: c.border,
            }}
          >
            <Text
              style={{
                color: c.text,
                fontSize: 16,
                fontFamily: fonts.semibold,
                flex: 1,
              }}
            >
              {title}
            </Text>
            <IconButton name="X" label="Cerrar" onPress={onClose} />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20 }}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </NativeModal>
  );
}
export function Confirm({ title, message, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  const { colors: c } = useTheme();
  return (
    <Modal title={title} onClose={busy ? () => {} : onClose}>
      <View style={{ marginBottom: 16 }}>
        <Icon name="TriangleAlert" size={28} color="#d97706" />
      </View>
      <Text
        style={{
          color: c.text,
          fontFamily: fonts.regular,
          fontSize: 14,
          lineHeight: 22,
          marginBottom: 20,
        }}
      >
        {message}
      </Text>
      {Boolean(error) && (
        <Text
          accessibilityRole="alert"
          style={{ color: c.danger, marginBottom: 12 }}
        >
          {error}
        </Text>
      )}
      <View style={[styles.actions, { justifyContent: "flex-end" }]}>
        <Button
          title="Volver"
          tone="secondary"
          disabled={busy}
          onPress={onClose}
        />
        <Button
          title={busy ? "Guardando…" : "Confirmar"}
          disabled={busy}
          onPress={async () => {
            if (lock.current) return;
            lock.current = true;
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } catch (e) {
              setError(e.message);
            } finally {
              lock.current = false;
              setBusy(false);
            }
          }}
        />
      </View>
    </Modal>
  );
}
