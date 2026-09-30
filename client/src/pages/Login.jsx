import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/axios';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      const user = res.user || res;
      nav(user.role === 'hr' ? '/hr' : '/jobs');
    } catch (err) {
      if (err.response?.data?.requiresOtp) {
        nav('/verify-otp', {
          state: {
            email: err.response.data.email || form.email,
            role: err.response.data.role,
            message: err.response.data.message || 'Please verify your email address to continue.',
          },
        });
        return;
      }
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (email, password) => {
    setForm({ email, password });
  };

  return (
    <div className="auth-container">
      <form className="card narrow auth-card" onSubmit={submit}>
        <div className="auth-header">
          <div className="auth-icon">🔐</div>
          <h1>Welcome Back</h1>
          <p className="muted">Log in to access smart job matches and talent rankings.</p>
        </div>

        {error && <div className="error-banner" role="alert">{error}</div>}

        <label>
          Email Address
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </label>

        <div className="password-label-row">
          <span>Password</span>
          <Link to="/forgot-password" className="forgot-link">
            Forgot password?
          </Link>
        </div>
        <input
          type="password"
          required
          placeholder="••••••••"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />

        <button className="primary" disabled={loading}>
          {loading ? 'Logging in…' : 'Log In'}
        </button>

        <p className="muted auth-footer-text">
          New to Smart Job Portal? <Link to="/register">Create an account</Link>
        </p>

        <div className="demo-accounts-box">
          <p className="demo-title">⚡ Quick Demo One-Click Fill:</p>
          <div className="demo-buttons">
            <button
              type="button"
              className="demo-btn hr-btn"
              onClick={() => quickFill('hr@techcorp.com', 'password123')}
            >
              🏢 HR: Sarah (TechCorp)
            </button>
            <button
              type="button"
              className="demo-btn seeker-btn"
              onClick={() => quickFill('arun@example.com', 'password123')}
            >
              🚀 Senior MERN: Arun
            </button>
            <button
              type="button"
              className="demo-btn seeker-btn"
              onClick={() => quickFill('priya@example.com', 'password123')}
            >
              🎨 Frontend: Priya
            </button>
            <button
              type="button"
              className="demo-btn seeker-btn"
              onClick={() => quickFill('vikram@example.com', 'password123')}
            >
              🌱 Junior Dev: Vikram
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
