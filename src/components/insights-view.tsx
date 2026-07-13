"use client";

import {
  Activity,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  MoonStar,
  Scale,
  Sparkles,
  Target,
} from "lucide-react";
import { addDays, fromISODate, minutesLabel } from "@/lib/date-utils";
import {
  activePracticeRatio,
  averageCalibrationGap,
  subjectMasteryValue,
} from "@/lib/planner";
import type { AppState } from "@/lib/study-types";
import { Badge, Panel, ProgressBar, SectionTitle } from "./ui";

const evidence = [
  {
    title: "Récupération active",
    finding: "Se tester améliore la rétention à long terme au-delà de la simple relecture.",
    use: "Réponse obligatoire avant correction ; rappel feuille blanche.",
    href: "https://pubmed.ncbi.nlm.nih.gov/16507066/",
    source: "Roediger & Karpicke, 2006",
  },
  {
    title: "Espacement",
    finding: "Le meilleur intervalle dépend du délai jusqu’au test, sans règle universelle fixe.",
    use: "Stabilité par chapitre et plafond resserré près de l’examen.",
    href: "https://doi.org/10.1111/j.1467-9280.2008.02209.x",
    source: "Cepeda et al., 2008",
  },
  {
    title: "Entrelacement",
    finding: "Mélanger les types de problèmes entraîne le choix de stratégie, crucial en examen.",
    use: "Alternance d’UE et problèmes mixtes après acquisition guidée.",
    href: "https://files.eric.ed.gov/fulltext/ED557355.pdf",
    source: "Rohrer et al., 2015",
  },
  {
    title: "Feedback correctif",
    finding: "Le feedback réduit la persistance des réponses erronées après un test.",
    use: "Confiance avant correction, puis erreur classée et rejouée.",
    href: "https://doi.org/10.3758/MC.36.3.604",
    source: "Butler & Roediger, 2008",
  },
  {
    title: "Auto-explication",
    finding: "Expliquer les étapes d’un exemple soutient compréhension et transfert.",
    use: "Exemple raisonné, masquage progressif, exercice jumeau.",
    href: "https://doi.org/10.1207/s15516709cog1302_1",
    source: "Chi et al., 1989",
  },
  {
    title: "Sommeil et cognition",
    finding: "La privation de sommeil réduit capacité d’apprentissage et performance académique.",
    use: "Difficulté et durée abaissées quand la disponibilité physiologique chute.",
    href: "https://pubmed.ncbi.nlm.nih.gov/16564189/",
    source: "Curcio et al., 2006",
  },
];

