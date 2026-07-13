"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  Check,
  ChevronRight,
  CircleHelp,
  Eye,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Target,
  X,
} from "lucide-react";
import { minutesLabel } from "@/lib/date-utils";
import type {
  EnergyLevel,
  ErrorType,
  PlanTask,
  SessionResult,
  Subject,
} from "@/lib/study-types";
import { Badge, Button, ProgressBar } from "./ui";

type FocusPhase = "prepare" | "work" | "confidence" | "evaluate";

const errorChoices: Array<{ id: ErrorType; label: string }> = [
  { id: "concept", label: "Concept / définition" },
  { id: "modelisation", label: "Modélisation / schéma" },
  { id: "methode", label: "Choix de méthode" },
  { id: "algebre", label: "Algèbre / calcul" },
  { id: "signe-unite", label: "Signe / unité" },
  { id: "lecture", label: "Lecture d’énoncé" },
  { id: "rigueur", label: "Rigueur / rédaction" },
  { id: "vitesse", label: "Vitesse / gestion du temps" },
];

const scoreChoices = [
  { value: 30, label: "Non acquis", detail: "Je ne saurais pas recommencer seul." },
  { value: 50, label: "Fragile", detail: "La méthode vient après aide ou correction." },
  { value: 70, label: "Correct", detail: "Je réussis seul avec quelques imprécisions." },
  { value: 85, label: "Solide", detail: "Autonome, juste et correctement rédigé." },
  { value: 100, label: "Transférable", detail: "Je sais expliquer et varier le contexte." },
];

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function hintsFor(task: PlanTask): string[] {
  if (task.mode === "retrieval" || task.mode === "diagnostic") {
    return [
      "Commence par les hypothèses et les grandeurs, pas par la formule finale.",
      "Dessine le système et écris la loi générale avant de la spécialiser.",
      "Cherche un cas limite ou une analyse dimensionnelle pour reconstruire.",
    ];
  }
  if (task.mode === "mixed-exam") {
    return [
      "Classe d’abord l’exercice : quelle structure reconnais-tu ?",
      "Liste deux méthodes candidates et élimine-en une explicitement.",
      "Isole le premier résultat intermédiaire qui débloque tout le reste.",
    ];
  }
  return [
    "Écris la donnée, l’inconnue et la loi susceptible de les relier.",
    "Reviens au schéma ou au théorème général, sans chercher une formule ressemblante.",
    "Consulte une seule étape de l’exemple puis referme immédiatement la correction.",
  ];
}

