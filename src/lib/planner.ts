import { addDays, clamp, daysBetween } from "./date-utils";
import type {
  AppState,
  LearningMode,
  PlanTask,
  PlannerCandidate,
  SessionLog,
  SessionResult,
  Subject,
  Topic,
} from "./study-types";

const MODE_LABELS: Record<LearningMode, string> = {
  diagnostic: "Diagnostic sans support",
  retrieval: "Rappel actif, feuille blanche",
  "worked-example": "Exemple raisonné → exercice jumeau",
  exercise: "Exercices en autonomie",
  "mixed-exam": "Problème mixte chronométré",
  "error-review": "Rejeu d’erreurs",
  debrief: "Bilan du soir",
};

const MODE_STEPS: Record<LearningMode, string[]> = {
  diagnostic: [
    "Fermer toutes les ressources et restituer ce qui est déjà disponible.",
    "Résoudre deux questions de niveau croissant sans aide.",
    "Comparer au cours et noter précisément les lacunes.",
  ],
  retrieval: [
    "Écrire définitions, hypothèses et résultats clés de mémoire.",
    "Reconstruire une démonstration ou un schéma causal.",
    "Vérifier seulement après avoir fixé une réponse.",
  ],
  "worked-example": [
    "Expliquer chaque ligne d’un exemple corrigé et la loi utilisée.",
    "Masquer progressivement les étapes de la solution.",
    "Résoudre immédiatement un exercice de structure voisine.",
  ],
  exercise: [
    "Identifier les données, l’inconnue et la méthode avant tout calcul.",
    "Résoudre sans correction avec une limite de temps explicite.",
    "Corriger en classant chaque erreur par cause, pas par symptôme.",
  ],
  "mixed-exam": [
    "Choisir seul la méthode parmi plusieurs chapitres possibles.",
    "Rédiger sous contrainte de temps et sans interruption.",
    "Faire un barème sévère puis rejouer uniquement les points perdus.",
  ],
  "error-review": [
    "Prédire l’erreur la plus probable avant de recommencer.",
    "Refaire le passage fautif sans regarder la correction.",
    "Énoncer une règle de prévention testable.",
  ],
  debrief: [
    "Nommer trois acquis réellement récupérables sans support.",
    "Capturer une zone floue et une erreur à ne pas répéter.",
    "Valider le premier bloc de demain.",
  ],
};

function subjectMastery(subject: Subject): number {
  const calibrated = subject.topics.filter((topic) => topic.calibrated);
  if (!calibrated.length) return 35;
  return calibrated.reduce((sum, topic) => sum + topic.mastery, 0) / calibrated.length;
}

export function topicRetention(topic: Topic, today: string): number {
  if (!topic.calibrated || !topic.lastReviewed) return 0.42;
  const elapsed = Math.max(0, daysBetween(topic.lastReviewed, today));
  return Math.exp(-elapsed / Math.max(0.75, topic.stabilityDays));
}

export function daysUntilExam(subject: Subject, today: string): number | null {
  if (!subject.examDate) return null;
  return daysBetween(today, subject.examDate);
}

function chooseMode(
  topic: Topic,
  retention: number,
  examDays: number | null,
  today: string,
): LearningMode {
  if (!topic.calibrated) return "diagnostic";
  if (examDays !== null && examDays >= 0 && examDays <= 14 && topic.mastery >= 45) {
    return "mixed-exam";
  }
  if (retention < 0.62 || daysBetween(topic.dueDate, today) >= 0) {
    return "retrieval";
  }
  if (topic.mastery < 45) return "worked-example";
  if (topic.mastery < 78) return "exercise";
  return "mixed-exam";
}

function taskDuration(mode: LearningMode, energy: number, remaining: number): number {
  const base: Record<LearningMode, number> = {
    diagnostic: 35,
    retrieval: 25,
    "worked-example": 45,
    exercise: 50,
    "mixed-exam": 70,
    "error-review": 25,
    debrief: 10,
  };
  const cap = energy <= 2 ? 35 : energy === 3 ? 50 : 75;
  const floor = mode === "debrief" ? 10 : 20;
  return Math.max(floor, Math.min(base[mode], cap, remaining));
}

