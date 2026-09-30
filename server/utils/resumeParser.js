const fs = require('fs');
const crypto = require('crypto');
const pdf = require('pdf-parse');

const SKILL_DICTIONARY = [
  // Frontend
  'javascript', 'typescript', 'react', 'reactjs', 'nextjs', 'vue', 'angular', 'svelte',
  'html', 'css', 'sass', 'tailwind', 'bootstrap', 'redux', 'graphql', 'webpack', 'vite',
  // Backend
  'node', 'nodejs', 'express', 'nestjs', 'python', 'django', 'flask', 'fastapi',
  'java', 'spring', 'springboot', 'c', 'c++', 'c#', 'dotnet', 'golang', 'rust', 'php', 'ruby',
  // Databases
  'mongodb', 'postgresql', 'postgres', 'mysql', 'sqlite', 'redis', 'elasticsearch',
  'cassandra', 'dynamodb', 'firebase', 'prisma', 'sequelize', 'sql',
  // DevOps & Cloud
  'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'ci/cd', 'git', 'github', 'gitlab',
  'linux', 'nginx', 'terraform', 'jenkins',
  // Mobile
  'react native', 'flutter', 'android', 'ios', 'swift', 'kotlin',
  // Testing & Methodologies
  'jest', 'mocha', 'cypress', 'rest api', 'microservices', 'agile', 'scrum',
  // CS Fundamentals & AI/Data
  'data structures', 'algorithms', 'machine learning', 'deep learning', 'tensorflow',
  'pytorch', 'pandas', 'numpy', 'nlp', 'computer vision'
];

exports.hashFile = filePath => {
  try {
    if (!filePath || !fs.existsSync(filePath)) return null;
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  } catch (err) {
    console.error('Error generating file hash:', err);
    return null;
  }
};

exports.extractSkills = async filePath => {
  try {
    if (!filePath || !fs.existsSync(filePath)) return [];
    const fileBuffer = fs.readFileSync(filePath);
    const parsed = await pdf(fileBuffer);
    const text = (parsed.text || '').toLowerCase();

    const matched = new Set();
    for (const skill of SKILL_DICTIONARY) {
      // Escape special characters like +, #, /
      const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9#+])${escaped}(?:$|[^a-zA-Z0-9#+])`, 'i');
      if (regex.test(text)) {
        matched.add(skill.toLowerCase());
      }
    }

    return Array.from(matched);
  } catch (err) {
    console.error('Resume extraction error:', err.message);
    return [];
  }
};
