const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const assert = require('assert');
const mongoose = require('mongoose');

const User = require('./models/User');
const Company = require('./models/Company');
const Job = require('./models/Job');
const Application = require('./models/Application');
const { calculateMatch } = require('./utils/skillMatcher');

async function runTests() {
  console.log('🧪 Starting Smart Job Portal Verification Tests...\n');
  await mongoose.connect(process.env.MONGO_URI);

  // 1. Verify Skill Matcher Algorithm
  console.log('Test 1: Testing Smart Skill Matcher algorithm calculation...');
  const mockJob = {
    requiredSkills: ['react', 'node', 'mongodb', 'typescript'],
    preferredSkills: ['docker', 'aws'],
    minExperience: 2,
  };

  const highFitCandidate = {
    skills: ['react', 'node', 'mongodb', 'typescript', 'docker', 'aws'],
    experienceYears: 3,
    internships: [{ company: 'ABC', role: 'Intern', techStack: ['react', 'node'], durationMonths: 6 }],
    projects: [{ title: 'App', techStack: ['react', 'node', 'mongodb'], link: 'https://github.com' }],
    hackathons: [{ name: 'Hackfest', position: 'Winner (1st)', techUsed: ['react', 'node'], year: 2024 }],
    competitiveExams: [{ name: 'GATE CS', rank: 150, score: 90, year: 2023 }],
  };

  const highMatch = calculateMatch(highFitCandidate, mockJob);
  console.log(`  -> High-fit candidate match score: ${highMatch.total}% (${highMatch.tier})`);
  assert(highMatch.total >= 85, 'High fit candidate should have score >= 85');
  assert.strictEqual(highMatch.missingSkills.length, 0, 'No missing required skills');
  assert.strictEqual(highMatch.matchedSkills.length, 4, 'Should match all 4 required skills');

  const lowFitCandidate = {
    skills: ['python'],
    experienceYears: 0,
    internships: [],
    projects: [],
    hackathons: [],
    competitiveExams: [],
  };
  const lowMatch = calculateMatch(lowFitCandidate, mockJob);
  console.log(`  -> Low-fit candidate match score: ${lowMatch.total}% (${lowMatch.tier})`);
  assert(lowMatch.total < 40, 'Low fit candidate should have score < 40');
  assert.strictEqual(lowMatch.missingSkills.length, 4, 'Should miss all 4 required skills');
  console.log('  ✓ Skill Matcher calculations passed!\n');

  // 2. Verify Database Unique Indexes for Duplicate Applications
  console.log('Test 2: Verifying Duplicate Application DB Constraints...');
  // Find a test user and job from seed data
  const candidate = await User.findOne({ email: 'arun@example.com' });
  const hrUser = await User.findOne({ email: 'hr@techcorp.com' });
  const job = await Job.findOne({ postedBy: hrUser._id });

  assert(candidate, 'Candidate Arun must exist');
  assert(job, 'Job vacancy must exist');

  // Check existing application for Arun
  const existing = await Application.findOne({ job: job._id, applicant: candidate._id });
  assert(existing, 'Arun should have an application for this job from seed');

  // Attempt duplicate application
  let duplicateBlocked = false;
  try {
    await Application.create({
      job: job._id,
      applicant: candidate._id,
      resumeUrl: 'uploads/resumes/sample-resume.pdf',
      matchScore: 90,
    });
  } catch (err) {
    if (err.code === 11000) {
      duplicateBlocked = true;
      console.log('  -> Duplicate application blocked with Mongo E11000 duplicate key error!');
    }
  }
  assert(duplicateBlocked, 'MongoDB unique index must reject duplicate application');
  console.log('  ✓ Duplicate Application Protection passed!\n');

  // 3. Verify HR Ranked Candidates API Query
  console.log('Test 3: Verifying Ranked Candidates sort order...');
  const apps = await Application.find({ job: job._id }).sort({ matchScore: -1 });
  console.log(`  -> Found ${apps.length} applicants for job "${job.title}"`);
  for (let i = 0; i < apps.length - 1; i++) {
    assert(
      apps[i].matchScore >= apps[i + 1].matchScore,
      `Ranked order failed: app[${i}] score ${apps[i].matchScore} < app[${i+1}] score ${apps[i+1].matchScore}`
    );
  }
  console.log('  ✓ Candidates correctly sorted in descending order of matchScore!\n');

  // 4. Verify Application Status Update with HR Feedback
  console.log('Test 4: Verifying HR Status update & Feedback...');
  existing.status = 'interview';
  existing.feedback = 'Strong portfolio projects and 1st prize in hackathon. Invited to technical round.';
  existing.reviewedAt = new Date();
  await existing.save();

  const refreshedApp = await Application.findById(existing._id);
  assert.strictEqual(refreshedApp.status, 'interview');
  assert(refreshedApp.feedback.includes('Strong portfolio'));
  console.log('  ✓ Status update and feedback persistence passed!\n');

  await mongoose.disconnect();
  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
