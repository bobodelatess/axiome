import { describe, expect, it } from "vitest";
import { addDays } from "./date-utils";
import { createInitialState } from "./initial-data";
import {
  applySessionResult,
  generateDailyPlan,
  rankCandidates,
  topicRetention,
} from "./planner";

const fixedDate = new Date(2026, 6, 12, 12, 0, 0);

describe("adaptive planner", () => {
  it("respects the available budget and interleaves subjects", () => {
    const state = createInitialState(fixedDate);
    state.checkIn.availableMinutes = 190;
    const plan = generateDailyPlan(state);
    const total = plan.reduce((sum, task) => sum + task.durationMinutes, 0);
    const academicTasks = plan.filter((task) => task.subjectId);

    expect(total).toBeLessThanOrEqual(190);
    expect(total).toBeGreaterThanOrEqual(160);
    expect(plan.at(-1)?.mode).toBe("debrief");
    expect(new Set(academicTasks.map((task) => task.topicId)).size).toBe(
      academicTasks.length,
    );

    for (let index = 2; index < academicTasks.length; index += 1) {
      const lastThree = academicTasks.slice(index - 2, index + 1);
      expect(new Set(lastThree.map((task) => task.subjectId)).size).toBeGreaterThan(1);
    }
  });

  it("starts with diagnostics instead of invented mastery scores", () => {
    const state = createInitialState(fixedDate);
    const plan = generateDailyPlan(state);

    expect(plan.filter((task) => task.subjectId).every((task) => task.mode === "diagnostic"))
      .toBe(true);
    expect(state.subjects.flatMap((subject) => subject.topics).every((topic) => !topic.calibrated))
      .toBe(true);
  });

  it("updates mastery, stability, logs and next review after a session", () => {
    const state = createInitialState(fixedDate);
    state.currentPlan = generateDailyPlan(state);
    const task = state.currentPlan.find((item) => item.topicId);
    expect(task).toBeDefined();
    if (!task?.topicId || !task.subjectId) return;

    const next = applySessionResult(state, task, {
      score: 85,
      confidence: 4,
      hintsUsed: 0,
      errorTypes: ["rigueur"],
      note: "Hypothèse non explicitée dans la première rédaction.",
      actualMinutes: 34,
    });
    const subject = next.subjects.find((item) => item.id === task.subjectId);
    const topic = subject?.topics.find((item) => item.id === task.topicId);

    expect(topic?.calibrated).toBe(true);
    expect(topic?.mastery).toBe(85);
    expect(topic?.dueDate).toBe(addDays(state.checkIn.date, 2));
    expect(next.logs).toHaveLength(1);
    expect(next.logs[0].calibrationGap).toBe(5);
    expect(next.errors).toHaveLength(1);
    expect(next.currentPlan.find((item) => item.id === task.id)?.completed).toBe(true);
  });

  it("switches autonomous topics to mixed exam practice near a deadline", () => {
    const state = createInitialState(fixedDate);
    const subject = state.subjects[0];
    subject.examDate = addDays(state.checkIn.date, 10);
    const topic = subject.topics[0];
    Object.assign(topic, {
      calibrated: true,
      mastery: 82,
      phase: "exam-ready",
      lastReviewed: state.checkIn.date,
      dueDate: addDays(state.checkIn.date, 8),
      stabilityDays: 12,
    });

    const candidate = rankCandidates(state).find((item) => item.topic.id === topic.id);
    expect(candidate?.mode).toBe("mixed-exam");
  });

  it("models forgetting as a monotonic decay between reviews", () => {
    const state = createInitialState(fixedDate);
    const topic = state.subjects[0].topics[0];
    Object.assign(topic, {
      calibrated: true,
      lastReviewed: state.checkIn.date,
      stabilityDays: 5,
    });

    const dayOne = topicRetention(topic, addDays(state.checkIn.date, 1));
    const dayFive = topicRetention(topic, addDays(state.checkIn.date, 5));
    const dayTen = topicRetention(topic, addDays(state.checkIn.date, 10));

    expect(dayOne).toBeGreaterThan(dayFive);
    expect(dayFive).toBeGreaterThan(dayTen);
    expect(dayFive).toBeCloseTo(Math.exp(-1), 5);
  });
});

