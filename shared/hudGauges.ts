/**
 * The four gauges around Iris's core on the home screen. Each one fills from
 * 0 to 1, shows a big value and a small caption, and turns amber when it
 * needs you. Pure so it can be tested; the app passes in what it knows.
 */

export type GaugeId = "today" | "inbox" | "vitals" | "plan";

export interface Gauge {
  id: GaugeId;
  /** Big readout, e.g. "4 TASKS". */
  value: string;
  /** Small caption under it, e.g. "TODAY". */
  caption: string;
  /** How full the arc is, 0–1. */
  fill: number;
  /** Amber: something here needs you. */
  alert: boolean;
  /** Spoken/aria description. */
  label: string;
}

export interface GaugeInput {
  todosPending: number;
  todosDone: number;
  urgent: number;
  unread: number;
  /** °F now, if known. */
  temp?: number;
  aqi?: number;
  pulseUrgent: boolean;
  /** Workouts logged this week and the weekly target (Tue/Thu/Sun = 3). */
  workouts: number;
  workoutTarget: number;
  monthDone: number;
  monthTotal: number;
  monthLabel: string;
}

const clamp = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function hudGauges(i: GaugeInput): Gauge[] {
  const totalTodos = i.todosPending + i.todosDone;
  const weather = [i.temp !== undefined ? `${Math.round(i.temp)}°` : "", i.aqi !== undefined ? `AQI ${i.aqi}` : ""].filter(Boolean).join(" · ");
  return [
    {
      id: "today",
      value: i.todosPending ? plural(i.todosPending, "TASK", "TASKS") : "ALL CLEAR",
      caption: i.urgent ? `TODAY · ${i.urgent} URGENT` : "TODAY",
      // Fills as you finish the day's list.
      fill: totalTodos ? i.todosDone / totalTodos : 1,
      alert: i.urgent > 0,
      label: `Today: ${plural(i.todosPending, "task", "tasks")} left${i.urgent ? `, ${i.urgent} urgent` : ""}`,
    },
    {
      id: "inbox",
      value: i.unread ? `${i.unread} NEW` : "CLEAR",
      caption: "INBOX",
      // Fuller = more waiting on you (10+ unread fills it).
      fill: clamp(i.unread / 10),
      alert: i.unread > 0,
      label: `Inbox: ${i.unread ? `${i.unread} unread` : "nothing unread"}`,
    },
    {
      id: "vitals",
      value: weather || "--°",
      caption: i.pulseUrgent ? "VITALS · PULSE ALERT" : "VITALS · PULSE OK",
      // Training this week toward the target.
      fill: clamp(i.workoutTarget ? i.workouts / i.workoutTarget : 0),
      alert: i.pulseUrgent,
      label: `Vitals: ${weather || "no weather yet"}, ${i.workouts} of ${i.workoutTarget} workouts this week${i.pulseUrgent ? ", Bay Area alert" : ""}`,
    },
    {
      id: "plan",
      value: `${i.monthLabel} · ${i.monthDone}/${i.monthTotal}`,
      caption: "PLAN",
      fill: clamp(i.monthTotal ? i.monthDone / i.monthTotal : 0),
      alert: false,
      label: `Plan: ${i.monthDone} of ${i.monthTotal} done in ${i.monthLabel}`,
    },
  ];
}
