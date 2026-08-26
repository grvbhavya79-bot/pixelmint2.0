#!/bin/bash
# ToolBox100 dev watchdog — restarts the Next.js dev server if it dies
# (e.g. after an environment OOM event) so the preview always recovers.
cd /home/z/my-project
while true; do
  if ! curl -s -m 8 http://localhost:3000/ > /dev/null 2>&1; then
    if ! pgrep -f "next dev" > /dev/null 2>&1 && ! pgrep -f "next-server" > /dev/null 2>&1; then
      echo "[$(date '+%H:%M:%S')] dev server down — restarting" >> /home/z/my-project/.zscripts/watchdog.log
      (setsid bun run dev > /dev/null 2>&1 < /dev/null &)
    fi
  fi
  sleep 15
done
