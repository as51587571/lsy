@echo off
chcp 65001 >nul
pushd "\\阿林\协作\仓库\lsy"

"C:\Program Files\Git\bin\git.exe" add -A

set /p msg="输入提交说明（直接回车默认 更新）: "
if "%msg%"=="" set msg=更新

"C:\Program Files\Git\bin\git.exe" commit -m "%msg%"
"C:\Program Files\Git\bin\git.exe" push

echo.
echo 同步完成！
pause

