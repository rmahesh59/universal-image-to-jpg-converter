#!/bin/sh

set -eu

cleanup() {
  if [ -n "${BACKEND_PID:-}" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "${FRONTEND_PID:-}" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

echo "Starting backend on http://localhost:4000"
npm --prefix ./backend run dev &
BACKEND_PID=$!

echo "Starting frontend on http://localhost:5173 and network host 0.0.0.0"
npm --prefix ./frontend run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"
