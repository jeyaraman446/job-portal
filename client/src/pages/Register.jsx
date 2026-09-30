import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/axios';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'seeker' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm({ ...form, [k]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setError('');
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
          <div className="auth-icon">🚀</div>
          <h1>Create Your Account</h1>
          <p className="muted">Join Smart Job Portal for intelligent skill matching and candidate ranking.</p>
        </div>

        {error && <div className="error-banner" role="alert">{error}</div>}

        <div className="role-selector-box">
          <label className="section-subtitle">I want to:</label>
          <div className="seg" role="radiogroup" aria-label="Account type">
            <button
              type="button"
              className={form.role === 'seeker' ? 'on' : ''}
              onClick={() => setForm({ ...form, role: 'seeker' })}
            >
              👤 Find a Job
            </button>
            <button
              type="button"
              className={form.role === 'hr' ? 'on' : ''}
              onClick={() => setForm({ ...form, role: 'hr' })}
            >
              🏢 Hire Talent (HR)
            </button>
          </div>
        </div>

        <label>
          Full Name
          <input required placeholder="Jane Doe" value={form.name} onChange={set('name')} />
        </label>

        <label>
          Email Address
          <input type="email" required placeholder="you@domain.com" value={form.email} onChange={set('email')} />
        </label>

        <label>
          Phone Number <span className="muted-text">(Optional)</span>
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
          {loading ? 'Creating Account…' : form.role === 'hr' ? 'Register as Employer' : 'Register as Job Seeker'}
        </button>

        <p className="muted auth-footer-text">
          Already registered? <Link to="/login">Log in here</Link>
        </p>
      </form>
    </div>
  );
}
