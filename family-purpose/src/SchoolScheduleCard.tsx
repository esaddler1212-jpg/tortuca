import { useState } from "react";
import {
  BELL_SCHEDULES,
  SCHOOL_NAME,
  formatClock,
  scheduleFor,
  type ScheduleId,
} from "./schedule";
import {
  MINIMUM_DAYS,
  SCHOOL_TERMS,
  SCHOOL_YEAR_LABEL,
  describeDay,
  termsOfKind,
} from "./schoolCalendar";
import { dayKeyOf } from "./reports";

const TABS: { id: ScheduleId; short: string }[] = [
  { id: "grade6", short: "6th grade" },
  { id: "grade78", short: "7th & 8th" },
  { id: "wednesday", short: "Wednesday" },
  { id: "minimum", short: "Minimum day" },
];

function shortDate(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Read-only view of the bell schedule and district calendar the app uses. */
export default function SchoolScheduleCard() {
  const now = new Date();
  const today = dayKeyOf(now.toISOString());
  const info = describeDay(today);
  const inEffect = info.isSchoolDay ? scheduleFor(now, "7").id : null;
  const [shown, setShown] = useState<ScheduleId>(inEffect ?? "grade78");

  const schedule = BELL_SCHEDULES[shown];

  return (
    <div className="card">
      <h2>School schedule</h2>
      <p className="hint" style={{ marginBottom: "1rem" }}>
        {SCHOOL_NAME} bell schedule and the Mt. Diablo Unified {SCHOOL_YEAR_LABEL}{" "}
        instructional calendar. Today is {shortDate(today)} — {info.label}.
      </p>

      <div className="pill-row" role="group" aria-label="Bell schedules">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`pill ${shown === tab.id ? "pill-active" : ""}`}
            aria-pressed={shown === tab.id}
            onClick={() => setShown(tab.id)}
          >
            {tab.short}
            {inEffect === tab.id && <span className="pill-meta">today</span>}
          </button>
        ))}
      </div>

      <table className="schedule-table" aria-label={schedule.label}>
        <caption className="sr-only">{schedule.label}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Start</th>
            <th scope="col">End</th>
          </tr>
        </thead>
        <tbody>
          {schedule.periods.map((p) => (
            <tr key={`${p.name}-${p.start}`}>
              <td>{p.name}</td>
              <td>{formatClock(p.start)}</td>
              <td>{formatClock(p.end)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginBottom: "0.25rem" }}>Terms</h3>
      <table className="schedule-table" aria-label="School terms">
        <thead>
          <tr>
            <th scope="col">Term</th>
            <th scope="col">School days</th>
            <th scope="col">Instructional days</th>
          </tr>
        </thead>
        <tbody>
          {SCHOOL_TERMS.filter((t) => t.kind !== "year").map((term) => (
            <tr key={term.id}>
              <td>{term.label}</td>
              <td>
                {shortDate(term.firstSchoolDay)} – {shortDate(term.lastSchoolDay)}
              </td>
              <td>{term.days}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">
        Reports and Impact can be run over any of these, or over calendar
        quarters. The year runs{" "}
        {shortDate(termsOfKind("year")[0].firstSchoolDay)} through{" "}
        {shortDate(termsOfKind("year")[0].lastSchoolDay)}, 180 instructional
        days.
      </p>

      <h3 style={{ marginBottom: "0.25rem" }}>Minimum days</h3>
      <p className="hint" style={{ marginTop: 0 }}>
        {MINIMUM_DAYS.filter((d) => describeDay(d).isSchoolDay)
          .map(shortDate)
          .join(" · ")}
      </p>
    </div>
  );
}
