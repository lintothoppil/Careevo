import { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SessionContext } from '../App';
import { CAREEVO_LOGO_MARK } from '../assets/branding';

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Create Account' },
];

const privateLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/resume_builder', label: 'Resume Builder' },
];

export default function Navbar() {
  const { session, refreshSession } = useContext(SessionContext);
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = session?.isAuthenticated && !session?.isAdmin;

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    await refreshSession();
    navigate('/login');
  };

  const links = isLoggedIn ? privateLinks : publicLinks;

  return (
    <header className="top-nav">
      <Link to={isLoggedIn ? '/dashboard' : '/'} className="brand-link">
        <img src={CAREEVO_LOGO_MARK} alt="Careevo logo" className="brand-logo mark" />
        <div>
          <div className="brand-name">Careevo</div>
          <div className="brand-tag">Resume intelligence for faster hiring</div>
        </div>
      </Link>

      <nav className="nav-links">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`nav-link-pill ${location.pathname === link.to ? 'active' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="nav-actions">
        {isLoggedIn ? (
          <>
            <span className="user-chip">{session?.user?.name || session?.userName || 'User'}</span>
            <button type="button" className="button button-ghost" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="button button-ghost">Sign In</Link>
            <Link to="/register" className="button button-primary">Start Free</Link>
          </>
        )}
      </div>
    </header>
  );
}
