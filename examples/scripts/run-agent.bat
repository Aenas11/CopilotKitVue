@echo off
cd /d "%~dp0\..\agent"

echo 🚀 Starting C# Proverbs Agent on http://localhost:8000...
echo.
dotnet run --launch-profile http 