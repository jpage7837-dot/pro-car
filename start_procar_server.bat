@echo off
cd /d "%~dp0"
set PHP_EXE=C:\wamp64\bin\php\php8.4.15\php.exe
set CHROME_EXE=C:\Program Files\Google\Chrome\Application\chrome.exe

if not exist "%PHP_EXE%" (
  echo PHP runtime not found at %PHP_EXE%
  echo Falling back to the system PHP runtime if it is available.
  where php >nul 2>nul
  if errorlevel 1 (
    pause
    exit /b 1
  )
  set PHP_EXE=php
)

if not exist "%CHROME_EXE%" (
  echo Chrome not found at %CHROME_EXE%
  echo Falling back to the system default browser.
  start "Pro Car PHP Server" "%PHP_EXE%" -S 127.0.0.1:80 -t .
  start "http://127.0.0.1/index.html" http://127.0.0.1/index.html
  exit /b 0
)

start "Pro Car PHP Server" "%PHP_EXE%" -S 127.0.0.1:80 -t .
start "" "%CHROME_EXE%" --new-window http://127.0.0.1/index.html
