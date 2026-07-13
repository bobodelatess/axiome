"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { toISODate } from "@/lib/date-utils";
import { createInitialState } from "@/lib/initial-data";
import { applySessionResult, generateDailyPlan } from "@/lib/planner";
import type {
  AppState,
  CalendarBlock,
  DailyCheckIn,
  ErrorEntry,
  PlanTask,
  SessionResult,
  Subject,
  Resource,
} from "@/lib/study-types";

const STORAGE_KEY = "axiome-psp-state-v1";
const subscribeToHydration = () => () => undefined;

function prepareToday(state: AppState): AppState {
  const today = toISODate(new Date());
  const dateChanged = state.checkIn.date !== today;
  const next = dateChanged
    ? {
        ...state,
        checkIn: { ...state.checkIn, date: today },
        currentPlan: [],
      }
    : state;

  if (!next.currentPlan.length || next.lastPlanDate !== today) {
    return {
      ...next,
      currentPlan: generateDailyPlan(next, today),
      lastPlanDate: today,
    };
  }
  return next;
}

function parseStoredState(raw: string | null): AppState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== 1 || !Array.isArray(parsed.subjects)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function useStudyStore() {
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const [state, setState] = useState<AppState>(() => {
    if (typeof window === "undefined") return prepareToday(createInitialState());
    const stored = parseStoredState(window.localStorage.getItem(STORAGE_KEY));
    return prepareToday(stored ?? createInitialState());
  });

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [hydrated, state]);

  const updateCheckIn = useCallback((patch: Partial<DailyCheckIn>) => {
    setState((current) => {
      const next = { ...current, checkIn: { ...current.checkIn, ...patch } };
      return {
        ...next,
        currentPlan: generateDailyPlan(next),
        lastPlanDate: next.checkIn.date,
      };
    });
  }, []);

  const regeneratePlan = useCallback(() => {
    setState((current) =>
      ({
        ...current,
        currentPlan: generateDailyPlan(current),
        lastPlanDate: current.checkIn.date,
      }),
    );
  }, []);

  const completeSession = useCallback((task: PlanTask, result: SessionResult) => {
    setState((current) => applySessionResult(current, task, result));
  }, []);

  const setExamDate = useCallback((subjectId: string, examDate: string | null) => {
    setState((current) => {
      const next = {
        ...current,
        subjects: current.subjects.map((subject) =>
          subject.id === subjectId ? { ...subject, examDate } : subject,
        ),
      };
      return { ...next, currentPlan: generateDailyPlan(next) };
    });
  }, []);

  const setSubjectPriority = useCallback(
    (subjectId: string, priority: Subject["priority"]) => {
      setState((current) => {
        const next = {
          ...current,
          subjects: current.subjects.map((subject) =>
            subject.id === subjectId ? { ...subject, priority } : subject,
          ),
        };
        return { ...next, currentPlan: generateDailyPlan(next) };
      });
    },
    [],
  );

  const addError = useCallback((entry: ErrorEntry) => {
    setState((current) => ({ ...current, errors: [entry, ...current.errors] }));
  }, []);

  const updateError = useCallback((id: string, patch: Partial<ErrorEntry>) => {
    setState((current) => ({
      ...current,
      errors: current.errors.map((error) =>
        error.id === id ? { ...error, ...patch } : error,
      ),
    }));
  }, []);

  const updateProfile = useCallback((patch: Partial<AppState["profile"]>) => {
    setState((current) => ({
      ...current,
      profile: { ...current.profile, ...patch },
    }));
  }, []);

  const addTopic = useCallback((subjectId: string, name: string) => {
    setState((current) => {
      if (!name.trim()) return current;
      const next = {
        ...current,
        subjects: current.subjects.map((subject) =>
          subject.id === subjectId
            ? {
                ...subject,
                topics: [
                  ...subject.topics,
                  {
                    id: `${subjectId}-topic-${Date.now()}`,
                    name: name.trim(),
                    mastery: 0,
                    calibrated: false,
                    stabilityDays: 1,
                    difficulty: 3 as const,
                    phase: "diagnostic" as const,
                    lastReviewed: null,
                    dueDate: current.checkIn.date,
                    repetitions: 0,
                    lapses: 0,
                  },
                ],
              }
            : subject,
        ),
      };
      return { ...next, currentPlan: generateDailyPlan(next) };
    });
  }, []);

  const addResource = useCallback(
    (subjectId: string, resource: Omit<Resource, "id">) => {
      setState((current) =>
        ({
          ...current,
          subjects: current.subjects.map((subject) =>
            subject.id === subjectId
              ? {
                  ...subject,
                  resources: [
                    ...subject.resources,
                    { ...resource, id: `${subjectId}-resource-${Date.now()}` },
                  ],
                }
              : subject,
          ),
        }),
      );
    },
    [],
  );

  const addCalendarBlock = useCallback((block: Omit<CalendarBlock, "id">) => {
    setState((current) =>
      ({
        ...current,
        calendar: [...current.calendar, { ...block, id: `block-${Date.now()}` }],
      }),
    );
  }, []);

  const removeCalendarBlock = useCallback((id: string) => {
    setState((current) =>
      ({ ...current, calendar: current.calendar.filter((block) => block.id !== id) }),
    );
  }, []);

  const replaceState = useCallback((nextState: AppState) => {
    if (nextState.version !== 1 || !Array.isArray(nextState.subjects)) {
      throw new Error("Ce fichier n’est pas une sauvegarde AXIOME valide.");
    }
    setState(prepareToday(nextState));
  }, []);

  const resetState = useCallback(() => {
    setState(prepareToday(createInitialState()));
  }, []);

  return {
    state,
    hydrated,
    updateCheckIn,
    regeneratePlan,
    completeSession,
    setExamDate,
    setSubjectPriority,
    addError,
    updateError,
    updateProfile,
    addTopic,
    addResource,
    addCalendarBlock,
    removeCalendarBlock,
    replaceState,
    resetState,
  };
}
