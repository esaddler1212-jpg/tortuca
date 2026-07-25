import {
  SCHOOL_NAME,
  formatPeriodRange,
  periodAt,
  scheduleFor,
  suggestedPeriod,
} from "./schedule";
import {
  FIRST_STUDENT_DAY,
  describeDay,
  nextSchoolDay,
} from "./schoolCalendar";
import { dayKeyOf } from "./reports";

function longDate(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Today's bell schedule and where the clock currently sits in it. */
export default function ScheduleBanner({
  now,
  grade,
}: {
  now: Date;
  grade: string;
}) {
  const day = dayKeyOf(now.toISOString());
  const info = describeDay(day);
  const schedule = scheduleFor(now, grade);
  const live = periodAt(now, grade);
  const suggestion = suggestedPeriod(now, grade);

  const resumes = info.isSchoolDay ? null : nextSchoolDay(day);
  const upcoming = resumes ?? (day < FIRST_STUDENT_DAY ? FIRST_STUDENT_DAY : null);

  return (
    <div className={`schedule-banner schedule-${info.kind}`}>
      <p className="schedule-line">
        <strong>{info.label}</strong>
        {info.milestone && <span className="tag">{info.milestone}</span>}
      </p>
      {info.isSchoolDay ? (
        <p className="hint">
          {schedule.label} ·{" "}
          {live
            ? `${live.name} now, ${formatPeriodRange(live)}`
            : suggestion
              ? `Passing period — ${suggestion.name} just ended`
              : "Before the first bell"}
        </p>
      ) : (
        <p className="hint">
          {upcoming
            ? `School resumes ${longDate(upcoming)}.`
            : `The ${SCHOOL_NAME} year has ended.`}{" "}
          You can still log and back-fill check-ins.
        </p>
      )}
    </div>
  );
}
