# AWS EC2 & CloudWatch Deployment Guide

This document outlines the step-by-step production deployment procedure for the **Cloud IT Support & Incident Management System** on AWS EC2 with GitHub Actions CI/CD and Amazon CloudWatch monitoring.

---

## 1. Required AWS Resources Overview

| Resource | Service | Purpose |
| :--- | :--- | :--- |
| **EC2 Instance** | Amazon EC2 | Hosts Docker Compose (Nginx, React Frontend, Express Backend, MySQL) |
| **Security Group** | Amazon VPC | Firewall rules allowing HTTP (80), HTTPS (443), and SSH (22) |
| **IAM Instance Profile** | AWS IAM | Grants EC2 permissions to push logs to CloudWatch and pull images from ECR |
| **ECR Repositories** | Amazon ECR | Private Docker registries for `cloud-incident-backend` and `cloud-incident-frontend` |
| **IAM OIDC Role** | AWS IAM | Secure passwordless authentication for GitHub Actions CI/CD to push to ECR |
| **CloudWatch Log Group** | Amazon CloudWatch | Centralized application audit and error logs (`/aws/ec2/cloud-incident-management`) |

---

## 2. Step 1: Create IAM Role for EC2 Instance Profile

### Why it is needed:
Allows the EC2 instance to pull images from Amazon ECR and send logs to Amazon CloudWatch without storing long-lived AWS access keys on the server filesystem.

### Instructions:
1. In the **AWS Management Console**, navigate to **IAM** &rarr; **Roles** &rarr; click **Create role**.
2. Select **AWS service** as the trusted entity type, and choose **EC2** as the use case. Click **Next**.
3. Under **Add permissions**, search and attach:
   - `CloudWatchAgentServerPolicy` (Allows CloudWatch agent to write metrics and logs)
   - `AmazonEC2ContainerRegistryReadOnly` (Allows Docker on EC2 to pull images from ECR)
4. Click **Next**. Name the role `EC2-CloudIncidentApp-Role`.
5. Click **Create role**.

---

## 3. Step 2: Create Amazon ECR Private Repositories

### Instructions:
1. Navigate to **Amazon ECR** &rarr; **Repositories** &rarr; click **Create repository**.
2. Set visibility to **Private**.
3. Repository name: `cloud-incident-backend`. Click **Create repository**.
4. Repeat to create a second private repository named: `cloud-incident-frontend`.
5. Note your **ECR Registry URI** (e.g., `123456789012.dkr.ecr.us-east-1.amazonaws.com`).

---

## 4. Step 3: Launch Ubuntu EC2 Instance

### Instructions:
1. Navigate to **EC2** &rarr; **Instances** &rarr; click **Launch instances**.
2. **Name**: `cloud-incident-management-prod`.
3. **AMI**: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type (64-bit x86).
4. **Instance type**: `t3.small` or `t3.medium` (recommended: minimum 2 GB RAM for Docker Compose).
5. **Key pair**: Select or generate a key pair (e.g. `cloud-incident-key.pem`). Save the `.pem` file securely on your computer.
6. **Network settings** &rarr; Configure **Security Group**:
   - Inbound Rule 1: Type **HTTP**, Port **80**, Source **0.0.0.0/0** (or your corporate CIDR).
   - Inbound Rule 2: Type **HTTPS**, Port **443**, Source **0.0.0.0/0**.
   - Inbound Rule 3: Type **SSH**, Port **22**, Source **My IP** (strictly restrict SSH to your IP).
7. **Configure Storage**: 20 GiB or 30 GiB gp3 root volume.
8. **Advanced details**:
   - Under **IAM instance profile**, select `EC2-CloudIncidentApp-Role`.
9. Click **Launch instance**.
10. Note the **Public IPv4 address** assigned to the instance.

---

## 5. Step 4: Provision the EC2 Instance

