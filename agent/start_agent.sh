#!/bin/bash

# Konfiguracja
AGENT_NAME="MCPanelAgent"
LOG_FILE="/var/log/mcpanel/agent.log"
PID_FILE="/var/run/mcpanel/agent.pid"
AGENT_SCRIPT="/home/agent/agent.py"  # Zmień na właściwą ścieżkę

# Katalogi
mkdir -p /var/log/mcpanel
mkdir -p /var/run/mcpanel

# Funkcja startująca agenta
start_agent() {
    if [ -f $PID_FILE ]; then
        PID=$(cat $PID_FILE)
        if ps -p $PID > /dev/null 2>&1; then
            echo "Agent jest już uruchomiony (PID: $PID)"
            return 1
        fi
    fi
    
    echo "Uruchamianie agenta..."
    nohup python3 $AGENT_SCRIPT >> $LOG_FILE 2>&1 &
    AGENT_PID=$!
    echo $AGENT_PID > $PID_FILE
    echo "Agent uruchomiony z PID: $AGENT_PID"
}

# Funkcja zatrzymująca agenta
stop_agent() {
    if [ -f $PID_FILE ]; then
        PID=$(cat $PID_FILE)
        if ps -p $PID > /dev/null 2>&1; then
            echo "Zatrzymywanie agenta (PID: $PID)..."
            kill $PID
            rm -f $PID_FILE
            echo "Agent zatrzymany"
        else
            echo "Agent nie jest uruchomiony"
            rm -f $PID_FILE
        fi
    else
        echo "PID file nie istnieje - agent prawdopodobnie nie jest uruchomiony"
    fi
}

# Funkcja sprawdzająca status
status_agent() {
    if [ -f $PID_FILE ]; then
        PID=$(cat $PID_FILE)
        if ps -p $PID > /dev/null 2>&1; then
            echo "Agent jest uruchomiony (PID: $PID)"
            tail -20 $LOG_FILE
        else
            echo "Agent nie jest uruchomiony (stary PID: $PID)"
            rm -f $PID_FILE
        fi
    else
        echo "Agent nie jest uruchomiony"
    fi
}

# Funkcja restartująca agenta
restart_agent() {
    stop_agent
    sleep 2
    start_agent
}

# Obsługa komend
case "$1" in
    start)
        start_agent
        ;;
    stop)
        stop_agent
        ;;
    restart)
        restart_agent
        ;;
    status)
        status_agent
        ;;
    *)
        echo "Użycie: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
