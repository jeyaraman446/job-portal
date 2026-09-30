import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/axios';

const PUBLIC_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'icloud.com', 'aol.com', 'proton.me', 'zoho.com', 'mail.com'
];

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'seeker' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm({ ...form, [k]: e.target.value });

  const isPublicDomain = email => {
    const domain = (email || '').split('@')[1]?.toLowerCase();
    return domain && PUBLIC_EMAIL_DOMAINS.includes(domain);
  };

  const submit = async e => {
    e.preventDefault();
    setError('');

    // Pre-flight validation for HR company email
    if (form.role === 'hr' && isPublicDomain(form.email)) {
      setError('HR & Employer accounts must register with an official company work email (e.g. name@company.com). Free email providers like Gmail or Yahoo are not permitted for hiring.');
      return;
    }

    setLoading(true);
    try {
      const u = await register(form);
      nav(u.role === 'hr' ? '/hr' : '/profile');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="card narrow auth-card" onSubmit={submit}>
        <div className="auth-header">
          <div className="auth-icon-badge">🚀</div>
          <h1>Create Your Account</h1>
          <p className="muted">Join SmartMatch Portal for verified skill matching and verified company hiring.</p>
        </div>

        {error && <div className="error-banner" role="alert">{error}</div>}

        <div className="role-selector-box">
          <label className="section-subtitle">Account Type</label>
          <div className="seg" role="radiogroup" aria-label="Account type">
            <button
              type="button"
              className={form.role === 'seeker' ? 'on' : ''}
              onClick={() => { setForm({ ...form, role: 'seeker' }); setError(''); }}
            >
              👤 Job Seeker / Candidate
            </button>
            <button
              type="button"
              className={form.role === 'hr' ? 'on' : ''}
              onClick={() => { setForm({ ...form, role: 'hr' }); setError(''); }}
            >
              🏢 HR / Employer
            </button>
          </div>
        </div>

        {form.role === 'hr' ? (
          <div className="corporate-policy-banner">
            <span className="policy-icon">💼</span>
            <div>
              <strong>Corporate Email Verification:</strong>
              <p>Recruiters must register with an official work email address (e.g. <code>hr@company.com</code>). You will also be asked to submit proof of company registration.</p>
            </div>
          </div>
        ) : (
          <div className="seeker-policy-banner">
            <span className="policy-icon">✉️</span>
            <div>
              <strong>Candidate Registration:</strong>
              <p>Register with your active email address to receive real-time interview invitations and status alerts.</p>
            </div>
          </div>
        )}

        <label>
          Full Name *
          <input required placeholder={form.role === 'hr' ? 'Sarah Jenkins' : 'Arun Kumar'} value={form.name} onChange={set('name')} />
        </label>

        <label>
          {form.role === 'hr' ? 'Official Company Work Email *' : 'Email Address *'}
          <input
            type="email"
            required
            placeholder={form.role === 'hr' ? 'recruiter@yourcompany.com' : 'you@example.com'}
            value={form.email}
            onChange={set('email')}
          />
          {form.role === 'hr' && form.email && isPublicDomain(form.email) && (
            <span className="warn-text">⚠️ Please use your official corporate domain (not @{form.email.split('@')[1]}).</span>
          )}
        </label>

        <label>
          Contact Phone <span className="muted-text">(Optional)</span>
          <input placeholder="+1 (555) 000-0000" value={form.phone} onChange={set('phone')} />
        </label>

        <label>
          Password <span className="muted-text">(Minimum 6 characters)</span>
          <input
            type="password"
            minLength={6}
            required
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
          />
        </label>

        <button className="primary" disabled={loading}>
          {loading ? 'Creating Account…' : form.role === 'hr' ? 'Register Verified Employer Account' : 'Register Candidate Account'}
        </button>

        <p className="muted auth-footer-text">
          Already registered? <Link to="/login">Log in here</Link>
        </p>
      </form>
    </div>
  );
}