function makeCandidate(subject: Subject, topic: Topic, today: string, state: AppState): PlannerCandidate {
  const retention = topicRetention(topic, today);
  const examDays = daysUntilExam(subject, today);
  const overdueDays = Math.max(0, daysBetween(topic.dueDate, today));
  const examUrgency =
    examDays === null || examDays < 0 ? 0 : clamp(1 - examDays / 35, 0, 1);
  const need = topic.calibrated ? 1 - topic.mastery / 100 : 0.82;
  const forgetting = 1 - retention;
  const overdue = clamp(overdueDays / 10, 0, 1);
  const priority = subject.priority / 5;
  const lapseRisk = clamp(topic.lapses / 4, 0, 1);
  const recentErrorCount = state.errors.filter(
    (error) => !error.resolved && error.topicId === topic.id,
  ).length;
  const errorRisk = clamp(recentErrorCount / 3, 0, 1);

  return {
    subject,
    topic,
    retention,
    examDays,
    mode: chooseMode(topic, retention, examDays, today),
    score:
      0.27 * need +
      0.2 * forgetting +
      0.18 * examUrgency +
      0.13 * priority +
      0.08 * overdue +
      0.07 * lapseRisk +
      0.07 * errorRisk,
  };
}

export function rankCandidates(state: AppState, today = state.checkIn.date): PlannerCandidate[] {
  return state.subjects
    .flatMap((subject) =>
      subject.topics.map((topic) => makeCandidate(subject, topic, today, state)),
    )
    .sort((a, b) => b.score - a.score);
}

function rationale(candidate: PlannerCandidate): string {
  if (!candidate.topic.calibrated) {
    return "Niveau inconnu : le logiciel mesure avant de prescrire du travail.";
  }
  if (candidate.examDays !== null && candidate.examDays <= 14) {
    return `Échéance à J-${Math.max(0, candidate.examDays)} : transfert et choix de méthode prioritaires.`;
  }
  if (candidate.retention < 0.55) {
    return "Risque d’oubli élevé : rappel maintenant, avant réapprentissage complet.";
  }
  if (candidate.topic.mastery < 45) {
    return "Schéma encore fragile : guidage réduit puis exercice immédiat.";
  }
  return "Consolidation par résolution autonome et variation des contextes.";
}

function resourceFor(mode: LearningMode, subject: Subject): string {
  if (mode === "mixed-exam") return "Annales PSP + barème";
  if (mode === "diagnostic") return "Feuille blanche, puis poly/TD pour vérifier";
  if (mode === "retrieval") return "Questions de rappel + poly fermé";
  if (mode === "worked-example") return "Cours + exemple corrigé + TD";
  if (mode === "error-review") return "Carnet d’erreurs";
  return subject.resources.find((resource) => resource.type === "td")?.name ?? "TD";
}

