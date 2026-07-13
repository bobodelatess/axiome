"use client";

import {
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronRight,
  Clock3,
  Coffee,
  Gauge,
  MoonStar,
  RefreshCw,
  Sparkles,
  Target,
  TimerReset,
  Zap,
} from "lucide-react";
import { formatLongDate, fromISODate, minutesLabel } from "@/lib/date-utils";
import type { AppState, DailyCheckIn, PlanTask, Subject } from "@/lib/study-types";
import { Badge, Button, Panel, ProgressBar, SectionTitle } from "./ui";

function readinessScore(checkIn: DailyCheckIn): number {
  const sleepScore = Math.min(100, Math.max(30, (checkIn.sleepHours / 8) * 100));
  const energyScore = checkIn.energy * 20;
  const focusScore = checkIn.focus * 20;
  const stressPenalty = (checkIn.stress - 1) * 5;
  return Math.round(sleepScore * 0.35 + energyScore * 0.35 + focusScore * 0.3 - stressPenalty);
}

function TaskModeIcon({ mode }: { mode: PlanTask["mode"] }) {
  if (mode === "retrieval" || mode === "diagnostic") return <BrainCircuit size={17} />;
  if (mode === "debrief") return <Coffee size={17} />;
  if (mode === "mixed-exam") return <TimerReset size={17} />;
  return <Target size={17} />;
}

function subjectFor(task: PlanTask, subjects: Subject[]) {
  return subjects.find((subject) => subject.id === task.subjectId) ?? null;
}

