#!/bin/bash

# Ollama initialization script
# This script pulls the Llama 3.1 8B Instruct model and verifies it's available

set -e

echo "🚀 Initializing Ollama service..."

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama service to be ready..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama service is ready!"
        break
    else
        echo "⏳ Attempt $attempt/$max_attempts: Ollama not ready yet, waiting 10s..."
        sleep 10
        attempt=$((attempt + 1))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Failed to connect to Ollama service after $max_attempts attempts"
    exit 1
fi

# Check if model is already available
echo "🔍 Checking if Llama 3.1 8B model is already available..."
if curl -s http://localhost:11434/api/tags | grep -q "llama3.1:8b"; then
    echo "✅ Llama 3.1 8B model is already available!"
    exit 0
fi

# Pull the model
echo "📥 Pulling Llama 3.1 8B Instruct model (this may take several minutes)..."
curl -X POST http://localhost:11434/api/pull -d '{
    "name": "llama3.1:8b",
    "stream": false
}'

# Verify the model is available
echo "🔍 Verifying model is available..."
if curl -s http://localhost:11434/api/tags | grep -q "llama3.1:8b"; then
    echo "✅ Llama 3.1 8B model successfully pulled and verified!"
    
    # Get model info
    echo "📊 Model information:"
    curl -s http://localhost:11434/api/tags | jq '.models[] | select(.name | contains("llama3.1:8b"))'
else
    echo "❌ Failed to verify Llama 3.1 8B model is available"
    exit 1
fi

echo "🎉 Ollama initialization completed successfully!"