export function generateDailyPlan(state: AppState, today = state.checkIn.date): PlanTask[] {
  const available = clamp(state.checkIn.availableMinutes, 20, 480);
  const debriefReserve = available >= 70 ? 10 : 0;
  let remaining = available - debriefReserve;
  const candidates = rankCandidates(state, today);
  const selected: PlannerCandidate[] = [];
  const subjectCounts = new Map<string, number>();

  while (remaining >= 20 && candidates.length && selected.length < 6) {
    const previousSubject = selected.at(-1)?.subject.id;
    const ranked = candidates
      .map((candidate, index) => ({
        candidate,
        index,
        adjusted:
          candidate.score -
          (candidate.subject.id === previousSubject ? 0.16 : 0) -
          (subjectCounts.get(candidate.subject.id) ?? 0) * 0.06,
      }))
      .sort((a, b) => b.adjusted - a.adjusted);
    const pick = ranked[0];
    const duration = taskDuration(
      pick.candidate.mode,
      state.checkIn.energy,
      remaining,
    );
    if (duration < 20) break;
    selected.push(pick.candidate);
    remaining -= duration;
    subjectCounts.set(
      pick.candidate.subject.id,
      (subjectCounts.get(pick.candidate.subject.id) ?? 0) + 1,
    );
    candidates.splice(pick.index, 1);
  }

  let budget = available - debriefReserve;
  const plan: PlanTask[] = selected.map((candidate, index) => {
    const duration = taskDuration(
      candidate.mode,
      state.checkIn.energy,
      budget,
    );
    budget -= duration;
    return {
      id: `plan-${today}-${candidate.topic.id}-${index}`,
      date: today,
      order: index,
      subjectId: candidate.subject.id,
      topicId: candidate.topic.id,
      title: candidate.topic.name,
      subtitle: MODE_LABELS[candidate.mode],
      mode: candidate.mode,
      durationMinutes: duration,
      rationale: rationale(candidate),
      resource: resourceFor(candidate.mode, candidate.subject),
      intensity:
        candidate.mode === "mixed-exam" || candidate.mode === "exercise"
          ? "deep"
          : candidate.mode === "retrieval"
            ? "normal"
            : "normal",
      steps: MODE_STEPS[candidate.mode],
      completed: false,
    } satisfies PlanTask;
  });

  if (debriefReserve) {
    plan.push({
      id: `plan-${today}-debrief`,
      date: today,
      order: plan.length,
      subjectId: null,
      topicId: null,
      title: "Bilan de consolidation",
      subtitle: MODE_LABELS.debrief,
      mode: "debrief",
      durationMinutes: 10,
      rationale: "Transformer la journée en décisions concrètes pour demain.",
      resource: "Journal d’apprentissage",
      intensity: "light",
      steps: MODE_STEPS.debrief,
      completed: false,
    });
  }

  return plan;
}

export function createTopicTask(
  subject: Subject,
  topic: Topic,
  today: string,
  requestedMode?: LearningMode,
): PlanTask {
  const retention = topicRetention(topic, today);
  const examDays = daysUntilExam(subject, today);
  const mode = requestedMode ?? chooseMode(topic, retention, examDays, today);
  const candidate: PlannerCandidate = {
    subject,
    topic,
    retention,
    examDays,
    mode,
    score: 1,
  };
  return {
    id: `manual-${today}-${topic.id}-${Date.now()}`,
    date: today,
    order: 0,
    subjectId: subject.id,
    topicId: topic.id,
    title: topic.name,
    subtitle: MODE_LABELS[mode],
    mode,
    durationMinutes: taskDuration(mode, 4, 75),
    rationale: rationale(candidate),
    resource: resourceFor(mode, subject),
    intensity: mode === "mixed-exam" || mode === "exercise" ? "deep" : "normal",
    steps: MODE_STEPS[mode],
    completed: false,
  };
}

function nextPhase(mastery: number): Topic["phase"] {
  if (mastery < 35) return "guided";
  if (mastery < 78) return "autonomous";
  return "exam-ready";
}

