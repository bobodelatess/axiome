"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleAlert,
  CircleCheckBig,
  Filter,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { addDays, formatShortDate } from "@/lib/date-utils";
import { createTopicTask } from "@/lib/planner";
import type { AppState, ErrorEntry, ErrorType, PlanTask } from "@/lib/study-types";
import { Badge, Button, EmptyState, Panel, SectionTitle } from "./ui";

const errorLabels: Record<ErrorType, string> = {
  concept: "Concept / définition",
  modelisation: "Modélisation",
  methode: "Choix de méthode",
  algebre: "Algèbre / calcul",
  "signe-unite": "Signe / unité",
  lecture: "Lecture d’énoncé",
  rigueur: "Rigueur / rédaction",
  vitesse: "Gestion du temps",
};

export function ErrorsView({
  state,
  onAdd,
  onUpdate,
  onStart,
}: {
  state: AppState;
  onAdd: (entry: ErrorEntry) => void;
  onUpdate: (id: string, patch: Partial<ErrorEntry>) => void;
  onStart: (task: PlanTask) => void;
}) {
  const [filter, setFilter] = useState<"open" | "resolved" | "all">("open");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [subjectId, setSubjectId] = useState(state.subjects[0]?.id ?? "");
  const [topicId, setTopicId] = useState("");
  const [type, setType] = useState<ErrorType>("methode");
  const [title, setTitle] = useState("");
  const [cause, setCause] = useState("");
  const [correction, setCorrection] = useState("");
  const [prevention, setPrevention] = useState("");

  const selectedSubject = state.subjects.find((subject) => subject.id === subjectId);
  const errors = useMemo(
    () =>
      state.errors.filter((error) => {
        const statusMatches =
          filter === "all" || (filter === "open" ? !error.resolved : error.resolved);
        const haystack = `${error.title} ${error.cause} ${error.correction}`.toLowerCase();
        return statusMatches && haystack.includes(search.toLowerCase());
      }),
    [filter, search, state.errors],
  );

  function resetForm() {
    setTopicId("");
    setType("methode");
    setTitle("");
    setCause("");
    setCorrection("");
    setPrevention("");
    setShowForm(false);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!subjectId || !title.trim()) return;
    onAdd({
      id: `error-${Date.now()}`,
      subjectId,
      topicId: topicId || null,
      createdAt: state.checkIn.date,
      nextReview: addDays(state.checkIn.date, 2),
      type,
      title: title.trim(),
      cause: cause.trim() || "Cause à identifier au prochain rejeu",
      correction: correction.trim() || "Reprendre la résolution et localiser le premier écart",
      prevention: prevention.trim() || "Créer un contrôle explicite avant le prochain essai",
      recurrence: 1,
      resolved: false,
    });
    resetForm();
  }

  return (
    <main className="view-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Boucle de correction</p>
          <h1>Carnet d’erreurs</h1>
          <p className="header-subtitle">
            Une erreur n’est utile que si sa cause est nommée, rejouée puis contrôlée plus tard.
          </p>
        </div>
        <Button onClick={() => setShowForm((value) => !value)}>
          <Plus size={16} /> Capturer une erreur
        </Button>
      </header>

      <div className="error-stats-row">
        <Panel className="error-stat-card">
          <CircleAlert size={20} />
          <div><strong>{state.errors.filter((error) => !error.resolved).length}</strong><small>erreurs ouvertes</small></div>
        </Panel>
        <Panel className="error-stat-card">
          <RotateCcw size={20} />
          <div><strong>{state.errors.filter((error) => error.recurrence > 1).length}</strong><small>erreurs récurrentes</small></div>
        </Panel>
        <Panel className="error-stat-card">
          <CircleCheckBig size={20} />
          <div><strong>{state.errors.filter((error) => error.resolved).length}</strong><small>neutralisées</small></div>
        </Panel>
      </div>

      {showForm ? (
        <Panel className="error-form-panel">
          <SectionTitle eyebrow="Capture en 90 secondes" title="Du symptôme à la règle de contrôle" />
          <form className="error-form" onSubmit={submit}>
            <label>
              <span>UE</span>
              <select
                value={subjectId}
                onChange={(event) => { setSubjectId(event.target.value); setTopicId(""); }}
              >
                {state.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
            </label>
            <label>
              <span>Chapitre</span>
              <select value={topicId} onChange={(event) => setTopicId(event.target.value)}>
                <option value="">Non classé</option>
                {selectedSubject?.topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
              </select>
            </label>
            <label>
              <span>Type d’erreur</span>
              <select value={type} onChange={(event) => setType(event.target.value as ErrorType)}>
                {Object.entries(errorLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="field-wide">
              <span>Erreur observable *</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Théorème de Gauss appliqué sans justifier la symétrie" required />
            </label>
            <label>
              <span>Cause réelle</span>
              <textarea value={cause} onChange={(event) => setCause(event.target.value)} rows={3} placeholder="Pourquoi mon raisonnement a-t-il dévié ?" />
            </label>
            <label>
              <span>Correction conceptuelle</span>
              <textarea value={correction} onChange={(event) => setCorrection(event.target.value)} rows={3} placeholder="Quel raisonnement exact remplace le mauvais ?" />
            </label>
            <label>
              <span>Contrôle préventif</span>
              <textarea value={prevention} onChange={(event) => setPrevention(event.target.value)} rows={3} placeholder="Quelle question me poser la prochaine fois ?" />
            </label>
            <div className="form-actions field-wide">
              <Button type="button" variant="ghost" onClick={resetForm}>Annuler</Button>
              <Button type="submit" disabled={!title.trim()}>Enregistrer et revoir dans 2 jours</Button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel className="errors-list-panel">
        <div className="errors-toolbar">
          <div className="tab-switcher">
            <button className={filter === "open" ? "selected" : ""} onClick={() => setFilter("open")}>Ouvertes</button>
            <button className={filter === "resolved" ? "selected" : ""} onClick={() => setFilter("resolved")}>Neutralisées</button>
            <button className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")}>Toutes</button>
          </div>
          <label className="search-field">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filtrer les erreurs…" />
          </label>
          <span className="filter-count"><Filter size={14} /> {errors.length}</span>
        </div>

        {errors.length ? (
          <div className="error-list">
            {errors.map((error) => {
              const subject = state.subjects.find((item) => item.id === error.subjectId);
              const topic = subject?.topics.find((item) => item.id === error.topicId);
              return (
                <article className={error.resolved ? "error-card resolved" : "error-card"} key={error.id}>
                  <div className="error-card-head">
                    <div>
                      <span className="subject-dot" style={{ background: subject?.color ?? "var(--muted)" }} />
                      <span>{subject?.shortName ?? "Non classée"}</span>
                      <span>·</span>
                      <span>{formatShortDate(error.createdAt)}</span>
                    </div>
                    <Badge tone={error.resolved ? "success" : error.recurrence > 1 ? "danger" : "warning"}>
                      {error.resolved ? "neutralisée" : error.recurrence > 1 ? `${error.recurrence} occurrences` : errorLabels[error.type]}
                    </Badge>
                  </div>
                  <h3>{error.title}</h3>
                  <div className="error-reasoning-grid">
                    <div><small>Cause</small><p>{error.cause}</p></div>
                    <div><small>Correction</small><p>{error.correction}</p></div>
                    <div><small>Contrôle</small><p>{error.prevention}</p></div>
                  </div>
                  <div className="error-card-actions">
                    <span>Rejeu prévu {formatShortDate(error.nextReview)}</span>
                    {!error.resolved && subject && topic ? (
                      <Button variant="secondary" onClick={() => onStart(createTopicTask(subject, topic, state.checkIn.date, "error-review"))}>
                        Rejouer <ArrowRight size={15} />
                      </Button>
                    ) : null}
                    <Button
                      variant={error.resolved ? "ghost" : "primary"}
                      onClick={() => onUpdate(error.id, { resolved: !error.resolved })}
                    >
                      {error.resolved ? <RotateCcw size={15} /> : <Check size={15} />}
                      {error.resolved ? "Rouvrir" : "Neutraliser"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<ShieldCheck size={27} />}
            title={state.errors.length ? "Aucun résultat avec ce filtre" : "Le carnet est volontairement vide"}
            detail={state.errors.length ? "Modifie le statut ou la recherche." : "Aucune fausse donnée de démonstration : ta première vraie erreur apparaîtra après une session."}
            action={!state.errors.length ? <Button onClick={() => setShowForm(true)}><Plus size={15} /> Ajouter la première</Button> : undefined}
          />
        )}
      </Panel>
    </main>
  );
}

