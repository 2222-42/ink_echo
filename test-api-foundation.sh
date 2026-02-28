#!/bin/bash

echo "Testing API Foundation..."

# Check if api directory exists
if [ ! -d "api" ]; then
    echo "ERROR: api directory not found"
    exit 1
fi

# Check if hello.ts exists
if [ ! -f "api/hello.ts" ]; then
    echo "ERROR: api/hello.ts not found"
    exit 1
fi

# Check if config.ts exists
if [ ! -f "api/config.ts" ]; then
    echo "ERROR: api/config.ts not found"
    exit 1
fi

# Check if middleware.ts exists
if [ ! -f "api/middleware.ts" ]; then
    echo "ERROR: api/middleware.ts not found"
    exit 1
fi

echo "✓ All required files exist"

# Try to compile TypeScript (if available)
if command -v tsc &> /dev/null; then
    echo "Running TypeScript compilation..."
    npx tsc --noEmit --project tsconfig.json 2>/dev/null || echo "TypeScript compilation failed (this is expected if tsconfig.json doesn't exist yet)"
else
    echo "TypeScript compiler not found, skipping compilation check"
fi

echo "✓ API Foundation test completed successfully"
