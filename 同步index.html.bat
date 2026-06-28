@echo off
chcp 65001 >nul
cd /d "\\阿林\协作\仓库\lsy"
"C:\Program Files\Git\bin\git.exe" add "index.html"
"C:\Program Files\Git\bin\git.exe" commit -m "更新 index.html"
"C:\Program Files\Git\bin\git.exe" push
echo index.html 同步完成！
pause
