import type { Config, Handler } from "@netlify/functions";
import { buildLeaveReminder, buildUrgentReminder, buildWindDownReminder } from "./_briefing";
import { listAllUserData, saveUserData } from "./_userData";
import { sendPush } from "./_push";
import { initBlobs } from "./_shared";
import type { SyncedTodo } from "../../shared/userDataTypes";
import { computeSuggestedBedtime, nextWakeDay } from "../../shared/bedtime";
import { computeServerLeaveBy } from "../../shared/leaveByLite";
import { dayKey, zonedDateTime } from "../../shared/timezone";

export const config: Config = {
  schedule: "*/10 * * * *",
};

function countUrgent(todos: SyncedTodo[], timeZone: string): number {
  const today = dayKey(timeZone);
  return todos.filter((t) => !t.done && t.dueDate === today).length;
}

export const handler: Handler = async (event) => {
  initBlobs(event);

  const users = await listAllUserData();
  const now = new Date();
  let sent = 0;

  for (const { sessionId, data } of users) {
    const settings = data.settings;
    if (!settings?.pushNotificationsEnabled || !data.pushSubscription) continue;

    const tz = settings.timezone;
    const day = dayKey(tz, now);

    const leavePlan = computeServerLeaveBy(settings, now);
    if (leavePlan) {
      const msUntilLeave = leavePlan.leaveBy.getTime() - now.getTime();
      const leaveKey = `${day}-leave`;

      if (msUntilLeave > 0 && msUntilLeave <= 10 * 60_000 && data.lastLeaveReminderKey !== leaveKey) {
        const msg = buildLeaveReminder(settings, leavePlan.leaveBy, leavePlan.destination);
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

    // Leave-by on the morning of the next wake-up drives tonight's bedtime.
    const wakeDay = nextWakeDay(settings, now);
    const wakeLeave = computeServerLeaveBy(settings, zonedDateTime(wakeDay, "12:00", tz));
    const bedtime = computeSuggestedBedtime(
      settings,
      wakeLeave ? { leaveBy: wakeLeave.leaveBy, destination: wakeLeave.destination } : null,
      now,
    );
    // One reminder per night (keyed by the morning it's for), even across midnight.
    const windDownKey = `${bedtime.wakeDay}-winddown`;
    const msUntilWindDown = bedtime.windDownStart.getTime() - now.getTime();
    if (
      msUntilWindDown >= 0 &&
      msUntilWindDown <= 10 * 60_000 &&
      data.lastWindDownReminderKey !== windDownKey
    ) {
      const msg = buildWindDownReminder(settings, bedtime.windDownStart, bedtime.lightsOut);
      const ok = await sendPush(data.pushSubscription, { ...msg, url: "/" });
      if (ok) {
        await saveUserData(sessionId, { ...data, lastWindDownReminderKey: windDownKey });
        sent++;
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ sent }) };
};
