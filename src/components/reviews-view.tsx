"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CalendarCheck,
  CircleDotDashed,
  Layers3,
  Repeat2,
  ShieldCheck,
} from "lucide-react";
import { daysBetween, formatShortDate, minutesLabel } from "@/lib/date-utils";
import { createTopicTask, rankCandidates } from "@/lib/planner";
import type { AppState, PlanTask, PlannerCandidate } from "@/lib/study-types";
import { Badge, Button, Panel, ProgressBar, SectionTitle } from "./ui";

function challenge(candidate: PlannerCandidate): string {
  if (!candidate.topic.calibrated) return "Diagnostic : restitution + deux questions croissantes";
  if (candidate.subject.kind === "mathematics") {
    return candidate.topic.mastery < 60
      ? "Reconstruire le théorème puis résoudre un exercice jumeau"
      : "Choisir la méthode sur trois exercices mélangés";
  }
  if (candidate.subject.kind === "physics") {
    return candidate.topic.mastery < 60
      ? "Schéma, hypothèses, loi générale, puis application"
      : "Problème de transfert avec contrôle dimensionnel";
  }
  return "Rappel libre, vérification, puis application courte";
}

export function ReviewsView({
  state,
  onStart,
}: {
  state: AppState;
  onStart: (task: PlanTask) => void;
}) {
  const [filter, setFilter] = useState<"due" | "upcoming" | "all">("due");
  const candidates = useMemo(() => rankCandidates(state), [state]);
  const filtered = candidates.filter((candidate) => {
    const dueIn = daysBetween(state.checkIn.date, candidate.topic.dueDate);
    if (filter === "due") return !candidate.topic.calibrated || dueIn <= 0;
    if (filter === "upcoming") return candidate.topic.calibrated && dueIn > 0 && dueIn <= 7;
    return true;
  });
  const atRisk = candidates.filter((candidate) => candidate.retention < 0.6).length;

  return (
    <main className="view-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Mémoire à long terme</p>
          <h1>File de révision</h1>
          <p className="header-subtitle">
            Les rappels sont des productions de maths et de physique, pas une pile de flashcards.
          </p>
        </div>
        <div className="header-stat">
          <span>{atRisk}</span>
          <small>notions à risque</small>
        </div>
      </header>

      <Panel className="review-principle-banner">
        <div className="review-principle-icon"><Repeat2 size={22} /></div>
        <div>
          <strong>Le bon moment n’est pas « quand tu as tout oublié ».</strong>
          <p>
            AXIOME vise une difficulté de récupération réelle mais encore productive, puis resserre
            automatiquement l’intervalle avant un contrôle.
          </p>
        </div>
        <Badge tone="success"><ShieldCheck size={13} /> espacement adaptatif</Badge>
      </Panel>

      <div className="review-layout">
        <Panel className="review-queue-panel">
          <SectionTitle
            eyebrow="Priorité calculée"
            title="À récupérer"
            aside={
              <div className="tab-switcher">
                <button className={filter === "due" ? "selected" : ""} onClick={() => setFilter("due")}>Échues</button>
                <button className={filter === "upcoming" ? "selected" : ""} onClick={() => setFilter("upcoming")}>7 jours</button>
                <button className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")}>Toutes</button>
              </div>
            }
          />
          <div className="review-list">
            {filtered.slice(0, 14).map((candidate, index) => {
              const dueIn = daysBetween(state.checkIn.date, candidate.topic.dueDate);
              const retention = Math.round(candidate.retention * 100);
              const task = createTopicTask(candidate.subject, candidate.topic, state.checkIn.date);
              return (
                <article className="review-item" key={candidate.topic.id}>
                  <div className="review-rank">{String(index + 1).padStart(2, "0")}</div>
                  <div className="review-subject-mark" style={{ background: `${candidate.subject.color}1b`, color: candidate.subject.color }}>
                    {candidate.subject.kind === "mathematics" ? <Layers3 size={18} /> : <BrainCircuit size={18} />}
                  </div>
                  <div className="review-copy">
                    <div className="review-label-row">
                      <span style={{ color: candidate.subject.color }}>{candidate.subject.shortName}</span>
                      <span>·</span>
                      <span>{candidate.topic.phase === "diagnostic" ? "calibration" : candidate.topic.phase}</span>
                    </div>
                    <h3>{candidate.topic.name}</h3>
                    <p>{challenge(candidate)}</p>
                  </div>
                  <div className="review-retention">
                    <div>
                      <small>Rétention</small>
                      <strong>{candidate.topic.calibrated ? `${retention}%` : "?"}</strong>
                    </div>
                    <ProgressBar value={candidate.topic.calibrated ? retention : 0} color={candidate.subject.color} />
                  </div>
                  <div className="review-due">
                    <CalendarCheck size={15} />
                    <span>{!candidate.topic.calibrated ? "maintenant" : dueIn <= 0 ? `${Math.abs(dueIn)} j de retard` : formatShortDate(candidate.topic.dueDate)}</span>
                  </div>
                  <Button variant="secondary" onClick={() => onStart(task)}>
                    {minutesLabel(task.durationMinutes)} <ArrowRight size={15} />
                  </Button>
                </article>
              );
            })}
            {!filtered.length ? (
              <div className="queue-empty">
                <CircleDotDashed size={26} />
                <strong>Aucun rappel dans cette fenêtre.</strong>
                <p>Le système évite le surapprentissage et attend une récupération utile.</p>
              </div>
            ) : null}
          </div>
        </Panel>

        <aside className="review-side">
          <Panel>
            <p className="eyebrow">Formats alternés</p>
            <h3>Une notion, quatre preuves de maîtrise</h3>
            <ul className="format-list">
              <li><span>01</span><div><strong>Restituer</strong><small>Définition, hypothèses, formule.</small></div></li>
              <li><span>02</span><div><strong>Dériver</strong><small>Retrouver le résultat depuis les lois.</small></div></li>
              <li><span>03</span><div><strong>Reconnaître</strong><small>Choisir la bonne méthode sans indice.</small></div></li>
              <li><span>04</span><div><strong>Transférer</strong><small>Résoudre dans un contexte différent.</small></div></li>
            </ul>
          </Panel>
          <Panel className="review-rule-card">
            <span className="rule-number">20%</span>
            <p>
              L’intervalle est plafonné près d’un examen à environ un cinquième du temps restant,
              puis ajusté par tes résultats.
            </p>
          </Panel>
        </aside>
      </div>
    </main>
  );
}

