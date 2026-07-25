import type { CheckIn, GroupSession } from "./types";
import { availableYears, dayKeyOf, getRange, type DateRange } from "./reports";
import {
  SCHOOL_TERMS,
  SCHOOL_YEAR_LABEL,
  termFor,
} from "./schoolCalendar";

export interface PeriodChoice {
  id: string;
  label: string;
  /** Heading the choice sits under in the picker. */
  group: string;
  range: DateRange;
}

const SCHOOL_GROUP = `School year ${SCHOOL_YEAR_LABEL}`;

function schoolChoices(): PeriodChoice[] {
  return SCHOOL_TERMS.map((term) => ({
    id: `term:${term.id}`,
    label: `${term.label} (${term.days} days)`,
    group: SCHOOL_GROUP,
    range: {
      start: term.start,
      end: term.end,
      label: `${term.label} · ${SCHOOL_YEAR_LABEL}`,
    },
  }));
}

function calendarChoices(years: number[]): PeriodChoice[] {
  const scopes = ["year", "q1", "q2", "q3", "q4"] as const;
  return years.flatMap((year) =>
    scopes.map((scope) => {
      const range = getRange(year, scope);
      return {
        id: `cal:${year}:${scope}`,
        label: range.label,
        group: `Calendar ${year}`,
        range,
      };
    }),
  );
}

export function periodChoices(
  checkIns: CheckIn[],
  sessions: GroupSession[],
): PeriodChoice[] {
  return [...schoolChoices(), ...calendarChoices(availableYears(checkIns, sessions))];
}

function hasData(
  range: DateRange,
  checkIns: CheckIn[],
  sessions: GroupSession[],
): boolean {
  const within = (day: string) => day >= range.start && day <= range.end;
  return (
    checkIns.some((c) => within(dayKeyOf(c.createdAt))) ||
    sessions.some((s) => within(s.date))
  );
}

/**
 * The term in progress if it has anything in it, otherwise the first period
 * that does. Opening a report on an empty term is never what you want.
 */
export function defaultPeriodChoice(
  choices: PeriodChoice[],
  checkIns: CheckIn[],
  sessions: GroupSession[],
  today = new Date(),
): PeriodChoice {
  const day = dayKeyOf(today.toISOString());
  const currentTerm = termFor(day, "quarter");
  if (currentTerm) {
    const match = choices.find((c) => c.id === `term:${currentTerm.id}`);
    if (match && hasData(match.range, checkIns, sessions)) return match;
  }
  return (
    choices.find((c) => hasData(c.range, checkIns, sessions)) ?? choices[0]
  );
}

/** Choices grouped for rendering as <optgroup>s, in their original order. */
export function groupChoices(
  choices: PeriodChoice[],
): { group: string; choices: PeriodChoice[] }[] {
  const groups: { group: string; choices: PeriodChoice[] }[] = [];
  for (const choice of choices) {
    const existing = groups.find((g) => g.group === choice.group);
    if (existing) existing.choices.push(choice);
    else groups.push({ group: choice.group, choices: [choice] });
  }
  return groups;
}
