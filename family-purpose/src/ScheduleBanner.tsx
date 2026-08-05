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

/** Tags for a day that does not run to the normal bell. */
function dayTags(kind: string): string[] {
  if (kind === "minimum") return ["Minimum day — ends 12:00 PM"];
  if (kind === "wednesday") return ["Early release — ends 12:43 PM"];
  return [];
}

/** Where the clock sits in today's bell schedule. */
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

  if (!info.isSchoolDay) {
    const resumes =
      nextSchoolDay(day) ?? (day < FIRST_STUDENT_DAY ? FIRST_STUDENT_DAY : null);
    return (
      <div className={`schedule-banner schedule-${info.kind}`}>
        <p className="schedule-line">
          <strong>{info.label}</strong>
        </p>
        <p className="hint">
          {resumes
            ? `School resumes ${longDate(resumes)}.`
            : `The ${SCHOOL_NAME} year has ended.`}{" "}
          You can still log and back-fill check-ins.
        </p>
      </div>
    );
  }

  const headline = live
    ? `${live.name} now · ${formatPeriodRange(live)}`
    : suggestion
      ? `Passing period — ${suggestion.name} just ended`
      : "Before the first bell";

  return (
    <div className={`schedule-banner schedule-${info.kind}`}>
      <p className="schedule-line">
        <strong>{headline}</strong>
        {dayTags(info.kind).map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
        {info.milestone && <span className="tag">{info.milestone}</span>}
      </p>
      <p className="hint">{schedule.label}</p>
    </div>
  );
}
