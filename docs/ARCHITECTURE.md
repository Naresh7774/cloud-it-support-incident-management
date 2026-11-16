# Architecture Overview: Cloud IT Support & Incident Management System

## 1. System Architecture

The **Cloud IT Support & Incident Management System** is built on a containerized multi-tier architecture designed for high availability, security, and maintainability on AWS EC2.

```mermaid
flowchart TD
    subgraph Client["End Users & Support Staff"]
        Browser["Modern Web Browser (React 18 SPA)"]
    end

    subgraph Host["AWS EC2 Host (Ubuntu Linux)"]
        subgraph Gateway["Edge Tier"]
            Nginx["Nginx Reverse Proxy (:80 / :443)\n- Gzip & Rate Limiting\n- Security Headers (CSP, HSTS)\n- SSL Termination"]
        end

        subgraph ContainerTier["Application Tier (Docker Compose)"]
            Frontend["Frontend Service (:80)\n- Nginx Static Asset Server\n- Client SPA Routing"]
            Backend["Backend Service (:5000)\n- Express.js REST API\n- JWT & Role Authorization\n- SLA Engine & Audit Logger\n- Winston Structured Logs"]
        end

        subgraph DataTier["Data Tier"]
            MySQL[("MySQL 8.0 Database (:3306)\n- Named Persistent Volume (mysql_data)\n- Parameterized Queries\n- InnoDB UTF8mb4")]
        end

        subgraph MonitoringTier["Host Agent Tier"]
            CWAgent["Amazon CloudWatch Agent\n- Gathers log files & container metrics\n- Streams to CloudWatch Logs"]
        end
    end

    subgraph AWSCloud["AWS Managed Services"]
        ECR["Amazon ECR\n- Private Container Registries"]
        CloudWatch["Amazon CloudWatch\n- Log Groups & Alarms\n- CPU/Memory Metrics"]
    end

    subgraph CICD["GitHub Actions CI/CD"]
        GHA["GitHub Actions Runner\n- OIDC Authentication\n- Docker Buildx & Push\n- Automated SSH Deploy"]
    end

    Browser -->|HTTP/HTTPS Requests| Nginx
    Nginx -->|Proxy / | Frontend
    Nginx -->|Proxy /api and /health| Backend
    Backend -->|Internal SQL Pool (TCP)| MySQL
    Backend -->|Direct Event Stream (SDK)| CloudWatch
    CWAgent -->|Collects /var/log & volumes| CloudWatch
    GHA -->|OIDC Token Exchange| AWSCloud
    GHA -->|Push Images| ECR
    GHA -->|SSH Deploy Command| Host
```

---

## 2. Request Flow & Security Architecture

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Engineer / Admin
    participant Nginx as Gateway Nginx (:80)
    participant Backend as Express Backend (:5000)
    participant DB as MySQL Database
    participant CW as AWS CloudWatch

    User->>Nginx: POST /api/auth/login
    Nginx->>Backend: Proxy Request with X-Real-IP
    Backend->>DB: Query user by parameterized email
    DB-->>Backend: Return user record & bcrypt hash
    Backend->>Backend: Verify password with bcrypt.compare()
    Backend->>CW: Log USER_LOGIN event
    Backend-->>User: Return signed JWT Token (24h expiry)

    Note over User,Backend: Subsequent requests include Authorization: Bearer <token>

    User->>Nginx: POST /api/tickets (Raise Incident)
    Nginx->>Backend: Forward with Bearer token
    Backend->>Backend: Validate token & check role permissions
    Backend->>Backend: Calculate SLA deadline from sla_configs
    Backend->>DB: INSERT into tickets table
    Backend->>DB: INSERT into ticket_history (Audit log)
    Backend->>CW: Log TICKET_CREATED event
    Backend-->>User: 201 Created with Ticket Details & SLA Countdown
```

---

## 3. Relational Database Schema (ERD)

```mermaid
erDiagram
    users ||--o{ tickets : "creates"
    users ||--o{ tickets : "assigned to"
    users ||--o{ ticket_comments : "writes"
    users ||--o{ ticket_history : "performs"
    tickets ||--o{ ticket_comments : "contains"
    tickets ||--o{ ticket_history : "tracks"
    sla_configs ||--o{ tickets : "governs SLA for"

    users {
        int id PK
        varchar name
        varchar email UK
        varchar password_hash
        enum role "user, engineer, admin"
        timestamp created_at
        timestamp updated_at
    }

    sla_configs {
        int id PK
        enum priority UK "Critical, High, Medium, Low"
        int target_minutes
        varchar description
        timestamp updated_at
    }

    tickets {
        int id PK
        varchar ticket_number UK
        varchar title
        text description
        varchar category
        enum priority "Critical, High, Medium, Low"
        enum status "Open, Assigned, In Progress, Resolved, Closed"
        int created_by FK
        int assigned_to FK
        datetime sla_deadline
        boolean is_overdue
        text resolution_notes
        datetime resolved_at
        datetime closed_at
        timestamp created_at
        timestamp updated_at
    }

    ticket_comments {
        int id PK
        int ticket_id FK
        int user_id FK
        text comment
        boolean is_internal
        timestamp created_at
    }

    ticket_history {
        int id PK
        int ticket_id FK
        int user_id FK
        varchar action
        varchar old_value
        varchar new_value
        text notes
        timestamp created_at
    }
```

---

## 4. Key Design Decisions

1. **Role-Based Access Control (RBAC)**:
   - Three segregated tiers: `user` (end-user), `engineer` (technical support), and `admin` (management).
   - Middleware enforces authorization on every API endpoint.
   - Internal notes on tickets are strictly sanitized and never returned to standard end-users.

2. **Configurable Dynamic SLA Engine**:
   - Rather than hardcoding SLA windows, values are sourced from `sla_configs` table in MySQL and cached in-memory with TTL.
   - When administrators update policies, cache is automatically invalidated.
   - Overdue status is computed dynamically in SQL (`NOW() > sla_deadline`) preventing stale boolean flags.

3. **Production Containerization**:
   - MySQL data is stored in named persistent volume `mysql_data`, ensuring zero data loss across container recreations.
   - Database port 3306 is isolated within Docker private bridge network `app-network` and is never exposed to the host network.
   - Gateway Nginx provides unified entry point on port 80, handling SPA client-side routing fallback and API proxying.

4. **Zero-Secret CI/CD with AWS OIDC**:
   - GitHub Actions connects to AWS using OpenID Connect (OIDC) federated role assumption, eliminating permanent AWS access keys in GitHub Secrets.
