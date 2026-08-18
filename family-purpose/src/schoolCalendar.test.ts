import { describe, expect, it } from "vitest";
import {
  FIRST_STUDENT_DAY,
  LAST_STUDENT_DAY,
  MINIMUM_DAYS,
  SCHOOL_TERMS,
  describeDay,
  isMinimumDay,
  isSchoolDay,
  nextSchoolDay,
  scheduleNote,
  termFor,
  termsOfKind,
} from "./schoolCalendar";

describe("terms", () => {
  it("matches the instructional day counts on the district calendar", () => {
    const days = (id: string) => SCHOOL_TERMS.find((t) => t.id === id)!.days;

    expect(days("q1")).toBe(41);
    expect(days("q2")).toBe(42);
    expect(days("q3")).toBe(48);
    expect(days("q4")).toBe(49);
    expect(days("q1") + days("q2")).toBe(days("s1"));
    expect(days("q3") + days("q4")).toBe(days("s2"));
    expect(days("s1") + days("s2")).toBe(180);
    expect(days("t1") + days("t2") + days("t3")).toBe(180);
  });

  it("leaves no gap between quarters", () => {
    const quarters = termsOfKind("quarter");
    expect(quarters[0].start).toBe(FIRST_STUDENT_DAY);
    expect(quarters[quarters.length - 1].end).toBe(LAST_STUDENT_DAY);

    for (let i = 1; i < quarters.length; i += 1) {
      const previousEnd = new Date(`${quarters[i - 1].end}T12:00:00`);
      previousEnd.setDate(previousEnd.getDate() + 1);
      expect(quarters[i].start).toBe(previousEnd.toISOString().slice(0, 10));
    }
  });

  it("places a day in the right quarter, semester and trimester", () => {
    expect(termFor("2026-09-15", "quarter")?.label).toBe("Quarter 1");
    expect(termFor("2026-11-20", "quarter")?.label).toBe("Quarter 2");
    expect(termFor("2027-02-01", "quarter")?.label).toBe("Quarter 3");
    expect(termFor("2027-05-01", "quarter")?.label).toBe("Quarter 4");
    expect(termFor("2026-11-20", "semester")?.label).toBe("Semester 1");
    expect(termFor("2026-11-20", "trimester")?.label).toBe("Trimester 2");
  });

  it("opens Quarter 2 on the day school resumes after fall recess", () => {
    const q2 = SCHOOL_TERMS.find((t) => t.id === "q2")!;
    expect(q2.start).toBe("2026-10-03");
    expect(q2.firstSchoolDay).toBe("2026-10-13");
    expect(isSchoolDay(q2.firstSchoolDay)).toBe(true);
  });
});

describe("describeDay", () => {
  it("knows the first and last student days", () => {
    expect(describeDay(FIRST_STUDENT_DAY).milestone).toBe("First student day");
    expect(describeDay(LAST_STUDENT_DAY).milestone).toBe("Last student day");
  });

  it("closes school for holidays and recesses", () => {
    expect(describeDay("2026-09-07").label).toBe("No school — Labor Day");
    expect(describeDay("2026-10-06").label).toBe("No school — Fall Recess");
    expect(describeDay("2026-12-25").label).toBe("No school — Winter Recess");
    expect(describeDay("2027-04-07").label).toBe("No school — Spring Recess");
    expect(isSchoolDay("2026-11-25")).toBe(false);
  });

  it("marks Wednesdays as early release", () => {
    const wednesday = describeDay("2026-08-12");
    expect(wednesday.kind).toBe("wednesday");
    expect(wednesday.label).toContain("early release");
  });

  it("marks the district's minimum days", () => {
    const day = describeDay("2026-09-01");
    expect(day.kind).toBe("minimum");
    expect(day.label).toContain("12:00 PM");
    expect(day.isSchoolDay).toBe(true);
  });

  it("lets a holiday win over a minimum day", () => {
    // April 2 is on the bell schedule's minimum-day list and is also
    // Farmworkers Day on the district calendar.
    expect(MINIMUM_DAYS).toContain("2027-04-02");
    expect(isMinimumDay("2027-04-02")).toBe(false);
    expect(describeDay("2027-04-02").label).toBe("No school — Farmworkers Day");
  });

  it("still reports the milestone on a minimum day", () => {
    expect(describeDay("2026-10-02").milestone).toBe("End of Quarter 1");
    expect(describeDay("2026-12-18").milestone).toBe(
      "End of Semester 1 and Quarter 2",
    );
  });

  it("separates weekends from closures", () => {
    expect(describeDay("2026-08-08").kind).toBe("weekend");
  });

  it("says when a date is outside the school year", () => {
    expect(describeDay("2026-07-25").label).toContain("Outside the 2026–2027");
    expect(describeDay("2027-07-01").isSchoolDay).toBe(false);
  });
});

describe("scheduleNote", () => {
  it("says nothing about an ordinary day", () => {
    expect(scheduleNote("2026-09-15")).toBeNull();
  });

  it("explains a short day", () => {
    expect(scheduleNote("2026-09-16")).toContain("Wednesday early release");
    expect(scheduleNote("2026-09-01")).toContain("Minimum day");
  });

  it("carries the milestone alongside the short day", () => {
    expect(scheduleNote("2026-10-02")).toBe(
      "Minimum day — school ended at 12:00 PM. End of Quarter 1",
    );
  });

  it("names a closure", () => {
    expect(scheduleNote("2026-11-25")).toBe("No school — School Recess");
  });
});

describe("nextSchoolDay", () => {
  it("skips a whole recess", () => {
    expect(nextSchoolDay("2026-10-02")).toBe("2026-10-13");
  });

  it("skips the weekend", () => {
    expect(nextSchoolDay("2026-08-07")).toBe("2026-08-10");
  });

  it("returns nothing past the end of the year", () => {
    expect(nextSchoolDay(LAST_STUDENT_DAY)).toBeNull();
  });
});
