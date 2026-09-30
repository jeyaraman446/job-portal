import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api/axios';

const STATUS_COLORS = {
  applied: 'status-applied',
  shortlisted: 'status-shortlisted',
  interview: 'status-interview',
  hired: 'status-hired',
  rejected: 'status-rejected',
};

const STATUS_DESCRIPTIONS = {
  applied: 'Application received and pending initial review',
  shortlisted: 'Your profile and matching score stood out! Moving to next round',
  interview: 'Interview scheduled or in progress with the hiring team',
  hired: 'Congratulations! You have received an offer for this role',
  rejected: 'Position filled or criteria not fully met for this opening',
};

export default function MyApplications() {
  const [apps, setApps] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = () => {
    api.get('/applications/mine')
      .then(r => setApps(r.data))
      .catch(e => setError(errMsg(e)));
  };

  useEffect(() => { load(); }, []);

  if (error) return <div className="card error-box"><p className="error">{error}</p></div>;
  if (!apps) return <div className="loading-state"><div className="spinner"></div><p>Loading your applications…</p></div>;

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter);

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>My Job Applications</h1>
          <p className="muted">Track the live status and match performance of your job submissions.</p>
        </div>
        <Link to="/jobs" className="btn primary">+ Find More Jobs</Link>
      </div>

      <div className="card filter-bar">
        <div className="pill-filters">
          {['all', 'applied', 'shortlisted', 'interview', 'hired', 'rejected'].map(s => (
            <button
              key={s}
              type="button"
              className={`filter-pill ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)} {s === 'all' ? `(${apps.length})` : `(${apps.filter(a => a.status === s).length})`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <h3>No applications found</h3>
          <p className="muted">
            {filter === 'all'
              ? "You haven't applied to any jobs yet. Check out the ranked jobs board to get started!"
              : `You have no applications currently marked as ${filter}.`}
          </p>
          <Link to="/jobs" className="btn primary" style={{ marginTop: '0.8rem' }}>Browse Recommended Jobs</Link>
        </div>
      ) : (
        <div className="apps-grid">
          {filtered.map(a => {
            const job = a.job || {};
            const company = job.company || {};
            return (
              <div key={a._id} className="card app-card">
                <div className="app-card-header">
                  <div>
                    <h2>{job.title || 'Untitled Vacancy'}</h2>
                    <p className="company-line">
                      <strong>{company.name || 'Company'}</strong>
                      {job.location && <span className="dot-sep">•</span>}
                      <span>{job.location}</span>
                      {job.jobType && <span className="job-badge">{job.jobType}</span>}
                    </p>
                  </div>
                  <div className="match-pill-wrap">
                    <div className={`score-badge ${a.matchScore >= 75 ? 'shi' : a.matchScore >= 50 ? 'smid' : 'slo'}`}>
                      <span className="score-num">{a.matchScore}%</span>
                      <span className="score-lbl">Match</span>
                    </div>
                  </div>
                </div>

                <div className="app-status-bar">
                  <div className="status-indicator">
                    <span className={`status-tag ${STATUS_COLORS[a.status] || ''}`}>
                      {a.status?.toUpperCase()}
                    </span>
                    <span className="status-note">{STATUS_DESCRIPTIONS[a.status]}</span>
                  </div>
                  <span className="applied-date">
                    Applied on {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {a.coverNote && (
                  <div className="cover-note-box">
                    <strong>Your note:</strong> "{a.coverNote}"
                  </div>
                )}

                {a.feedback && (
                  <div className="feedback-box">
                    <strong>Hiring Team Feedback:</strong> {a.feedback}
                  </div>
                )}

                {a.matchBreakdown && (
                  <div className="app-breakdown">
                    <div className="breakdown-chip">Skills: {a.matchBreakdown.requiredSkills}/40</div>
                    <div className="breakdown-chip">Preferred: {a.matchBreakdown.preferredSkills}/15</div>
                    <div className="breakdown-chip">Projects: {a.matchBreakdown.projects}/15</div>
                    <div className="breakdown-chip">Experience: {a.matchBreakdown.experience}/8</div>
                    <div className="breakdown-chip">Internships: {a.matchBreakdown.internships}/7</div>
                    <div className="breakdown-chip">Hackathons: {a.matchBreakdown.hackathons}/10</div>
                    <div className="breakdown-chip">Exams: {a.matchBreakdown.exams}/5</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
