import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UploadArea } from './UploadArea'

describe('UploadArea', () => {
    it('renders an area indicating "Drag & drop an image or click to upload"', () => {
        render(<UploadArea onImageSelect={vi.fn()} />)
        expect(screen.getByText(/Drag & drop an image or click to upload/i)).toBeInTheDocument()
    })

    it('triggers onImageSelect when a valid image is selected', async () => {
        const handleImageSelect = vi.fn()
        render(<UploadArea onImageSelect={handleImageSelect} />)

        const fileInput = screen.getByTestId('upload-input') as HTMLInputElement
        const file = new File(['dummy content'], 'test.png', { type: 'image/png' })

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
            expect(handleImageSelect).toHaveBeenCalledWith(file)
            expect(handleImageSelect).toHaveBeenCalledTimes(1)
        })
    })

    it('displays a preview and "Clear" button when an image is selected', async () => {
        // Need to mock URL.createObjectURL for testing
        window.URL.createObjectURL = vi.fn().mockReturnValue('blob:test')
        window.URL.revokeObjectURL = vi.fn()

        render(<UploadArea onImageSelect={vi.fn()} />)
        const fileInput = screen.getByTestId('upload-input') as HTMLInputElement
        const file = new File(['dummy content'], 'test.png', { type: 'image/png' })

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
            expect(screen.getByTestId('image-preview')).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
        })
    })

    it('removes the selected image when "Clear" button is clicked', async () => {
        window.URL.createObjectURL = vi.fn().mockReturnValue('blob:test')

        const handleImageSelect = vi.fn()
        render(<UploadArea onImageSelect={handleImageSelect} />)

        const fileInput = screen.getByTestId('upload-input') as HTMLInputElement
        const file = new File(['dummy content'], 'test.png', { type: 'image/png' })

        fireEvent.change(fileInput, { target: { files: [file] } })

        const clearButton = await screen.findByRole('button', { name: /clear/i })
        fireEvent.click(clearButton)

        expect(screen.queryByTestId('image-preview')).not.toBeInTheDocument()
        expect(screen.getByText(/Drag & drop an image or click to upload/i)).toBeInTheDocument()
        expect(handleImageSelect).toHaveBeenLastCalledWith(null)
    })
})
