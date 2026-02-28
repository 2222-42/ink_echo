#!/bin/bash

echo "Testing Mistral API Implementation..."

# Check if mistral directory exists
if [ ! -d "api/mistral" ]; then
    echo "ERROR: api/mistral directory not found"
    exit 1
fi

# Check if required files exist
required_files=(
    "api/mistral/chat.ts"
    "api/mistral/vision.ts"
    "api/mistral/prompts.ts"
    "api/mistral/chat.test.ts"
    "api/mistral/vision.test.ts"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "ERROR: $file not found"
        exit 1
    fi
    echo "✓ $file exists"
done

echo "✓ All required Mistral API files exist"

# Check for system prompts
echo "Checking system prompts..."
if grep -q "CHAT_SYSTEM_PROMPT" api/mistral/prompts.ts; then
    echo "✓ CHAT_SYSTEM_PROMPT found"
else
    echo "ERROR: CHAT_SYSTEM_PROMPT not found in prompts.ts"
    exit 1
fi

if grep -q "VISION_SYSTEM_PROMPT" api/mistral/prompts.ts; then
    echo "✓ VISION_SYSTEM_PROMPT found"
else
    echo "ERROR: VISION_SYSTEM_PROMPT not found in prompts.ts"
    exit 1
fi

# Check for proper API key usage
echo "Checking API key usage..."
if grep -q "process.env.MISTRAL_API_KEY" api/mistral/chat.ts && grep -q "process.env.MISTRAL_API_KEY" api/mistral/vision.ts; then
    echo "✓ API keys properly loaded from environment variables"
else
    echo "ERROR: API keys not properly loaded from environment variables"
    exit 1
fi

# Check for system prompt injection
echo "Checking system prompt injection..."
if grep -q "getSystemPrompt" api/mistral/chat.ts && grep -q "getSystemPrompt" api/mistral/vision.ts; then
    echo "✓ System prompts properly injected server-side"
else
    echo "ERROR: System prompts not properly injected"
    exit 1
fi

# Check for JSON response format in vision
echo "Checking JSON response format..."
if grep -q "response_format.*json_object" api/mistral/vision.ts; then
    echo "✓ Vision API configured for JSON output"
else
    echo "ERROR: Vision API not configured for JSON output"
    exit 1
fi

echo "✓ Mistral API test completed successfully"
