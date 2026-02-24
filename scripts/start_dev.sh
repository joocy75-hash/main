#!/bin/bash
tmux new-session -d -s dev_servers "cd /Users/mr.joo/Desktop/관리자페이지/backend && source .venv/bin/activate && PYTHONPATH=. uvicorn app.main:app --port 8002 --reload"
tmux split-window -h -t dev_servers:0 "cd /Users/mr.joo/Desktop/관리자페이지/frontend && npx next dev --port 3001 --webpack"
tmux split-window -v -t dev_servers:0.0 "cd /Users/mr.joo/Desktop/casino && docker compose up postgres redis -d && cd backend && php artisan serve --port=8003"
tmux split-window -v -t dev_servers:0.1 "cd /Users/mr.joo/Desktop/casino/frontend && npx next dev --port 3002 --webpack"
tmux select-layout -t dev_servers tiled