Connect to your EC2 instance via SSH:
```bash
ssh -i /path/to/cloud-incident-key.pem ubuntu@<EC2_PUBLIC_IP>
```

Run the automated provisioning script to install Docker, Docker Compose, AWS CLI, and backup cron:
```bash
# Clone the repository or copy the scripts directory:
git clone https://github.com/<YOUR_GITHUB_ORG_OR_USER>/cloud-incident-management.git ~/app
cd ~/app
chmod +x scripts/*.sh cloudwatch/*.sh
./scripts/setup-ec2.sh
```

---

## 6. Step 5: Configure GitHub Actions OIDC Authentication

GitHub Actions OIDC allows GitHub to assume an IAM role directly using cryptographic token exchange without storing AWS keys in GitHub.

### 1. Add GitHub as Identity Provider in IAM:
1. Navigate to **IAM** &rarr; **Identity providers** &rarr; click **Add provider**.
2. Select **OpenID Connect**.
3. Provider URL: `https://token.actions.githubusercontent.com`
4. Audience: `sts.amazonaws.com`
5. Click **Add provider**.

### 2. Create IAM Role for GitHub Actions:
1. In IAM &rarr; **Roles** &rarr; click **Create role**.
2. Select **Web identity**.
3. Identity provider: `token.actions.githubusercontent.com`.
4. Audience: `sts.amazonaws.com`.
5. GitHub organization: Your GitHub username or organization.
6. Repository: `cloud-incident-management`.
7. Click **Next**.
8. Create an inline policy allowing ECR push:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    }
  ]
}
```
9. Name the role: `GitHubActions-ECR-Deploy-Role`. Note the **Role ARN** (e.g. `arn:aws:iam::123456789012:role/GitHubActions-ECR-Deploy-Role`).

---

## 7. Step 6: Configure GitHub Repository Secrets

In your GitHub repository, navigate to **Settings** &rarr; **Secrets and variables** &rarr; **Actions** &rarr; click **New repository secret**:

| Secret Name | Value Description | Example |
| :--- | :--- | :--- |
| `AWS_OIDC_ROLE_ARN` | The ARN of the GitHub Actions IAM Role | `arn:aws:iam::123456789012:role/GitHubActions-ECR-Deploy-Role` |
| `AWS_REGION` | AWS Region where resources are deployed | `us-east-1` |
| `EC2_HOST` | Public IPv4 address or DNS of your EC2 instance | `54.210.xx.xx` |
| `EC2_USER` | Default username for the Ubuntu instance | `ubuntu` |
| `EC2_SSH_KEY` | Entire contents of your private SSH key (`.pem` file) | `-----BEGIN RSA PRIVATE KEY-----...` |
| `ECR_BACKEND_REPO` | Name of backend ECR repository | `cloud-incident-backend` |
| `ECR_FRONTEND_REPO` | Name of frontend ECR repository | `cloud-incident-frontend` |

---

## 8. Step 7: Application Verification & Health Probing

Once deployed, verify the system from your local terminal or browser:

1. **Check System Health**:
   ```bash
   curl -i http://<EC2_PUBLIC_IP>/health
   ```
   Expected response: `200 OK` with `"status": "healthy"`, `"database": {"status": "connected"}`.

2. **Access Web Application**:
   Open `http://<EC2_PUBLIC_IP>` in your browser.
   - Sign in as Admin: `admin@cloudsupport.local` / `Admin@123`
   - Sign in as Engineer: `engineer@cloudsupport.local` / `Engineer@123`
   - Sign in as User: `user@cloudsupport.local` / `User@123`

3. **Verify CloudWatch Logs**:
   - In AWS Console, go to **CloudWatch** &rarr; **Logs** &rarr; **Log groups**.
   - Check `/aws/ec2/cloud-incident-management/backend-combined`.
   - Confirm structured JSON log records for `APPLICATION_STARTUP`, `USER_LOGIN`, and `TICKET_CREATED`.