export function InsightsView({ state }: { state: AppState }) {
  const activeRatio = activePracticeRatio(state);
  const calibration = averageCalibrationGap(state);
  const completedTasks = state.currentPlan.filter((task) => task.completed).length;
  const execution = state.currentPlan.length
    ? Math.round((completedTasks / state.currentPlan.length) * 100)
    : 0;
  const totalMinutes = state.logs.reduce((sum, log) => sum + log.durationMinutes, 0);
  const lastSevenDays = Array.from({ length: 7 }, (_, index) => addDays(state.checkIn.date, index - 6));
  const calibratedTopics = state.subjects.flatMap((subject) => subject.topics).filter((topic) => topic.calibrated).length;
  const totalTopics = state.subjects.reduce((sum, subject) => sum + subject.topics.length, 0);

  const recommendations = [
    calibratedTopics < 8
      ? "Priorité : calibrer au moins un socle dans chaque UE avant de chercher à optimiser les notes."
      : "La carte de maîtrise est assez dense pour arbitrer entre les UE.",
    state.logs.length && activeRatio < state.profile.activePracticeTarget
      ? `Production active à ${activeRatio}% : transforme la prochaine relecture en restitution sans support.`
      : "La cible de production active est respectée ou encore en cours de calibration.",
    calibration !== null && calibration > 20
      ? `Écart confiance-performance de ${calibration} points : tes impressions sont encore un mauvais instrument de mesure.`
      : "L’étalonnage confiance-performance sera suivi après plusieurs sessions.",
  ];

  return (
    <main className="view-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Mesure, pas motivation</p>
          <h1>Progression</h1>
          <p className="header-subtitle">
            Le tableau juge des performances observables : récupération, transfert, erreurs et calibration.
          </p>
        </div>
        <Badge tone={state.logs.length >= 5 ? "success" : "warning"}>
          {state.logs.length >= 5 ? "signal exploitable" : `${state.logs.length}/5 sessions avant tendance`}
        </Badge>
      </header>

      <div className="insight-metric-grid">
        <Panel className="insight-metric-card">
          <span><Activity size={19} /></span>
          <small>Temps mesuré</small>
          <strong>{minutesLabel(totalMinutes)}</strong>
          <p>{state.logs.length} session{state.logs.length > 1 ? "s" : ""} enregistrée{state.logs.length > 1 ? "s" : ""}</p>
        </Panel>
        <Panel className="insight-metric-card">
          <span><Target size={19} /></span>
          <small>Exécution du jour</small>
          <strong>{execution}%</strong>
          <p>{completedTasks}/{state.currentPlan.length} blocs</p>
        </Panel>
        <Panel className="insight-metric-card">
          <span><BrainCircuit size={19} /></span>
          <small>Production active</small>
          <strong>{state.logs.length ? `${activeRatio}%` : "—"}</strong>
          <p>cible {state.profile.activePracticeTarget}%</p>
        </Panel>
        <Panel className="insight-metric-card">
          <span><Scale size={19} /></span>
          <small>Erreur de calibration</small>
          <strong>{calibration === null ? "—" : `${calibration} pts`}</strong>
          <p>confiance vs performance</p>
        </Panel>
      </div>

      <div className="insights-main-grid">
        <Panel className="mastery-panel">
          <SectionTitle
            eyebrow="Carte réelle"
            title="Maîtrise par UE"
            aside={<span className="muted-label">{calibratedTopics}/{totalTopics} chapitres calibrés</span>}
          />
          <div className="mastery-list">
            {state.subjects.map((subject) => {
              const mastery = subjectMasteryValue(subject);
              return (
                <div className="mastery-row" key={subject.id}>
                  <span className="subject-dot" style={{ background: subject.color }} />
                  <div className="mastery-label"><strong>{subject.shortName}</strong><small>{mastery === null ? "Diagnostic requis" : `${subject.topics.filter((topic) => topic.calibrated).length}/${subject.topics.length} chapitres`}</small></div>
                  <ProgressBar value={mastery ?? 0} color={subject.color} />
                  <strong className="mastery-value">{mastery === null ? "—" : `${mastery}%`}</strong>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="recommendation-panel">
          <p className="eyebrow">Diagnostic du système</p>
          <h3>Prochain levier</h3>
          <div className="recommendation-list">
            {recommendations.map((recommendation, index) => (
              <div key={recommendation}>
                <span>{index === 0 ? <Sparkles size={16} /> : index === 1 ? <Gauge size={16} /> : <CheckCircle2 size={16} />}</span>
                <p>{recommendation}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="weekly-signal-panel">
        <SectionTitle eyebrow="Sept derniers jours" title="Régularité de production" />
        <div className="activity-week">
          {lastSevenDays.map((date) => {
            const minutes = state.logs.filter((log) => log.date === date).reduce((sum, log) => sum + log.durationMinutes, 0);
            return (
              <div className="activity-day" key={date}>
                <div className="activity-bar-wrap"><div className="activity-bar" style={{ height: `${Math.min(100, (minutes / 180) * 100)}%` }} /></div>
                <strong>{minutes ? `${minutes}m` : "—"}</strong>
                <span>{new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(fromISODate(date))}</span>
              </div>
            );
          })}
        </div>
      </Panel>

      <section className="evidence-section">
        <div className="evidence-heading">
          <div><p className="eyebrow">Fondements</p><h2>Ce que « basé sur les neurosciences » signifie ici</h2></div>
          <p>Pas de neuro-mythes ni de type d’apprenant. Des résultats robustes de psychologie cognitive traduits en décisions de produit, avec leurs limites.</p>
        </div>
        <div className="evidence-grid">
          {evidence.map((item) => (
            <a className="evidence-card" key={item.title} href={item.href} target="_blank" rel="noreferrer">
              <div><span>{item.title}</span><ArrowUpRight size={15} /></div>
              <p>{item.finding}</p>
              <small><strong>Dans AXIOME :</strong> {item.use}</small>
              <cite>{item.source}</cite>
            </a>
          ))}
        </div>
        <div className="evidence-caveat"><MoonStar size={17} /><p>Ces effets sont des régularités de groupe, pas des lois biologiques individuelles. Le logiciel les utilise comme point de départ puis apprend sur tes performances.</p></div>
      </section>
    </main>
  );
}

