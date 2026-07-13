"use client";

import { useEffect, useState } from "react";
import { Check, Command } from "lucide-react";
import { useStudyStore } from "@/hooks/use-study-store";
import type { PlanTask } from "@/lib/study-types";
import { AppSidebar, type NavSection } from "./app-sidebar";
import { CoursesView } from "./courses-view";
import { DebriefSession } from "./debrief-session";
import { ErrorsView } from "./errors-view";
import { FocusSession } from "./focus-session";
import { InsightsView } from "./insights-view";
import { PlanningView } from "./planning-view";
import { ReviewsView } from "./reviews-view";
import { SettingsView } from "./settings-view";
import { TodayDashboard } from "./today-dashboard";

export function AxiomeApp() {
  const store = useStudyStore();
  const [section, setSection] = useState<NavSection>("today");
  const [activeTask, setActiveTask] = useState<PlanTask | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  if (!store.hydrated || !store.state) {
    return (
      <div className="app-loading">
        <div className="loading-mark"><Command size={28} /></div>
        <strong>AXIOME</strong>
        <span>Construction du plan adaptatif…</span>
      </div>
    );
  }

  const state = store.state;
  const activeSubject = activeTask?.subjectId
    ? state.subjects.find((subject) => subject.id === activeTask.subjectId) ?? null
    : null;

  return (
    <div className="app-shell">
      <AppSidebar active={section} onChange={setSection} firstName={state.profile.firstName} />
      <div className="app-content">
        {section === "today" ? (
          <TodayDashboard state={state} onStart={setActiveTask} onCheckIn={store.updateCheckIn} onRegenerate={store.regeneratePlan} />
        ) : null}
        {section === "planning" ? (
          <PlanningView state={state} onExamDate={store.setExamDate} onProfile={store.updateProfile} onAddBlock={store.addCalendarBlock} onRemoveBlock={store.removeCalendarBlock} />
        ) : null}
        {section === "courses" ? (
          <CoursesView state={state} onStart={setActiveTask} onExamDate={store.setExamDate} onPriority={store.setSubjectPriority} onAddTopic={store.addTopic} onAddResource={store.addResource} />
        ) : null}
        {section === "reviews" ? <ReviewsView state={state} onStart={setActiveTask} /> : null}
        {section === "errors" ? <ErrorsView state={state} onAdd={store.addError} onUpdate={store.updateError} onStart={setActiveTask} /> : null}
        {section === "insights" ? <InsightsView state={state} /> : null}
        {section === "settings" ? <SettingsView state={state} onProfile={store.updateProfile} onImport={store.replaceState} onReset={store.resetState} /> : null}
      </div>

      {activeTask?.mode === "debrief" ? (
        <DebriefSession
          onClose={() => setActiveTask(null)}
          onComplete={(result) => {
            store.completeSession(activeTask, result);
            setActiveTask(null);
            setToast("Journée clôturée · la première action de demain est capturée.");
          }}
        />
      ) : activeTask ? (
        <FocusSession
          task={activeTask}
          subject={activeSubject}
          onClose={() => setActiveTask(null)}
          onComplete={(result) => {
            store.completeSession(activeTask, result);
            setActiveTask(null);
            setToast("Session enregistrée · maîtrise et prochain rappel recalculés.");
          }}
        />
      ) : null}

      {toast ? <div className="app-toast" role="status"><span><Check size={15} /></span>{toast}</div> : null}
    </div>
  );
}
