#!/bin/bash

echo "Testing Frontend API Implementation..."

# Check if src directory exists
if [ ! -d "src" ]; then
    echo "ERROR: src directory not found"
    exit 1
fi

# Check if api directory exists
if [ ! -d "src/api" ]; then
    echo "ERROR: src/api directory not found"
    exit 1
fi

# Check if hooks directory exists
if [ ! -d "src/hooks" ]; then
    echo "ERROR: src/hooks directory not found"
    exit 1
fi

# Check if required files exist
required_files=(
    "src/api/types.ts"
    "src/api/mistralClient.ts"
    "src/api/elevenlabsClient.ts"
    "src/api/mistralClient.test.ts"
    "src/api/elevenlabsClient.test.ts"
    "src/hooks/useAudio.ts"
    "frontend-api.spec.md"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "ERROR: $file not found"
        exit 1
    fi
    echo "✓ $file exists"
done

echo "✓ All required frontend API files exist"

# Check for proper TypeScript imports
echo "Checking TypeScript imports..."
if grep -q "from './types'" src/api/mistralClient.ts && grep -q "from './types'" src/api/elevenlabsClient.ts; then
    echo "✓ Type imports properly used"
else
    echo "ERROR: Type imports not found"
    exit 1
fi

# Check for singleton pattern
echo "Checking singleton pattern..."
if grep -q "export const mistralClient = new MistralClient()" src/api/mistralClient.ts && grep -q "export const elevenlabsClient = new ElevenLabsClient()" src/api/elevenlabsClient.ts; then
    echo "✓ Singleton pattern implemented"
else
    echo "ERROR: Singleton pattern not found"
    exit 1
fi

# Check for Web Speech API usage
echo "Checking Web Speech API integration..."
if grep -q "SpeechRecognition" src/hooks/useAudio.ts && grep -q "recognition.onresult" src/hooks/useAudio.ts; then
    echo "✓ Web Speech API properly integrated"
else
    echo "ERROR: Web Speech API not properly integrated"
    exit 1
fi

# Check for error handling
echo "Checking error handling..."
if grep -q "try {" src/hooks/useAudio.ts && grep -q "catch (error)" src/hooks/useAudio.ts; then
    echo "✓ Error handling implemented"
else
    echo "ERROR: Error handling not found"
    exit 1
fi

# Check for browser compatibility checks
echo "Checking browser compatibility..."
if grep -q "isSpeechRecognitionSupported" src/hooks/useAudio.ts; then
    echo "✓ Browser compatibility checks implemented"
else
    echo "ERROR: Browser compatibility checks not found"
    exit 1
fi

echo "✓ Frontend API test completed successfully"
