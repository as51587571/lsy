@echo off
chcp 65001 >nul
cd /d "\\阿林\协作\仓库\lsy"
"C:\Program Files\Git\bin\git.exe" add "fuzhiyejisuan.html"
"C:\Program Files\Git\bin\git.exe" commit -m "更新 fuzhiyejisuan.html"
"C:\Program Files\Git\bin\git.exe" push
echo fuzhiyejisuan.html 同步完成！
pause
