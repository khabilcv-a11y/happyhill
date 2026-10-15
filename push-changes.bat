@echo off
cd /d "%~dp0"
git add -A
git commit -m "Update portal" || echo Nothing new to commit
git push
pause
