#!/bin/bash
cd /home/kavia/workspace/code-generation/unified-calendar-scheduler-210940-210954/calendar_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

