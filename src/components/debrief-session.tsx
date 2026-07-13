"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Check, Coffee, MoonStar, Sparkles, Target } from "lucide-react";
import type { SessionResult } from "@/lib/study-types";
import { Button } from "./ui";

export function DebriefSession({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (result: SessionResult) => void;
}) {
  const [acquis, setAcquis] = useState("");
  const [zoneFloue, setZoneFloue] = useState("");
  const [decision, setDecision] = useState("");

  useEffect(() => {
    document.body.classList.add("modal-open");
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  function submit(event: FormEvent) {
    event.preventDefault();
    onComplete({
      score: 100,
      confidence: 3,
      hintsUsed: 0,
      errorTypes: [],
      note: `ACQUIS\n${acquis}\n\nZONE FLOUE\n${zoneFloue}\n\nDÉCISION\n${decision}`,
      actualMinutes: 10,
    });
  }

  const ready = acquis.trim() && zoneFloue.trim() && decision.trim();

  return (
    <div className="focus-overlay" role="dialog" aria-modal="true" aria-labelledby="debrief-title">
      <div className="debrief-shell">
        <header className="focus-header">
          <button className="icon-button" onClick={onClose} aria-label="Fermer le bilan">
            <ArrowLeft size={20} />
          </button>
          <div className="focus-brand"><span className="focus-brand-dot" /><span>AXIOME · clôture</span></div>
          <MoonStar className="debrief-moon" size={18} />
        </header>
        <form className="debrief-content" onSubmit={submit}>
          <div className="debrief-heading">
            <span><Coffee size={20} /></span>
            <p className="eyebrow">Bilan du soir · 10 minutes maximum</p>
            <h1 id="debrief-title">Fermer les boucles, puis arrêter.</h1>
            <p>Pas de journal intime : trois traces qui changent concrètement le travail de demain.</p>
          </div>

          <div className="debrief-fields">
            <label>
              <span className="debrief-field-number">01</span>
              <div className="debrief-field-copy"><strong>Ce que je peux produire sans support</strong><small>Trois acquis précis, formulés comme des actions ou résultats.</small></div>
              <Sparkles size={18} />
              <textarea value={acquis} onChange={(event) => setAcquis(event.target.value)} rows={4} placeholder="Ex. Je sais justifier le choix d’une surface de Gauss à partir des symétries…" autoFocus />
            </label>
            <label>
              <span className="debrief-field-number">02</span>
              <div className="debrief-field-copy"><strong>La zone floue à ne pas masquer</strong><small>Une question testable, pas « je n’ai pas compris le chapitre ».</small></div>
              <Target size={18} />
              <textarea value={zoneFloue} onChange={(event) => setZoneFloue(event.target.value)} rows={4} placeholder="Ex. Je ne sais pas encore démontrer pourquoi le champ est radial dans ce cas…" />
            </label>
            <label>
              <span className="debrief-field-number">03</span>
              <div className="debrief-field-copy"><strong>La première action de demain</strong><small>Ressource, tâche et critère d’arrêt explicites.</small></div>
              <Check size={18} />
              <textarea value={decision} onChange={(event) => setDecision(event.target.value)} rows={4} placeholder="Ex. Refaire TD2 ex. 4 sans cours jusqu’au bilan des forces, 35 min max…" />
            </label>
          </div>

          <div className="debrief-actions">
            <p>Une fois validé, aucune nouvelle tâche n’est ajoutée ce soir.</p>
            <Button type="submit" disabled={!ready}>Clore la journée <Check size={16} /></Button>
          </div>
        </form>
      </div>
    </div>
  );
}

