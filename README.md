# 🏥 Telemedicine & EHR Platform

A secure, cryptographically compliant Telemedicine and Electronic Health Records (EHR) platform built with React, Node.js, MongoDB, and WebRTC.

## 🔐 Security Architecture

- **AES-256** field-level encryption for all PHI (Protected Health Information)
- **JWT** authentication with role-based access control
- **WebRTC** peer-to-peer encrypted video streams
- **Audit Logging** middleware for full compliance trail
- **Zod** schema validation to prevent NoSQL injection & XSS

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Material-UI |
| Backend API | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Video | WebRTC + Socket.io (Signaling) |
| Security | JWT, AES-256, bcrypt |
| PDF Generation | PDFKit + QR Code |
| DevOps | Docker, GitHub Actions |

## 📁 Project Structure

```
Telemedicine/
├── backend/              # Express.js REST API
│   ├── config/           # DB & env configuration
│   ├── controllers/      # Route handlers
│   ├── middleware/        # Auth, audit logging, encryption
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API route definitions
│   └── utils/            # Encryption, token helpers
├── frontend/             # React + TypeScript app
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Route-level pages
│       ├── hooks/        # Custom React hooks
│       ├── services/     # Axios API service layer
│       └── types/        # TypeScript interfaces
├── signaling-server/     # Socket.io WebRTC signaling
├── .github/workflows/    # CI/CD pipelines
├── docs/                 # Architecture documentation
└── docker-compose.yml    # Container orchestration
```

## 🚀 Local Development Setup

### Prerequisites
- Node.js >= 18.x
- MongoDB >= 6.x
- Docker & Docker Compose (optional)

### 1. Clone the repository
```bash
git clone https://github.com/shaikayan2084/Telemedicine.git
cd Telemedicine
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in your environment variables
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. Signaling Server
```bash
cd signaling-server
npm install
npm start
```

### 5. Docker (Full Stack)
```bash
docker-compose up --build
```

## 🔑 Environment Variables

See `backend/.env.example` for all required variables. **Never commit real secrets.**

### Required Variables
```
MONGODB_URI=mongodb://localhost:27017/telemedicine
JWT_SECRET=<strong-random-secret>
AES_ENCRYPTION_KEY=<32-byte-hex-key>
AES_IV=<16-byte-hex-iv>
PORT=5000
```

## 🧪 Running Tests
```bash
cd backend && npm test
cd frontend && npm test
```

## 🔒 Cryptographic Algorithms Used

- **AES-256-CBC** — Field-level encryption of PHI fields in MongoDB
- **bcrypt (rounds: 12)** — Password hashing
- **JWT (HS256)** — Stateless authentication tokens
- **SHA-256** — Prescription integrity hash
- **DTLS (WebRTC built-in)** — Video stream encryption

## 📋 User Roles

| Role | Capabilities |
|------|-------------|
| Patient | Book appointments, view own records, join video calls, download prescriptions |
| Doctor | Manage schedule, view patient history, conduct consultations, issue prescriptions |
| Admin | System management, compliance audit logs, analytics |

## 📅 Development Roadmap

- [x] Week 1: DB schema, AES-256 encryption, JWT auth, audit logging
- [x] Week 2: EHR CRUD APIs, scheduling engine, React frontend
- [x] Week 3: WebRTC signaling, telehealth rooms, room tokens
- [x] Week 4: PDF prescriptions, security audit, Docker deployment

## 📄 License
MIT
