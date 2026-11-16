#!/usr/bin/env bash
# ==============================================================================
# Amazon CloudWatch Agent Installation & Configuration Script
# ==============================================================================
set -euo pipefail

echo "===================================================================="
echo " Installing and Configuring Amazon CloudWatch Agent"
echo "===================================================================="

# 1. Download and install Amazon CloudWatch Agent deb package
echo "Downloading CloudWatch agent package..."
wget -q https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
rm -f ./amazon-cloudwatch-agent.deb

# 2. Deploy CloudWatch Agent configuration
CONFIG_PATH="/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json"
echo "Deploying configuration to $CONFIG_PATH..."
sudo cp "$(dirname "$0")/amazon-cloudwatch-agent.json" "$CONFIG_PATH"

# 3. Start and enable CloudWatch Agent service
echo "Starting CloudWatch Agent..."
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:"$CONFIG_PATH"

echo "Checking agent status..."
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a status

echo "===================================================================="
echo " CloudWatch Agent successfully installed and operational!"
echo "===================================================================="
