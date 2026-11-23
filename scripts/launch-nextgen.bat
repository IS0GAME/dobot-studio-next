@echo off
title Dobot Studio Next-Gen
cd /d "%~dp0\.."
echo Starting Dobot Studio Next-Gen Services...
set PATH=C:\Users\Administrator\AppData\Local\Microsoft\WinGet\Links;%PATH%
bun run dev
