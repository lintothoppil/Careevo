import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Save,
  Trash2,
  WandSparkles,
} from 'lucide-react';

const ALL_STEPS = [
  { id: 'profile', label: 'Profile' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'review', label: 'Review' },
];

const createEducation = () => ({
  degree: '',
  institution: '',
  location: '',
  start_date: '',
  end_date: '',
  currently_studying: false,
});

const createExperience = () => ({
  job_title: '',
  company: '',
  location: '',
  start_date: '',
  end_date: '',
  currently_working: false,
  bullet_points: '',
});

const createProject = () => ({
  project_name: '',
  technologies_used: '',
  description: '',
  github_link: '',
  demo_link: '',
});

const createCertification = () => ({
  certification_name: '',
  organization: '',
  start_date: '',
  end_date: '',
  currently_valid: false,
  certification_id: '',
});

const emptyBuilder = {
  user_type: 'experienced',
  template_type: 'modern',
  personal_details: {
    full_name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
  },
  professional_summary: '',
  education: [createEducation()],
  technical_skills: {
    programming_languages: '',
    frameworks: '',
    databases: '',
    cloud_technologies: '',
    devops_tools: '',
    other_technical_skills: '',
  },
  soft_skills: [],
  work_experience: [createExperience()],
  projects: [createProject()],
  certifications: [createCertification()],
};

function normalizeSavedResume(rawResume) {
  if (!rawResume) {
    return {
      ...emptyBuilder,
      personal_details: { ...emptyBuilder.personal_details },
      technical_skills: { ...emptyBuilder.technical_skills },
      education: [createEducation()],
      work_experience: [createExperience()],
      projects: [createProject()],
      certifications: [createCertification()],
      soft_skills: [],
    };
  }
  const data = rawResume.data || rawResume;
  return {
    ...emptyBuilder,
    ...data,
    education: data.education?.length ? data.education : [createEducation()],
    work_experience: data.work_experience?.length ? data.work_experience : [createExperience()],
    projects: data.projects?.length ? data.projects : [createProject()],
    certifications: data.certifications?.length ? data.certifications : [createCertification()],
    soft_skills: Array.isArray(data.soft_skills)
      ? data.soft_skills
      : typeof data.soft_skills === 'string'
        ? data.soft_skills.split(',').map((item) => item.trim()).filter(Boolean)
        : [],
  };
}

function builderToAnalysisPayload(builder) {
  return {
    firstName: builder.personal_details.full_name.split(' ')[0] || '',
    lastName: builder.personal_details.full_name.split(' ').slice(1).join(' '),
    email: builder.personal_details.email,
    phone: builder.personal_details.phone,
    summary: builder.professional_summary,
    skills: [
      builder.technical_skills.programming_languages,
      builder.technical_skills.frameworks,
      builder.technical_skills.databases,
      builder.technical_skills.cloud_technologies,
      builder.technical_skills.devops_tools,
      builder.technical_skills.other_technical_skills,
      builder.soft_skills.join(', '),
    ]
      .join(', ')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    experience: builder.work_experience.map((item) => ({
      role: item.job_title,
      company: item.company,
      description: item.bullet_points,
    })),
    education: builder.education,
  };
}

