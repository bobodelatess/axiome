"use client";

import {
  BarChart3,
  BookOpenText,
  BrainCircuit,
  CalendarRange,
  CircleAlert,
  Command,
  Settings2,
  SunMedium,
} from "lucide-react";

export type NavSection =
  | "today"
  | "planning"
  | "courses"
  | "reviews"
  | "errors"
  | "insights"
  | "settings";

const items: Array<{
  id: NavSection;
  label: string;
  shortLabel: string;
  icon: typeof SunMedium;
}> = [
  { id: "today", label: "Aujourd’hui", shortLabel: "Jour", icon: SunMedium },
  { id: "planning", label: "Planification", shortLabel: "Plan", icon: CalendarRange },
  { id: "courses", label: "Unités d’enseignement", shortLabel: "UE", icon: BookOpenText },
  { id: "reviews", label: "Révisions", shortLabel: "Rappels", icon: BrainCircuit },
  { id: "errors", label: "Carnet d’erreurs", shortLabel: "Erreurs", icon: CircleAlert },
  { id: "insights", label: "Progression", shortLabel: "Bilan", icon: BarChart3 },
  { id: "settings", label: "Réglages", shortLabel: "Réglages", icon: Settings2 },
];

export function AppSidebar({
  active,
  onChange,
  firstName,
}: {
  active: NavSection;
  onChange: (section: NavSection) => void;
  firstName: string;
}) {
  return (
    <>
      <aside className="desktop-sidebar">
        <button className="brand" onClick={() => onChange("today")}>
          <span className="brand-mark" aria-hidden="true">
            <Command size={18} strokeWidth={2.4} />
          </span>
          <span>
            <strong>AXIOME</strong>
            <small>PSP · cockpit</small>
          </span>
        </button>

        <nav className="sidebar-nav" aria-label="Navigation principale">
          <p className="nav-label">Espace de travail</p>
          {items.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={active === item.id ? "nav-item active" : "nav-item"}
                onClick={() => onChange(item.id)}
                aria-current={active === item.id ? "page" : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <p className="nav-label nav-label-second">Pilotage</p>
          {items.slice(5).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={active === item.id ? "nav-item active" : "nav-item"}
                onClick={() => onChange(item.id)}
                aria-current={active === item.id ? "page" : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">{firstName.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{firstName}</strong>
            <small>L2 PSP · Toulouse</small>
          </div>
          <span className="status-dot" title="Données enregistrées localement" />
        </div>
      </aside>

      <nav className="mobile-nav" aria-label="Navigation mobile">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={active === item.id ? "mobile-nav-item active" : "mobile-nav-item"}
              onClick={() => onChange(item.id)}
              aria-label={item.label}
              aria-current={active === item.id ? "page" : undefined}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

