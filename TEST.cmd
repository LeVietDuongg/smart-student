@echo off
cd /d "%~dp0"
set "SMART_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%SMART_NODE%" set "SMART_NODE=node"
"%SMART_NODE%" --test tests/*.test.mjs
pause
