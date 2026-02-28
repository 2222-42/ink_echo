import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConversationLog, Message } from './ConversationLog'

const mockMessages: Message[] = [
    { id: '1', role: 'user', content: 'Hello' },
    { id: '2', role: 'assistant', content: 'Hi there!' },
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

        expect(handlePlayAudio).toHaveBeenCalledWith('2')
        expect(handlePlayAudio).toHaveBeenCalledTimes(1)
    })

    it('scrolls to bottom when messages change', () => {
        const scrollIntoViewMock = vi.fn()
        window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock

        const { rerender } = render(<ConversationLog messages={mockMessages} autoScroll={true} onPlayAudio={vi.fn()} />)

        const newMessages: Message[] = [
            ...mockMessages,
            { id: '3', role: 'user', content: 'How are you?' },
        ]

        rerender(<ConversationLog messages={newMessages} autoScroll={true} onPlayAudio={vi.fn()} />)

        expect(scrollIntoViewMock).toHaveBeenCalled()
    })
})
