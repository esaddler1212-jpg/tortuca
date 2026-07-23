import { listSubmissions } from '@/lib/store'
import { formatDate } from '@ecs/shared'

export const dynamic = 'force-dynamic'

export default async function SubmissionsPage() {
  const submissions = await listSubmissions()

  return (
    <div>
      <h1 className="text-2xl font-semibold uppercase tracking-wide">
        Submissions
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Collaboration requests from the ECS Network contact form.
      </p>

      <ul className="mt-8 space-y-4">
        {submissions.map((s) => (
          <li
            key={s.id}
            className="rounded-lg border border-neutral-800 bg-neutral-900 p-5"
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-medium">
                {s.name}
                {s.company && (
                  <span className="text-neutral-500"> · {s.company}</span>
                )}
              </span>
              <span className="shrink-0 text-xs uppercase tracking-widest text-neutral-500">
                {formatDate(s.created_at)}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-400">{s.email}</p>
            <p className="mt-3 text-sm text-neutral-300">{s.message}</p>
          </li>
        ))}
        {submissions.length === 0 && (
          <li className="text-sm text-neutral-500">No submissions yet.</li>
        )}
      </ul>
    </div>
  )
}
