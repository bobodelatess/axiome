"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookMarked,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  FileText,
  FlaskConical,
  Gauge,
  Layers3,
  Plus,
} from "lucide-react";
import { daysBetween, formatShortDate } from "@/lib/date-utils";
import { createTopicTask, subjectMasteryValue, topicRetention } from "@/lib/planner";
import type { AppState, PlanTask, Resource, Subject } from "@/lib/study-types";
import { Badge, Button, Panel, ProgressBar, SectionTitle } from "./ui";

const phaseLabels = {
  diagnostic: "À calibrer",
  guided: "Guidé",
  autonomous: "Autonome",
  "exam-ready": "Prêt examen",
};

function subjectIcon(subject: Subject) {
  if (subject.kind === "lab") return FlaskConical;
  if (subject.kind === "mathematics") return Layers3;
  return BookMarked;
}

export function CoursesView({
  state,
  onStart,
  onExamDate,
  onPriority,
  onAddTopic,
  onAddResource,
}: {
  state: AppState;
  onStart: (task: PlanTask) => void;
  onExamDate: (subjectId: string, value: string | null) => void;
  onPriority: (subjectId: string, value: Subject["priority"]) => void;
  onAddTopic: (subjectId: string, name: string) => void;
  onAddResource: (subjectId: string, resource: Omit<Resource, "id">) => void;
}) {
  const [selectedId, setSelectedId] = useState(state.subjects[0]?.id ?? "");
  const [newTopic, setNewTopic] = useState("");
  const [newResource, setNewResource] = useState("");
  const selected = useMemo(
    () => state.subjects.find((subject) => subject.id === selectedId) ?? state.subjects[0],
    [selectedId, state.subjects],
  );

  if (!selected) return null;
  const mastery = subjectMasteryValue(selected);
  const calibratedCount = selected.topics.filter((topic) => topic.calibrated).length;

  return (
    <main className="view-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">S3 · L2 Parcours Spécial Physique</p>
          <h1>Unités d’enseignement</h1>
          <p className="header-subtitle">
            Le logiciel part du syllabus, puis remplace les chapitres initiaux par ton poly réel.
          </p>
        </div>
        <Badge tone="accent">{state.subjects.length} UE actives</Badge>
      </header>

      <div className="course-layout">
        <aside className="subject-list" aria-label="Unités d’enseignement">
          {state.subjects.map((subject) => {
            const Icon = subjectIcon(subject);
            const value = subjectMasteryValue(subject);
            return (
              <button
                key={subject.id}
                className={selected.id === subject.id ? "subject-list-item selected" : "subject-list-item"}
                onClick={() => setSelectedId(subject.id)}
              >
                <span className="subject-list-icon" style={{ color: subject.color, background: `${subject.color}18` }}>
                  <Icon size={18} />
                </span>
                <span className="subject-list-copy">
                  <strong>{subject.shortName}</strong>
                  <small>{value === null ? "Non calibré" : `${value}% de maîtrise`}</small>
                </span>
                <span className="subject-priority">P{subject.priority}</span>
              </button>
            );
          })}
        </aside>

        <div className="course-detail">
          <Panel className="course-hero" style={{ "--subject-color": selected.color } as React.CSSProperties}>
            <div className="course-hero-main">
              <div className="subject-code">{selected.code}</div>
              <h2>{selected.name}</h2>
              <p>
                {calibratedCount === 0
                  ? "Aucune estimation fictive : commence par un diagnostic sans cours."
                  : `${calibratedCount}/${selected.topics.length} chapitres calibrés à partir de performances observées.`}
              </p>
              <div className="course-hero-progress">
                <ProgressBar value={mastery ?? 0} color={selected.color} label="Maîtrise de l’UE" />
                <span>{mastery === null ? "—" : `${mastery}%`}</span>
              </div>
            </div>
            <div className="course-settings-grid">
              <label>
                <span><CalendarClock size={15} /> Date du prochain contrôle</span>
                <input
                  type="date"
                  value={selected.examDate ?? ""}
                  onChange={(event) => onExamDate(selected.id, event.target.value || null)}
                />
              </label>
              <div>
                <span className="input-label"><Gauge size={15} /> Priorité stratégique</span>
                <div className="priority-picker">
                  {([1, 2, 3, 4, 5] as const).map((priority) => (
                    <button
                      key={priority}
                      className={selected.priority === priority ? "selected" : ""}
                      onClick={() => onPriority(selected.id, priority)}
                      aria-pressed={selected.priority === priority}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="chapters-panel">
            <SectionTitle
              eyebrow="Carte de maîtrise"
              title="Chapitres"
              aside={<span className="muted-label">Estimation fondée sur les sessions</span>}
            />
            <div className="topic-table">
              {selected.topics.map((topic) => {
                const retention = Math.round(topicRetention(topic, state.checkIn.date) * 100);
                const dueIn = daysBetween(state.checkIn.date, topic.dueDate);
                const suggested = createTopicTask(selected, topic, state.checkIn.date);
                return (
                  <article className="topic-row" key={topic.id}>
                    <div className="topic-status-icon" style={{ color: selected.color }}>
                      {topic.calibrated ? <CheckCircle2 size={18} /> : <CircleDashed size={18} />}
                    </div>
                    <div className="topic-name-cell">
                      <strong>{topic.name}</strong>
                      <span>{phaseLabels[topic.phase]} · difficulté {topic.difficulty}/5</span>
                    </div>
                    <div className="topic-metric">
                      <small>Maîtrise</small>
                      <strong>{topic.calibrated ? `${topic.mastery}%` : "—"}</strong>
                    </div>
                    <div className="topic-metric">
                      <small>Rétention estimée</small>
                      <strong>{topic.calibrated ? `${retention}%` : "À mesurer"}</strong>
                    </div>
                    <div className="topic-metric due-metric">
                      <small>Prochain rappel</small>
                      <strong className={dueIn <= 0 ? "due" : ""}>
                        {dueIn < 0 ? `retard ${Math.abs(dueIn)} j` : dueIn === 0 ? "aujourd’hui" : formatShortDate(topic.dueDate)}
                      </strong>
                    </div>
                    <Button variant="ghost" onClick={() => onStart(suggested)} aria-label={`Travailler ${topic.name}`}>
                      Travailler <ArrowRight size={15} />
                    </Button>
                  </article>
                );
              })}
            </div>
            <form
              className="inline-add-form"
              onSubmit={(event) => {
                event.preventDefault();
                onAddTopic(selected.id, newTopic);
                setNewTopic("");
              }}
            >
              <Plus size={17} />
              <input
                value={newTopic}
                onChange={(event) => setNewTopic(event.target.value)}
                placeholder="Ajouter un chapitre exact du poly…"
                aria-label="Nom du nouveau chapitre"
              />
              <Button variant="secondary" disabled={!newTopic.trim()}>Ajouter</Button>
            </form>
          </Panel>

          <Panel className="resources-panel">
            <SectionTitle eyebrow="Corpus local" title="Ressources de référence" />
            <div className="resource-grid">
              {selected.resources.map((resource) => (
                <article className="resource-card" key={resource.id}>
                  <span><FileText size={18} /></span>
                  <div>
                    <strong>{resource.name}</strong>
                    <small>{resource.detail}</small>
                  </div>
                  <Badge tone={resource.detail.includes("À") ? "warning" : "neutral"}>{resource.type}</Badge>
                </article>
              ))}
            </div>
            <form
              className="inline-add-form resource-add-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!newResource.trim()) return;
                onAddResource(selected.id, {
                  name: newResource.trim(),
                  type: "livre",
                  detail: "Ressource personnelle ajoutée",
                });
                setNewResource("");
              }}
            >
              <Plus size={17} />
              <input
                value={newResource}
                onChange={(event) => setNewResource(event.target.value)}
                placeholder="Ajouter un livre, une fiche ou un recueil…"
                aria-label="Nom de la ressource"
              />
              <Button variant="secondary" disabled={!newResource.trim()}>Ajouter</Button>
            </form>
          </Panel>
        </div>
      </div>
    </main>
  );
}
