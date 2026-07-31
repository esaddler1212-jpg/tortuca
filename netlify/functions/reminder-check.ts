import type { Config, Handler } from "@netlify/functions";
import { buildLeaveReminder, buildUrgentReminder } from "./_briefing";
import { listAllUserData, saveUserData } from "./_userData";
import { sendPush } from "./_push";
import type { SyncedTodo } from "../../shared/userDataTypes";

export const config: Config = {
  schedule: "*/10 * * * *",
};

function localDayKey(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}

function zonedDateTime(day: string, hhmm: string, timeZone: string): Date {
  const [hour, minute] = hhmm.split(":").map(Number);
  let guess = new Date(`${day}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`);
  for (let i = 0; i < 4; i++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(guess);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const y = get("year");
    const mo = get("month");
    const da = get("day");
    const h = get("hour");
    const mi = get("minute");
    const gotDay = `${y}-${String(mo).padStart(2, "0")}-${String(da).padStart(2, "0")}`;
    if (gotDay === day && h === hour && mi === minute) return guess;
    guess = new Date(guess.getTime() + ((hour - h) * 60 + (minute - mi)) * 60_000);
  }
  return guess;
}

function countUrgent(todos: SyncedTodo[], timeZone: string): number {
  const today = localDayKey(timeZone);
  return todos.filter((t) => !t.done && t.dueDate === today).length;
}

export const handler: Handler = async () => {
  const users = await listAllUserData();
  const now = new Date();
  let sent = 0;

  for (const { sessionId, data } of users) {
    const settings = data.settings;
    if (!settings?.pushNotificationsEnabled || !data.pushSubscription) continue;

    const tz = settings.timezone;
    const day = localDayKey(tz, now);
    const commute = settings.commuteMinutes;
    const buffer = settings.arriveBufferMinutes;
    const arriveBy = zonedDateTime(day, settings.schoolStartTime || "08:00", tz);
    const leaveBy = new Date(arriveBy.getTime() - (commute + buffer) * 60_000);
    const msUntilLeave = leaveBy.getTime() - now.getTime();
    const leaveKey = `${day}-leave`;

    if (msUntilLeave > 0 && msUntilLeave <= 10 * 60_000 && data.lastLeaveReminderKey !== leaveKey) {
      const msg = buildLeaveReminder(settings, leaveBy, settings.schoolName);
      const ok = await sendPush(data.pushSubscription, { ...msg, url: "/" });
      if (ok) {
        await saveUserData(sessionId, { ...data, lastLeaveReminderKey: leaveKey });
        sent++;
      }
    }

    const urgent = countUrgent(data.todos ?? [], tz);
    const urgentKey = `${day}-urgent`;
    if (
      urgent > 0 &&
      msUntilLeave > 30 * 60_000 &&
      msUntilLeave <= 90 * 60_000 &&
      data.lastUrgentReminderKey !== urgentKey
    ) {
      const msg = buildUrgentReminder(urgent);
      const ok = await sendPush(data.pushSubscription, { ...msg, url: "/" });
      if (ok) {
        await saveUserData(sessionId, { ...data, lastUrgentReminderKey: urgentKey });
        sent++;
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ sent }) };
};
