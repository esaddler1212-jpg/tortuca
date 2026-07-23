import { describe, it, expect } from 'vitest'
import { addTurtle, releaseTurtle, countBySpecies, type Turtle } from './pond'

const base: Turtle[] = []

describe('addTurtle', () => {
  it('adds a turtle with a trimmed name', () => {
    const next = addTurtle(base, { name: '  Franklin  ', species: 'Box Turtle' })
    expect(next).toHaveLength(1)
    expect(next[0].name).toBe('Franklin')
    expect(next[0].species).toBe('Box Turtle')
    expect(next[0].id).toBeTruthy()
  })

  it('does not mutate the original pond', () => {
    const next = addTurtle(base, { name: 'Crush', species: 'Green Sea Turtle' })
    expect(base).toHaveLength(0)
    expect(next).toHaveLength(1)
  })

  it('throws when the name is empty', () => {
    expect(() => addTurtle(base, { name: '   ', species: 'Loggerhead' })).toThrow(
      /needs a name/,
    )
  })
})

describe('releaseTurtle', () => {
  it('removes the turtle with the matching id', () => {
    const withOne = addTurtle(base, { name: 'Speedy', species: 'Painted Turtle' })
    const emptied = releaseTurtle(withOne, withOne[0].id)
    expect(emptied).toHaveLength(0)
  })
})

describe('countBySpecies', () => {
  it('tallies turtles by species', () => {
    let pond = addTurtle(base, { name: 'A', species: 'Loggerhead' })
    pond = addTurtle(pond, { name: 'B', species: 'Loggerhead' })
    pond = addTurtle(pond, { name: 'C', species: 'Leatherback' })
    expect(countBySpecies(pond)).toEqual({ Loggerhead: 2, Leatherback: 1 })
  })
})
