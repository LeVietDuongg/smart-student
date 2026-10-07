@echo off
cd /d "%~dp0"
set "SMART_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%SMART_NODE%" set "SMART_NODE=node"
echo Smart Student - http://127.0.0.1:3000
echo Keep this window open while using the website.
"%SMART_NODE%" server.mjs
pause
