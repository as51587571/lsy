@echo off
chcp 65001 >nul
echo ???? syncrun ??...

set "SELF_DIR=%~dp0"
copy /y "%SELF_DIR%syncrun.vbs" "%USERPROFILE%\syncrun.vbs" >nul

reg add "HKCR\syncrun" /ve /d "URL:syncrun Protocol" /f >nul 2>&1
reg add "HKCR\syncrun" /v "URL Protocol" /d "" /f >nul 2>&1
reg add "HKCR\syncrun\shell\open\command" /ve /d "wscript.exe \"%USERPROFILE%\syncrun.vbs\" \"%%1\"" /f >nul 2>&1

if %errorlevel%==0 (
  echo [??] syncrun ????????????????
) else (
  echo [??] ??????????????
)
pause
