#!/bin/bash

echo "Testing ElevenLabs TTS API Implementation..."

# Check if elevenlabs directory exists
if [ ! -d "api/elevenlabs" ]; then
    echo "ERROR: api/elevenlabs directory not found"
    exit 1
fi

# Check if required files exist
required_files=(
    "api/elevenlabs/tts.ts"
    "api/elevenlabs/tts.test.ts"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "ERROR: $file not found"
        exit 1
    fi
    echo "✓ $file exists"
done

echo "✓ All required ElevenLabs API files exist"

# Check for proper API key usage
echo "Checking API key usage..."
if grep -q "process.env.ELEVENLABS_API_KEY" api/elevenlabs/tts.ts; then
    echo "✓ API key properly loaded from environment variables"
else
    echo "ERROR: API key not properly loaded from environment variables"
    exit 1
fi

# Check for audio streaming
echo "Checking audio streaming implementation..."
if grep -q "Content-Type.*audio/mpeg" api/elevenlabs/tts.ts; then
    echo "✓ Audio content type properly set"
else
    echo "ERROR: Audio content type not properly set"
    exit 1
fi

if grep -q "getReader" api/elevenlabs/tts.ts; then
    echo "✓ Audio streaming implementation found"
else
    echo "ERROR: Audio streaming implementation not found"
    exit 1
fi

# Check for turn-based voice settings
echo "Checking turn-based voice settings..."
if grep -q "turn >= 5 && turn <= 7" api/elevenlabs/tts.ts; then
    echo "✓ Turn-based voice settings implemented"
else
    echo "ERROR: Turn-based voice settings not implemented"
    exit 1
fi

# Check for default Japanese voice
echo "Checking default voice configuration..."
if grep -q "21m00Tcm4TlvDq8ikWAM" api/elevenlabs/tts.ts; then
    echo "✓ Default Japanese voice configured"
else
    echo "ERROR: Default Japanese voice not configured"
    exit 1
fi

echo "✓ ElevenLabs TTS API test completed successfully"
