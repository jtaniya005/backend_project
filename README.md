# TaskFlow — Scalable REST API with Auth & RBAC

A production-grade backend API built with **Node.js + Express + MongoDB**, featuring JWT authentication, role-based access control, full CRUD, Swagger docs, and a React frontend.

---

## 🛠 Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Runtime   | Node.js 20 + Express 4                 |
| Database  | MongoDB (Mongoose ODM)                  |
| Auth      | JWT (access + refresh tokens)           |
| Frontend  | React 18 + Vite                         |
| Docs      | Swagger UI (OpenAPI 3.0) + Postman      |
| Docker    | Docker Compose                          |
| Security  | Helmet, bcryptjs, express-rate-limit    |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (or Docker)

### 1. Clone & install

```bash
git clone <your-repo-url>
cd project

# Backend
cd backend
cp .env.example .env   # edit secrets
npm install
npm run dev

# Frontend (in a new terminal)
cd ../frontend
npm install
npm run dev
```

### 2. Access
- **Frontend:** http://localhost:3000
- **API:** http://localhost:5000/api/v1
- **Swagger Docs:** http://localhost:5000/api-docs

### 3. Docker (all-in-one)

```bash
docker-compose up --build
```

---

## 📁 Project Structure

```
project/
├── backend/
│   ├── src/
│   │   ├── config/        # DB, Swagger configs
│   │   ├── controllers/   # Business logic
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API route definitions
│   │   └── utils/         # JWT helpers, response utils
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Full React app (auth + dashboard)
│   │   └── main.jsx
│   ├── Dockerfile
│   └── vite.config.js
├── docker-compose.yml
└── TaskFlow_API.postman_collection.json
```

---

## 🔑 API Endpoints (v1)

### Auth  `/api/v1/auth`
| Method | Endpoint   | Description         | Auth |
|--------|------------|---------------------|------|
| POST   | /register  | Register user        | ❌   |
| POST   | /login     | Login + get tokens   | ❌   |
| POST   | /refresh   | Refresh access token | ❌   |
| POST   | /logout    | Invalidate tokens    | ✅   |
| GET    | /me        | Get own profile      | ✅   |

### Tasks  `/api/v1/tasks`
| Method | Endpoint | Description              | Auth |
|--------|----------|--------------------------|------|
| GET    | /        | List tasks (paginated)   | ✅   |
| GET    | /:id     | Get task by ID           | ✅   |
| POST   | /        | Create task              | ✅   |
| PUT    | /:id     | Update task              | ✅   |
| DELETE | /:id     | Delete task              | ✅   |

### Admin  `/api/v1/admin`  *(admin role required)*
| Method | Endpoint          | Description        |
|--------|-------------------|--------------------|
| GET    | /stats            | Platform stats     |
| GET    | /users            | All users          |
| PATCH  | /users/:id/role   | Update user role   |
| DELETE | /users/:id        | Delete user        |

---

## 🔐 Authentication Flow

```
Register / Login
       │
       ▼
  Server validates → hashes password → issues:
    ├── accessToken  (15 min, JWT)
    └── refreshToken (7 days, JWT, stored in DB)

Protected request:
  Authorization: Bearer <accessToken>

Token expired?
  POST /auth/refresh  →  new accessToken
```

---

## 🗄 Database Schema

### User
```
_id, name, email (unique), password (hashed),
role (user|admin), isActive, refreshToken, timestamps
```

### Task
```
_id, title, description, status (pending|in-progress|completed),
priority (low|medium|high), owner (ref:User),
dueDate, tags[], timestamps
```
Indexes: `(owner, status)`, `(owner, createdAt)`

---

## 🛡 Security Measures

- **bcryptjs** (salt rounds: 12) for password hashing
- **Short-lived JWTs** (15 min access / 7 day refresh)
- **Refresh token rotation** — new refresh token issued on each refresh
- **Helmet** sets secure HTTP headers
- **Rate limiting** — 100 req/15min globally; 10 req/15min on auth routes
- **Input sanitization** via express-validator (trim, normalizeEmail)
- **Role-based access** enforced at middleware level
- **Passwords never returned** in API responses (`select: false`)

---

## 📈 Scalability Note

### Current Architecture
Single-server Node.js + MongoDB with optimized indexes and connection pooling.

### Path to Scale

**Horizontal scaling:**
- Stateless JWT auth → deploy multiple Node.js instances behind an **Nginx load balancer** or **AWS ALB** with zero session sharing needed
- MongoDB **Replica Sets** for high availability and read scaling

**Caching (Redis):**
- Cache frequently read endpoints (`/admin/stats`, task lists) with TTL
- Store rate-limit counters in Redis for cross-instance enforcement

**Microservices (future):**
- Split into `auth-service`, `task-service`, `notification-service`
- Communicate via **message queue** (RabbitMQ / AWS SQS) for async tasks
- API Gateway (Kong / AWS API Gateway) routes traffic per service

**Performance:**
- MongoDB indexes on `(owner, status)` and `(owner, createdAt)` reduce query time from O(n) to O(log n)
- Pagination prevents unbounded response sizes
- `express-validator` rejects malformed input before hitting the DB

**Observability:**
- Add **Winston** structured logging + **Morgan** HTTP logs (already included)
- Plug in **Prometheus** metrics endpoint + **Grafana** dashboard
- **Sentry** for error tracking

---

## 📚 API Documentation

Import `TaskFlow_API.postman_collection.json` into Postman, or visit `/api-docs` for interactive Swagger UI.

---

## 👤 Default Admin Setup

After starting the app, manually promote a user to admin via MongoDB:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

Or use the admin endpoint if you already have an admin account.
