#!/usr/bin/env bash
# ==============================================================================
# AWS EC2 Ubuntu Provisioning Script for Cloud IT Support Platform
# ==============================================================================
set -euo pipefail

echo "===================================================================="
echo " Starting EC2 Instance Provisioning"
echo " OS: Ubuntu Server 22.04 / 24.04 LTS"
echo "===================================================================="

# 1. Update system packages
echo "Updating system package repositories..."
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git unzip gzip jq

# 2. Install Docker CE and Docker Compose Plugin
echo "Installing Docker Engine..."
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable Docker service and grant permissions to ubuntu user
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu

# 3. Install AWS CLI v2 (if not already present)
if ! command -v aws >/dev/null 2>&1; then
    echo "Installing AWS CLI v2..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -q awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
fi

# 4. Create App directory structure
APP_DIR="/home/ubuntu/app"
mkdir -p "$APP_DIR/scripts" "$APP_DIR/nginx" "$APP_DIR/database" "/home/ubuntu/backups/mysql"
chown -R ubuntu:ubuntu "$APP_DIR" "/home/ubuntu/backups"

# 5. Setup automated nightly database backup cron job (at 02:00 UTC daily)
CRON_JOB="0 2 * * * /bin/bash /home/ubuntu/app/scripts/backup.sh >> /home/ubuntu/backups/backup.log 2>&1"
(crontab -l 2>/dev/null | grep -Fv "/home/ubuntu/app/scripts/backup.sh" ; echo "$CRON_JOB") | crontab -

echo "===================================================================="
echo " EC2 Instance Provisioning Complete!"
echo " Docker Version: $(docker --version)"
echo " Docker Compose: $(docker compose version)"
echo " AWS CLI:        $(aws --version)"
echo " Nightly Backup Cron configured."
echo " Note: Please log out and back in for group 'docker' to apply."
echo "===================================================================="
