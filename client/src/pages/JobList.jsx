import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api/axios';

const BREAKDOWN_LABELS = {
  requiredSkills: 'Required Skills (40 max)',
  preferredSkills: 'Preferred Skills (15 max)',
  projects: 'Relevant Projects (15 max)',
  experience: 'Work Experience (8 max)',
  internships: 'Internships (7 max)',
  hackathons: 'Hackathons Attended (10 max)',
  exams: 'Competitive Exams (5 max)',
};

const BREAKDOWN_MAX = {
  requiredSkills: 40,
  preferredSkills: 15,
  projects: 15,
  experience: 8,
  internships: 7,
  hackathons: 10,
  exams: 5,
};

function ApplyModal({ job, onClose, onSuccess }) {
  const [coverNote, setCoverNote] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    setError('');

    const fd = new FormData();
    if (file) fd.append('resume', file);
    if (coverNote) fd.append('coverNote', coverNote);

    try {
      const res = await api.post(`/jobs/${job._id}/apply`, fd);
      onSuccess(res.data.message || 'Application submitted successfully!');
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Apply to {job.title}</h2>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>
        <p className="company-subtitle">{job.company?.name} • {job.location}</p>

        {error && <div className="error-banner" role="alert">{error}</div>}

        <form onSubmit={submit} className="stack">
          <label>
            Cover Note to Hiring Manager <span className="muted-text">(Optional)</span>
            <textarea
              placeholder="Why are you a great fit for this vacancy? Mention your matching skills or projects…"
              value={coverNote}
              onChange={e => setCoverNote(e.target.value)}
              rows={3}
            />
          </label>

          <label>
            Attach Custom Resume (PDF, max 2MB)
            <span className="muted-text" style={{ fontSize: '0.82rem', marginBottom: '0.3rem' }}>
              Leave blank to use the resume already saved on your profile.
            </span>
            <input
              type="file"
              accept="application/pdf"
              onChange={e => setFile(e.target.files[0])}
            />
          </label>

          <div className="anti-duplicate-notice">
            🔒 <strong>Duplicate Protection:</strong> Each candidate may only submit one application per vacancy. Your profile and resume hash will be registered with TechCorp.
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="primary" disabled={busy}>
              {busy ? 'Submitting Application…' : 'Confirm & Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JobCard({ job, onApplyClick }) {
  const [open, setOpen] = useState(false);
  const { match } = job;
  const breakdown = match?.breakdown || {};

  return (
    <article className="card job-card-main">
      <div className="job-card-top">
        <div className="job-title-area">
          <div className="job-heading-row">
            <h2>{job.title}</h2>
            {job.jobType && <span className="job-badge">{job.jobType}</span>}
          </div>
          <p className="company-line">
            <span className="company-name">{job.company?.name}</span>
            {job.location && <span className="dot-sep">•</span>}
            <span>{job.location}</span>
            {job.salaryRange?.max && (
              <>
                <span className="dot-sep">•</span>
                <span className="salary-tag">
                  ${job.salaryRange.min ? `${(job.salaryRange.min / 1000)}k` : '0'} – ${(job.salaryRange.max / 1000)}k/yr
                </span>
              </>
            )}
            {job.minExperience !== undefined && (
              <>
                <span className="dot-sep">•</span>
                <span>{job.minExperience === 0 ? 'Freshers welcome' : `${job.minExperience}+ yrs exp`}</span>
              </>
            )}
          </p>
        </div>

        <div className="match-score-container">
          <div
            className={`match-score-circle ${match.total >= 75 ? 'shi' : match.total >= 50 ? 'smid' : 'slo'}`}
            title={`Match Score: ${match.total}% (${match.tier})`}
          >
            <div className="match-percentage">{match.total}%</div>
            <div className="match-label">Match</div>
          </div>
          <span className="match-tier-tag">{match.tier}</span>
        </div>
      </div>

      {job.description && (
        <p className="job-desc-snippet">{job.description}</p>
      )}

      {/* Skills Comparison */}
      <div className="skills-match-area">
        <div className="skills-row">
          <span className="skill-section-label">Required:</span>
          <div className="tags-inline">
            {(job.requiredSkills || []).map(s => {
              const isMatched = (match.matchedSkills || []).includes(s.toLowerCase());
              return (
                <span key={s} className={`skill-pill ${isMatched ? 'skill-hit' : 'skill-miss'}`}>
                  {isMatched ? '✓' : '✗'} {s}
                </span>
              );
            })}
          </div>
        </div>

        {job.preferredSkills?.length > 0 && (
          <div className="skills-row">
            <span className="skill-section-label">Preferred:</span>
            <div className="tags-inline">
              {job.preferredSkills.map(s => {
                const isMatched = (match.matchedPreferredSkills || []).includes(s.toLowerCase());
                return (
                  <span key={s} className={`skill-pill ${isMatched ? 'skill-pref-hit' : 'skill-pref-default'}`}>
                    {isMatched ? '★' : '•'} {s}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {match.missingSkills?.length > 0 && (
        <div className="missing-skills-alert">
          <span className="warn-icon">⚠️</span>
          <span>Missing required skills for 100% match: <strong>{match.missingSkills.join(', ')}</strong></span>
        </div>
      )}

      {/* Expandable Score Breakdown */}
      {open && (
        <div className="match-breakdown-card">
          <h4>Smart Match Score Breakdown (out of 100):</h4>
          <div className="breakdown-grid">
            {Object.entries(breakdown).map(([k, score]) => {
              const max = BREAKDOWN_MAX[k] || 10;
              const pct = Math.min(100, Math.round((score / max) * 100));
              return (
                <div key={k} className="breakdown-item">
                  <div className="breakdown-label-row">
                    <span>{BREAKDOWN_LABELS[k] || k}</span>
                    <strong>{score} / {max}</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="job-card-footer">
        <button
          type="button"
          className="btn-toggle-breakdown"
          onClick={() => setOpen(!open)}
        >
          {open ? '▲ Hide Score Breakdown' : '▼ View Score Breakdown'}
        </button>

        <div className="apply-action-wrap">
          {job.alreadyApplied ? (
            <div className="applied-pill-group">
              <span className="applied-badge">✓ Application Submitted</span>
              {job.applicationStatus && (
                <span className="sub-status">Status: {job.applicationStatus}</span>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="primary apply-now-btn"
              onClick={() => onApplyClick(job)}
            >
              Apply to Vacancy
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function JobList() {
  const [jobs, setJobs] = useState(null);
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('All');
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState('match');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);

  const load = () => {
    setError('');
    api.get('/jobs', { params: { q, location, jobType, minScore, sortBy } })
      .then(r => setJobs(r.data))
      .catch(e => setError(errMsg(e)));
  };

  useEffect(() => { load(); }, [jobType, minScore, sortBy]); // eslint-disable-line

  const handleApplySuccess = msg => {
    setSelectedJobForApply(null);
    setSuccessMsg(msg);
    load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Smart Ranked Job Board</h1>
          <p className="muted">
            Vacancies are dynamically matched and ranked according to your verified skills, projects, hackathon achievements, internships, and competitive exam scores.
          </p>
        </div>
        <Link to="/profile" className="btn">Edit Profile & Boost Score</Link>
      </div>

      {successMsg && (
        <div className="notice notice-good" role="alert">
          {successMsg}
          <button type="button" className="close-notice-btn" onClick={() => setSuccessMsg('')}>✕</button>
        </div>
      )}

      {error && <div className="error-banner" role="alert">{error}</div>}

      {/* Search & Filter Toolbar */}
      <div className="card filter-container">
        <form
          className="search-row"
          onSubmit={e => { e.preventDefault(); load(); }}
        >
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Search title, tech stack (e.g. MERN, React, Node)…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>

          <div className="search-input-wrap">
            <span className="search-icon">📍</span>
            <input
              placeholder="Location (e.g. Remote, San Francisco)…"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>

          <button type="submit" className="primary search-btn">Search</button>
        </form>

        <div className="filters-row">
          <div className="filter-item">
            <label>Job Type:</label>
            <select value={jobType} onChange={e => setJobType(e.target.value)}>
              <option value="All">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Internship">Internship</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Sort By:</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="match">Highest Match Score</option>
              <option value="newest">Newest First</option>
              <option value="salary">Highest Salary</option>
            </select>
          </div>

          <div className="filter-item score-slider-item">
            <label>Min Match Score: <strong>{minScore}%</strong></label>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={minScore}
              onChange={e => setMinScore(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Jobs List */}
      {!jobs ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Calculating live match scores for open positions…</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="card empty-state">
          <h3>No matching job vacancies</h3>
          <p className="muted">Try adjusting your filters or lowering the minimum match score.</p>
        </div>
      ) : (
        <div className="jobs-list">
          {jobs.map(j => (
            <JobCard
              key={j._id}
              job={j}
              onApplyClick={job => setSelectedJobForApply(job)}
            />
          ))}
        </div>
      )}

      {selectedJobForApply && (
        <ApplyModal
          job={selectedJobForApply}
          onClose={() => setSelectedJobForApply(null)}
          onSuccess={handleApplySuccess}
        />
      )}
    </div>
  );
}
