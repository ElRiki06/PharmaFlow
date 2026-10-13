import { useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../lib/context.js";
import { Field, IconButton } from "../components/Ui.jsx";

export default function Login() {
  const { signIn, mode, error: loadError } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [register, setRegister] = useState(false);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e, account) {
    e?.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await signIn(
        account || email,
        account ? "Pharma123!" : password,
        register ? { name } : undefined,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login">
      <section className="login-story">
        <div className="login-brand">
          <img src="/logo.png" alt="PharmaFlow" />
          <span>Operaciones farmacéuticas</span>
        </div>
        <div className="login-copy">
          <div className="pill">
            <span className="status-dot" />
            Un solo sistema. Todas tus sedes.
          </div>
          <h1>
            Precisión en cada
            <br />
            operación.
            <br />
            <span>Cuidado en cada entrega.</span>
          </h1>
          <p>
            Inventario conectado, reservas organizadas y recetas bajo revisión.
            Todo lo que tu farmacia necesita, en un mismo lugar.
          </p>
          <div className="login-features">
            <div>
              <Layers3 size={20} />
              <span>Inventario multisede</span>
              <Check size={16} />
            </div>
            <div>
              <ShieldCheck size={20} />
              <span>Auditoría de recetas</span>
              <Check size={16} />
            </div>
            <div>
              <Building2 size={20} />
              <span>Reservas y despachos</span>
              <Check size={16} />
            </div>
          </div>
        </div>
        <div className="login-foot">
          PharmaFlow OS <span>v1.0.0 · El Salvador</span>
        </div>
      </section>
      <section className="login-form">
        <div className="form-wrap">
          <div className="login-mark">
            <LockKeyhole size={26} />
          </div>
          <h2>{register ? "Crea tu cuenta" : "Bienvenido a PharmaFlow"}</h2>
          <p>
            {register
              ? "Consulta medicamentos y gestiona tus reservas."
              : "Inicia sesión para acceder a tu espacio de trabajo."}
          </p>
          {mode === "demo" && (
            <div className="demo-note">
              <span className="status-dot amber" />
              Entorno de demostración · datos ficticios
            </div>
          )}
          <form onSubmit={submit}>
            {register && (
              <Field label="Nombre completo">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={3}
                  maxLength={100}
                  autoComplete="name"
                  required
                />
              </Field>
            )}
            <Field label="Correo electrónico">
              <input
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                maxLength={190}
              />
            </Field>
            <Field label="Contraseña">
              <div className="password-input">
                <input
                  type={show ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={register ? 8 : 1}
                  maxLength={128}
                  autoComplete={register ? "new-password" : "current-password"}
                  required
                />
                <IconButton
                  label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                  type="button"
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </IconButton>
              </div>
            </Field>
            {(error || loadError) && (
              <p className="form-error" role="alert">
                {error || loadError}
              </p>
            )}
            <button className="btn primary full" disabled={busy}>
              {busy ? <LoaderCircle className="spin" size={16} /> : null}
              {register ? "Crear cuenta" : "Iniciar sesión"}
              <ArrowRight size={17} />
            </button>
          </form>
          {mode === "api" ? (
            <button
              className="text-btn"
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Ya tengo una cuenta" : "Crear una cuenta de cliente"}
            </button>
          ) : (
            <div className="test-accounts">
              <div className="divider">Acceso rápido de prueba</div>
              <button
                className="btn secondary full"
                disabled={busy}
                onClick={() => submit(null, "empleado@farmacia.com")}
              >
                <ShieldCheck size={17} />
                Entrar como empleado
                <ArrowRight size={16} />
              </button>
              <button
                className="btn secondary full"
                disabled={busy}
                onClick={() => submit(null, "cliente@correo.com")}
              >
                <Building2 size={17} />
                Entrar como cliente
                <ArrowRight size={16} />
              </button>
              <small>
                Ambas cuentas usan la contraseña <code>Pharma123!</code>
              </small>
            </div>
          )}
          <div className="access-note">
            <ShieldCheck size={15} />
            Acceso a herramientas según tu rol
          </div>
        </div>
      </section>
    </main>
  );
}
