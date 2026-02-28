import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MicButton } from './MicButton'

describe('MicButton', () => {
    it('renders a button with a microphone icon initially', () => {
        render(<MicButton isRecording={false} disabled={false} onClick={() => { }} />)
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
        expect(screen.getByTestId('mic-icon')).toBeInTheDocument()
    })

    it('shows a stop visual indicator when isRecording is true', () => {
        render(<MicButton isRecording={true} disabled={false} onClick={() => { }} />)
        expect(screen.getByTestId('square-icon')).toBeInTheDocument()
        expect(screen.queryByTestId('mic-icon')).not.toBeInTheDocument()

        const button = screen.getByRole('button')
        expect(button.className).toMatch(/bg-red/)
    })

    it('is visually disabled and unclickable when disabled is true', () => {
        const handleClick = vi.fn()
        render(<MicButton isRecording={false} disabled={true} onClick={handleClick} />)

        const button = screen.getByRole('button')
        expect(button).toBeDisabled()

        fireEvent.click(button)
        expect(handleClick).not.toHaveBeenCalled()
    })

    it('fires onClick callback when clicked and not disabled', () => {
        const handleClick = vi.fn()
        render(<MicButton isRecording={false} disabled={false} onClick={handleClick} />)

        const button = screen.getByRole('button')
        fireEvent.click(button)
        expect(handleClick).toHaveBeenCalledTimes(1)
    })
})
