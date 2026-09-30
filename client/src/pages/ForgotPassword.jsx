import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/axios';

export default function ForgotPassword() {
  const { forgotPassword, resetPassword, resendOtp } = useAuth();
  const nav = useNavigate();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password, 3: Success
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [devOtp, setDevOtp] = useState('');

  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (step === 2 && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const handleDigitChange = (index, value) => {
    const clean = value.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (clean.length > 1) {
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

  // Step 1: Request password reset email
  const handleRequestOtp = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await forgotPassword(email.trim());
      setSuccess(res.message || 'Password reset passcode has been sent to your email.');
      if (res.devOtp) setDevOtp(res.devOtp);
      setStep(2);
      setTimer(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit OTP and new password
  const handleResetSubmit = async e => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit reset code sent to your email.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await resetPassword(email.trim(), fullOtp, newPassword);
      setSuccess(res.message || 'Password updated successfully!');
      setStep(3);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setError('');
    setSuccess('');
    setResending(true);

    try {
      const res = await resendOtp(email.trim(), 'reset_password');
      setSuccess(res.message || 'A new password reset code has been sent.');
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

  // Password strength score
  const getPasswordStrength = pwd => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let s = 0;
    if (pwd.length >= 6) s++;
    if (pwd.length >= 10) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;

    if (s <= 2) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (s <= 3) return { score: 2, label: 'Medium', color: '#f59e0b' };
    return { score: 3, label: 'Strong', color: '#10b981' };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="auth-container">
      <div className="card narrow auth-card forgot-card-container">
        {step === 1 && (
          <>
            <div className="auth-header">
              <div className="auth-icon-badge">🔑</div>
              <h1>Reset Your Password</h1>
              <p className="muted">
                Enter your registered email address (candidate or HR work email), and we will send a 6-digit recovery passcode.
              </p>
            </div>

            {error && <div className="error-banner" role="alert">{error}</div>}

            <form onSubmit={handleRequestOtp}>
              <label>
                Registered Email Address
                <input
                  type="email"
                  required
                  placeholder="name@company.com or candidate@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                />
              </label>

              <button type="submit" className="primary full-width" disabled={loading}>
                {loading ? 'Sending Passcode…' : 'Send Recovery Passcode'}
              </button>
            </form>

            <p className="muted auth-footer-text">
              Remembered your password? <Link to="/login">Back to Log In</Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <div className="auth-header">
              <div className="auth-icon-badge">🛡️</div>
              <h1>Set New Password</h1>
              <p className="muted">Enter the 6-digit code sent to</p>
              <div className="email-target-chip">
                <strong>{email}</strong>
              </div>
            </div>

            {error && <div className="error-banner" role="alert">{error}</div>}
            {success && <div className="success-banner" role="status">{success}</div>}

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

            <form onSubmit={handleResetSubmit}>
              <div className="otp-inputs-wrapper" onPaste={handlePaste}>
                <label className="section-subtitle centered-label">Enter 6-Digit Reset Passcode</label>
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

              <label>
                New Password <span className="muted-text">(Min 6 characters)</span>
                <div className="password-input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(s => !s)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </label>

              {newPassword && (
                <div className="password-strength-container">
                  <div className="strength-bars">
                    <div className={`bar ${strength.score >= 1 ? 'active' : ''}`} style={{ backgroundColor: strength.score >= 1 ? strength.color : '' }} />
                    <div className={`bar ${strength.score >= 2 ? 'active' : ''}`} style={{ backgroundColor: strength.score >= 2 ? strength.color : '' }} />
                    <div className={`bar ${strength.score >= 3 ? 'active' : ''}`} style={{ backgroundColor: strength.score >= 3 ? strength.color : '' }} />
                  </div>
                  <span className="strength-label" style={{ color: strength.color }}>
                    Strength: <strong>{strength.label}</strong>
                  </span>
                </div>
              )}

              <label>
                Confirm New Password
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </label>

              <button
                type="submit"
                className="primary full-width"
                disabled={loading || otpDigits.join('').length !== 6}
              >
                {loading ? 'Updating Password…' : 'Save New Password & Sign In'}
              </button>
            </form>

            <div className="otp-resend-section">
              {timer > 0 ? (
                <p className="resend-countdown muted">
                  ⏱️ Resend code in <strong>{timer}s</strong>
                </p>
              ) : (
                <p className="resend-action">
                  Didn't receive the passcode?{' '}
                  <button
                    type="button"
                    className="link-button"
                    onClick={handleResend}
                    disabled={resending}
                  >
                    {resending ? 'Sending…' : 'Resend Code'}
                  </button>
                </p>
              )}
            </div>

            <div className="otp-footer-links">
              <button type="button" className="link-button" onClick={() => setStep(1)}>
                ← Change Email Address
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="success-step-box">
            <div className="celebration-icon">🎉</div>
            <h2>Password Updated!</h2>
            <p className="muted">
              Your account password has been successfully reset. You are now logged in and can access your portal.
            </p>
            <div className="success-actions">
              <button
                type="button"
                className="primary full-width"
                onClick={() => nav('/jobs')}
              >
                Go to Dashboard ➔
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