function updatedTopic(
  topic: Topic,
  result: SessionResult,
  today: string,
  examDate: string | null,
): Topic {
  const diagnostic = !topic.calibrated;
  const rawMastery = diagnostic
    ? result.score
    : topic.mastery + (result.score - topic.mastery) * 0.2 + (result.hintsUsed === 0 ? 2 : 0);
  const mastery = Math.round(clamp(rawMastery, 0, 100));
  const successFactor =
    result.score >= 85 ? 1.85 : result.score >= 70 ? 1.35 : result.score >= 50 ? 0.82 : 0.45;
  const difficultyFactor = 1.12 - topic.difficulty * 0.04;
  const newStability = diagnostic
    ? result.score >= 70
      ? 2
      : 1
    : clamp(topic.stabilityDays * successFactor * difficultyFactor + 0.4, 0.75, 120);
  const examDays = examDate ? Math.max(1, daysBetween(today, examDate)) : null;
  const evidenceIntervalCap = examDays ? Math.max(1, Math.round(examDays * 0.2)) : 120;
  const interval = Math.max(1, Math.min(Math.round(newStability), evidenceIntervalCap));

  return {
    ...topic,
    calibrated: true,
    mastery,
    phase: nextPhase(mastery),
    stabilityDays: Number(newStability.toFixed(1)),
    lastReviewed: today,
    dueDate: addDays(today, interval),
    repetitions: topic.repetitions + 1,
    lapses: topic.lapses + (result.score < 50 ? 1 : 0),
  };
}

export function applySessionResult(
  state: AppState,
  task: PlanTask,
  result: SessionResult,
): AppState {
  const today = state.checkIn.date;
  const confidencePercent = result.confidence * 20;
  const calibrationGap = Math.abs(confidencePercent - result.score);
  const subject = task.subjectId
    ? state.subjects.find((item) => item.id === task.subjectId)
    : null;

  const subjects = state.subjects.map((item) => {
    if (item.id !== task.subjectId || !task.topicId) return item;
    return {
      ...item,
      topics: item.topics.map((topic) =>
        topic.id === task.topicId
          ? updatedTopic(topic, result, today, item.examDate)
          : topic,
      ),
    };
  });

  const log: SessionLog = {
    id: `log-${Date.now()}`,
    taskId: task.id,
    subjectId: task.subjectId,
    topicId: task.topicId,
    date: today,
    mode: task.mode,
    durationMinutes: result.actualMinutes,
    score: result.score,
    confidence: result.confidence,
    hintsUsed: result.hintsUsed,
    calibrationGap,
    errorTypes: result.errorTypes,
    note: result.note,
  };

  const errorEntries = result.errorTypes.map((type, index) => ({
    id: `error-${Date.now()}-${index}`,
    subjectId: task.subjectId ?? "system",
    topicId: task.topicId,
    createdAt: today,
    nextReview: addDays(today, 2),
    type,
    title: `${subject?.shortName ?? "Session"} · ${task.title}`,
    cause: "À préciser pendant la revue du soir",
    correction: result.note || "Rejouer le passage fautif sans correction.",
    prevention: "Écrire une règle de contrôle avant le prochain essai.",
    recurrence: 1,
    resolved: false,
  }));

  return {
    ...state,
    subjects,
    currentPlan: state.currentPlan.map((item) =>
      item.id === task.id ? { ...item, completed: true } : item,
    ),
    logs: [log, ...state.logs],
    errors: [...errorEntries, ...state.errors],
  };
}

export function subjectMasteryValue(subject: Subject): number | null {
  const calibrated = subject.topics.filter((topic) => topic.calibrated);
  if (!calibrated.length) return null;
  return Math.round(subjectMastery(subject));
}

export function activePracticeRatio(state: AppState): number {
  if (!state.logs.length) return 0;
  const activeModes: LearningMode[] = [
    "retrieval",
    "exercise",
    "mixed-exam",
    "diagnostic",
    "error-review",
  ];
  const activeMinutes = state.logs
    .filter((log) => {
      if (log.mode) return activeModes.includes(log.mode);
      const task = state.currentPlan.find((item) => item.id === log.taskId);
      return task ? activeModes.includes(task.mode) : false;
    })
    .reduce((sum, log) => sum + log.durationMinutes, 0);
  const total = state.logs.reduce((sum, log) => sum + log.durationMinutes, 0);
  return total ? Math.round((activeMinutes / total) * 100) : 0;
}

export function averageCalibrationGap(state: AppState): number | null {
  if (!state.logs.length) return null;
  return Math.round(
    state.logs.reduce((sum, log) => sum + log.calibrationGap, 0) / state.logs.length,
  );
}
