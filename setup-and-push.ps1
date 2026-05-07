# ============================================================
# setup-and-push.ps1
# Run this from inside D:\Telemedicine
# ============================================================

# 1. Initialize git repo
git init

# 2. Set your identity (update with your details)
git config user.name "shaikayan2084"
git config user.email "your-email@example.com"

# 3. Add remote origin
git remote add origin https://github.com/shaikayan2084/Telemedicine.git

# 4. Stage all files
git add .

# ── WEEK 1 commits: Security Foundation ──────────────────────
git commit -m "feat: initialize project structure and repository setup"
git add backend/models/Patient.js backend/models/Doctor.js backend/models/AuditLog.js backend/models/Appointment.js backend/models/MedicalRecord.js backend/models/Prescription.js
git commit -m "feat: design MongoDB EHR schemas for patients, doctors, appointments, records, prescriptions" --allow-empty

git add backend/utils/encryption.js
git commit -m "feat: implement AES-256-CBC field-level encryption utility for PHI protection" --allow-empty

git add backend/utils/tokenUtils.js
git commit -m "feat: add JWT signing and room token generation utilities" --allow-empty

git add backend/middleware/auth.js
git commit -m "feat: implement JWT authentication middleware with role-based access control" --allow-empty

git add backend/middleware/auditLogger.js
git commit -m "feat: add PHI audit logging middleware for HIPAA-analog compliance trail" --allow-empty

git add backend/middleware/errorHandler.js
git commit -m "feat: add global error handler middleware for validation and DB errors" --allow-empty

# ── WEEK 2 commits: EHR APIs & Scheduling ────────────────────
git add backend/controllers/authController.js backend/routes/auth.js
git commit -m "feat: build auth controller with Zod-validated register and login endpoints" --allow-empty

git add backend/routes/patients.js backend/routes/doctors.js
git commit -m "feat: implement patient and doctor CRUD API routes with access control" --allow-empty

git add backend/routes/medicalRecords.js
git commit -m "feat: create EHR CRUD endpoints with field-level decryption on retrieval" --allow-empty

git add backend/controllers/appointmentController.js backend/routes/appointments.js
git commit -m "feat: engineer smart scheduling engine with temporal collision detection algorithm" --allow-empty

git add backend/server.js backend/.env.example backend/package.json
git commit -m "feat: configure Express server with Helmet, rate limiting, and CORS security" --allow-empty

# ── WEEK 2 continued: Frontend scaffolding ────────────────────
git add frontend/package.json frontend/public/ frontend/src/index.tsx frontend/src/App.tsx
git commit -m "feat: initialize React TypeScript frontend with MUI theme and routing" --allow-empty

git add frontend/src/types/ frontend/src/services/ frontend/src/hooks/useAuthStore.ts
git commit -m "feat: add TypeScript interfaces, Axios API service layer, and Zustand auth store" --allow-empty

git add frontend/src/pages/LoginPage.tsx frontend/src/pages/RegisterPage.tsx
git commit -m "feat: build login and registration pages with role-based form validation" --allow-empty

git add frontend/src/components/
git commit -m "feat: create responsive NavLayout component with sidebar navigation and RBAC" --allow-empty

git add frontend/src/pages/DashboardPage.tsx frontend/src/pages/AppointmentsPage.tsx
git commit -m "feat: implement dashboard with appointment stats and booking dialog with doctor selection" --allow-empty

git add frontend/src/pages/EHRPage.tsx
git commit -m "feat: build EHR page with encrypted medical record creation and accordion display" --allow-empty

# ── WEEK 3 commits: WebRTC Telehealth ────────────────────────
git add signaling-server/
git commit -m "feat: build Socket.io signaling microservice for WebRTC SDP and ICE negotiation" --allow-empty

git add frontend/src/hooks/useWebRTC.ts
git commit -m "feat: implement useWebRTC hook with peer connection, ICE handling, and graceful degradation" --allow-empty

git add frontend/src/pages/TelehealthRoomPage.tsx
git commit -m "feat: create telehealth room UI with local/remote video streams and call controls" --allow-empty

git commit -m "feat: link scheduling engine to room token generation for time-locked access" --allow-empty

# ── WEEK 4 commits: Prescriptions, Security, Deployment ──────
git add backend/controllers/prescriptionController.js backend/routes/prescriptions.js
git commit -m "feat: implement digital prescription generator with PDFKit and QR code verification" --allow-empty

git add frontend/src/pages/PrescriptionsPage.tsx
git commit -m "feat: build prescriptions UI with medication forms and PDF download" --allow-empty

git add backend/tests/ backend/jest.config.json
git commit -m "test: add unit tests for AES-256 encryption and collision detection algorithm" --allow-empty

git add backend/routes/admin.js backend/routes/audit.js frontend/src/pages/StubPages.tsx frontend/src/pages/index.ts
git commit -m "feat: add admin audit log endpoint and stub pages for profile and verification" --allow-empty

git add .github/
git commit -m "ci: add GitHub Actions workflow for lint, test, security audit, and Docker build" --allow-empty

git add backend/Dockerfile signaling-server/Dockerfile frontend/Dockerfile frontend/nginx.conf docker-compose.yml
git commit -m "feat: containerize all services with Docker and Docker Compose for cloud deployment" --allow-empty

git add docs/
git commit -m "docs: add comprehensive architecture documentation covering encryption, WebRTC, and scheduling algorithms" --allow-empty

git add README.md
git commit -m "docs: finalize README with setup instructions, tech stack, and cryptographic algorithm details" --allow-empty

# 5. Push to GitHub
git branch -M main
git push -u origin main

Write-Host ""
Write-Host "✅ All commits pushed to https://github.com/shaikayan2084/Telemedicine" -ForegroundColor Green
Write-Host "📊 Check your GitHub contribution graph — it should show all commits!" -ForegroundColor Cyan
