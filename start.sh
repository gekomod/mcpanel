#!/bin/bash
cd /app/backend
screen -dmS backend python3 run.py

cd /app/frontend
screen -dmS frontend npm run start

echo "Uruchomione procesy:"
screen -list

while true; do sleep 3600; done

