import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Message } from '../types/conversation'
import { ConversationLog } from './ConversationLog'

const mockMessages: Message[] = [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi there!' },
]

describe('ConversationLog', () => {
    beforeEach(() => {
        window.HTMLElement.prototype.scrollIntoView = vi.fn()
    })

    it('renders messages from user and assistant', () => {
        render(<ConversationLog messages={mockMessages} onPlayAudio={vi.fn()} />)

        expect(screen.getByText('Hello')).toBeInTheDocument()
        expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })

    it('renders a Play Audio button for assistant messages', () => {
        render(<ConversationLog messages={mockMessages} onPlayAudio={vi.fn()} />)

        const playButtons = screen.getAllByTestId('play-audio-button')
        expect(playButtons).toHaveLength(1) // Only one assistant message
    })

    it('calls onPlayAudio when Play Audio button is clicked', () => {
        const handlePlayAudio = vi.fn()
        render(<ConversationLog messages={mockMessages} onPlayAudio={handlePlayAudio} />)

        const playButton = screen.getByTestId('play-audio-button')
        fireEvent.click(playButton)

        expect(handlePlayAudio).toHaveBeenCalledWith('Hi there!')
        expect(handlePlayAudio).toHaveBeenCalledTimes(1)
    })

    it('scrolls to bottom when messages change', () => {
        const scrollIntoViewMock = vi.fn()
        window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock

        const { rerender } = render(<ConversationLog messages={mockMessages} autoScroll={true} onPlayAudio={vi.fn()} />)

        const newMessages: Message[] = [
            ...mockMessages,
            { role: 'user', content: 'How are you?' },
        ]

        rerender(<ConversationLog messages={newMessages} autoScroll={true} onPlayAudio={vi.fn()} />)

        expect(scrollIntoViewMock).toHaveBeenCalled()
    })
})
