import { useEffect, useState } from 'react';
import api, { errMsg, getFileUrl } from '../api/axios';
import TagInput from '../components/TagInput';

const blank = {
  exam: { name: '', rank: '', score: '', year: '' },
  hack: { name: '', position: '', techUsed: [], year: '' },
  proj: { title: '', description: '', techStack: [], link: '' },
  intern: { company: '', role: '', durationMonths: '', description: '', techStack: [] },
};

export default function SeekerProfile() {
  const [p, setP] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [exam, setExam] = useState(blank.exam);
  const [hack, setHack] = useState(blank.hack);
  const [proj, setProj] = useState(blank.proj);
  const [intern, setIntern] = useState(blank.intern);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/me').then(r => setP(r.data));
  }, []);

  if (!p) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading your profile and matching data…</p>
      </div>
    );
  }

  const save = async () => {
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      const { data } = await api.put('/profile', {
        name: p.name,
        headline: p.headline,
        location: p.location,
        phone: p.phone,
        github: p.github,
        linkedin: p.linkedin,
        skills: p.skills,
        experienceYears: p.experienceYears,
        internships: p.internships,
        competitiveExams: p.competitiveExams,
        hackathons: p.hackathons,
        projects: p.projects,
      });
      setP(data);
      setMsg({ type: 'success', text: 'Profile updated successfully! All job match scores have been recalculated.' });
    } catch (e) {
      setMsg({ type: 'error', text: errMsg(e) });
    } finally {
      setSaving(false);
    }
  };

  const uploadResume = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setMsg({ type: '', text: '' });
    const fd = new FormData();
    fd.append('resume', file);
    try {
      const { data } = await api.post('/profile/resume', fd);
      setP({ ...p, skills: data.skills, resumeUrl: data.resumeUrl, resumeFileName: data.resumeFileName });
      setMsg({
        type: 'success',
        text: `Resume processed successfully! Parsed ${data.detectedSkills.length} skills from your PDF: ${data.detectedSkills.join(', ') || 'No known skills matched'}.`,
      });
    } catch (err) {
      setMsg({ type: 'error', text: errMsg(err) });
    } finally {
      setUploading(false);
    }
  };

  const addTo = (key, item, reset, clear) => {
    setP({ ...p, [key]: [...(p[key] || []), item] });
    reset(clear);
  };

  const removeFrom = (key, i) => {
    setP({ ...p, [key]: p[key].filter((_, idx) => idx !== i) });
  };

  const num = v => (v === '' || isNaN(v) ? undefined : Number(v));

  // Build resume download URL
  const resumeDownloadUrl = p.resumeUrl ? getFileUrl(p.resumeUrl) : null;

  return (
    <div className="stack profile-page">
      <div className="profile-header-banner card">
        <div className="profile-header-info">
          <h1>{p.name}</h1>
          <p className="profile-headline">{p.headline || 'Add a professional headline below'}</p>
          <div className="profile-meta-tags">
            {p.email && (
              <span className="profile-meta-pill verified-meta-pill" title="Candidate email address verified">
                ✉️ {p.email} <strong className="verified-tick-small">✓ Verified</strong>
              </span>
            )}
            {p.location && <span>📍 {p.location}</span>}
            {p.experienceYears !== undefined && <span>💼 {p.experienceYears} Years Experience</span>}
            {p.skills?.length > 0 && <span>⚡ {p.skills.length} Technical Skills</span>}
          </div>
        </div>
        <button className="primary save-top-btn" onClick={save} disabled={saving}>
          {saving ? 'Saving Changes…' : 'Save Profile'}
        </button>
      </div>

      {msg.text && (
        <div className={`notice ${msg.type === 'error' ? 'notice-bad' : 'notice-good'}`} role="status">
          {msg.text}
        </div>
      )}

      {/* 1. Resume Upload Card */}
      <section className="card">
        <div className="card-section-title">
          <span className="icon">📄</span>
          <div>
            <h2>Resume & Auto-Skill Extraction</h2>
            <p className="muted">Upload your PDF resume. Our parser automatically scans keywords and expands your skill profile for higher job matching scores.</p>
          </div>
        </div>

        <div className="resume-box">
          <div className="resume-status">
            {p.resumeUrl ? (
              <div className="resume-current">
                <span className="file-badge">PDF</span>
                <div>
                  <strong>{p.resumeFileName || 'Resume on file'}</strong>
                  <p className="muted">Uploaded and indexed for job vacancy submissions.</p>
                </div>
                <a
                  href={resumeDownloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn"
                  style={{ marginLeft: 'auto' }}
                >
                  View / Download Resume ↗
                </a>
              </div>
            ) : (
              <p className="warn">⚠️ No resume on file yet. Upload one to be able to submit job applications.</p>
            )}
          </div>

          <div className="upload-input-wrap">
            <label className="file-upload-label">
              <span>{uploading ? 'Extracting text and skills from PDF…' : 'Upload New Resume (PDF only, max 2MB)'}</span>
              <input type="file" accept="application/pdf" onChange={uploadResume} disabled={uploading} />
            </label>
          </div>
        </div>
      </section>

      {/* 2. Personal & Contact Information */}
      <section className="card">
        <div className="card-section-title">
          <span className="icon">👤</span>
          <div>
            <h2>Personal & Professional Info</h2>
            <p className="muted">Add links and contact info to stand out to hiring managers.</p>
          </div>
        </div>

        <div className="row">
          <label>Full Name
            <input value={p.name || ''} onChange={e => setP({ ...p, name: e.target.value })} />
          </label>
          <label>Professional Headline
            <input
              placeholder="e.g. Full Stack MERN Developer | React & Node.js"
              value={p.headline || ''}
              onChange={e => setP({ ...p, headline: e.target.value })}
            />
          </label>
        </div>

        <div className="row">
          <label>Location
            <input
              placeholder="City, State / Country or Remote"
              value={p.location || ''}
              onChange={e => setP({ ...p, location: e.target.value })}
            />
          </label>
          <label>Phone Number
            <input
              placeholder="+1 (555) 123-4567"
              value={p.phone || ''}
              onChange={e => setP({ ...p, phone: e.target.value })}
            />
          </label>
        </div>

        <div className="row">
          <label>GitHub Profile Link
            <input
              placeholder="https://github.com/username"
              value={p.github || ''}
              onChange={e => setP({ ...p, github: e.target.value })}
            />
          </label>
          <label>LinkedIn Profile Link
            <input
              placeholder="https://linkedin.com/in/username"
              value={p.linkedin || ''}
              onChange={e => setP({ ...p, linkedin: e.target.value })}
            />
          </label>
        </div>
      </section>

      {/* 3. Skills & Experience */}
      <section className="card">
        <div className="card-section-title">
          <span className="icon">🛠️</span>
          <div>
            <h2>Core Skills & Experience</h2>
            <p className="muted">Directly influences your 40% Required Skills and 15% Preferred Skills match weights.</p>
          </div>
        </div>

        <label>
          Technical Skills
          <TagInput
            value={p.skills}
            onChange={skills => setP({ ...p, skills })}
            placeholder="Type a skill (e.g. react, node, mongodb, docker, aws) and press Enter"
          />
        </label>

        <label>
          Years of Full-Time Professional Experience
          <input
            type="number"
            min="0"
            step="0.5"
            value={p.experienceYears ?? 0}
            onChange={e => setP({ ...p, experienceYears: Number(e.target.value) })}
          />
        </label>
      </section>

      {/* 4. Internships (Fulfills Experience/Internships requirement) */}
      <section className="card">
        <div className="card-section-title">
          <span className="icon">💼</span>
          <div>
            <h2>Internships & Work Experience</h2>
            <p className="muted">Attending internships gives you direct bonus points in matching against job vacancies.</p>
          </div>
        </div>

        <ul className="items">
          {(p.internships || []).map((x, i) => (
            <li key={i} className="profile-item-row">
              <div>
                <strong>{x.role}</strong> at <strong>{x.company}</strong>
                {x.durationMonths ? ` (${x.durationMonths} months)` : ''}
                {x.description && <p className="item-desc">{x.description}</p>}
                {x.techStack?.length > 0 && (
                  <div className="item-tech-tags">
                    {x.techStack.map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                )}
              </div>
              <button type="button" className="link remove-btn" onClick={() => removeFrom('internships', i)}>Remove</button>
            </li>
          ))}
          {(!p.internships || p.internships.length === 0) && (
            <p className="muted empty-note">No internships added yet.</p>
          )}
        </ul>

        <div className="form-sub-box">
          <h3>+ Add an Internship</h3>
          <div className="row">
            <input
              placeholder="Company name (e.g. Stripe, Startup Labs)"
              value={intern.company}
              onChange={e => setIntern({ ...intern, company: e.target.value })}
            />
            <input
              placeholder="Role (e.g. Frontend Intern, SDE Intern)"
              value={intern.role}
              onChange={e => setIntern({ ...intern, role: e.target.value })}
            />
            <input
              placeholder="Duration in months (e.g. 3, 6)"
              type="number"
              min="1"
              value={intern.durationMonths}
              onChange={e => setIntern({ ...intern, durationMonths: e.target.value })}
            />
          </div>
          <textarea
            placeholder="Key responsibilities and achievements during this internship…"
            value={intern.description}
            onChange={e => setIntern({ ...intern, description: e.target.value })}
          />
          <label>
            Tech Stack Used in Internship
            <TagInput
              value={intern.techStack}
              onChange={techStack => setIntern({ ...intern, techStack })}
              placeholder="Add tech used (e.g. node, mongodb, react)"
            />
          </label>
          <button
            type="button"
            className="btn"
            disabled={!intern.company || !intern.role}
            onClick={() =>
              addTo(
                'internships',
                { ...intern, durationMonths: num(intern.durationMonths) },
                setIntern,
                blank.intern
              )
            }
          >
            Add Internship
          </button>
        </div>
      </section>

      {/* 5. Projects Built */}
      <section className="card">
        <div className="card-section-title">
          <span className="icon">💻</span>
          <div>
            <h2>Projects Built</h2>
            <p className="muted">Projects matching the job's required tech stack award up to 15 match points.</p>
          </div>
        </div>

        <ul className="items">
          {(p.projects || []).map((x, i) => (
            <li key={i} className="profile-item-row">
              <div>
                <div className="project-title-line">
                  <strong>{x.title}</strong>
                  {x.link && (
                    <a href={x.link} target="_blank" rel="noreferrer" className="link proj-link">
                      {x.link} ↗
                    </a>
                  )}
                </div>
                {x.description && <p className="item-desc">{x.description}</p>}
                {x.techStack?.length > 0 && (
                  <div className="item-tech-tags">
                    {x.techStack.map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                )}
              </div>
              <button type="button" className="link remove-btn" onClick={() => removeFrom('projects', i)}>Remove</button>
            </li>
          ))}
          {(!p.projects || p.projects.length === 0) && (
            <p className="muted empty-note">No projects added yet.</p>
          )}
        </ul>

        <div className="form-sub-box">
          <h3>+ Add a Project</h3>
          <div className="row">
            <input
              placeholder="Project Title (e.g. E-Commerce Microservices)"
              value={proj.title}
              onChange={e => setProj({ ...proj, title: e.target.value })}
            />
            <input
              placeholder="GitHub / Demo URL (optional)"
              value={proj.link}
              onChange={e => setProj({ ...proj, link: e.target.value })}
            />
          </div>
          <textarea
            placeholder="Describe what you built, architecture decisions, and outcomes…"
            value={proj.description}
            onChange={e => setProj({ ...proj, description: e.target.value })}
          />
          <label>
            Tech Stack Used in Project
            <TagInput
              value={proj.techStack}
              onChange={techStack => setProj({ ...proj, techStack })}
              placeholder="e.g. react, node, express, mongodb, redis"
            />
          </label>
          <button
            type="button"
            className="btn"
            disabled={!proj.title}
            onClick={() => addTo('projects', proj, setProj, blank.proj)}
          >
            Add Project
          </button>
        </div>
      </section>

      {/* 6. Hackathons */}
      <section className="card">
        <div className="card-section-title">
          <span className="icon">🏆</span>
          <div>
            <h2>Hackathons Attended & Won</h2>
            <p className="muted">Winning or participating in hackathons adds up to 10 points to your score breakdown.</p>
          </div>
        </div>

        <ul className="items">
          {(p.hackathons || []).map((x, i) => (
            <li key={i} className="profile-item-row">
              <div>
                <strong>{x.name}</strong>
                {x.position && <span className="position-tag"> — {x.position}</span>}
                {x.year && <span className="muted"> ({x.year})</span>}
                {x.techUsed?.length > 0 && (
                  <div className="item-tech-tags">
                    {x.techUsed.map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                )}
              </div>
              <button type="button" className="link remove-btn" onClick={() => removeFrom('hackathons', i)}>Remove</button>
            </li>
          ))}
          {(!p.hackathons || p.hackathons.length === 0) && (
            <p className="muted empty-note">No hackathons added yet.</p>
          )}
        </ul>

        <div className="form-sub-box">
          <h3>+ Add a Hackathon</h3>
          <div className="row">
            <input
              placeholder="Hackathon Name (e.g. Smart India Hackathon, ETHGlobal)"
              value={hack.name}
              onChange={e => setHack({ ...hack, name: e.target.value })}
            />
            <input
              placeholder="Position (e.g. 1st Place Winner, Finalist, Participant)"
              value={hack.position}
              onChange={e => setHack({ ...hack, position: e.target.value })}
            />
            <input
              placeholder="Year"
              type="number"
              min="2015"
              max="2030"
              value={hack.year}
              onChange={e => setHack({ ...hack, year: e.target.value })}
            />
          </div>
          <label>
            Tech Used in Hackathon
            <TagInput
              value={hack.techUsed}
              onChange={techUsed => setHack({ ...hack, techUsed })}
              placeholder="e.g. react, node, mongodb"
            />
          </label>
          <button
            type="button"
            className="btn"
            disabled={!hack.name}
            onClick={() => addTo('hackathons', { ...hack, year: num(hack.year) }, setHack, blank.hack)}
          >
            Add Hackathon
          </button>
        </div>
      </section>

      {/* 7. Competitive Exams & Problem Solving */}
      <section className="card">
        <div className="card-section-title">
          <span className="icon">📊</span>
          <div>
            <h2>Competitive Exams & Ratings</h2>
            <p className="muted">High ranks in exams like GATE, JEE, CAT, or ratings on LeetCode/Codeforces award up to 5 points.</p>
          </div>
        </div>

        <ul className="items">
          {(p.competitiveExams || []).map((x, i) => (
            <li key={i} className="profile-item-row">
              <div>
                <strong>{x.name}</strong>
                {x.rank ? `, All-India / Global Rank: #${x.rank}` : ''}
                {x.score ? `, Score / Rating: ${x.score}` : ''}
                {x.year ? ` (${x.year})` : ''}
              </div>
              <button type="button" className="link remove-btn" onClick={() => removeFrom('competitiveExams', i)}>Remove</button>
            </li>
          ))}
          {(!p.competitiveExams || p.competitiveExams.length === 0) && (
            <p className="muted empty-note">No competitive exams added yet.</p>
          )}
        </ul>

        <div className="form-sub-box">
          <h3>+ Add an Exam or Coding Rating</h3>
          <div className="row">
            <input
              placeholder="Exam / Platform (e.g. GATE CS, LeetCode, Codeforces, CAT)"
              value={exam.name}
              onChange={e => setExam({ ...exam, name: e.target.value })}
            />
            <input
              placeholder="Rank (e.g. 142)"
              type="number"
              value={exam.rank}
              onChange={e => setExam({ ...exam, rank: e.target.value })}
            />
            <input
              placeholder="Score / Rating (e.g. 95 or 2100)"
              type="number"
              value={exam.score}
              onChange={e => setExam({ ...exam, score: e.target.value })}
            />
            <input
              placeholder="Year"
              type="number"
              min="2015"
              max="2030"
              value={exam.year}
              onChange={e => setExam({ ...exam, year: e.target.value })}
            />
          </div>
          <button
            type="button"
            className="btn"
            disabled={!exam.name}
            onClick={() =>
              addTo(
                'competitiveExams',
                { name: exam.name, rank: num(exam.rank), score: num(exam.score), year: num(exam.year) },
                setExam,
                blank.exam
              )
            }
          >
            Add Competitive Exam
          </button>
        </div>
      </section>

      <div className="bottom-save-bar">
        <button className="primary large-btn" onClick={save} disabled={saving}>
          {saving ? 'Saving Profile Changes…' : 'Save Full Profile & Update Matches'}
        </button>
      </div>
    </div>
  );
}
