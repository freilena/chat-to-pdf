#!/bin/bash
# Test runner script that runs tests in batches to avoid hanging

set -e

echo "Running frontend tests in Docker..."

# Run tests with a timeout to prevent hanging
timeout 120 docker compose exec -T web npm run test 2>&1 || {
  EXIT_CODE=$?
  if [ $EXIT_CODE -eq 124 ]; then
    echo "ERROR: Tests timed out after 120 seconds"
    exit 1
  else
    exit $EXIT_CODE
  fi
}

