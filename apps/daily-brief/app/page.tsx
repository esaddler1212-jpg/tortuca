import { formatPrice } from '@ecs/shared'
import { Card, Stat, Pill } from '@/components/ui'
import { TrackersPanel } from '@/components/TrackersPanel'
import { TasksPanel } from '@/components/TasksPanel'
import { getSchedule } from '@/lib/schedule'
import { getInbox } from '@/lib/inbox'
import { getActionItems } from '@/lib/ecs'
import { listTasks, listTrackers } from '@/lib/store'
import { isGoogleConfigured, isGoogleConnected } from '@/lib/google'

export const dynamic = 'force-dynamic'

function greeting(date: Date): string {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function timeLabel(iso: string, allDay: boolean): string {
  if (allDay) return 'All day'
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

const GOOGLE_BANNER: Record<string, string> = {
  connected: 'Google connected — calendar and email are now live.',
  disconnected: 'Google disconnected.',
  error: 'Google sign-in failed. Please try again.',
  norefresh: 'Google did not return a refresh token. Try connecting again.',
  unconfigured:
    'Google is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
}

export default async function BriefPage({
  searchParams,
}: {
  searchParams: { google?: string }
}) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const [schedule, inbox, actions, tasks, trackers] = await Promise.all([
    getSchedule(),
    getInbox(),
    getActionItems(),
    listTasks(),
    listTrackers(),
  ])

  const openTasks = tasks.filter((t) => !t.done).length
  const connected = isGoogleConnected()
  const configured = isGoogleConfigured()
  const banner = searchParams.google
    ? GOOGLE_BANNER[searchParams.google]
    : undefined

  const scheduleLabel =
    schedule.source === 'google'
      ? 'Google'
      : schedule.source === 'ics'
        ? 'Calendar'
        : 'Sample'

  return (
    <div>
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            Daily Brief
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {greeting(now)}.
          </h1>
          <p className="mt-1 text-neutral-400">{dateStr}</p>
        </div>

        <div className="shrink-0 text-right">
          {connected ? (
            <a
              href="/api/google/logout"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs uppercase tracking-widest text-emerald-300 hover:bg-emerald-500/20"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Google connected
            </a>
          ) : configured ? (
            <a
              href="/api/google/auth"
              className="inline-block rounded-full border border-white/20 px-3 py-1.5 text-xs uppercase tracking-widest text-neutral-200 hover:bg-white/10"
            >
              Connect Google
            </a>
          ) : (
            <span className="inline-block rounded-full border border-white/10 px-3 py-1.5 text-xs uppercase tracking-widest text-neutral-500">
              Google not configured
            </span>
          )}
        </div>
      </header>

      {banner && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-300">
          {banner}
        </div>
      )}

      {/* At a glance */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Meetings" value={schedule.events.length} hint="today" />
        <Stat label="Priority email" value={inbox.emails.length} />
        <Stat label="Orders to approve" value={actions.ordersToApprove.length} />
        <Stat label="Open tasks" value={openTasks} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Schedule */}
        <Card title="Schedule" action={<Pill>{scheduleLabel}</Pill>}>
          {schedule.events.length === 0 ? (
            <p className="text-sm text-neutral-500">Nothing scheduled today.</p>
          ) : (
            <ul className="space-y-3">
              {schedule.events.map((e) => (
                <li key={e.id} className="flex items-baseline gap-4">
                  <span className="w-20 shrink-0 text-xs uppercase tracking-widest text-neutral-400">
                    {timeLabel(e.start, e.allDay)}
                  </span>
                  <span className="text-sm">{e.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Priorities */}
        <Card
          title="Priority email"
          action={<Pill>{inbox.source === 'gmail' ? 'Gmail' : 'Sample'}</Pill>}
        >
          {inbox.emails.length === 0 ? (
            <p className="text-sm text-neutral-500">Inbox zero. Nice.</p>
          ) : (
            <ul className="space-y-3">
              {inbox.emails.map((m) => (
                <li key={m.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{m.subject}</p>
                    <span className="shrink-0 text-[10px] uppercase tracking-widest text-neutral-500">
                      {m.reason}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-400">{m.from}</p>
                  <p className="mt-1 text-xs text-neutral-500">{m.snippet}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Action items from ECS */}
        <Card
          title="Needs your attention"
          action={<Pill>{actions.source === 'tortuca' ? 'Tortuca' : 'Sample'}</Pill>}
        >
          <div className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-neutral-500">
                Orders to approve
              </p>
              {actions.ordersToApprove.length === 0 ? (
                <p className="mt-1 text-sm text-neutral-500">All caught up.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {actions.ordersToApprove.map((o) => (
                    <li key={o.id} className="flex justify-between text-sm">
                      <span>
                        {o.id}{' '}
                        <span className="text-neutral-500">
                          · {o.customer_email}
                        </span>
                      </span>
                      <span className="tabular-nums">
                        {formatPrice(o.total, o.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-neutral-500">
                Collaboration inquiries
              </p>
              {actions.submissionsToAnswer.length === 0 ? (
                <p className="mt-1 text-sm text-neutral-500">Nothing waiting.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {actions.submissionsToAnswer.map((s) => (
                    <li key={s.id} className="text-sm">
                      {s.name}
                      <span className="text-neutral-500"> · {s.email}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>

        {/* Trackers */}
        <Card title="Trackers">
          <TrackersPanel initial={trackers} />
        </Card>

        {/* Tasks */}
        <Card title="Tasks">
          <TasksPanel initial={tasks} />
        </Card>
      </div>

      <footer className="mt-10 text-center text-xs text-neutral-600">
        Aggregated from Tortuca, your calendar and email. No talking required.
      </footer>
    </div>
  )
}
