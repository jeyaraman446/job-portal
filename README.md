# Smart Job Portal with Resume Matching (MERN Stack)

A complete, production-grade **MERN Stack Job Portal** designed to solve recruiter screening fatigue and candidate qualification mismatch through multi-variable candidate scoring, enterprise company verification with official business ID proof, corporate email validation, and strict duplicate-application prevention.

---

## 🚀 Key Highlights & Architecture

### 1. 🔐 Email OTP Verification & Forgot Password Recovery
- **6-Digit One-Time Passcode (OTP)**: Every new registration (both HR recruiters and candidate job seekers) generates and dispatches an authentic 6-digit OTP code to the user's email address.
- **Enterprise HTML Email Templates**: Responsive, branded email layouts with security alerts, role badges, and clear 10-minute expiration countdowns.
- **Dedicated Split-Input OTP Screen**: 6-digit auto-advancing input boxes, keyboard backspace handling, clipboard paste support, and 60-second resend cooldown timer.
- **Self-Service Forgot Password Wizard**: Multi-step flow allowing users to verify ownership with an OTP and set a new password, complete with a real-time password strength meter.
- **Developer/Demo Test Preview Helper**: Automatically exposes a "Dev/Local Preview OTP" badge with a 1-click "Auto-fill Code" button during development/testing so evaluations can be performed without requiring a live external SMTP mailbox.

### 2. 🛡️ Company Verification & Anti-Fraud Security
- **Corporate Work Email Required (`company@mail.com`)**: Recruiters and HR managers cannot register with personal public webmail (e.g. `@gmail.com`, `@yahoo.com`, `@hotmail.com`, `@outlook.com`). Only legitimate custom corporate domains are permitted.
- **Valid Company ID Proof Upload**: Employers submit official legal documents (Certificate of Incorporation, Tax Registration / EIN / GSTIN, Commercial Business License, or Corporate ID Badge).
- **Company Verification Workflow**:
  - `Verified Employer ✓`: Verified badge displayed across all job vacancy listings, establishing high trust with candidates.
  - `Pending Verification ⏳`: Displayed while business documents are queued for compliance review.
  - One-click admin simulation review button built directly into the HR dashboard for easy demonstration and evaluation.

### 2. 🎯 Intelligent Multi-Factor Matching Algorithm (out of 100)
- **Required Skills (40 pts)**: Exact and normalized synonym matching against job-critical requirements (e.g., `React.js` ↔ `React`, `Node.js` ↔ `Node`).
- **Preferred Skills (15 pts)**: Bonus weight for nice-to-have capabilities.
- **Projects Built (15 pts)**: Evaluates project portfolio relevance to job skills + live GitHub/demo links.
- **Full-Time Experience (8 pts)**: Evaluates years of full-time professional industry experience against `minExperience`.
- **Internships Attended (7 pts)**: Evaluates practical internships and relevant tech stack exposure.
- **Hackathons Attended & Won (10 pts)**: Rewards participation, podium finishes (`Winner`, `Finalist`, `Top 3`), and tech used.
- **Competitive Exams & Problem Solving (5 pts)**: Evaluates ranks and scores in GATE, LeetCode, Codeforces, JEE, CAT, etc.

### 3. 🚫 Strict Duplicate Application Protection
- **UI Level**: Immediate reactive feedback, disabling buttons and displaying submission badges.
- **Controller Level**: Pre-query checks preventing re-application (`409 Conflict`).
- **Database Index Level**:
  - `applicationSchema.index({ job: 1, applicant: 1 }, { unique: true })` — guarantees single-candidate constraint at the database storage engine.
  - `applicationSchema.index({ job: 1, resumeHash: 1 }, { unique: true, sparse: true })` — guarantees the exact same resume document cannot be submitted twice to the same job.

### 4. 🏢 HR & Employer Portal
- Register verified company profile with Tax ID and upload business verification proof.
- Post vacancies with required/preferred skills, job types (Full-time, Internship, Remote), experience, vacancies, and salary.
- Real-time ranked candidates list sorted by smart match score descending.
- Candidate inspection modal with match breakdown bars, portfolio links, internships, hackathon achievements, and **direct PDF resume viewer**.
- Review decisions: Update candidate status (`Applied` → `Shortlisted` → `Interview` → `Hired` / `Rejected`) with private review notes and feedback.

### 5. 👤 Job Seeker Experience
- Register with valid email address to receive real-time updates.
- Dynamic job search with filters for keywords, location, job type, and minimum match score slider.
- Verified Employer badges highlighting authenticated companies.
- Interactive profile manager: add skills, internships, projects, hackathons, and competitive exams.
- PDF resume uploader with instant skill extraction parser.
- **My Applications** dashboard to monitor review progress, match breakdowns, and hiring feedback in real time.

---

## 🏃 Quick Start Guide

### Prerequisites
- Node.js 18+ (tested on Node v22)
- MongoDB running locally on port 27017 (or MongoDB Atlas URI)

### 1. Launch with Unified Dev Runner (Single Command)
From the project root directory:
```bash
npm run dev
```
Starts both:
- **Backend API Server**: `http://localhost:5001`
- **Frontend Web Portal**: `http://localhost:5173`

*(Alternatively, Express serves the compiled frontend directly at `http://localhost:5001`)*

### 2. Seed Database with Verified Company & Candidates
```bash
npm run seed
```

### 3. Run Automated Integration Test Suite
```bash
npm test
```
Verifies:
- Corporate email check for HR (`isCompanyEmail`) vs candidate email validation
- Company business ID proof and verification schema
- Skill matcher algorithm calculations
- Database duplicate application constraints (E11000 key conflict)
- HR candidate ranking order
- Application status updates and feedback persistence

---

## 🔑 Pre-Seeded Demo Accounts (One-Click Login available on UI)

| Role | Email | Password | Details |
|---|---|---|---|
| **HR / Recruiter** | `hr@techcorp.com` | `password123` | HR Director at TechCorp Solutions (Verified Employer with ID Proof) |
| **Senior Candidate** | `arun@example.com` | `password123` | Senior MERN Dev (GATE CS #142, Hackathon Winner, 3.5 yrs exp) |
| **Frontend Candidate**| `priya@example.com`| `password123` | UI/UX Specialist (Hackathon Best Design, 2 yrs exp) |
| **Junior Candidate** | `vikram@example.com`| `password123` | CS Graduate (Codeforces Expert, SDE Intern, Projects) |