export function FocusSession({
  task,
  subject,
  onClose,
  onComplete,
}: {
  task: PlanTask;
  subject: Subject | null;
  onClose: () => void;
  onComplete: (result: SessionResult) => void;
}) {
  const totalSeconds = task.durationMinutes * 60;
  const [phase, setPhase] = useState<FocusPhase>("prepare");
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [confidence, setConfidence] = useState<EnergyLevel>(3);
  const [score, setScore] = useState(70);
  const [errorTypes, setErrorTypes] = useState<ErrorType[]>([]);
  const [note, setNote] = useState("");
  const hints = useMemo(() => hintsFor(task), [task]);

  useEffect(() => {
    document.body.classList.add("modal-open");
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !running) onClose();
      if (event.code === "Space" && phase === "work") {
        const target = event.target as HTMLElement;
        if (["INPUT", "TEXTAREA", "BUTTON"].includes(target.tagName)) return;
        event.preventDefault();
        setRunning((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, phase, running]);

  useEffect(() => {
    if (!running || phase !== "work") return;
    const interval = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          setRunning(false);
          setPhase("confidence");
          return 0;
        }
        return value - 1;
      });
      setElapsedSeconds((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [phase, running]);

  function start() {
    setPhase("work");
    setRunning(true);
  }

  function toggleStep(index: number) {
    setCheckedSteps((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    );
  }

  function toggleError(type: ErrorType) {
    setErrorTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
    );
  }

  function validate() {
    onComplete({
      score,
      confidence,
      hintsUsed,
      errorTypes,
      note,
      actualMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
    });
  }

  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return (
    <div className="focus-overlay" role="dialog" aria-modal="true" aria-labelledby="focus-title">
      <div className="focus-shell">
        <header className="focus-header">
          <button className="icon-button" onClick={onClose} aria-label="Fermer la session" disabled={running}>
            {phase === "prepare" ? <X size={20} /> : <ArrowLeft size={20} />}
          </button>
          <div className="focus-brand">
            <span className="focus-brand-dot" style={{ background: subject?.color ?? "var(--accent)" }} />
            <span>{subject?.shortName ?? "AXIOME"}</span>
          </div>
          <div className="focus-header-meta">
            <Badge tone={phase === "work" ? "accent" : "neutral"}>
              {phase === "prepare" ? "Préparation" : phase === "work" ? "Travail profond" : "Calibration"}
            </Badge>
          </div>
        </header>

        {phase === "prepare" ? (
          <div className="focus-prepare focus-content">
            <div className="focus-kicker">
              <Target size={16} /> Objectif unique
            </div>
            <h1 id="focus-title">{task.title}</h1>
            <p className="focus-subtitle">{task.subtitle}</p>

            <div className="focus-prepare-grid">
              <div className="focus-protocol-card">
                <p className="eyebrow">Protocole</p>
                <ol>
                  {task.steps.map((step, index) => (
                    <li key={step}>
                      <span>{index + 1}</span>
                      <p>{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="focus-resource-card">
                <BookOpenCheck size={22} />
                <p className="eyebrow">Ressource autorisée</p>
                <strong>{task.resource}</strong>
                <small>
                  {task.mode === "diagnostic" || task.mode === "retrieval"
                    ? "Reste fermée jusqu’à ce qu’une réponse soit écrite."
                    : "Consulte seulement la portion nécessaire au protocole."}
                </small>
              </div>
            </div>

            <div className="focus-contract">
              <ShieldAlert size={18} />
              <p>
                <strong>Contrat anti-illusion :</strong> une impression de familiarité ne compte pas comme une réponse.
                Tu dois produire avant de vérifier.
              </p>
            </div>

            <Button className="focus-start-button" onClick={start}>
              Démarrer · {minutesLabel(task.durationMinutes)}
              <Play size={17} fill="currentColor" />
            </Button>
          </div>
        ) : null}

        {phase === "work" ? (
          <div className="focus-work focus-content">
            <div className="focus-timer-wrap">
              <span className={running ? "timer-pulse active" : "timer-pulse"} />
              <div className="focus-timer" aria-live="polite">{formatTimer(secondsLeft)}</div>
              <p>{running ? "Session en cours" : "Session en pause"}</p>
              <ProgressBar value={progress} label="Temps écoulé" />
            </div>

            <div className="focus-work-grid">
              <section className="focus-checklist">
                <p className="eyebrow">Fil de résolution</p>
                <h2>{task.title}</h2>
                <div className="checklist-items">
                  {task.steps.map((step, index) => (
                    <button
                      key={step}
                      className={checkedSteps.includes(index) ? "checklist-item checked" : "checklist-item"}
                      onClick={() => toggleStep(index)}
                    >
                      <span>{checkedSteps.includes(index) ? <Check size={15} /> : index + 1}</span>
                      <p>{step}</p>
                    </button>
                  ))}
                </div>
              </section>

              <aside className="hint-panel">
                <div className="hint-heading">
                  <CircleHelp size={18} />
                  <div>
                    <strong>Aide graduée</strong>
                    <small>Chaque niveau est enregistré.</small>
                  </div>
                </div>
                <div className="hint-list">
                  {hints.slice(0, hintsUsed).map((hint, index) => (
                    <div className="revealed-hint" key={hint}>
                      <span><Lightbulb size={15} /></span>
                      <p><strong>Niveau {index + 1}</strong>{hint}</p>
                    </div>
                  ))}
                </div>
                {hintsUsed < hints.length ? (
                  <Button variant="secondary" onClick={() => setHintsUsed((value) => value + 1)}>
                    <Eye size={16} /> Révéler l’aide {hintsUsed + 1}
                  </Button>
                ) : (
                  <p className="hint-limit">Toutes les aides ont été révélées. Reviens au cours si nécessaire.</p>
                )}
              </aside>
            </div>

            <div className="focus-controls">
              <Button variant="secondary" onClick={() => setRunning((value) => !value)}>
                {running ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
                {running ? "Pause" : "Reprendre"}
              </Button>
              <Button onClick={() => { setRunning(false); setPhase("confidence"); }}>
                J’ai fixé ma réponse
                <ChevronRight size={17} />
              </Button>
            </div>
          </div>
        ) : null}

        {phase === "confidence" ? (
          <div className="focus-evaluation focus-content compact-evaluation">
            <div className="evaluation-icon"><Eye size={24} /></div>
            <p className="eyebrow">Avant de corriger</p>
            <h1 id="focus-title">À quel point ta réponse est-elle probablement juste ?</h1>
            <p className="focus-subtitle">
              Cette prédiction mesure ton étalonnage métacognitif. Ne regarde pas encore la correction.
            </p>
            <div className="confidence-scale">
              {([1, 2, 3, 4, 5] as EnergyLevel[]).map((value) => (
                <button
                  key={value}
                  className={confidence === value ? "selected" : ""}
                  onClick={() => setConfidence(value)}
                >
                  <strong>{value}</strong>
                  <span>{value === 1 ? "Hasard" : value === 3 ? "Mitigé" : value === 5 ? "Certain" : ""}</span>
                </button>
              ))}
            </div>
            <Button className="evaluation-next" onClick={() => setPhase("evaluate")}>
              Maintenant, corriger et noter
              <BookOpenCheck size={17} />
            </Button>
          </div>
        ) : null}

        {phase === "evaluate" ? (
          <div className="focus-evaluation focus-content">
            <div className="evaluation-heading">
              <div>
                <p className="eyebrow">Correction sévère</p>
                <h1 id="focus-title">Qu’est-ce qui est récupérable demain ?</h1>
                <p>Note l’autonomie et la qualité de rédaction, pas seulement le résultat final.</p>
              </div>
              <div className="confidence-reminder">
                <span>Confiance annoncée</span>
                <strong>{confidence}/5</strong>
              </div>
            </div>

            <div className="score-grid">
              {scoreChoices.map((choice) => (
                <button
                  key={choice.value}
                  className={score === choice.value ? "score-choice selected" : "score-choice"}
                  onClick={() => setScore(choice.value)}
                >
                  <span className="score-radio">{score === choice.value ? <Check size={14} /> : null}</span>
                  <strong>{choice.value}% · {choice.label}</strong>
                  <small>{choice.detail}</small>
                </button>
              ))}
            </div>

            <div className="evaluation-lower-grid">
              <section>
                <p className="eyebrow">Causes des points perdus</p>
                <div className="error-chips">
                  {errorChoices.map((choice) => (
                    <button
                      key={choice.id}
                      className={errorTypes.includes(choice.id) ? "selected" : ""}
                      onClick={() => toggleError(choice.id)}
                    >
                      {errorTypes.includes(choice.id) ? <Check size={13} /> : null}
                      {choice.label}
                    </button>
                  ))}
                </div>
              </section>
              <label className="session-note-field">
                <span>Correction utile en une phrase</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Ex. J’ai appliqué Gauss sans justifier que le champ est constant sur la surface."
                  rows={4}
                />
              </label>
            </div>

            <div className="evaluation-actions">
              <Button variant="ghost" onClick={() => setPhase("confidence")}>
                <RotateCcw size={16} /> Revoir la confiance
              </Button>
              <Button onClick={validate}>
                Valider et replanifier
                <Check size={17} />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

