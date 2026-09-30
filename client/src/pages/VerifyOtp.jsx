import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/axios';

export default function VerifyOtp() {
  const { verifyOtp, resendOtp } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  // Retrieve email, role, and devOtp passed from registration or login
  const emailState = location.state?.email || '';
  const roleState = location.state?.role || 'seeker';
  const initialDevOtp = location.state?.devOtp || '';
  const initialMessage = location.state?.message || '';

  const [email, setEmail] = useState(emailState);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [devOtp, setDevOtp] = useState(initialDevOtp);

  const inputRefs = useRef([]);

  // Focus the first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleDigitChange = (index, value) => {
    const clean = value.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (clean.length > 1) {
      // Pasting full 6-digit code
      const pasted = clean.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = clean;
    setOtpDigits(newDigits);

    // Auto advance to next box
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = e => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (pasteData.length > 0) {
      const pasted = pasteData.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const targetFocus = Math.min(pasted.length, 5);
      inputRefs.current[targetFocus]?.focus();
    }
  };

  const handleAutoFill = code => {
    if (!code) return;
    const split = code.split('').slice(0, 6);
    setOtpDigits(split);
    setError('');
  };

  const submitOtp = async e => {
    e?.preventDefault();
    const fullOtp = otpDigits.join('');
    if (!email) {
      setError('Please provide the email address associated with your account.');
      return;
    }
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await verifyOtp(email, fullOtp);
      setSuccess(res.message || 'Email successfully verified! Redirecting…');
      setTimeout(() => {
        if (res.user?.role === 'hr' || roleState === 'hr') {
          nav('/hr');
        } else {
          nav('/profile');
        }
      }, 1000);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    if (!email) {
      setError('Email address is missing. Please enter your email.');
      return;
    }

    setError('');
    setSuccess('');
    setResending(true);

    try {
      const res = await resendOtp(email, 'verify_email');
      setSuccess(res.message || 'A fresh verification code has been dispatched to your email.');
      if (res.devOtp) setDevOtp(res.devOtp);
      setTimer(60);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card narrow auth-card otp-card-container">
        <div className="auth-header">
          <div className="auth-icon-badge otp-icon">🛡️</div>
          <h1>Verify Your Email</h1>
          <p className="muted">
            We sent a 6-digit verification code to
          </p>
          <div className="email-target-chip">
            <strong>{email || 'your registered email'}</strong>
          </div>
          <span className={`role-pill ${roleState === 'hr' ? 'hr' : 'seeker'}`}>
            {roleState === 'hr' ? '🏢 HR / Employer Verification' : '👤 Candidate Email Verification'}
          </span>
        </div>

        {error && <div className="error-banner" role="alert">{error}</div>}
        {success && <div className="success-banner" role="status">{success}</div>}

        {/* Demo / Developer Quick Helper */}
        {devOtp && (
          <div className="demo-otp-box">
            <div className="demo-otp-header">
              <span>⚡ Dev/Local Preview Code:</span>
              <strong className="dev-code-val">{devOtp}</strong>
            </div>
            <button
              type="button"
              className="btn btn-sm secondary auto-fill-btn"
              onClick={() => handleAutoFill(devOtp)}
            >
              Auto-fill Code
            </button>
          </div>
        )}

        <form onSubmit={submitOtp}>
          {!emailState && (
            <label className="otp-email-input">
              Registered Email Address
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </label>
          )}

          <div className="otp-inputs-wrapper" onPaste={handlePaste}>
            <label className="section-subtitle centered-label">Enter 6-Digit Passcode</label>
            <div className="otp-digit-boxes">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`otp-digit-input ${digit ? 'filled' : ''}`}
                  value={digit}
                  onChange={e => handleDigitChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  aria-label={`Digit ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="primary full-width"
            disabled={loading || otpDigits.join('').length !== 6}
          >
            {loading ? 'Verifying Code…' : 'Verify & Continue'}
          </button>
        </form>

        <div className="otp-resend-section">
          {timer > 0 ? (
            <p className="resend-countdown muted">
              ⏱️ Resend code available in <strong>{timer}s</strong>
            </p>
          ) : (
            <p className="resend-action">
              Didn't receive the email?{' '}
              <button
                type="button"
                className="link-button"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? 'Sending…' : 'Resend Verification Code'}
              </button>
            </p>
          )}
        </div>

        <div className="otp-footer-links">
          <Link to="/login" className="muted-link">← Return to Login</Link>
          <span className="dot-divider">•</span>
          <Link to="/register" className="muted-link">Register with another email</Link>
        </div>
      </div>
    </div>
  );
}
