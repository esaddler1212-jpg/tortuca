import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('<App />', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with an empty pond', () => {
    render(<App />)
    expect(screen.getByTestId('pond-count')).toHaveTextContent('0')
    expect(screen.getByText(/no turtles yet/i)).toBeInTheDocument()
  })

  it('adds a turtle when the form is submitted', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/turtle name/i), 'Crush')
    await user.click(screen.getByRole('button', { name: /add to pond/i }))

    expect(screen.getByTestId('pond-count')).toHaveTextContent('1')
    expect(screen.getByText('Crush')).toBeInTheDocument()
  })

  it('shows an error when adding a turtle with no name', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /add to pond/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/needs a name/i)
    expect(screen.getByTestId('pond-count')).toHaveTextContent('0')
  })
})
