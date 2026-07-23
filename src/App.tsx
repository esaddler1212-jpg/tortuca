import { useEffect, useMemo, useState } from 'react'
import {
  addTurtle,
  releaseTurtle,
  countBySpecies,
  loadPond,
  savePond,
  SPECIES,
  type Turtle,
} from './lib/pond'
import './App.css'

export default function App() {
  const [pond, setPond] = useState<Turtle[]>(() => loadPond())
  const [name, setName] = useState('')
  const [species, setSpecies] = useState<string>(SPECIES[0])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    savePond(pond)
  }, [pond])

  const tallies = useMemo(() => countBySpecies(pond), [pond])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    try {
      const next = addTurtle(pond, { name, species })
      setPond(next)
      setName('')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <span className="hero__emoji" aria-hidden>🐢</span>
        <div>
          <h1>Tortuca</h1>
          <p className="hero__subtitle">Welcome new turtles to the pond.</p>
        </div>
      </header>

      <main className="card">
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Turtle name</label>
            <input
              id="name"
              name="name"
              placeholder="e.g. Franklin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label htmlFor="species">Species</label>
            <select
              id="species"
              name="species"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
            >
              {SPECIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn">
            Add to pond
          </button>
        </form>

        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}

        <section className="pond" aria-live="polite">
          <h2>
            The pond{' '}
            <span className="count" data-testid="pond-count">
              {pond.length}
            </span>
          </h2>

          {pond.length === 0 ? (
            <p className="empty">No turtles yet — add the first one above.</p>
          ) : (
            <ul className="turtle-list">
              {pond.map((t) => (
                <li key={t.id} className="turtle">
                  <span className="turtle__emoji" aria-hidden>🐢</span>
                  <span className="turtle__name">{t.name}</span>
                  <span className="turtle__species">{t.species}</span>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    aria-label={`Release ${t.name}`}
                    onClick={() => setPond((current) => releaseTurtle(current, t.id))}
                  >
                    Release
                  </button>
                </li>
              ))}
            </ul>
          )}

          {pond.length > 0 && (
            <ul className="tallies">
              {Object.entries(tallies).map(([s, n]) => (
                <li key={s}>
                  {s}: <strong>{n}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="footer">Built with Vite + React + TypeScript.</footer>
    </div>
  )
}
