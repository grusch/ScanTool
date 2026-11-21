@echo off
rem Startet ScanTool lokal (http://127.0.0.1:3030) und oeffnet den Browser.
rem Fenster offen lassen - Schliessen beendet ScanTool.
title ScanTool
cd /d "%~dp0"
call npm run live
if errorlevel 1 pause
