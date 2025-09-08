#!/bin/bash

echo "=== DEBUGGING ADMIN BUILD ==="

echo "1. Current working directory:"
pwd

echo "2. Contents of .medusa directory:"
find .medusa -type f -name "*.html" 2>/dev/null || echo "No .medusa directory found"

echo "3. All HTML files in container:"
find . -name "*.html" -type f 2>/dev/null || echo "No HTML files found"

echo "4. Check medusa-config admin settings:"
if [ -f "medusa-config.ts" ]; then
    grep -A 5 "admin:" medusa-config.ts || echo "No admin config found"
else
    echo "medusa-config.ts not found"
fi

echo "5. Contents of current directory:"
ls -la

echo "6. Environment variables related to admin:"
env | grep -i admin || echo "No admin env vars"

echo "=== END DEBUG ==="