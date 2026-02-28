# Image Compression Spec

## Objective
To prevent the `FUNCTION_PAYLOAD_TOO_LARGE` error when uploading images to the Vision API, we must compress and resize images on the client side before base64 encoding them.

## Context
When a user uploads a high-resolution photo (e.g., from a mobile device), the file size can easily exceed Vercel's 4.5MB Serverless Function payload limit once base64 encoded. The Mistral Pixtral-12b model also performs optimally and uses fewer tokens with images sized at 1024x1024 or smaller.

## ACCEPTANCE_CRITERIA
- [ ] AC-1: Images are resized to a maximum dimension (e.g. 1024x1024) while preserving aspect ratio.
- [ ] AC-2: Images are converted to JPEG format.
- [ ] AC-3: Images are compressed to reduce file size (e.g., quality 0.8).
- [ ] AC-4: A standard `.test.ts` file exists for the `compressImage` utility and is passing.
- [ ] AC-5: `App.tsx` handles `onImageSelect` by calling `compressImage` before base64 encoding and sending the payload.

## Non-Functional Requirements
- Ensure TDD is strictly followed for the `src/lib/imageUtils.ts` integration.
