import { formatPrice } from '@ecs/shared'
import { Card, Stat, Pill } from '@/components/ui'
import { TrackersPanel } from '@/components/TrackersPanel'
import { TasksPanel } from '@/components/TasksPanel'
import { getTodayEvents } from '@/lib/calendar'
import { getPriorityEmails } from '@/lib/email'
import { getActionItems } from '@/lib/ecs'
import { listTasks, listTrackers } from '@/lib/store'

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

export default async function BriefPage() {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const [calendar, email, actions, tasks, trackers] = await Promise.all([
    getTodayEvents(),
    getPriorityEmails(),
    getActionItems(),
    listTasks(),
    listTrackers(),
  ])

  const openTasks = tasks.filter((t) => !t.done).length

  return (
    <div>
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-neutral-500">
          Daily Brief
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {greeting(now)}.
        </h1>
        <p className="mt-1 text-neutral-400">{dateStr}</p>
      </header>

      {/* At a glance */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Meetings" value={calendar.events.length} hint="today" />
        <Stat label="Priority email" value={email.emails.length} />
        <Stat label="Orders to approve" value={actions.ordersToApprove.length} />
        <Stat label="Open tasks" value={openTasks} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Schedule */}
        <Card
          title="Schedule"
          action={<Pill>{calendar.configured ? 'Calendar' : 'Sample'}</Pill>}
        >
          {calendar.events.length === 0 ? (
            <p className="text-sm text-neutral-500">Nothing scheduled today.</p>
          ) : (
            <ul className="space-y-3">
              {calendar.events.map((e) => (
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
          action={<Pill>{email.configured ? 'Gmail' : 'Sample'}</Pill>}
        >
          <ul className="space-y-3">
            {email.emails.map((m) => (
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
