@echo off
chcp 65001 >nul
cd /d "\\阿林\协作\仓库\lsy"
"C:\Program Files\Git\bin\git.exe" add "nengliang.HTML"
"C:\Program Files\Git\bin\git.exe" commit -m "更新 nengliang.HTML"
"C:\Program Files\Git\bin\git.exe" push
echo nengliang.HTML 同步完成！
pause
