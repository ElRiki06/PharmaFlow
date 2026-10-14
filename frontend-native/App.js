import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import Provider from "./src/components/Provider";
import Shell from "./src/components/Shell";
import { useApp } from "./src/lib/context";
import { canAccess } from "./src/lib/domain";
import { ThemeContext, useTheme, fonts } from "./src/components/Ui";
import Login from "./src/screens/Login";
import Catalog from "./src/screens/Catalog";
import Orders from "./src/screens/Orders";
import Audit from "./src/screens/Audit";
import Inventory from "./src/screens/Inventory";
import Dashboard from "./src/screens/Dashboard";
import Settings from "./src/screens/Settings";
const screens = {
  dashboard: Dashboard,
  catalog: Catalog,
  inventory: Inventory,
  audit: Audit,
  orders: Orders,
  settings: Settings,
};
function Content() {
  const { user, ready, toast } = useApp();
  const { colors } = useTheme();
  const [route, setRoute] = useState({ page: "", params: {} }),
    [hidden, setHidden] = useState(null);
  const navigate = (page, params = {}) => setRoute({ page, params });
  const page = canAccess(user, route.page)
    ? route.page
    : canAccess(user, "dashboard")
      ? "dashboard"
      : "catalog";
  const Screen = screens[page];
  if (!ready)
    return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {user ? (
          <Shell page={page} navigate={navigate}>
            <Screen
              key={`${page}-${route.params.id || ""}-${route.params.query || ""}`}
              navigate={navigate}
              initialId={route.params.id}
              initialQuery={route.params.query || ""}
            />
          </Shell>
        ) : (
          <Login />
        )}
        {toast && toast !== hidden && (
          <Pressable
            accessibilityRole="alert"
            onPress={() => setHidden(toast)}
            style={{
              position: "absolute",
              bottom: 24,
              right: 24,
              left: Platform.OS === "web" ? undefined : 16,
              maxWidth: 600,
              backgroundColor: toast.kind === "error" ? "#fef2f2" : "#ecfdf5",
              borderWidth: 1,
              borderColor: toast.kind === "error" ? "#fecaca" : "#a7f3d0",
              padding: 16,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 13,
                color: toast.kind === "error" ? "#991b1b" : "#065f46",
              }}
            >
              {toast.message}
            </Text>
          </Pressable>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
function Themed() {
  const { prefs } = useApp();
  return (
    <ThemeContext.Provider value={prefs.theme}>
      <Content />
    </ThemeContext.Provider>
  );
}
export default function App() {
  const [loaded, error] = useFonts({
    Inter: require("@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf"),
    InterMedium: require("@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf"),
    InterSemiBold: require("@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf"),
    InterBold: require("@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf"),
    JetBrainsMono: require("@expo-google-fonts/jetbrains-mono/500Medium/JetBrainsMono_500Medium.ttf"),
  });
  if (error)
    return (
      <View>
        <Text>No se pudieron cargar las fuentes: {error.message}</Text>
      </View>
    );
  if (!loaded) return <ActivityIndicator style={{ flex: 1 }} color="#0369a1" />;
  return (
    <SafeAreaProvider>
      <Provider>
        <Themed />
      </Provider>
    </SafeAreaProvider>
  );
}
