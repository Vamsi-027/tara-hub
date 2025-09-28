#!/bin/bash
# Medusa CLI Helper for Sandbox Environment
export XDG_CONFIG_HOME="/mnt/c/Users/varak/repos/tara-hub-1/medusa/.medusa-config"
export DATABASE_URL_TEST="postgresql://medusa:medusa@localhost:5433/medusa_test"

echo "🔧 Sandbox Medusa CLI Environment"
echo "📁 Config dir: $XDG_CONFIG_HOME"
echo "🔗 Database: $DATABASE_URL_TEST"
echo ""

exec npx medusa "$@"