export function TodayDashboard({
  state,
  onStart,
  onCheckIn,
  onRegenerate,
}: {
  state: AppState;
  onStart: (task: PlanTask) => void;
  onCheckIn: (patch: Partial<DailyCheckIn>) => void;
  onRegenerate: () => void;
}) {
  const { checkIn, currentPlan, subjects } = state;
  const score = readinessScore(checkIn);
  const completed = currentPlan.filter((task) => task.completed);
  const totalMinutes = currentPlan.reduce((sum, task) => sum + task.durationMinutes, 0);
  const doneMinutes = completed.reduce((sum, task) => sum + task.durationMinutes, 0);
  const nextTask = currentPlan.find((task) => !task.completed) ?? null;
  const nextSubject = nextTask ? subjectFor(nextTask, subjects) : null;
  const semesterHasStarted =
    fromISODate(checkIn.date).getTime() >= fromISODate(state.profile.semesterStart).getTime();

  return (
    <main className="view-shell dashboard-view">
      <header className="page-header dashboard-header">
        <div>
          <p className="eyebrow">{formatLongDate(checkIn.date)}</p>
          <h1>Bonjour {state.profile.firstName}.</h1>
          <p className="header-subtitle">
            {semesterHasStarted
              ? "Voici le minimum efficace pour faire progresser ta maîtrise aujourd’hui."
              : "Pré-rentrée : on calibre les prérequis avant d’ajouter de la charge."}
          </p>
        </div>
        <Button variant="secondary" onClick={onRegenerate}>
          <RefreshCw size={16} aria-hidden="true" />
          Recalculer le plan
        </Button>
      </header>

      <div className="dashboard-grid">
        <div className="dashboard-main-column">
          <Panel className="daily-command-panel">
            <div className="readiness-block">
              <div className="readiness-ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}>
                <div>
                  <strong>{score}</strong>
                  <span>disponibilité</span>
                </div>
              </div>
              <div className="readiness-copy">
                <Badge tone={score >= 76 ? "success" : score >= 58 ? "warning" : "danger"}>
                  {score >= 76 ? "Charge profonde possible" : score >= 58 ? "Charge normale" : "Mode récupération"}
                </Badge>
                <h2>Ton état pilote la difficulté, pas l’ambition.</h2>
                <p>
                  Le volume reste borné à {minutesLabel(checkIn.availableMinutes)} ; les tâches les plus
                  exigeantes sont déplacées si ton énergie chute.
                </p>
              </div>
            </div>

            <div className="checkin-controls">
              <label className="checkin-control">
                <span>
                  <MoonStar size={16} aria-hidden="true" /> Sommeil
                </span>
                <strong>{checkIn.sleepHours.toFixed(1)} h</strong>
                <input
                  type="range"
                  min="4"
                  max="10"
                  step="0.5"
                  value={checkIn.sleepHours}
                  onChange={(event) => onCheckIn({ sleepHours: Number(event.target.value) })}
                  aria-label="Durée de sommeil"
                />
              </label>

              <div className="checkin-control energy-control">
                <span>
                  <Zap size={16} aria-hidden="true" /> Énergie
                </span>
                <strong>{checkIn.energy}/5</strong>
                <div className="segmented-control" aria-label="Niveau d’énergie">
                  {([1, 2, 3, 4, 5] as const).map((energy) => (
                    <button
                      key={energy}
                      className={checkIn.energy === energy ? "selected" : ""}
                      onClick={() => onCheckIn({ energy })}
                      aria-label={`Énergie ${energy} sur 5`}
                      aria-pressed={checkIn.energy === energy}
                    >
                      {energy}
                    </button>
                  ))}
                </div>
              </div>

              <label className="checkin-control">
                <span>
                  <Clock3 size={16} aria-hidden="true" /> Temps net
                </span>
                <strong>{minutesLabel(checkIn.availableMinutes)}</strong>
                <input
                  type="range"
                  min="30"
                  max="480"
                  step="10"
                  value={checkIn.availableMinutes}
                  onChange={(event) =>
                    onCheckIn({ availableMinutes: Number(event.target.value) })
                  }
                  aria-label="Temps de travail disponible"
                />
              </label>
            </div>
          </Panel>

          <Panel className="plan-panel">
            <SectionTitle
              eyebrow="Plan adaptatif"
              title="Aujourd’hui"
              aside={
                <div className="plan-summary">
                  <span>{completed.length}/{currentPlan.length} blocs</span>
                  <strong>{minutesLabel(totalMinutes)}</strong>
                </div>
              }
            />
            <ProgressBar
              value={totalMinutes ? (doneMinutes / totalMinutes) * 100 : 0}
              label="Progression du plan du jour"
            />

            <div className="task-timeline">
              {currentPlan.map((task, index) => {
                const subject = subjectFor(task, subjects);
                return (
                  <article
                    className={`plan-task ${task.completed ? "completed" : ""}`}
                    key={task.id}
                  >
                    <div className="timeline-marker-wrap">
                      <span
                        className="timeline-marker"
                        style={{
                          borderColor: task.completed ? "var(--success)" : subject?.color,
                          background: task.completed ? "var(--success)" : "var(--panel)",
                        }}
                      >
                        {task.completed ? <Check size={13} /> : index + 1}
                      </span>
                      {index < currentPlan.length - 1 ? <span className="timeline-line" /> : null}
                    </div>
                    <div className="task-body">
                      <div className="task-meta-row">
                        <span style={{ color: subject?.color ?? "var(--muted)" }}>
                          {subject?.shortName ?? "Système"}
                        </span>
                        <span>{minutesLabel(task.durationMinutes)}</span>
                        <span className={`intensity-dot intensity-${task.intensity}`} />
                      </div>
                      <h3>{task.title}</h3>
                      <p className="task-mode">
                        <TaskModeIcon mode={task.mode} /> {task.subtitle}
                      </p>
                      <p className="task-rationale">{task.rationale}</p>
                    </div>
                    <div className="task-action">
                      {task.completed ? (
                        <Badge tone="success">Terminé</Badge>
                      ) : (
                        <Button variant={nextTask?.id === task.id ? "primary" : "ghost"} onClick={() => onStart(task)}>
                          {nextTask?.id === task.id ? "Commencer" : "Ouvrir"}
                          <ChevronRight size={16} />
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </Panel>
        </div>

        <aside className="dashboard-side-column">
          <Panel className="next-task-panel">
            <div className="next-task-topline">
              <span className="live-dot" />
              <span>Prochain bloc</span>
              {nextTask ? <span>{minutesLabel(nextTask.durationMinutes)}</span> : null}
            </div>
            {nextTask ? (
              <>
                <div className="subject-icon" style={{ background: `${nextSubject?.color}1f`, color: nextSubject?.color }}>
                  <BrainCircuit size={22} />
                </div>
                <p className="next-subject">{nextSubject?.name ?? "Bilan"}</p>
                <h2>{nextTask.title}</h2>
                <p>{nextTask.subtitle}</p>
                <ol className="mini-steps">
                  {nextTask.steps.slice(0, 3).map((step, index) => (
                    <li key={step}>
                      <span>{index + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <Button className="full-button" onClick={() => onStart(nextTask)}>
                  Lancer le bloc
                  <ArrowRight size={16} />
                </Button>
              </>
            ) : (
              <div className="all-done">
                <Check size={30} />
                <h2>Plan terminé.</h2>
                <p>Arrête-toi : ajouter du volume maintenant dégraderait la consolidation.</p>
              </div>
            )}
          </Panel>

          <Panel className="rules-panel">
            <p className="eyebrow">Garde-fous personnalisés</p>
            <h3>Ce que le système empêche</h3>
            <ul>
              <li>
                <span><Sparkles size={16} /></span>
                <div><strong>Compréhension illusoire</strong><small>Réponse fixée avant d’ouvrir le cours.</small></div>
              </li>
              <li>
                <span><Gauge size={16} /></span>
                <div><strong>Cours sans exercice</strong><small>Tout apport est suivi d’une production.</small></div>
              </li>
              <li>
                <span><RefreshCw size={16} /></span>
                <div><strong>Planning figé</strong><small>Échec, fatigue et échéances repondèrent demain.</small></div>
              </li>
            </ul>
          </Panel>

          <Panel className="method-ratio-panel">
            <div className="ratio-number">{state.profile.activePracticeTarget}%</div>
            <div>
              <strong>production active visée</strong>
              <p>Rappel, démonstration, exercice ou annale — jamais seulement relire.</p>
            </div>
          </Panel>
        </aside>
      </div>
    </main>
  );
}

