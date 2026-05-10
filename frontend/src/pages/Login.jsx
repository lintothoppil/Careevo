import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { SessionContext } from '../App';
import { CAREEVO_LOGO_FULL } from '../assets/branding';

export default function Login() {
  const navigate = useNavigate();
  const { refreshSession } = useContext(SessionContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.message || 'Login failed.');
        return;
      }

      await refreshSession();
      navigate(result.redirect || '/dashboard');
    } catch (err) {
      setError('Could not connect to the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-shell auth-shell">
      <section className="auth-card">
        <div className="auth-header">
          <img src={CAREEVO_LOGO_FULL} alt="Careevo" className="auth-logo" />
          <h1>Welcome back</h1>
          <p>Sign in to upload resumes, review ATS insights, and continue editing your builder draft.</p>
        </div>

        {error ? <div className="status-banner error">{error}</div> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
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
                placeholder="Enter your password"
                required
              />
            </div>
          </label>

          <button type="submit" className="button button-primary button-full" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Google Sign-In */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0', color: '#9CA3AF', fontSize: '0.85rem' }}>
          <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
          or continue with
          <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
        </div>

        <a
          href="/auth/google"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            padding: '12px 20px', background: '#fff', border: '1.5px solid #E5E7EB',
            borderRadius: '8px', fontWeight: 600, color: '#2E2E2E',
            fontSize: '0.95rem', textDecoration: 'none', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#3EB489'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(62,180,137,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </a>

        <div className="auth-footer">
          <Link to="/forgot_password">Forgot password?</Link>
          <span />
          <Link to="/register">Create a new account</Link>
        </div>
      </section>
    </main>
  );
}
