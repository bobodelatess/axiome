"use client";

import { ChangeEvent, useState } from "react";
import {
  BrainCircuit,
  Check,
  Database,
  Download,
  FileJson,
  HardDrive,
  LockKeyhole,
  RefreshCcw,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import type { AppState } from "@/lib/study-types";
import { Badge, Button, Panel, SectionTitle } from "./ui";

export function SettingsView({
  state,
  onProfile,
  onImport,
  onReset,
}: {
  state: AppState;
  onProfile: (patch: Partial<AppState["profile"]>) => void;
  onImport: (state: AppState) => void;
  onReset: () => void;
}) {
  const [message, setMessage] = useState<string | null>(null);

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `axiome-sauvegarde-${state.checkIn.date}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setMessage("Sauvegarde exportée.");
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as AppState;
      onImport(parsed);
      setMessage("Sauvegarde restaurée et plan recalculé.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Fichier invalide.");
    } finally {
      event.target.value = "";
    }
  }

  function reset() {
    if (window.confirm("Effacer toutes les sessions, erreurs et réglages locaux ?")) {
      onReset();
      setMessage("Données réinitialisées.");
    }
  }

  return (
    <main className="view-shell settings-view">
      <header className="page-header">
        <div>
          <p className="eyebrow">Configuration personnelle</p>
          <h1>Réglages</h1>
          <p className="header-subtitle">
            Les paramètres visibles peuvent être modifiés ; les performances comptent davantage que les préférences déclarées.
          </p>
        </div>
        <Badge tone="success"><LockKeyhole size={13} /> données locales</Badge>
      </header>

      {message ? <div className="settings-message"><Check size={15} /> {message}<button onClick={() => setMessage(null)}>×</button></div> : null}

      <div className="settings-layout">
        <div className="settings-main">
          <Panel className="settings-panel">
            <SectionTitle eyebrow="Profil" title="Cap académique" />
            <div className="settings-form-grid">
              <label>
                <span>Prénom</span>
                <input value={state.profile.firstName} onChange={(event) => onProfile({ firstName: event.target.value })} />
              </label>
              <label>
                <span>Formation</span>
                <input value={state.profile.track} onChange={(event) => onProfile({ track: event.target.value })} />
              </label>
              <label className="field-wide">
                <span>Objectif directeur</span>
                <input value={state.profile.objective} onChange={(event) => onProfile({ objective: event.target.value })} />
              </label>
              <label>
                <span>Début du semestre</span>
                <input type="date" value={state.profile.semesterStart} onChange={(event) => onProfile({ semesterStart: event.target.value })} />
              </label>
              <label>
                <span>Objectif hebdomadaire</span>
                <div className="range-setting">
                  <input type="range" min="8" max="40" value={state.profile.weeklyTargetHours} onChange={(event) => onProfile({ weeklyTargetHours: Number(event.target.value) })} />
                  <strong>{state.profile.weeklyTargetHours} h</strong>
                </div>
              </label>
              <label className="field-wide">
                <span>Part minimale de production active</span>
                <div className="range-setting">
                  <input type="range" min="50" max="90" step="1" value={state.profile.activePracticeTarget} onChange={(event) => onProfile({ activePracticeTarget: Number(event.target.value) })} />
                  <strong>{state.profile.activePracticeTarget}%</strong>
                </div>
              </label>
            </div>
          </Panel>

          <Panel className="settings-panel">
            <SectionTitle eyebrow="Portabilité" title="Sauvegarde et restauration" />
            <div className="data-actions">
              <div className="data-action-copy">
                <span><FileJson size={20} /></span>
                <div><strong>Fichier AXIOME complet</strong><p>UE, dates, maîtrise, sessions, erreurs, agenda et paramètres.</p></div>
              </div>
              <div className="data-action-buttons">
                <Button variant="secondary" onClick={exportData}><Download size={16} /> Exporter</Button>
                <label className="button button-secondary file-button"><Upload size={16} /> Importer<input type="file" accept="application/json,.json" onChange={importData} /></label>
              </div>
            </div>
          </Panel>

          <Panel className="settings-panel danger-zone">
            <div>
              <p className="eyebrow">Zone de remise à zéro</p>
              <h3>Revenir à la configuration PSP initiale</h3>
              <p>Supprime localement les sessions, erreurs et réglages. Exporte d’abord si tu veux pouvoir revenir en arrière.</p>
            </div>
            <Button variant="danger" onClick={reset}><RefreshCcw size={16} /> Réinitialiser</Button>
          </Panel>
        </div>

        <aside className="settings-side">
          <Panel>
            <div className="settings-side-icon"><BrainCircuit size={22} /></div>
            <p className="eyebrow">Moteur adaptatif v1</p>
            <h3>Ce qui influence la priorité</h3>
            <ul className="weight-list">
              <li><span>27%</span><div><strong>Lacune de maîtrise</strong><small>Résultat observé, pas ressenti.</small></div></li>
              <li><span>20%</span><div><strong>Risque d’oubli</strong><small>Temps écoulé / stabilité.</small></div></li>
              <li><span>18%</span><div><strong>Proximité examen</strong><small>Rampe sur 35 jours.</small></div></li>
              <li><span>13%</span><div><strong>Priorité de l’UE</strong><small>Réglage stratégique.</small></div></li>
              <li><span>22%</span><div><strong>Retard et erreurs</strong><small>Échéance, rechute, récurrence.</small></div></li>
            </ul>
          </Panel>

          <Panel className="privacy-panel">
            <HardDrive size={21} />
            <h3>Local par défaut</h3>
            <p>Cette version fonctionne sans compte ni serveur. Les données restent dans le navigateur utilisé.</p>
            <div><Database size={14} /> localStorage · schéma v{state.version}</div>
          </Panel>

          <Panel className="algorithm-limit-panel">
            <SlidersHorizontal size={19} />
            <div>
              <strong>Limite assumée</strong>
              <p>Avant cinq à dix sessions, le moteur explore et calibre. Il ne peut pas déduire un « profil cognitif » stable en une journée.</p>
            </div>
          </Panel>
        </aside>
      </div>
    </main>
  );
}

