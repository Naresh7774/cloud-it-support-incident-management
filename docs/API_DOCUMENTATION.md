# REST API Documentation: Cloud IT Support & Incident Management

Base URL: `http://<HOST>/api` (or `/api` locally)

All endpoints returning data follow the standard JSON response format:
```json
{
  "success": true,
  "message": "Optional message",
  "data": { ... }
}
```

---

## 1. System Health & Diagnostics

### `GET /health`
Verifies backend application status, system memory, node runtime, and live MySQL database pool connectivity.

- **Authentication**: None (Public)
- **Status Codes**: `200 OK` (Healthy), `503 Service Unavailable` (Database Degraded)
- **Response**:
```json
{
  "status": "healthy",
  "uptime": 124.5,
  "timestamp": "2026-01-01T12:00:00.000Z",
  "services": {
    "api": { "status": "up" },
    "database": { "status": "connected" }
  },
  "system": {
    "memory": { ... },
    "nodeVersion": "v20.x"
  }
}
```

---

## 2. Authentication & User Management

### `POST /api/auth/register`
Registers a new user account. Defaults to role `user`.
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password@123",
  "role": "user"
}
```
- **Response**: `201 Created` with JWT token and user profile object.

### `POST /api/auth/login`
Authenticates user credentials and issues a JWT token (24-hour expiration).
- **Request Body**:
```json
{
  "email": "admin@cloudsupport.local",
  "password": "Admin@123"
}
```
- **Response**: `200 OK` with token and user object.

### `GET /api/auth/me`
Retrieves the authenticated user's current session profile.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

### `GET /api/users`
Lists all users. Can be filtered by role.
- **Authentication**: `admin` or `engineer` (Engineers can only query `role=engineer` for assignments).
- **Query Parameters**: `role` (`user`, `engineer`, `admin`), `search` (name or email)
- **Response**: `200 OK`

### `PUT /api/users/:id/role`
Updates a user's role.
- **Authentication**: `admin` only
- **Request Body**: `{ "role": "engineer" }`
- **Response**: `200 OK`

---

## 3. Incident & Ticket Management

### `POST /api/tickets`
Creates a new support incident. Automatically calculates SLA deadline based on priority.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "title": "EC2 Instance Kernel Panic in us-east-1a",
  "description": "Production worker node terminated unexpectedly with kernel panic logs.",
  "category": "Cloud/Infrastructure",
  "priority": "Critical"
}
```
- **Response**: `201 Created` with created ticket details.

### `GET /api/tickets`
Lists incidents with optional filters and role-based segregation.
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `status`: `Open`, `Assigned`, `In Progress`, `Resolved`, `Closed`
  - `priority`: `Critical`, `High`, `Medium`, `Low`
  - `category`: Service category
  - `search`: Keyword search across ticket ID, title, description
  - `queue`: `mine` (assigned to requesting engineer), `unassigned` (open pool)
  - `isOverdue`: `true` (filter breached SLA incidents)
  - `limit`: Number of records (default: 50)
  - `offset`: Pagination offset
- **Response**: `200 OK` with tickets array and pagination metadata.

### `GET /api/tickets/:id`
Retrieves a single incident by ID or ticket number (`INC-2026-XXXX`), including associated comments and audit history.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` with `{ ticket, comments, history }`.

### `PUT /api/tickets/:id/status`
Transitions the lifecycle status of an incident.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "status": "Resolved",
  "resolutionNotes": "Scaled Auto Scaling Group minimum size and cleared connection pool."
}
```
- **Rules**:
  - Setting status to `Resolved` requires non-empty `resolutionNotes`.
  - Regular users can only transition their own tickets from `Resolved` to `Closed`.
  - Support engineers and admins can perform all valid transitions.

### `PUT /api/tickets/:id/assign`
Assigns an incident to an engineer.
- **Headers**: `Authorization: Bearer <token>`
- **Authentication**: `admin` (can assign any engineer) or `engineer` (self-assignment)
- **Request Body**: `{ "engineerId": 2 }`
- **Response**: `200 OK`

### `PUT /api/tickets/:id/priority`
Updates priority level and automatically recalculates the SLA deadline from ticket creation timestamp.
- **Headers**: `Authorization: Bearer <token>`
- **Authentication**: `admin` or `engineer`
- **Request Body**: `{ "priority": "Critical" }`
- **Response**: `200 OK`

### `POST /api/tickets/:id/comments`
Adds a collaboration update or inquiry to the incident.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "comment": "Requested additional CloudWatch metric graphs from client.",
  "isInternal": true
}
```
- **Rules**:
  - `isInternal: true` is allowed only for `engineer` and `admin` roles.
  - Internal comments are never returned to standard `user` roles.

---

## 4. SLA Policy & Dashboard Metrics

### `GET /api/sla/configs`
Retrieves the currently configured SLA target thresholds.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` with array of `{ priority, target_minutes, description }`.

### `PUT /api/sla/configs`
Modifies the SLA target duration for a priority level.
- **Authentication**: `admin` only
- **Request Body**:
```json
{
  "priority": "Critical",
  "targetMinutes": 15,
  "description": "Immediate outage escalation"
}
```
- **Response**: `200 OK`

### `GET /api/dashboard/stats`
Retrieves aggregated statistics tailored to the caller's role (total, open, in-progress, resolved, closed, overdue incidents, priority distribution, category breakdown).
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`
