import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Briefcase, FileText, ScanSearch, Sparkles, Target } from 'lucide-react';
import { CAREEVO_LOGO_FULL, CAREEVO_LOGO_MARK } from '../assets/branding';

const features = [
  {
    icon: FileText,
    title: 'ATS-safe resume builder',
    copy: 'Build polished resumes with guided sections for personal details, education, projects, certifications, and experience.',
  },
  {
    icon: ScanSearch,
    title: 'Resume analysis',
    copy: 'Upload a PDF or DOCX and get ATS scoring, keyword extraction, improvement tips, and skill-gap analysis.',
  },
  {
    icon: Briefcase,
    title: 'Job matching',
    copy: 'See recommended roles and job listings that align with your resume content and transferable skills.',
  },
  {
    icon: Bot,
    title: 'AI career assistant',
    copy: 'Ask follow-up questions about your score, likely roles, and missing skills directly inside the dashboard.',
  },
];

export default function Landing() {
  return (
    <main className="page-shell landing-shell">
      <section className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={16} />
            Free resume builder plus ATS analysis
          </div>
          <h1>Move from resume draft to interview-ready with Careevo.</h1>
          <p className="hero-text">
            Replace guesswork with a workflow that uploads, scores, improves, and exports resumes while showing the roles you are closest to landing.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="button button-primary button-large">
              Create Your Account
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="button button-ghost button-large">
              Sign In
            </Link>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <strong>ATS score</strong>
              <span>Track how strong your resume reads for recruiters.</span>
            </div>
            <div className="stat-card">
              <strong>Skill gaps</strong>
              <span>Find the exact capabilities that hold back top matches.</span>
            </div>
            <div className="stat-card">
              <strong>PDF export</strong>
              <span>Generate a downloadable resume from the same builder.</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-panel">
            <div className="hero-panel-top">
              <img src={CAREEVO_LOGO_MARK} alt="Careevo" />
              <div>
                <strong>Careevo Workspace</strong>
                <span>Builder, analyzer, and matching dashboard</span>
              </div>
            </div>

            <div className="score-ring">
              <div className="score-ring-inner">
                <span>92</span>
                <small>ATS score</small>
              </div>
            </div>

            <div className="hero-list">
              <div className="hero-list-item">
                <Target size={18} />
                <div>
                  <strong>Top role</strong>
                  <span>Frontend Developer</span>
                </div>
              </div>
              <div className="hero-list-item">
                <ScanSearch size={18} />
                <div>
                  <strong>Missing skills</strong>
                  <span>Testing, Docker, accessibility</span>
                </div>
              </div>
              <div className="hero-list-item">
                <Briefcase size={18} />
                <div>
                  <strong>Job matches</strong>
                  <span>Relevant openings surfaced from backend data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block">

        <div className="section-heading">
          <span className="section-kicker">What you keep</span>
          <h2>The current product features, now in a cleaner React frontend.</h2>
          <p>The new UI is built around your existing Flask logic instead of replacing it with mock behavior.</p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="feature-card">
                <div className="feature-icon">
                  <Icon size={22} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
