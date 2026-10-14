import { useCallback, useEffect, useRef, useState } from "react";
import { seed, users } from "../data/seed.js";
import { apply, canAccess, login, normalize } from "../lib/domain.js";
import { mode, mutate, request } from "../lib/api.js";
import { read, remove, write } from "../lib/storage.js";
import { Context } from "../lib/context.js";
import { beep } from "../lib/sound.js";

export default function Provider({ children }) {
  const [data, setData] = useState(seed);
  const [session, setSession] = useState(null);
  const [prefs, setPrefs] = useState({
    branchId: 1,
    sound: true,
    theme: "light",
  });
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const stateRef = useRef(data);
  const toastTimer = useRef(null);
  const sound = useRef(prefs.sound);
  useEffect(() => {
    sound.current = prefs.sound;
  }, [prefs.sound]);
  const commit = useCallback((value) => {
    stateRef.current = value;
    setData(value);
  }, []);
  const notify = useCallback((message, kind = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ message, kind });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [saved, savedPrefs, local] = await Promise.all([
          read(`session-${mode}`),
          read("prefs"),
          mode === "demo" ? read("demo") : Promise.resolve(null),
        ]);
        if (!active) return;
        if (savedPrefs)
          setPrefs({
            branchId: Number(savedPrefs.branchId) || 1,
            sound: savedPrefs.sound !== false,
            theme: savedPrefs.theme === "light" ? "light" : "dark",
          });
        if (mode === "demo") {
          commit(normalize(local));
          const user = users.find((u) => u.id === saved?.user?.id);
          if (user) setSession({ user });
        } else if (saved?.token) {
          try {
            const account = await request("/auth/me", { token: saved.token });
            const result = await request("/state", { token: saved.token });
            if (active) {
              setSession({ ...saved, user: account.user });
              commit(result.state);
            }
          } catch (e) {
            if (e.status === 401) await remove(`session-${mode}`);
            throw e;
          }
        }
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setReady(true);
      }
    }
    load();
    return () => {
      active = false;
      clearTimeout(toastTimer.current);
    };
  }, [commit]);

  useEffect(() => {
    // Theme is provided through native components, including React Native Web.
  }, [prefs.theme]);

  async function signIn(email, password, registration) {
    const result =
      mode === "demo"
        ? { user: login(email, password) }
        : await request(registration ? "/auth/register" : "/auth/login", {
            method: "POST",
            data: { email, password, ...registration },
          });
    const next =
      mode === "demo"
        ? stateRef.current
        : (await request("/state", { token: result.token })).state;
    await write(`session-${mode}`, result);
    commit(next);
    setSession(result);
    setError("");
  }
  async function signOut() {
    if (mode === "api") {
      try {
        await request("/auth/logout", { method: "POST", token: session.token });
      } catch (e) {
        if (e.status !== 401) throw e;
      }
    }
    await remove(`session-${mode}`);
    setSession(null);
  }
  async function run(action) {
    if (lock.current)
      throw new Error("Espera a que termine la operación actual.");
    lock.current = true;
    setBusy(true);
    try {
      const next =
        mode === "demo"
          ? apply(stateRef.current, action, session.user)
          : (await mutate(action, session.token)).state;
      if (mode === "demo") await write("demo", next);
      commit(next);
      if (sound.current) beep();
      return next;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function refresh() {
    if (mode === "api")
      commit((await request("/state", { token: session.token })).state);
    else commit(normalize(await read("demo", stateRef.current)));
  }
  async function savePrefs(values) {
    const next = { ...prefs, ...values };
    await write("prefs", next);
    setPrefs(next);
  }
  async function reset() {
    if (mode !== "demo" || !canAccess(session.user, "settings"))
      throw new Error(
        "El reinicio está disponible para empleados en modo demo.",
      );
    const next = seed();
    await write("demo", next);
    commit(next);
    for (const user of users) await remove(`cart-${mode}-${user.id}`);
    notify("Datos de demostración restablecidos.");
  }
  return (
    <Context.Provider
      value={{
        data,
        user: session?.user,
        prefs,
        ready,
        busy,
        toast,
        error,
        mode,
        signIn,
        signOut,
        run,
        refresh,
        savePrefs,
        reset,
        notify,
      }}
    >
      {children}
    </Context.Provider>
  );
}
