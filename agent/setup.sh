#!/bin/bash

# Configuration
AGENT_DIR="/opt/mcpanel-agent"
CONFIG_DIR="/etc/mcpanel-agent"
SERVICE_FILE="mcpanel-agent.service"
SERVICE_NAME="mcpanel-agent"
PYTHON_SCRIPT="agent.py"

# Check for root privileges
if [ "$(id -u)" -ne 0 ]; then
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
    # The service file is now expected to be in the same directory as the setup script
    cp $SERVICE_FILE /etc/systemd/system/

    # Interactive configuration setup
    echo "--- Agent Configuration ---"
    read -p "Enter Panel URL: " PANEL_URL
    read -p "Enter Agent Token: " AGENT_TOKEN
    read -p "Enter Agent Name [$(hostname)]: " AGENT_NAME
    AGENT_NAME=${AGENT_NAME:-$(hostname)}
    read -p "Enter Max Servers (Capacity) [5]: " AGENT_CAPACITY
    AGENT_CAPACITY=${AGENT_CAPACITY:-5}

    # Create configuration file
    echo "Creating configuration file at $CONFIG_DIR/config..."
    cat > $CONFIG_DIR/config <<EOF
PANEL_URL=${PANEL_URL}
AGENT_TOKEN=${AGENT_TOKEN}
AGENT_NAME=${AGENT_NAME}
AGENT_CAPACITY=${AGENT_CAPACITY}
AGENT_PORT=9292
AGENT_BASE_PATH=/opt/mcpanel-agent/servers
EOF

    # Reload systemd, enable and start the service
    echo "Reloading systemd daemon..."
    systemctl daemon-reload
    echo "Enabling and starting the MCPanel Agent service..."
    systemctl enable $SERVICE_NAME
    systemctl start $SERVICE_NAME

    echo ""
    echo "MCPanel Agent installed and started successfully!"
    echo "------------------------------------------------"
    echo "To check the status, run: systemctl status $SERVICE_NAME"
    echo "To see logs, run: journalctl -u $SERVICE_NAME -f"
    echo "Configuration is saved in: $CONFIG_DIR/config"
}

# Function to uninstall the agent
uninstall() {
    echo "Uninstalling MCPanel Agent..."

    # Stop and disable the service
    systemctl stop $SERVICE_NAME
    systemctl disable $SERVICE_NAME

    # Remove files
    rm -f /etc/systemd/system/$SERVICE_FILE
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
    echo "Restarting MCPanel Agent..."
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