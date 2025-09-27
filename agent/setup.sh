#!/bin/bash

# Configuration
AGENT_DIR="/opt/mcpanel-agent"
CONFIG_DIR="/etc/mcpanel-agent"
SERVICE_FILE="mcpanel-agent.service"
SERVICE_NAME="mcpanel-agent"
PYTHON_SCRIPT="agent.py"

# Check for root privileges
if [ "$EUID" -ne 0 ]; then
  echo "This script must be run as root."
  exit 1
fi

# Function to install the agent
install() {
    echo "Installing MCPanel Agent..."
    
    # Create directories
    mkdir -p $AGENT_DIR
    mkdir -p $CONFIG_DIR
    
    # Copy agent files
    cp $PYTHON_SCRIPT $AGENT_DIR/
    cp $SERVICE_FILE /etc/systemd/system/
    
    # Create default configuration file
    if [ ! -f $CONFIG_DIR/config ]; then
        echo "Creating default configuration file..."
        echo "PANEL_URL=http://your-panel-url.com" > $CONFIG_DIR/config
        echo "AGENT_TOKEN=your-secret-token" >> $CONFIG_DIR/config
        echo "AGENT_NAME=$(hostname)" >> $CONFIG_DIR/config
        echo "AGENT_CAPACITY=5" >> $CONFIG_DIR/config
        echo "AGENT_PORT=8080" >> $CONFIG_DIR/config
        echo "AGENT_BASE_PATH=/opt/mcpanel-agent/servers" >> $CONFIG_DIR/config
        echo "Please edit $CONFIG_DIR/config with your panel details."
    fi
    
    # Reload systemd, enable and start the service
    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    systemctl start $SERVICE_NAME
    
    echo "MCPanel Agent installed and started successfully."
    echo "To check the status, run: systemctl status $SERVICE_NAME"
    echo "To see logs, run: journalctl -u $SERVICE_NAME -f"
}

# Function to uninstall the agent
uninstall() {
    echo "Uninstalling MCPanel Agent..."
    
    # Stop and disable the service
    systemctl stop $SERVICE_NAME
    systemctl disable $SERVICE_NAME
    
    # Remove files
    rm /etc/systemd/system/$SERVICE_FILE
    rm -rf $AGENT_DIR
    rm -rf $CONFIG_DIR
    
    # Reload systemd
    systemctl daemon-reload
    
    echo "MCPanel Agent uninstalled successfully."
}

# Function to display status
status() {
    systemctl status $SERVICE_NAME
}

# Function to restart the service
restart() {
    systemctl restart $SERVICE_NAME
    echo "MCPanel Agent restarted."
}

# Command-line argument handling
case "$1" in
    install)
        install
        ;;
    uninstall)
        uninstall
        ;;
    status)
        status
        ;;
    restart)
        restart
        ;;
    *)
        echo "Usage: $0 {install|uninstall|status|restart}"
        exit 1
        ;;
esac

exit 0