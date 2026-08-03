@echo off
REM Starts the portfolio + blog backend (Node/Express + MongoDB) and opens it
REM in your browser. Run "npm install" once first if you haven't already.
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies for the first time...
  call npm install
)
echo Starting server at http://localhost:3000 ...
start "" http://localhost:3000/index.html
node server/server.js
