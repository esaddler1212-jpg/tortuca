import { beforeEach, describe, expect, it } from "vitest";
import type { CheckIn } from "./types";
import { addStudentNote, deleteStudentNote, studentMemory } from "./memory";
import { loadStudentNotes } from "./storage";
import { buildBackup, restoreBackup } from "./backup";
import { emptyBackup, mergeBackups } from "./backupMerge";
import { loadDebriefSettings } from "./storage";

const NOW = new Date("2026-11-04T19:00:00Z");
function ci(id: string, name: string, daysAgo: number, reasons: string[], extra: Partial<CheckIn> = {}): CheckIn {
  return {
    id,
    studentName: name,
    grade: "7",
    classPeriod: "P3",
    reasons: reasons as CheckIn["reasons"],
    reasonNotes: "",
    createdAt: new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString(),
    ...extra,
  };
}

describe("student memory", () => {
  beforeEach(() => localStorage.clear());

  it("spots patterns from a student's check-ins", () => {
    const checkIns = [
      ci("1", "Maria Lopez", 1, ["Attendance / tardiness"], { outcome: "Plan or goal set" }),
      ci("2", "maria lopez ", 3, ["Attendance / tardiness", "Family / home situation"]),
      ci("3", "Maria Lopez", 20, ["Attendance / tardiness"], {
        followUp: { dueAt: new Date(NOW.getTime() - 86_400_000).toISOString(), notes: "" } as CheckIn["followUp"],
      }),
      ci("4", "Someone Else", 1, ["Behavior / classroom concerns"]),
    ];
    const m = studentMemory("Maria Lopez", checkIns, [], NOW);
    expect(m.patterns[0]).toBe("2 check-ins in the last 7 days");
    expect(m.patterns).toContain("attendance came up 3 times this month");
    expect(m.patterns.some((p) => p.startsWith("Last check-in") && p.includes("attendance") && p.includes("plan or goal set"))).toBe(true);
    expect(m.patterns.some((p) => p.startsWith("Follow-up overdue since"))).toBe(true);
    expect(m.patterns.join(" ")).not.toContain("behavior");
  });

  it("keeps private notes per student, newest first, and deletes them", () => {
    addStudentNote("Maria Lopez", "Responds well to basketball goals");
    addStudentNote("Maria Lopez", "Mom prefers texts");
    addStudentNote("Jordan Smith", "Someone else's note");
    const m = studentMemory("maria lopez", [], loadStudentNotes(), NOW);
    // Only this student's notes (name matching ignores case and spaces).
    expect(m.notes.map((n) => n.text).sort()).toEqual(["Mom prefers texts", "Responds well to basketball goals"]);
    deleteStudentNote(m.notes[0].id);
    expect(studentMemory("Maria Lopez", [], loadStudentNotes(), NOW).notes).toHaveLength(1);
    // The deletion is kept as a tombstone so it syncs to other devices.
    expect(loadStudentNotes().filter((n) => n.deletedAt)).toHaveLength(1);
  });

  it("travels in backups and merges across devices (deletions win when newer)", () => {
    addStudentNote("Maria Lopez", "Responds well to basketball goals");
    const phone = buildBackup();
    expect(phone.studentNotes).toHaveLength(1);
    const computer = { ...emptyBackup(loadDebriefSettings()), studentNotes: [{ ...phone.studentNotes![0], text: "", deletedAt: "2099-01-01T00:00:00Z", updatedAt: "2099-01-01T00:00:00Z" }] };
    const merged = mergeBackups(phone, computer);
    expect(merged.studentNotes).toHaveLength(1);
    expect(merged.studentNotes![0].deletedAt).toBeTruthy();
    localStorage.clear();
    restoreBackup(phone);
    expect(studentMemory("Maria Lopez", [], loadStudentNotes(), NOW).notes.map((n) => n.text)).toEqual(["Responds well to basketball goals"]);
  });
});