export default function Builder() {
  const [activeStep, setActiveStep] = useState(steps[0].id);
  const [builder, setBuilder] = useState(emptyBuilder);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [status, setStatus] = useState('');

  const steps = useMemo(() => {
    return ALL_STEPS.filter(step => {
      if (builder.user_type === 'fresher' && step.id === 'experience') return false;
      return true;
    });
  }, [builder.user_type]);

  useEffect(() => {
    const loadBuilder = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/resume_builder');
        const result = await response.json();
        if (result.success) {
          setBuilder(normalizeSavedResume(result.data.saved_resume));
        }
      } finally {
        setLoading(false);
      }
    };

    loadBuilder();
  }, []);

  const stepIndex = useMemo(() => steps.findIndex((step) => step.id === activeStep), [activeStep]);

  const updatePersonal = (field, value) => {
    setBuilder((current) => ({
      ...current,
      personal_details: {
        ...current.personal_details,
        [field]: value,
      },
    }));
  };

  const updateSkills = (field, value) => {
    setBuilder((current) => ({
      ...current,
      technical_skills: {
        ...current.technical_skills,
        [field]: value,
      },
    }));
  };

  const updateArrayItem = (key, index, field, value) => {
    setBuilder((current) => ({
      ...current,
      [key]: current[key].map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  };

  const addArrayItem = (key, factory) => {
    setBuilder((current) => ({
      ...current,
      [key]: [...current[key], factory()],
    }));
  };

  const removeArrayItem = (key, index, factory) => {
    setBuilder((current) => ({
      ...current,
      [key]: current[key].length === 1
        ? [factory()]
        : current[key].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const saveDraft = async () => {
    setSaving(true);
    setStatus('Saving your draft...');
    try {
      const response = await fetch('/api/save_resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(builder),
      });
      const result = await response.json();
      setStatus(result.message || (result.success ? 'Draft saved.' : 'Could not save draft.'));
    } finally {
      setSaving(false);
    }
  };

  const analyzeResume = async () => {
    setAnalyzing(true);
    setStatus('Running ATS analysis...');
    try {
      const response = await fetch('/api/analyze_resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(builderToAnalysisPayload(builder)),
      });
      const result = await response.json();
      if (result.success) {
        setAnalysis(result.data);
        setStatus('Analysis refreshed.');
      } else {
        setStatus(result.message || 'Analysis failed.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const generateSummary = async () => {
    setGeneratingSummary(true);
    setStatus('Generating AI summary...');
    try {
      const response = await fetch('/api/generate_summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(builderToAnalysisPayload(builder)),
      });
      const result = await response.json();
      if (result.success && result.summary) {
        setBuilder(current => ({ ...current, professional_summary: result.summary }));
        setStatus('Summary generated.');
      } else {
        setStatus('Could not generate summary.');
      }
    } finally {
      setGeneratingSummary(false);
    }
  };

  const exportPdf = async () => {
    setGenerating(true);
    setStatus('Generating PDF...');
    try {
      const response = await fetch('/api/generate_resume_pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(builder),
      });
      if (!response.ok) {
        setStatus('Could not generate the PDF.');
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `careevo-resume-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setStatus('PDF downloaded.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <main className="page-shell centered-page">Loading your resume builder...</main>;
  }

  return (
    <main className={`builder-shell ${activeStep === 'review' ? 'review-mode' : ''}`}>
      <aside className="builder-sidebar">
        <span className="section-kicker">Builder workflow</span>
        <h1>Craft your resume with the Careevo system.</h1>
        <div className="builder-step-list">
          {steps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              className={`builder-step ${step.id === activeStep ? 'active' : ''}`}
              onClick={() => setActiveStep(step.id)}
            >
              <span>{index + 1}</span>
              <strong>{step.label}</strong>
            </button>
          ))}
        </div>
        <div className="builder-actions">
          <button type="button" className="button button-ghost" onClick={saveDraft} disabled={saving}>
            {saving ? <span className="circular-spinner dark" style={{ width: '14px', height: '14px' }} /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save draft'}
          </button>
          <button type="button" className="button button-primary" onClick={exportPdf} disabled={generating}>
            {generating ? <span className="circular-spinner" style={{ width: '14px', height: '14px' }} /> : <Download size={16} />}
            {generating ? 'Processing PDF...' : 'Export PDF'}
          </button>
        </div>
        {status ? <p className="muted-copy">{status}</p> : null}
      </aside>

      <section className="builder-main">
        {activeStep === 'profile' ? (
          <div className="surface-card">
            <div className="split-heading">
              <div>
                <span className="section-kicker">Profile details</span>
                <h2>Personal information and summary</h2>
              </div>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>User type</span>
                <select value={builder.user_type} onChange={(event) => setBuilder((current) => ({ ...current, user_type: event.target.value }))}>
                  <option value="experienced">Experienced professional</option>
                  <option value="fresher">Fresher</option>
                </select>
              </label>
              <label className="field">
                <span>Full name</span>
                <input value={builder.personal_details.full_name} onChange={(event) => updatePersonal('full_name', event.target.value)} />
              </label>
              <label className="field">
                <span>Email</span>
                <input type="email" value={builder.personal_details.email} onChange={(event) => updatePersonal('email', event.target.value)} />
              </label>
              <label className="field">
                <span>Phone</span>
                <input value={builder.personal_details.phone} onChange={(event) => updatePersonal('phone', event.target.value)} />
              </label>
              <label className="field">
                <span>Location</span>
                <input value={builder.personal_details.location} onChange={(event) => updatePersonal('location', event.target.value)} />
              </label>
              <label className="field">
                <span>LinkedIn</span>
                <input value={builder.personal_details.linkedin} onChange={(event) => updatePersonal('linkedin', event.target.value)} />
              </label>
              <label className="field">
                <span>GitHub</span>
                <input value={builder.personal_details.github} onChange={(event) => updatePersonal('github', event.target.value)} />
              </label>
            </div>

            <label className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Professional summary</span>
                <button type="button" className="button button-light" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={generateSummary} disabled={generatingSummary}>
                  {generatingSummary ? <span className="circular-spinner dark" style={{ width: '14px', height: '14px' }} /> : <WandSparkles size={14} />}
                  {generatingSummary ? 'Generating...' : 'Auto-generate AI'}
                </button>
              </div>
              <textarea
                rows="5"
                value={builder.professional_summary}
                onChange={(event) => setBuilder((current) => ({ ...current, professional_summary: event.target.value }))}
                placeholder="Summarize your experience, strengths, and target role."
              />
            </label>
          </div>
        ) : null}

        {activeStep === 'education' ? (
          <div className="surface-card">
            <div className="split-heading">
              <div>
                <span className="section-kicker">Education</span>
                <h2>Academic history</h2>
              </div>
              <button type="button" className="button button-ghost" onClick={() => addArrayItem('education', createEducation)}>
                <Plus size={16} />
                Add education
              </button>
            </div>
            <div className="stack-list">
              {builder.education.map((item, index) => (
                <div key={index} className="entry-card">
                  <div className="entry-card-header">
                    <strong>Education #{index + 1}</strong>
                    <button type="button" className="icon-button" onClick={() => removeArrayItem('education', index, createEducation)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="form-grid">
                    <label className="field"><span>Degree</span><input value={item.degree} onChange={(event) => updateArrayItem('education', index, 'degree', event.target.value)} /></label>
                    <label className="field"><span>Institution</span><input value={item.institution} onChange={(event) => updateArrayItem('education', index, 'institution', event.target.value)} /></label>
                    <label className="field"><span>Location</span><input value={item.location} onChange={(event) => updateArrayItem('education', index, 'location', event.target.value)} /></label>
                    <label className="field"><span>Start date</span><input type="month" value={item.start_date} onChange={(event) => updateArrayItem('education', index, 'start_date', event.target.value)} /></label>
                    <label className="field"><span>End date</span><input type="month" disabled={item.currently_studying} value={item.end_date} onChange={(event) => updateArrayItem('education', index, 'end_date', event.target.value)} /></label>
                    <label className="checkbox-field"><input type="checkbox" checked={item.currently_studying} onChange={(event) => updateArrayItem('education', index, 'currently_studying', event.target.checked)} />Currently studying</label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeStep === 'skills' ? (
          <div className="surface-card">
            <div className="split-heading">
              <div>
                <span className="section-kicker">Skills</span>
                <h2>Technical stacks and soft skills</h2>
              </div>
              <button type="button" className="button button-ghost" onClick={analyzeResume} disabled={analyzing}>
                {analyzing ? <span className="circular-spinner dark" style={{ width: '14px', height: '14px' }} /> : <WandSparkles size={16} />}
                {analyzing ? 'Analyzing...' : 'Refresh analysis'}
              </button>
            </div>
            <div className="form-grid">
              <label className="field"><span>Programming languages</span><input value={builder.technical_skills.programming_languages} onChange={(event) => updateSkills('programming_languages', event.target.value)} placeholder="Python, JavaScript, Java" /></label>
              <label className="field"><span>Frameworks</span><input value={builder.technical_skills.frameworks} onChange={(event) => updateSkills('frameworks', event.target.value)} placeholder="React, Flask, Django" /></label>
              <label className="field"><span>Databases</span><input value={builder.technical_skills.databases} onChange={(event) => updateSkills('databases', event.target.value)} placeholder="PostgreSQL, MySQL" /></label>
              <label className="field"><span>Cloud technologies</span><input value={builder.technical_skills.cloud_technologies} onChange={(event) => updateSkills('cloud_technologies', event.target.value)} placeholder="AWS, Azure, GCP" /></label>
              <label className="field"><span>DevOps tools</span><input value={builder.technical_skills.devops_tools} onChange={(event) => updateSkills('devops_tools', event.target.value)} placeholder="Docker, CI/CD, Kubernetes" /></label>
              <label className="field"><span>Other technical skills</span><input value={builder.technical_skills.other_technical_skills} onChange={(event) => updateSkills('other_technical_skills', event.target.value)} placeholder="Testing, accessibility, analytics" /></label>
            </div>
            <label className="field">
              <span>Soft skills</span>
              <textarea
                rows="3"
                value={builder.soft_skills.join(', ')}
                onChange={(event) => setBuilder((current) => ({
                  ...current,
                  soft_skills: event.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                }))}
                placeholder="Communication, leadership, stakeholder management"
              />
            </label>
          </div>
        ) : null}

        {activeStep === 'experience' ? (
          <div className="surface-card">
            <div className="split-heading">
              <div>
                <span className="section-kicker">Experience</span>
                <h2>Professional history</h2>
              </div>
              <button type="button" className="button button-ghost" onClick={() => addArrayItem('work_experience', createExperience)}>
                <Plus size={16} />
                Add role
              </button>
            </div>
            <div className="stack-list">
              {builder.work_experience.map((item, index) => (
                <div key={index} className="entry-card">
                  <div className="entry-card-header">
                    <strong>Role #{index + 1}</strong>
                    <button type="button" className="icon-button" onClick={() => removeArrayItem('work_experience', index, createExperience)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="form-grid">
                    <label className="field"><span>Job title</span><input value={item.job_title} onChange={(event) => updateArrayItem('work_experience', index, 'job_title', event.target.value)} /></label>
                    <label className="field"><span>Company</span><input value={item.company} onChange={(event) => updateArrayItem('work_experience', index, 'company', event.target.value)} /></label>
                    <label className="field"><span>Location</span><input value={item.location} onChange={(event) => updateArrayItem('work_experience', index, 'location', event.target.value)} /></label>
                    <label className="field"><span>Start date</span><input type="month" value={item.start_date} onChange={(event) => updateArrayItem('work_experience', index, 'start_date', event.target.value)} /></label>
                    <label className="field"><span>End date</span><input type="month" disabled={item.currently_working} value={item.end_date} onChange={(event) => updateArrayItem('work_experience', index, 'end_date', event.target.value)} /></label>
                    <label className="checkbox-field"><input type="checkbox" checked={item.currently_working} onChange={(event) => updateArrayItem('work_experience', index, 'currently_working', event.target.checked)} />Currently working here</label>
                  </div>
                  <label className="field">
                    <span>Impact bullets</span>
                    <textarea rows="4" value={item.bullet_points} onChange={(event) => updateArrayItem('work_experience', index, 'bullet_points', event.target.value)} placeholder="Led..., improved..., delivered..." />
                  </label>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeStep === 'projects' ? (
          <div className="surface-card">
            <div className="split-heading">
              <div>
                <span className="section-kicker">Projects</span>
                <h2>Portfolio and proof of work</h2>
              </div>
              <button type="button" className="button button-ghost" onClick={() => addArrayItem('projects', createProject)}>
                <Plus size={16} />
                Add project
              </button>
            </div>
            <div className="stack-list">
              {builder.projects.map((item, index) => (
                <div key={index} className="entry-card">
                  <div className="entry-card-header">
                    <strong>Project #{index + 1}</strong>
                    <button type="button" className="icon-button" onClick={() => removeArrayItem('projects', index, createProject)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="form-grid">
                    <label className="field"><span>Project name</span><input value={item.project_name} onChange={(event) => updateArrayItem('projects', index, 'project_name', event.target.value)} /></label>
                    <label className="field"><span>Technologies</span><input value={item.technologies_used} onChange={(event) => updateArrayItem('projects', index, 'technologies_used', event.target.value)} /></label>
                    <label className="field"><span>GitHub link</span><input value={item.github_link} onChange={(event) => updateArrayItem('projects', index, 'github_link', event.target.value)} /></label>
                    <label className="field"><span>Demo link</span><input value={item.demo_link} onChange={(event) => updateArrayItem('projects', index, 'demo_link', event.target.value)} /></label>
                  </div>
                  <label className="field">
                    <span>Description</span>
                    <textarea rows="4" value={item.description} onChange={(event) => updateArrayItem('projects', index, 'description', event.target.value)} />
                  </label>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeStep === 'certifications' ? (
          <div className="surface-card">
            <div className="split-heading">
              <div>
                <span className="section-kicker">Certifications</span>
                <h2>Credentials and certificates</h2>
              </div>
              <button type="button" className="button button-ghost" onClick={() => addArrayItem('certifications', createCertification)}>
                <Plus size={16} />
                Add certification
              </button>
            </div>
            <div className="stack-list">
              {builder.certifications.map((item, index) => (
                <div key={index} className="entry-card">
                  <div className="entry-card-header">
                    <strong>Certification #{index + 1}</strong>
                    <button type="button" className="icon-button" onClick={() => removeArrayItem('certifications', index, createCertification)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="form-grid">
                    <label className="field"><span>Name</span><input value={item.certification_name} onChange={(event) => updateArrayItem('certifications', index, 'certification_name', event.target.value)} /></label>
                    <label className="field"><span>Organization</span><input value={item.organization} onChange={(event) => updateArrayItem('certifications', index, 'organization', event.target.value)} /></label>
                    <label className="field"><span>Certificate ID</span><input value={item.certification_id} onChange={(event) => updateArrayItem('certifications', index, 'certification_id', event.target.value)} /></label>
                    <label className="field"><span>Start date</span><input type="month" value={item.start_date} onChange={(event) => updateArrayItem('certifications', index, 'start_date', event.target.value)} /></label>
                    <label className="field"><span>End date</span><input type="month" disabled={item.currently_valid} value={item.end_date} onChange={(event) => updateArrayItem('certifications', index, 'end_date', event.target.value)} /></label>
                    <label className="checkbox-field"><input type="checkbox" checked={item.currently_valid} onChange={(event) => updateArrayItem('certifications', index, 'currently_valid', event.target.checked)} />Currently valid</label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeStep === 'review' ? (
          <div className="surface-card" style={{ padding: '2.5rem' }}>
            <div className="split-heading" style={{ marginBottom: '2rem' }}>
              <div>
                <span className="section-kicker">Review</span>
                <h2>Final check before saving or exporting</h2>
              </div>
              <div className="review-actions" style={{ gap: '1rem' }}>
                <button type="button" className="button button-ghost" onClick={analyzeResume} disabled={analyzing}>
                  {analyzing ? <span className="circular-spinner dark" style={{ width: '14px', height: '14px' }} /> : <WandSparkles size={16} />}
                  {analyzing ? 'Analyzing...' : 'Run ATS analysis'}
                </button>
                <button type="button" className="button button-primary" onClick={saveDraft} disabled={saving}>
                  {saving ? <span className="circular-spinner" style={{ width: '14px', height: '14px' }} /> : <CheckCircle2 size={16} />}
                  {saving ? 'Saving...' : 'Save final draft'}
                </button>
              </div>
            </div>

            <div className="full-page-preview" style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '3rem', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', color: '#1a202c' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '2.2rem', margin: '0 0 0.5rem', color: '#1a202c' }}>{builder.personal_details.full_name || 'Your Name'}</h1>
                <div style={{ fontSize: '0.9rem', color: '#4a5568', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {builder.personal_details.email && <span>{builder.personal_details.email}</span>}
                  {builder.personal_details.phone && <span>• {builder.personal_details.phone}</span>}
                  {builder.personal_details.location && <span>• {builder.personal_details.location}</span>}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#4a5568', display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  {builder.personal_details.linkedin && <span>LinkedIn: {builder.personal_details.linkedin}</span>}
                  {builder.personal_details.github && <span>GitHub: {builder.personal_details.github}</span>}
                </div>
              </div>

              {builder.professional_summary && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ textTransform: 'uppercase', fontSize: '1rem', color: '#2d3748', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem', marginBottom: '0.8rem' }}>Summary</h3>
                  <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6 }}>{builder.professional_summary}</p>
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ textTransform: 'uppercase', fontSize: '1rem', color: '#2d3748', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem', marginBottom: '0.8rem' }}>Skills</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', fontSize: '0.95rem' }}>
                  {builder.technical_skills.programming_languages && <><strong style={{ color: '#4a5568' }}>Languages:</strong><span>{builder.technical_skills.programming_languages}</span></>}
                  {builder.technical_skills.frameworks && <><strong style={{ color: '#4a5568' }}>Frameworks:</strong><span>{builder.technical_skills.frameworks}</span></>}
                  {builder.technical_skills.databases && <><strong style={{ color: '#4a5568' }}>Databases:</strong><span>{builder.technical_skills.databases}</span></>}
                  {builder.technical_skills.cloud_technologies && <><strong style={{ color: '#4a5568' }}>Cloud:</strong><span>{builder.technical_skills.cloud_technologies}</span></>}
                  {builder.soft_skills.length > 0 && <><strong style={{ color: '#4a5568' }}>Soft Skills:</strong><span>{builder.soft_skills.join(', ')}</span></>}
                </div>
              </div>

              {builder.user_type !== 'fresher' && builder.work_experience.some(e => e.company || e.job_title) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ textTransform: 'uppercase', fontSize: '1rem', color: '#2d3748', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem', marginBottom: '0.8rem' }}>Experience</h3>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {builder.work_experience.filter(e => e.company || e.job_title).map((item, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <strong style={{ fontSize: '1.05rem', color: '#1a202c' }}>{item.job_title || 'Untitled Role'}</strong>
                          <span style={{ fontSize: '0.9rem', color: '#4a5568' }}>{item.start_date} - {item.currently_working ? 'Present' : item.end_date}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#4a5568', marginBottom: '0.5rem' }}>
                          <span>{item.company}</span>
                          <span>{item.location}</span>
                        </div>
                        {item.bullet_points && (
                          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.95rem', lineHeight: 1.5, color: '#2d3748' }}>
                            {item.bullet_points.split('\n').filter(Boolean).map((bullet, idx) => (
                              <li key={idx} style={{ marginBottom: '0.3rem' }}>{bullet.replace(/^[•-]\s*/, '')}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {builder.projects.some(p => p.project_name) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ textTransform: 'uppercase', fontSize: '1rem', color: '#2d3748', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem', marginBottom: '0.8rem' }}>Projects</h3>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {builder.projects.filter(p => p.project_name).map((item, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <strong style={{ fontSize: '1.05rem', color: '#1a202c' }}>{item.project_name}</strong>
                          <span style={{ fontSize: '0.9rem', color: '#4a5568' }}>{item.technologies_used}</span>
                        </div>
                        {item.description && <p style={{ margin: '0.3rem 0 0', fontSize: '0.95rem', lineHeight: 1.5, color: '#2d3748' }}>{item.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {builder.education.some(e => e.degree || e.institution) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ textTransform: 'uppercase', fontSize: '1rem', color: '#2d3748', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem', marginBottom: '0.8rem' }}>Education</h3>
                  <div style={{ display: 'grid', gap: '0.8rem' }}>
                    {builder.education.filter(e => e.degree || e.institution).map((item, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <strong style={{ fontSize: '1.05rem', color: '#1a202c' }}>{item.degree || 'Degree'}</strong>
                          <span style={{ fontSize: '0.9rem', color: '#4a5568' }}>{item.start_date} - {item.currently_studying ? 'Present' : item.end_date}</span>
                        </div>
                        <div style={{ fontSize: '0.95rem', color: '#4a5568' }}>{item.institution} {item.location ? `| ${item.location}` : ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="builder-footer-nav">
          <button type="button" className="button button-ghost" disabled={stepIndex === 0} onClick={() => setActiveStep(steps[stepIndex - 1].id)}>
            <ChevronLeft size={16} />
            Previous
          </button>
          <button type="button" className="button button-primary" disabled={stepIndex === steps.length - 1} onClick={() => setActiveStep(steps[stepIndex + 1].id)}>
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {activeStep !== 'review' ? (
        <aside className="builder-preview">
          <div className="surface-card sticky-card">
            <span className="section-kicker">Live preview</span>
            <h2>{builder.personal_details.full_name || 'Your resume preview'}</h2>
            <p>{builder.personal_details.email} {builder.personal_details.phone ? `- ${builder.personal_details.phone}` : ''}</p>
            <div className="preview-section">
              <strong>Summary</strong>
              <p>{builder.professional_summary || 'Your summary will appear here.'}</p>
            </div>
            <div className="preview-section">
              <strong>Top skills</strong>
              <div className="chip-list">
                {[builder.technical_skills.programming_languages, builder.technical_skills.frameworks, builder.soft_skills.join(', ')]
                  .join(', ')
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean)
                  .slice(0, 8)
                  .map((item) => <span key={item} className="skill-chip">{item}</span>)}
              </div>
            </div>
            {builder.user_type !== 'fresher' && (
              <div className="preview-section">
                <strong>Experience snapshot</strong>
                {builder.work_experience.filter((item) => item.job_title || item.company).slice(0, 3).map((item, index) => (
                  <div key={index} className="preview-line-item">
                    <span>{item.job_title || 'Untitled role'}</span>
                    <small>{item.company}</small>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="surface-card sticky-card" style={{ marginTop: '1rem' }}>
            <span className="section-kicker">ATS analyzer</span>
            <h2>{analysis ? `${analysis.ats_score}/100 score` : 'Run analysis from the builder'}</h2>
            <p>{analysis?.ats_explanation || 'Use the analyzer to preview ATS guidance before exporting the PDF.'}</p>
            {analysis?.job_matches?.length ? (
              <div className="analysis-list">
                {analysis.job_matches.slice(0, 3).map((match) => (
                  <div key={match.role} className="analysis-item">
                    <strong>{match.role}</strong>
                    <span>{match.match_percentage}% match</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </aside>
      ) : null}
    </main>
  );
}
