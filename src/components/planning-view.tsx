"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Clock3,
  GraduationCap,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  addDays,
  daysBetween,
  formatShortDate,
  fromISODate,
  minutesLabel,
} from "@/lib/date-utils";
import type { AppState, CalendarBlock } from "@/lib/study-types";
import { Badge, Button, Panel, ProgressBar, SectionTitle } from "./ui";

const weekdays = [
  { value: 1, label: "Lundi", short: "Lun" },
  { value: 2, label: "Mardi", short: "Mar" },
  { value: 3, label: "Mercredi", short: "Mer" },
  { value: 4, label: "Jeudi", short: "Jeu" },
  { value: 5, label: "Vendredi", short: "Ven" },
  { value: 6, label: "Samedi", short: "Sam" },
  { value: 0, label: "Dimanche", short: "Dim" },
];

const kindLabels: Record<CalendarBlock["kind"], string> = {
  course: "Cours / TD",
  lab: "TP",
  personal: "Personnel",
  sport: "Sport",
};

function weekDates(todayISO: string) {
  const today = fromISODate(todayISO);
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  return weekdays.map((weekday, index) => ({ ...weekday, date: addDays(monday, index) }));
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function PlanningView({
  state,
  onExamDate,
  onProfile,
  onAddBlock,
  onRemoveBlock,
}: {
  state: AppState;
  onExamDate: (subjectId: string, value: string | null) => void;
  onProfile: (patch: Partial<AppState["profile"]>) => void;
  onAddBlock: (block: Omit<CalendarBlock, "id">) => void;
  onRemoveBlock: (id: string) => void;
}) {
  const dates = useMemo(() => weekDates(state.checkIn.date), [state.checkIn.date]);
  const [showForm, setShowForm] = useState(false);
  const [weekday, setWeekday] = useState(1);
  const [start, setStart] = useState("18:00");
  const [end, setEnd] = useState("19:30");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<CalendarBlock["kind"]>("personal");
  const examSubjects = state.subjects
    .filter((subject) => subject.examDate)
    .sort((a, b) => (a.examDate ?? "").localeCompare(b.examDate ?? ""));
  const plannedMinutes = state.calendar
    .filter((block) => block.kind === "personal")
    .reduce((sum, block) => sum + Math.max(0, timeToMinutes(block.end) - timeToMinutes(block.start)), 0);
  const weeklyTargetMinutes = state.profile.weeklyTargetHours * 60;

  function submitBlock(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || timeToMinutes(end) <= timeToMinutes(start)) return;
    onAddBlock({ weekday, start, end, title: title.trim(), kind });
    setTitle("");
    setShowForm(false);
  }

  return (
    <main className="view-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Contraintes avant intentions</p>
          <h1>Planification</h1>
          <p className="header-subtitle">
            Les cours, TP, sport et échéances bornent le temps ; le moteur remplit seulement ce qui reste.
          </p>
        </div>
        <Button onClick={() => setShowForm((value) => !value)}>
          <Plus size={16} /> Ajouter un bloc fixe
        </Button>
      </header>

      <div className="planning-stats">
        <Panel className="planning-stat">
          <span><Target size={18} /></span>
          <div><small>Objectif personnel</small><strong>{state.profile.weeklyTargetHours} h / semaine</strong></div>
          <input
            type="range"
            min="8"
            max="40"
            step="1"
            value={state.profile.weeklyTargetHours}
            onChange={(event) => onProfile({ weeklyTargetHours: Number(event.target.value) })}
            aria-label="Objectif hebdomadaire en heures"
          />
        </Panel>
        <Panel className="planning-stat">
          <span><Clock3 size={18} /></span>
          <div><small>Temps fixe déjà réservé</small><strong>{minutesLabel(plannedMinutes)}</strong></div>
          <ProgressBar value={(plannedMinutes / weeklyTargetMinutes) * 100} />
        </Panel>
        <Panel className="planning-stat">
          <span><Sparkles size={18} /></span>
          <div><small>Plan adaptatif aujourd’hui</small><strong>{minutesLabel(state.currentPlan.reduce((sum, task) => sum + task.durationMinutes, 0))}</strong></div>
          <Badge tone="accent">{state.currentPlan.length} blocs</Badge>
        </Panel>
      </div>

      {showForm ? (
        <Panel className="calendar-form-panel">
          <form onSubmit={submitBlock} className="calendar-form">
            <label>
              <span>Jour</span>
              <select value={weekday} onChange={(event) => setWeekday(Number(event.target.value))}>
                {weekdays.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
              </select>
            </label>
            <label><span>Début</span><input type="time" value={start} onChange={(event) => setStart(event.target.value)} /></label>
            <label><span>Fin</span><input type="time" value={end} onChange={(event) => setEnd(event.target.value)} /></label>
            <label>
              <span>Type</span>
              <select value={kind} onChange={(event) => setKind(event.target.value as CalendarBlock["kind"])}>
                {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="calendar-title-field"><span>Nom du bloc</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Entraînement, TD encadré…" /></label>
            <div className="form-actions"><Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Annuler</Button><Button type="submit" disabled={!title.trim()}>Ajouter</Button></div>
          </form>
        </Panel>
      ) : null}

      <Panel className="weekly-calendar-panel">
        <SectionTitle
          eyebrow="Semaine courante"
          title={`${formatShortDate(dates[0].date)} — ${formatShortDate(dates[6].date)}`}
          aside={<Badge tone="neutral">blocs récurrents</Badge>}
        />
        <div className="week-grid">
          {dates.map((day) => {
            const blocks = state.calendar
              .filter((block) => block.weekday === day.value)
              .sort((a, b) => a.start.localeCompare(b.start));
            const isToday = day.date === state.checkIn.date;
            return (
              <section className={isToday ? "week-day today" : "week-day"} key={day.value}>
                <header><span>{day.short}</span><strong>{fromISODate(day.date).getDate()}</strong></header>
                <div className="day-blocks">
                  {blocks.map((block) => (
                    <article className={`calendar-block block-${block.kind}`} key={block.id}>
                      <small>{block.start}–{block.end}</small>
                      <strong>{block.title}</strong>
                      <span>{kindLabels[block.kind]}</span>
                      <button onClick={() => onRemoveBlock(block.id)} aria-label={`Supprimer ${block.title}`}><Trash2 size={13} /></button>
                    </article>
                  ))}
                  {!blocks.length ? <span className="empty-day">Disponible</span> : null}
                  {isToday ? (
                    <article className="calendar-block adaptive-block">
                      <small>adaptatif</small>
                      <strong>Plan AXIOME</strong>
                      <span>{minutesLabel(state.checkIn.availableMinutes)} nets</span>
                    </article>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
        <div className="calendar-caveat">
          <TriangleAlert size={16} />
          <p>L’emploi du temps universitaire n’est pas inventé : ajoute-le lorsqu’il sera publié. Les créneaux « Disponible » ne signifient pas qu’ils doivent tous être remplis.</p>
        </div>
      </Panel>

      <div className="deadlines-layout">
        <Panel className="deadlines-panel">
          <SectionTitle eyebrow="Échéances" title="Contrôles et examens" />
          <div className="deadline-list">
            {state.subjects.map((subject) => {
              const days = subject.examDate ? daysBetween(state.checkIn.date, subject.examDate) : null;
              return (
                <div className="deadline-row" key={subject.id}>
                  <span className="subject-dot" style={{ background: subject.color }} />
                  <div><strong>{subject.shortName}</strong><small>{days === null ? "Date inconnue" : days < 0 ? "Passé" : `J-${days}`}</small></div>
                  <input type="date" value={subject.examDate ?? ""} onChange={(event) => onExamDate(subject.id, event.target.value || null)} aria-label={`Date de contrôle ${subject.name}`} />
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel className="exam-ramp-panel">
          <GraduationCap size={24} />
          <p className="eyebrow">Rampe examen</p>
          <h3>{examSubjects.length ? `${examSubjects.length} échéance${examSubjects.length > 1 ? "s" : ""} active${examSubjects.length > 1 ? "s" : ""}` : "En attente des dates"}</h3>
          <p>
            À J-21, le plan augmente le mélange des chapitres. À J-14, les problèmes chronométrés prennent le dessus. Les rappels restent courts pour préserver le sommeil.
          </p>
          {examSubjects[0]?.examDate ? <Badge tone="warning">Prochaine : {examSubjects[0].shortName} · {formatShortDate(examSubjects[0].examDate)}</Badge> : null}
        </Panel>
      </div>
    </main>
  );
}
