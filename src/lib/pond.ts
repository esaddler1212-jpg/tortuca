export interface Turtle {
  id: string
  name: string
  species: string
  addedAt: number
}

export type TurtleDraft = Pick<Turtle, 'name' | 'species'>

export const SPECIES = [
  'Green Sea Turtle',
  'Loggerhead',
  'Leatherback',
  'Box Turtle',
  'Painted Turtle',
] as const

const STORAGE_KEY = 'tortuca.pond.v1'

let idCounter = 0
function makeId(): string {
  idCounter += 1
  return `${Date.now().toString(36)}-${idCounter.toString(36)}`
}

/** Add a turtle to the pond. Trims the name and rejects empty names. */
export function addTurtle(pond: Turtle[], draft: TurtleDraft): Turtle[] {
  const name = draft.name.trim()
  if (!name) {
    throw new Error('A turtle needs a name')
  }
  const turtle: Turtle = {
    id: makeId(),
    name,
    species: draft.species,
    addedAt: Date.now(),
  }
  return [...pond, turtle]
}

/** Remove ("release") a turtle from the pond by id. */
export function releaseTurtle(pond: Turtle[], id: string): Turtle[] {
  return pond.filter((t) => t.id !== id)
}

/** Count how many turtles of each species live in the pond. */
export function countBySpecies(pond: Turtle[]): Record<string, number> {
  return pond.reduce<Record<string, number>>((acc, t) => {
    acc[t.species] = (acc[t.species] ?? 0) + 1
    return acc
  }, {})
}

export function loadPond(): Turtle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Turtle[]) : []
  } catch {
    return []
  }
}

export function savePond(pond: Turtle[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pond))
  } catch {
    // ignore write failures (e.g. storage disabled)
  }
}
