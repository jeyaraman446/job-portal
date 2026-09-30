const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const User = require('./models/User');
const Company = require('./models/Company');
const Job = require('./models/Job');
const Application = require('./models/Application');
const { calculateMatch } = require('./utils/skillMatcher');
const { hashFile } = require('./utils/resumeParser');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for seeding...');

  // Ensure resumes directory exists
  const resumesDir = path.resolve(__dirname, 'uploads/resumes');
  if (!fs.existsSync(resumesDir)) {
    fs.mkdirSync(resumesDir, { recursive: true });
  }

  const samplePdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 55 >> stream
BT /F1 12 Tf 72 712 Td (Sample Document for Smart Job Portal) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000210 00000 n 
trailer << /Size 5 /Root 1 0 R >>
startxref
316
%%EOF`;

  // Create sample PDF dummy file if not exists
  const samplePdfPath = path.join(resumesDir, 'sample-resume.pdf');
  if (!fs.existsSync(samplePdfPath)) {
    fs.writeFileSync(samplePdfPath, samplePdfContent);
  }
  const sampleResumeHash = hashFile(samplePdfPath);

  // Clear existing collections
  await Application.deleteMany({});
  await Job.deleteMany({});
  await Company.deleteMany({});
  await User.deleteMany({});

  console.log('Cleared existing data.');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create HR User
  const hrUser = await User.create({
    name: 'Sarah Jenkins (HR Director)',
    email: 'hr@techcorp.com',
    password: hashedPassword,
    role: 'hr',
    phone: '+1 555-019-2834',
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
  });

  // Create sample company ID proof PDF dummy file if not exists
  const companyDocsDir = path.resolve(__dirname, 'uploads/company_docs');
  if (!fs.existsSync(companyDocsDir)) {
    fs.mkdirSync(companyDocsDir, { recursive: true });
  }
  const sampleCompanyDocPath = path.join(companyDocsDir, 'sample-business-registration.pdf');
  if (!fs.existsSync(sampleCompanyDocPath)) {
    fs.writeFileSync(sampleCompanyDocPath, samplePdfContent);
  }

  // 2. Create Company with Validated Business ID Proof
  const company = await Company.create({
    name: 'TechCorp Solutions',
    website: 'https://techcorp.example.com',
    industry: 'Software & Cloud Infrastructure',
    size: '100-500 employees',
    location: 'San Francisco, CA & Remote',
    description: 'TechCorp is a high-growth technology company building modern distributed enterprise cloud systems and intelligent developer tools.',
    registeredBy: hrUser._id,
    taxId: 'US-EIN-884920194',
    companyEmailDomain: 'techcorp.com',
    idProofUrl: 'uploads/company_docs/sample-business-registration.pdf',
    idProofFileName: 'TechCorp_Certificate_Of_Incorporation.pdf',
    idProofType: 'Certificate of Incorporation',
    verificationStatus: 'verified',
    verified: true,
    verifiedAt: new Date(),
    verificationNotes: 'Corporate state incorporation & EIN tax ID verified.',
  });

  hrUser.company = company._id;
  hrUser.isCompanyEmail = true;
  hrUser.companyEmailDomain = 'techcorp.com';
  await hrUser.save();
  console.log('Created HR User and Verified Company with ID Proof.');

  // 3. Create Job Vacancies
  const jobMern = await Job.create({
    title: 'Senior Full Stack MERN Developer',
    description: 'We are seeking an experienced Full Stack Engineer proficient in MongoDB, Express, React, and Node.js. You will lead the architecture of our cloud-based portal, design scalable REST and GraphQL APIs, and optimize frontend web experiences.',
    company: company._id,
    postedBy: hrUser._id,
    location: 'Remote / San Francisco',
    jobType: 'Full-time',
    requiredSkills: ['react', 'node', 'express', 'mongodb', 'typescript', 'docker'],
    preferredSkills: ['aws', 'redis', 'graphql', 'tailwind'],
    minExperience: 2,
    salaryRange: { min: 120000, max: 160000 },
    vacancies: 3,
    preferHackathons: true,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days ahead
    status: 'open',
  });

  const jobFrontend = await Job.create({
    title: 'Frontend React / UI Specialist',
    description: 'Looking for a dedicated Frontend Engineer with a passion for sleek user experiences, state management with Redux/Zustand, and modern Tailwind CSS UI component design.',
    company: company._id,
    postedBy: hrUser._id,
    location: 'Remote / New York',
    jobType: 'Full-time',
    requiredSkills: ['react', 'typescript', 'tailwind', 'redux', 'css', 'javascript'],
    preferredSkills: ['nextjs', 'jest', 'vite'],
    minExperience: 1,
    salaryRange: { min: 95000, max: 130000 },
    vacancies: 2,
    preferHackathons: false,
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    status: 'open',
  });

  const jobJunior = await Job.create({
    title: 'Junior Software Engineer (Full Stack & Intern)',
    description: 'Exciting opportunity for junior engineers, recent university graduates, or competitive coding enthusiasts to build projects and develop microservices.',
    company: company._id,
    postedBy: hrUser._id,
    location: 'Remote / Austin, TX',
    jobType: 'Internship',
    requiredSkills: ['javascript', 'node', 'mongodb', 'data structures'],
    preferredSkills: ['react', 'python', 'git'],
    minExperience: 0,
    salaryRange: { min: 65000, max: 85000 },
    vacancies: 4,
    preferHackathons: true,
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    status: 'open',
  });

  console.log('Created 3 Job Vacancies.');

  // 4. Create Job Seekers
  const seekerArun = await User.create({
    name: 'Arun Kumar',
    email: 'arun@example.com',
    password: hashedPassword,
    role: 'seeker',
    phone: '+1 555-432-8765',
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
    headline: 'Senior MERN Stack Engineer | Cloud Architect',
    location: 'San Jose, CA',
    github: 'https://github.com/arun-kumar-mern',
    linkedin: 'https://linkedin.com/in/arunkumar-dev',
    skills: ['react', 'node', 'express', 'mongodb', 'typescript', 'docker', 'aws', 'redis', 'javascript'],
    experienceYears: 3.5,
    resumeUrl: 'uploads/resumes/sample-resume.pdf',
    resumeFileName: 'Arun_Kumar_Senior_MERN_Resume.pdf',
    resumeHash: sampleResumeHash,
    internships: [
      {
        company: 'FinTech Labs',
        role: 'Full Stack Engineering Intern',
        durationMonths: 6,
        description: 'Engineered high-throughput financial settlement endpoints using Node.js and MongoDB.',
        techStack: ['node', 'mongodb', 'redis'],
      },
    ],
    projects: [
      {
        title: 'Microservices E-Commerce Core',
        description: 'Scalable commerce backend with distributed cart management, Redis caching, and Docker compose.',
        techStack: ['react', 'node', 'mongodb', 'docker', 'redis'],
        link: 'https://github.com/arun-kumar-mern/ecom-core',
      },
      {
        title: 'Resume AI Matcher & Parser',
        description: 'Semantic talent matching pipeline with multi-variable candidate scoring.',
        techStack: ['react', 'node', 'express', 'typescript'],
        link: 'https://github.com/arun-kumar-mern/resume-matcher',
      },
    ],
    hackathons: [
      {
        name: 'National Smart Cities Hackathon',
        position: 'Winner (1st Prize)',
        techUsed: ['react', 'node', 'mongodb', 'docker'],
        year: 2024,
      },
      {
        name: 'OpenAI Dev Day Hackathon',
        position: 'Finalist',
        techUsed: ['typescript', 'node'],
        year: 2023,
      },
    ],
    competitiveExams: [
      { name: 'GATE Computer Science', rank: 142, score: 94, year: 2023 },
      { name: 'LeetCode Guardian (2250+)', score: 96, year: 2024 },
    ],
  });

  const seekerPriya = await User.create({
    name: 'Priya Sharma',
    email: 'priya@example.com',
    password: hashedPassword,
    role: 'seeker',
    phone: '+1 555-876-1234',
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
    headline: 'Frontend Engineer & UI/UX Specialist',
    location: 'Seattle, WA',
    github: 'https://github.com/priyasharma-ui',
    linkedin: 'https://linkedin.com/in/priyasharma-ui',
    skills: ['react', 'typescript', 'tailwind', 'redux', 'css', 'javascript', 'html', 'nextjs', 'jest'],
    experienceYears: 2,
    resumeUrl: 'uploads/resumes/sample-resume.pdf',
    resumeFileName: 'Priya_Sharma_Frontend_Resume.pdf',
    resumeHash: sampleResumeHash + '_priya',
    internships: [
      {
        company: 'DesignCraft Interactive',
        role: 'Frontend UI/UX Intern',
        durationMonths: 5,
        description: 'Designed responsive component libraries, accessible forms, and dark-mode themes with Tailwind CSS.',
        techStack: ['react', 'tailwind', 'typescript'],
      },
    ],
    projects: [
      {
        title: 'Interactive Diagramming Canvas',
        description: 'Collaborative infinite canvas tool with custom SVGs, zoom controls, and undo/redo state tree.',
        techStack: ['react', 'typescript', 'tailwind', 'redux'],
        link: 'https://github.com/priyasharma-ui/canvas-studio',
      },
    ],
    hackathons: [
      {
        name: 'UI/UX Global Design Sprint',
        position: 'Best UI Design Award',
        techUsed: ['react', 'tailwind', 'typescript'],
        year: 2024,
      },
    ],
    competitiveExams: [
      { name: 'HackerRank 6-Star Frontend Specialist', score: 98, year: 2024 },
    ],
  });

  const seekerVikram = await User.create({
    name: 'Vikram Patel',
    email: 'vikram@example.com',
    password: hashedPassword,
    role: 'seeker',
    phone: '+1 555-901-3456',
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
    headline: 'Computer Science Graduate | Aspiring Full Stack Developer',
    location: 'Austin, TX',
    github: 'https://github.com/vikram-patel-cs',
    linkedin: 'https://linkedin.com/in/vikrampatel-cs',
    skills: ['javascript', 'node', 'mongodb', 'data structures', 'algorithms', 'git', 'python'],
    experienceYears: 0.5,
    resumeUrl: 'uploads/resumes/sample-resume.pdf',
    resumeFileName: 'Vikram_Patel_CS_Resume.pdf',
    resumeHash: sampleResumeHash + '_vikram',
    internships: [
      {
        company: 'CloudVentures',
        role: 'Software Development Intern',
        durationMonths: 3,
        description: 'Implemented automated API integration tests and enhanced database query indexes.',
        techStack: ['node', 'javascript', 'mongodb'],
      },
    ],
    projects: [
      {
        title: 'Visual Graph & Sorting Algorithms',
        description: 'Web simulator demonstrating Dijkstra, A*, and sorting algorithm comparisons with time complexity meters.',
        techStack: ['javascript', 'data structures', 'html', 'css'],
        link: 'https://github.com/vikram-patel-cs/algo-viz',
      },
    ],
    hackathons: [
      {
        name: 'University Hackfest 2024',
        position: 'Participant',
        techUsed: ['javascript', 'node', 'mongodb'],
        year: 2024,
      },
    ],
    competitiveExams: [
      { name: 'Codeforces Expert (1720 rating)', rank: 2800, score: 86, year: 2024 },
    ],
  });

  console.log('Created 3 Candidate Profiles.');

  // 5. Submit Initial Applications for MERN job
  // Arun applies to MERN job -> High score
  const matchArunMern = calculateMatch(seekerArun, jobMern);
  await Application.create({
    job: jobMern._id,
    applicant: seekerArun._id,
    resumeUrl: seekerArun.resumeUrl,
    resumeHash: seekerArun.resumeHash,
    matchScore: matchArunMern.total,
    matchBreakdown: matchArunMern.breakdown,
    coverNote: 'Excited about TechCorp! With over 3 years of building MERN applications, Docker containerization, and AWS infrastructure, I am eager to contribute to your core cloud platform.',
    status: 'shortlisted',
  });

  // Priya applies to MERN job -> Medium/Good score (Great React & TS, missing Node/Mongo depth)
  const matchPriyaMern = calculateMatch(seekerPriya, jobMern);
  await Application.create({
    job: jobMern._id,
    applicant: seekerPriya._id,
    resumeUrl: seekerPriya.resumeUrl,
    resumeHash: seekerPriya.resumeHash,
    matchScore: matchPriyaMern.total,
    matchBreakdown: matchPriyaMern.breakdown,
    coverNote: 'I specialize in clean React, TypeScript architectures, and user interfaces.',
    status: 'applied',
  });

  // Vikram applies to Junior job -> High match for Junior position
  const matchVikramJunior = calculateMatch(seekerVikram, jobJunior);
  await Application.create({
    job: jobJunior._id,
    applicant: seekerVikram._id,
    resumeUrl: seekerVikram.resumeUrl,
    resumeHash: seekerVikram.resumeHash,
    matchScore: matchVikramJunior.total,
    matchBreakdown: matchVikramJunior.breakdown,
    coverNote: 'Recent CS grad with passion for data structures, problem solving, and backend APIs.',
    status: 'interview',
  });

  // Priya applies to Frontend job -> High match for Frontend!
  const matchPriyaFrontend = calculateMatch(seekerPriya, jobFrontend);
  await Application.create({
    job: jobFrontend._id,
    applicant: seekerPriya._id,
    resumeUrl: seekerPriya.resumeUrl,
    resumeHash: seekerPriya.resumeHash,
    matchScore: matchPriyaFrontend.total,
    matchBreakdown: matchPriyaFrontend.breakdown,
    coverNote: 'My skills and hackathon wins align directly with this frontend opening!',
    status: 'interview',
  });

  console.log('Seed applications created with pre-computed smart match scores.');
  console.log('\n--- DEMO CREDENTIALS ---');
  console.log('HR Login:');
  console.log('  Email:    hr@techcorp.com');
  console.log('  Password: password123');
  console.log('Candidate Logins:');
  console.log('  1. Senior MERN:  arun@example.com    / password123');
  console.log('  2. Frontend:     priya@example.com   / password123');
  console.log('  3. Junior Dev:   vikram@example.com  / password123');
  console.log('------------------------\n');

  await mongoose.disconnect();
  console.log('Seeding completed successfully!');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
