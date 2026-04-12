#!/bin/bash
# Uruchom backend w tle
python3 backend/run.py &
# Poczekaj chwilę na uruchomienie backendu
sleep 5
# Uruchom frontend
cd frontend && npm start

