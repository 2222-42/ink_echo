import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EndMessageOverlay } from './EndMessageOverlay'

describe('EndMessageOverlay', () => {
    it('renders nothing when isVisible is false', () => {
        const { container } = render(<EndMessageOverlay isVisible={false} message="Game Over" onUploadTransition={vi.fn()} />)
        expect(container).toBeEmptyDOMElement()
    })

    it('renders overlay and message when isVisible is true', () => {
        render(<EndMessageOverlay isVisible={true} message="Game Over" onUploadTransition={vi.fn()} />)
        expect(screen.getByText('Game Over')).toBeInTheDocument()
    })

    it('triggers onUploadTransition when the button is clicked', () => {
        const handleTransition = vi.fn()
        render(<EndMessageOverlay isVisible={true} message="Game Over" onUploadTransition={handleTransition} />)

        const button = screen.getByRole('button', { name: /upload card/i })
        fireEvent.click(button)

        expect(handleTransition).toHaveBeenCalledTimes(1)
    })
})
