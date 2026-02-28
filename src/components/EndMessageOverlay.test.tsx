import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EndMessageOverlay } from './EndMessageOverlay'

describe('EndMessageOverlay', () => {
    it('renders nothing when isVisible is false', () => {
        const { container } = render(<EndMessageOverlay isVisible={false} message="Game Over" onRestart={vi.fn()} />)
        expect(container).toBeEmptyDOMElement()
    })

    it('renders overlay and message when isVisible is true', () => {
        render(<EndMessageOverlay isVisible={true} message="Game Over" onRestart={vi.fn()} />)
        expect(screen.getByText('Game Over')).toBeInTheDocument()
    })

    it('triggers onRestart when the button is clicked', () => {
        const handleRestart = vi.fn()
        render(<EndMessageOverlay isVisible={true} message="Game Over" onRestart={handleRestart} />)

        const button = screen.getByRole('button', { name: /restart/i })
        fireEvent.click(button)

        expect(handleRestart).toHaveBeenCalledTimes(1)
    })
})
