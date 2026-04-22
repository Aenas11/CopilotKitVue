#!/bin/bash

# Navigate to the agent directory
cd "$(dirname "$0")/../agent" || exit 1

# Run the C# agent
echo "🚀 Starting C# Proverbs Agent on http://localhost:8000..."
echo ""
dotnet run --launch-profile http
