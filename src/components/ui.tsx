import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  variant = "primary",
  className = "",
  children,
  loading = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
}) {
  return (
    <button
      className={`button button-${variant} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <LoaderCircle aria-hidden="true" className="spin" size={16} /> : null}
      {children}
    </button>
  );
}

export function Panel({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <section className={`panel ${className}`} {...props}>
      {children}
    </section>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  aside,
}: {
  eyebrow?: string;
  title: string;
  aside?: ReactNode;
}) {
  return (
    <div className="section-title-row">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      {aside ? <div className="section-title-aside">{aside}</div> : null}
    </div>
  );
}

export function ProgressBar({
  value,
  color = "var(--accent)",
  label,
}: {
  value: number;
  color?: string;
  label?: string;
}) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      aria-label={label}
    >
      <div
        className="progress-value"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function EmptyState({
  icon,
  title,
  detail,
  action,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{detail}</p>
      {action}
    </div>
  );
}

