@echo off
chcp 65001 >nul
pushd "\\阿林\协作\仓库\lsy"

echo 正在同步 nengliang.HTML ...

"C:\Program Files\Git\bin\git.exe" add "nengliang.HTML"
if errorlevel 1 (
  echo [失败] add 失败，请检查文件是否存在
  pause
  exit
)

"C:\Program Files\Git\bin\git.exe" commit -m "更新 nengliang.HTML"
if errorlevel 1 (
  echo [提示] 文件无变更或 commit 失败
) else (
  echo [提交] commit 成功
)

"C:\Program Files\Git\bin\git.exe" push
if errorlevel 1 (
  echo [失败] push 失败，检查网络或代理
  pause
  exit
)

echo ======================
echo nengliang.HTML 同步完成！
======================
pause

