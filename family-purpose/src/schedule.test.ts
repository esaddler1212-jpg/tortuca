import { describe, expect, it } from "vitest";
import {
  BELL_SCHEDULES,
  classPeriods,
  formatPeriodRange,
  periodAt,
  scheduleFor,
  suggestedPeriod,
} from "./schedule";

/** A local time on a given school day. */
function at(day: string, hour: number, minute = 0): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date, hour, minute);
}

const MONDAY = "2026-08-10";
const WEDNESDAY = "2026-08-12";
const MINIMUM_DAY = "2026-09-01";

describe("scheduleFor", () => {
  it("splits 6th grade from 7th and 8th on a normal day", () => {
    expect(scheduleFor(at(MONDAY, 10), "6").id).toBe("grade6");
    expect(scheduleFor(at(MONDAY, 10), "7").id).toBe("grade78");
    expect(scheduleFor(at(MONDAY, 10), "8").id).toBe("grade78");
  });

  it("puts every grade on the early-release schedule on Wednesday", () => {
    expect(scheduleFor(at(WEDNESDAY, 10), "6").id).toBe("wednesday");
    expect(scheduleFor(at(WEDNESDAY, 10), "8").id).toBe("wednesday");
  });

  it("uses the minimum-day schedule on the district's half days", () => {
    expect(scheduleFor(at(MINIMUM_DAY, 10), "6").id).toBe("minimum");
  });
});

describe("the schedules themselves", () => {
  it("gives 6th grade an earlier lunch than 7th and 8th", () => {
    const sixth = BELL_SCHEDULES.grade6.periods.find((p) => p.name === "Lunch")!;
    const upper = BELL_SCHEDULES.grade78.periods.find((p) => p.name === "Lunch")!;

    expect(sixth.start).toBe("11:30");
    expect(upper.start).toBe("12:16");
  });

  it("ends the early-release day before the normal one", () => {
    const wednesday = classPeriods(BELL_SCHEDULES.wednesday);
    const normal = classPeriods(BELL_SCHEDULES.grade78);

    expect(wednesday[wednesday.length - 1].end).toBe("12:43");
    expect(normal[normal.length - 1].end).toBe("14:18");
  });

  it("ends minimum days at noon", () => {
    const periods = classPeriods(BELL_SCHEDULES.minimum);
    expect(periods[periods.length - 1].end).toBe("12:00");
  });

  it("runs Advisory through Period 7 on a normal day, and skips Advisory otherwise", () => {
    expect(classPeriods(BELL_SCHEDULES.grade78).map((p) => p.name)).toEqual([
      "Advisory",
      "Period 1",
      "Period 2",
      "Period 3",
      "Period 4",
      "Period 5",
      "Period 6",
      "Period 7",
    ]);
    expect(classPeriods(BELL_SCHEDULES.wednesday)).toHaveLength(7);
    expect(
      classPeriods(BELL_SCHEDULES.wednesday).some((p) => p.name === "Advisory"),
    ).toBe(false);
  });

  it("leaves lunch out of the class periods", () => {
    expect(classPeriods(BELL_SCHEDULES.grade6).some((p) => p.name === "Lunch")).toBe(
      false,
    );
  });
});

describe("periodAt", () => {
  it("finds the period a moment falls in", () => {
    expect(periodAt(at(MONDAY, 10, 15), "7")?.name).toBe("Period 3");
    expect(periodAt(at(MONDAY, 8, 10), "7")?.name).toBe("Advisory");
  });

  it("differs by grade at midday", () => {
    expect(periodAt(at(MONDAY, 11, 45), "6")?.name).toBe("Lunch");
    expect(periodAt(at(MONDAY, 11, 45), "7")?.name).toBe("Period 5");
  });

  it("follows the Wednesday and minimum-day clocks", () => {
    expect(periodAt(at(WEDNESDAY, 11, 45), "7")?.name).toBe("Period 6");
    expect(periodAt(at(MINIMUM_DAY, 11, 45), "7")?.name).toBe("Period 7");
  });

  it("returns nothing in the passing period or before school", () => {
    expect(periodAt(at(MONDAY, 9, 14), "7")).toBeNull();
    expect(periodAt(at(MONDAY, 7, 30), "7")).toBeNull();
  });
});

describe("suggestedPeriod", () => {
  it("uses the class in session", () => {
    expect(suggestedPeriod(at(MONDAY, 10, 15), "7")?.name).toBe("Period 3");
  });

  it("falls back to the class the student just came from", () => {
    // Passing period between 2nd and 3rd.
    expect(suggestedPeriod(at(MONDAY, 9, 59), "7")?.name).toBe("Period 2");
    // A 6th grader at lunch came from 4th period.
    expect(suggestedPeriod(at(MONDAY, 11, 45), "6")?.name).toBe("Period 4");
  });

  it("keeps the last period after the final bell", () => {
    expect(suggestedPeriod(at(MONDAY, 15, 0), "7")?.name).toBe("Period 7");
  });

  it("suggests nothing before school starts", () => {
    expect(suggestedPeriod(at(MONDAY, 7, 15), "7")).toBeNull();
  });

  it("suggests nothing when school is closed", () => {
    expect(suggestedPeriod(at("2026-09-07", 10), "7")).toBeNull();
    expect(suggestedPeriod(at("2026-08-08", 10), "7")).toBeNull();
    expect(suggestedPeriod(at("2026-07-25", 10), "7")).toBeNull();
  });
});

describe("formatPeriodRange", () => {
  it("reads as a clock time", () => {
    expect(
      formatPeriodRange({
        name: "Period 3",
        start: "10:02",
        end: "10:44",
        instructional: true,
      }),
    ).toBe("10:02 AM–10:44 AM");
  });
});
