@echo off
chcp 65001 >nul
pushd "\\阿林\协作\仓库\lsy"

set /p file="输入要同步的文件名（如 笔记.txt）: "
if "%file%"=="" (
    echo 未输入文件名，按任意键退出...
    pause >nul
    exit
)

if not exist "%file%" (
    echo 文件 "%file%" 不存在，请检查文件名
    pause >nul
    exit
)

"C:\Program Files\Git\bin\git.exe" add "%file%"

set /p msg="输入提交说明（直接回车默认 更新 %file%）: "
if "%msg%"=="" set msg=更新 %file%

"C:\Program Files\Git\bin\git.exe" commit -m "%msg%"
"C:\Program Files\Git\bin\git.exe" push

echo.
echo %file% 同步完成！
pause

