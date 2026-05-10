import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, LockKeyhole, Mail } from 'lucide-react';
import { CAREEVO_LOGO_FULL } from '../assets/branding';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [passwords, setPasswords] = useState({ new_password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sendStep = async (payload) => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/forgot_password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.message || 'Could not process your request.');
        return;
      }
      return result;
    } catch (err) {
      setError('Could not connect to the server. Please try again.');
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailStep = async (event) => {
    event.preventDefault();
    const result = await sendStep({ step: 1, email });
    if (result) {
      setSuccess(result.message || 'OTP sent to your email address.');
      setStep(2);
    }
  };

  const handleOtpStep = async (event) => {
    event.preventDefault();
    const result = await sendStep({ step: 2, email, otp });
    if (result) {
      setSuccess('');
      setStep(3);
    }
  };

  const handlePasswordStep = async (event) => {
    event.preventDefault();
    const result = await sendStep({ step: 3, email, ...passwords });
    if (result) {
      setSuccess(result.message || 'Password updated successfully.');
      setStep(4);
    }
  };

  return (
    <main className="page-shell auth-shell">
      <section className="auth-card">
        <div className="auth-header">
          <img src={CAREEVO_LOGO_FULL} alt="Careevo" className="auth-logo" />
          <h1>Reset your password</h1>
          <p>Enter your account email and we will send a 6-digit OTP through Gmail to verify the password reset.</p>
        </div>

        {error ? <div className="status-banner error">{error}</div> : null}
        {success ? <div className="status-banner success">{success}</div> : null}

        {step === 1 ? (
          <form className="auth-form" onSubmit={handleEmailStep}>
            <label className="field">
              <span>Account email</span>
              <div className="field-input">
                <Mail size={18} />
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
            </label>
            <button type="submit" className="button button-primary button-full" disabled={submitting}>
              {submitting ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : null}

        {step === 2 ? (
          <form className="auth-form" onSubmit={handleOtpStep}>
            <div className="info-panel">
              <Mail size={18} />
              <div>
                <strong>Check your email</strong>
                <p>We sent a 6-digit OTP to {email}. It stays valid for a few minutes.</p>
              </div>
            </div>
            <label className="field">
              <span>OTP code</span>
              <div className="field-input">
                <KeyRound size={18} />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  required
                />
              </div>
            </label>
            <button type="submit" className="button button-primary button-full" disabled={submitting}>
              {submitting ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        ) : null}

        {step === 3 ? (
          <form className="auth-form" onSubmit={handlePasswordStep}>
            <label className="field">
              <span>New password</span>
              <div className="field-input">
                <LockKeyhole size={18} />
                <input
                  type="password"
                  value={passwords.new_password}
                  onChange={(event) => setPasswords((current) => ({ ...current, new_password: event.target.value }))}
                  required
                />
              </div>
            </label>
            <label className="field">
              <span>Confirm password</span>
              <div className="field-input">
                <LockKeyhole size={18} />
                <input
                  type="password"
                  value={passwords.confirm_password}
                  onChange={(event) => setPasswords((current) => ({ ...current, confirm_password: event.target.value }))}
                  required
                />
              </div>
            </label>
            <button type="submit" className="button button-primary button-full" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update password'}
            </button>
          </form>
        ) : null}

        {step === 4 ? (
          <div className="auth-footer single-link">
            <Link to="/login">Return to sign in</Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
