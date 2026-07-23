import { DIVISIONS } from '@ecs/shared'

export const metadata = {
  title: 'About — ECS Network',
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="text-2xl font-semibold uppercase tracking-wide">About</h1>
      <div className="mt-6 space-y-4 text-neutral-600">
        <p>
          ECS Network is a creative holding company. We design, produce and
          invest across four divisions, sharing one infrastructure and one
          point of view.
        </p>
        <p>
          Our shared backend — Tortuca — powers authentication, content and
          commerce across every property in the network.
        </p>
      </div>

      <ul className="mt-10 space-y-4">
        {DIVISIONS.map((d) => (
          <li key={d.slug} className="border-t border-neutral-200 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="font-medium">{d.name}</span>
              <span className="text-xs uppercase tracking-widest text-neutral-400">
                {d.tagline}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-500">{d.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
