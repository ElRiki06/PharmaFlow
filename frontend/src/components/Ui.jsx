import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, LoaderCircle, X } from "lucide-react";

export function IconButton({ label, children, ...props }) {
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}
export function Badge({ tone = "neutral", children, dot = false }) {
  return (
    <span className={`badge ${tone}`}>
      {dot && <i />}
      {children}
    </span>
  );
}
export function Empty({
  title = "No hay registros",
  children,
  icon: Icon = Check,
}) {
  return (
    <div className="empty">
      <Icon size={28} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function PageHead({ tag, title, children, actions }) {
  return (
    <div className="page-head">
      <div>
        {tag && <div className="eyebrow">{tag}</div>}
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {actions && <div className="head-actions">{actions}</div>}
    </div>
  );
}
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const el = ref.current;
    const focus = () =>
      [...el.querySelectorAll("button,input,select,textarea,a[href]")].filter(
        (x) => !x.disabled,
      );
    focus()[0]?.focus();
    function key(e) {
      if (e.key === "Escape") close.current();
      if (e.key === "Tab") {
        const list = focus();
        const first = list[0];
        const last = list.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    el.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      el.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h2>{title}</h2>
          <IconButton label="Cerrar ventana" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </header>
        {children}
      </section>
    </div>
  );
}
export function Confirm({
  title,
  message,
  label = "Confirmar",
  danger = false,
  onClose,
  onConfirm,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  async function submit() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal title={title} onClose={busy ? () => {} : onClose}>
      <div className="modal-body">
        <div className={`confirm-icon ${danger ? "danger" : ""}`}>
          <AlertTriangle size={24} />
        </div>
        <p>{message}</p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <footer>
        <button className="btn secondary" disabled={busy} onClick={onClose}>
          Volver
        </button>
        <button
          className={`btn ${danger ? "danger" : "primary"}`}
          disabled={busy}
          onClick={submit}
        >
          {busy ? <LoaderCircle className="spin" size={16} /> : null}
          {label}
        </button>
      </footer>
    </Modal>
  );
}
export function Field({ label, children, help }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {help && <small>{help}</small>}
    </label>
  );
}
export function Stat({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
  badge,
  children,
}) {
  return (
    <section className={`stat ${tone}`}>
      <div className="stat-label">
        {label}
        <Icon size={18} />
      </div>
      <div className="stat-value">
        {value}
        {badge && <Badge tone={tone}>{badge}</Badge>}
      </div>
      {children}
      <div className="stat-detail">{detail}</div>
    </section>
  );
}
