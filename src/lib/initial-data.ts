import { addDays, toISODate } from "./date-utils";
import type { AppState, Subject, SubjectKind, Topic } from "./study-types";

function topic(
  subjectId: string,
  index: number,
  name: string,
  difficulty: Topic["difficulty"],
  today: string,
  prerequisites?: string[],
): Topic {
  return {
    id: `${subjectId}-t${index}`,
    name,
    mastery: 0,
    calibrated: false,
    stabilityDays: 1,
    difficulty,
    phase: "diagnostic",
    lastReviewed: null,
    dueDate: addDays(today, index % 3),
    repetitions: 0,
    lapses: 0,
    prerequisites,
  };
}

function subject(
  id: string,
  code: string,
  name: string,
  shortName: string,
  kind: SubjectKind,
  color: string,
  priority: Subject["priority"],
  topicNames: Array<[string, Topic["difficulty"], string[]?]>,
  today: string,
): Subject {
  return {
    id,
    code,
    name,
    shortName,
    kind,
    color,
    semester: "S3",
    priority,
    examDate: null,
    topics: topicNames.map(([nameValue, difficulty, prerequisites], index) =>
      topic(id, index + 1, nameValue, difficulty, today, prerequisites),
    ),
    resources: [
      {
        id: `${id}-poly`,
        name: "Poly du cours",
        type: "poly",
        detail: "À relier au document officiel dès réception",
      },
      {
        id: `${id}-td`,
        name: "Feuilles de TD",
        type: "td",
        detail: "Exercices classés par chapitre et difficulté",
      },
      {
        id: `${id}-annales`,
        name: "Annales PSP",
        type: "annale",
        detail: "À utiliser après acquisition autonome",
      },
    ],
  };
}

export function createInitialState(now = new Date()): AppState {
  const today = toISODate(now);

  const subjects: Subject[] = [
    subject(
      "optique",
      "S3 · PHYSIQUE",
      "Optique ondulatoire",
      "Optique",
      "physics",
      "#79c9ff",
      5,
      [
        ["Phase, chemin optique et superposition", 3],
        ["Interférences à deux ondes", 4],
        ["Diffraction et transformée de Fourier", 5],
        ["Réseaux et pouvoir de résolution", 4],
      ],
      today,
    ),
    subject(
      "meca-solide",
      "S3 · PHYSIQUE",
      "Mécanique du solide",
      "Méca. solide",
      "physics",
      "#ff9f7a",
      5,
      [
        ["Cinématique d’un solide indéformable", 4],
        ["Moments d’inertie et axes principaux", 4],
        ["Dynamique de rotation", 5],
        ["Roulement et énergie", 4],
      ],
      today,
    ),
    subject(
      "em1",
      "PHYS2-EM1-PS",
      "Électromagnétisme 1",
      "Électromagnétisme",
      "physics",
      "#bb9cff",
      5,
      [
        ["Symétries, flux et théorème de Gauss", 4],
        ["Potentiel et énergie électrostatiques", 4],
        ["Conducteurs à l’équilibre", 4],
        ["Magnétostatique et symétries", 5],
      ],
      today,
    ),
    subject(
      "algebre2",
      "S3 · MATHÉMATIQUES",
      "Algèbre linéaire 2",
      "Algèbre 2",
      "mathematics",
      "#68dfb0",
      5,
      [
        ["Applications linéaires, noyau et image", 3],
        ["Matrices et changements de base", 4],
        ["Valeurs propres et diagonalisation", 5],
        ["Formes bilinéaires et orthogonalité", 5],
      ],
      today,
    ),
    subject(
      "om2",
      "PHYS2-OM2",
      "Outils mathématiques 2",
      "Outils maths 2",
      "mathematics",
      "#f1d36e",
      5,
      [
        ["Calcul différentiel à plusieurs variables", 4],
        ["Gradient, divergence et rotationnel", 4],
        ["Intégrales multiples et changements de variables", 5],
        ["Équations différentielles et développements", 5],
      ],
      today,
    ),
    subject(
      "atomistique",
      "S3 · CHIMIE",
      "Atomistique 1",
      "Atomistique",
      "chemistry",
      "#f39ac7",
      3,
      [
        ["Quantification et modèles atomiques", 3],
        ["Nombres quantiques et orbitales", 4],
        ["Configurations électroniques", 3],
        ["Spectres et transitions", 4],
      ],
      today,
    ),
    subject(
      "tp-physique",
      "S3 · TP",
      "Travaux pratiques de physique",
      "TP physique",
      "lab",
      "#8bd4c5",
      4,
      [
        ["Incertitudes et propagation", 4],
        ["Ajustement, résidus et validation", 4],
        ["Protocole et traçabilité", 3],
        ["Rédaction scientifique", 3],
      ],
      today,
    ),
    subject(
      "anglais",
      "S3 · LANGUE",
      "Anglais scientifique",
      "Anglais",
      "language",
      "#aeb7c6",
      2,
      [
        ["Vocabulaire scientifique actif", 2],
        ["Compréhension et synthèse", 3],
        ["Expression orale structurée", 3],
      ],
      today,
    ),
  ];

  return {
    version: 1,
    profile: {
      firstName: "Richard",
      track: "L2 Parcours Spécial Physique · UT3",
      objective: "Maîtrise profonde · dossier sélectif X / ENS / masters d’excellence",
      weeklyTargetHours: 24,
      activePracticeTarget: 72,
      semesterStart: "2026-09-01",
    },
    subjects,
    checkIn: {
      date: today,
      sleepHours: 7.5,
      energy: 4,
      focus: 4,
      stress: 2,
      availableMinutes: 190,
    },
    currentPlan: [],
    logs: [],
    errors: [],
    calendar: [
      {
        id: "sport-tue",
        weekday: 2,
        start: "18:30",
        end: "20:00",
        title: "Sport",
        kind: "sport",
      },
      {
        id: "weekly-review-sun",
        weekday: 0,
        start: "18:00",
        end: "18:35",
        title: "Revue hebdomadaire",
        kind: "personal",
      },
    ],
    lastPlanDate: "",
  };
}
