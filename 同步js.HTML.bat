@echo off
chcp 65001 >nul
cd /d "\\阿林\协作\仓库\lsy"
"C:\Program Files\Git\bin\git.exe" add "js.HTML"
"C:\Program Files\Git\bin\git.exe" commit -m "更新 js.HTML"
"C:\Program Files\Git\bin\git.exe" push
echo js.HTML 同步完成！
pause
