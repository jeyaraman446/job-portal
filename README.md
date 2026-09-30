# Smart Job Portal with Resume Matching (MERN Stack)

A complete, production-grade **MERN Stack Job Portal** designed to solve recruiter screening fatigue and candidate qualification mismatch through multi-variable candidate scoring and strict duplicate-application prevention.

---

## 🚀 Key Highlights & Architecture

1. **Intelligent Multi-Factor Matching Algorithm (out of 100)**:
   - **Required Skills (40 pts)**: Exact and normalized synonym matching against job-critical requirements.
   - **Preferred Skills (15 pts)**: Bonus weight for having nice-to-have capabilities.
   - **Projects Built (15 pts)**: Evaluates project portfolio relevance to job skills + live GitHub/demo links.
   - **Full-Time Experience (8 pts)**: Evaluates years of full-time professional industry experience.
   - **Internships Attended (7 pts)**: Evaluates practical internships and relevant tech stack exposure.
   - **Hackathons Attended & Won (10 pts)**: Rewards participation, podium finishes (1st, 2nd, 3rd, Finalist), and tech used.
   - **Competitive Exams & Problem Solving (5 pts)**: Evaluates ranks and scores in GATE, LeetCode, Codeforces, JEE, etc.

2. **Strict Duplicate Application Protection**:
   - **UI Level**: Direct reactive feedback, disabling buttons and displaying submission badges.
   - **Controller Level**: Pre-query checks preventing re-application (`409 Conflict`).
   - **Database Index Level**:
     - `applicationSchema.index({ job: 1, applicant: 1 }, { unique: true })` — guarantees one application per candidate per job.
     - `applicationSchema.index({ job: 1, resumeHash: 1 }, { unique: true, sparse: true })` — guarantees the exact same resume document cannot be submitted twice to the same job.

3. **HR / Recruiter Portal**:
   - Register company organization profile and manage vacancies.
   - Post vacancies with required/preferred skills, job types (Full-time, Internship, Remote), experience, vacancies, and salary.
   - Real-time ranked candidates list sorted by smart match score descending.
   - Candidate inspection modal with match breakdown bars, portfolio links, internships, hackathon achievements, and **direct PDF resume viewer**.
   - Review decisions: Update candidate status (`Applied` → `Shortlisted` → `Interview` → `Hired` / `Rejected`) with private review notes and feedback.

4. **Job Seeker Portal**:
   - Dynamic job search with filters for keywords, location, job type, and minimum match score slider.
   - Interactive profile manager: add skills, internships, projects, hackathons, and competitive exams.
   - PDF resume uploader with instant skill extraction parser.
   - **My Applications** dashboard to monitor review progress, match breakdowns, and hiring feedback in real time.

---

## 🏃 Quick Start Guide

### Prerequisites
- Node.js 18+ (tested on Node v22)
- MongoDB running locally on port 27017 (or MongoDB Atlas URI)

### 1. Backend Server Setup
```bash
cd server
npm install
npm run seed      # Seeds demo company, jobs, and candidates with match scores
npm run dev       # Starts API server on http://localhost:5001
```

### 2. Frontend Client Setup
In a new terminal window:
```bash
cd client
npm install
npm run dev       # Starts Vite dev server on http://localhost:5173
```

Access the application in your browser at: **`http://localhost:5173`**

---

## 🔑 Pre-Seeded Demo Accounts (One-Click Login available on UI)

| Role | Email | Password | Details |
|---|---|---|---|
| **HR / Recruiter** | `hr@techcorp.com` | `password123` | HR Director at TechCorp Solutions with 3 vacancies posted |
| **Senior Candidate** | `arun@example.com` | `password123` | Senior MERN Dev (GATE CS #142, Hackathon Winner, 3.5 yrs exp) |
| **Frontend Candidate**| `priya@example.com`| `password123` | UI/UX & React Specialist (Hackathon Best Design, 2 yrs exp) |
| **Junior Candidate**  | `vikram@example.com`| `password123` | CS Graduate (Codeforces Expert, SDE Intern, Projects) |

---

## 🧪 Automated Testing
Run the comprehensive integration test suite:
```bash
cd server
npm test
```
Verifies:
- Skill matcher algorithm calculations for high and low fit profiles
- Database duplicate application constraints (E11000 key conflict)
- HR candidate ranking order
- Application status updates and feedback persistence

---

## 📡 API Overview

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new seeker or HR account |
| `POST` | `/api/auth/login` | Public | Authenticate and obtain JWT token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| `PUT` | `/api/profile` | Seeker | Update skills, internships, projects, hackathons, exams |
| `POST` | `/api/profile/resume` | Seeker | Upload PDF resume with auto-detected skill extraction |
| `GET` | `/api/jobs` | Seeker | Browse open vacancies ranked by smart match score |
| `POST` | `/api/jobs/:jobId/apply`| Seeker | Apply to vacancy with duplicate protection |
| `GET` | `/api/applications/mine` | Seeker | View my submitted applications and statuses |
| `POST` | `/api/company` | HR | Register company organization profile |
| `PUT` | `/api/company` | HR | Update company details |
| `GET` | `/api/company/mine` | HR | Fetch company profile |
| `POST` | `/api/jobs` | HR | Post new job vacancy |
| `PUT` | `/api/jobs/:jobId` | HR | Update job vacancy |
| `GET` | `/api/jobs/mine` | HR | List all vacancies posted by HR |
| `PATCH`| `/api/jobs/:jobId/close`| HR | Toggle vacancy open/closed status |
| `GET` | `/api/jobs/:jobId/applicants`| HR | View ranked candidate pool with match breakdown |
| `PATCH`| `/api/applications/:id/status`| HR | Update candidate status and reviewer feedback |
