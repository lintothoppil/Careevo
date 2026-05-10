import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Lock, Mail, UserRound } from 'lucide-react';
import { CAREEVO_LOGO_FULL } from '../assets/branding';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.message || 'Registration failed.');
        return;
      }
      setSuccess(result.message || 'Registration successful. Please log in.');
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      setError('Could not complete registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-shell auth-shell">
      <section className="auth-card auth-card-wide">
        <div className="auth-header">
          <img src={CAREEVO_LOGO_FULL} alt="Careevo" className="auth-logo" />
          <h1>Create your Careevo account</h1>
          <p>Create an account with your email and password. Password recovery uses a Gmail OTP instead of security questions.</p>
        </div>

        {error ? <div className="status-banner error">{error}</div> : null}
        {success ? <div className="status-banner success">{success}</div> : null}

        <form className="auth-form two-column-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Full name</span>
            <div className="field-input">
              <UserRound size={18} />
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Your full name"
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Email</span>
            <div className="field-input">
              <Mail size={18} />
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="you@example.com"
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div className="field-input">
              <Lock size={18} />
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="At least 6 characters"
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Confirm password</span>
            <div className="field-input">
              <KeyRound size={18} />
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                value={form.confirm_password}
                onChange={(event) => setForm((current) => ({ ...current, confirm_password: event.target.value }))}
                placeholder="Repeat your password"
                required
              />
            </div>
          </label>

          <button type="submit" className="button button-primary button-full" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer single-link">
          <Link to="/login">Already have an account? Sign in</Link>
        </div>
      </section>
    </main>
  );
}
