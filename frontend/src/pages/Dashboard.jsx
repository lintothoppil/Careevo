import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Download,
  FileSearch,
  FileUp,
  Languages,
  Mic,
  MicOff,
  MessageSquare,
  Send,
  Sparkles,
  Star,
  Target,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function stripHtml(value) {
  return (value || '').replace(/<[^>]+>/g, '');
}

function formatDateTime(value) {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function recommendationFromScore(score) {
  if (score > 85) return 'Excellent';
  if (score > 70) return 'Good';
  if (score > 50) return 'Needs improvement';
  if (score > 30) return 'Weak';
  return 'Poor';
}

const CHAT_LANGUAGES = [
  { value: 'en-US', label: 'English' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'ml-IN', label: 'Malayalam' },
  { value: 'ta-IN', label: 'Tamil' },
  { value: 'te-IN', label: 'Telugu' },
];

function scoreBreakdown(score) {
  const normalized = Number(score) || 0;
  return [
    {
      label: 'Structure',
      value: Math.min(100, Math.round(normalized >= 80 ? 88 : normalized >= 65 ? 72 : 56)),
    },
    {
      label: 'Keywords',
      value: Math.min(100, Math.round(normalized >= 80 ? 84 : normalized >= 65 ? 68 : 48)),
    },
    {
      label: 'Impact',
      value: Math.min(100, Math.round(normalized >= 80 ? 78 : normalized >= 65 ? 60 : 42)),
    },
  ];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatting, setChatting] = useState(false);
  const [chatLanguage, setChatLanguage] = useState(() => window.localStorage.getItem('careevo_chat_language') || 'en-US');
  const [isListening, setIsListening] = useState(false);
  const [chatNotice, setChatNotice] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'bot', content: 'Ask about your ATS score, missing skills, or which role fits you best.' },
  ]);
  const [feedback, setFeedback] = useState({ rating: 5, suggestion: '' });
  const [feedbackStatus, setFeedbackStatus] = useState('');
  const recognitionRef = useRef(null);
  const noticeTimerRef = useRef(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dashboard');
      if (response.status === 401) {
        navigate('/login');
        return;
      }
      const result = await response.json();
      if (result.success) {
        setDashboard(result.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    window.localStorage.setItem('careevo_chat_language', chatLanguage);
  }, [chatLanguage]);

  useEffect(() => {
    const savedMessages = dashboard?.chat_history?.map((item) => ({
      id: `${item.role}-${item.created_at || Math.random()}`,
      role: item.role,
      content: item.content,
    }));
    if (savedMessages?.length) {
      setChatMessages(savedMessages);
    } else {
      setChatMessages([
        { role: 'bot', content: 'Ask about your ATS score, missing skills, or which role fits you best.' },
      ]);
    }
  }, [dashboard?.chat_history]);

  useEffect(() => () => window.clearTimeout(noticeTimerRef.current), []);

  useEffect(() => {
    if (dashboard?.chatLanguage) {
      setChatLanguage(dashboard.chatLanguage);
    }
  }, [dashboard?.chatLanguage]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = chatLanguage;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ');
      setChatInput(transcript.trim());
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.stop();
    };
  }, [chatLanguage]);

  const topSkillGap = useMemo(() => {
    if (dashboard?.last_analysis?.primary_role_gap) {
      return dashboard.last_analysis.primary_role_gap;
    }
    const gaps = dashboard?.last_analysis?.skill_gaps;
    if (!gaps) return null;
    const firstKey = Object.keys(gaps)[0];
    return firstKey ? gaps[firstKey] : null;
  }, [dashboard]);

  const analysisHistory = dashboard?.analysis_history || [];
  const analysisTrend = [...analysisHistory].reverse();
  const roleMatches = dashboard?.last_analysis?.job_matches || [];
  const atsBreakdown = scoreBreakdown(dashboard?.last_analysis?.resume_score);
  const atsActionItems = [
    ...(dashboard?.last_analysis?.improvement_feedback || []),
    ...(dashboard?.last_analysis?.quantified_suggestions || []),
  ].slice(0, 6);

  const showChatNotice = (message) => {
    setChatNotice(message);
    window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setChatNotice(''), 2600);
  };

  const playChatSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 740;
      gainNode.gain.value = 0.05;
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18);
      oscillator.stop(audioContext.currentTime + 0.18);
    } catch {
      // Ignore browser audio restrictions silently.
    }
  };

  const animateBotReply = async (text) => {
    const content = text || 'No response received.';
    const messageId = `bot-${Date.now()}`;
    setChatMessages((current) => [...current, { id: messageId, role: 'bot', content: '' }]);

    for (let cursor = 1; cursor <= content.length; cursor += Math.max(1, Math.ceil(content.length / 42))) {
      const nextChunk = content.slice(0, cursor);
      setChatMessages((current) => current.map((message) => (
        message.id === messageId ? { ...message, content: nextChunk } : message
      )));
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => window.setTimeout(resolve, 18));
    }

    setChatMessages((current) => current.map((message) => (
      message.id === messageId ? { ...message, content } : message
    )));
    playChatSound();
    showChatNotice(content);
  };

  const toggleVoiceInput = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      showChatNotice('Voice input is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }
    recognition.lang = chatLanguage;
    recognition.start();
    setIsListening(true);
  };

  const handleUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('resume', file);
    setUploading(true);

    try {
      const response = await fetch('/upload_resume', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        alert(result.message || 'Upload failed.');
        return;
      }
      await fetchDashboard();
    } catch (err) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    setFeedbackStatus('Saving feedback...');
    const response = await fetch('/api/submit_feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    });
    const result = await response.json();
    setFeedbackStatus(result.message || (result.success ? 'Feedback saved.' : 'Could not save feedback.'));
    if (result.success) {
      setFeedback({ rating: 5, suggestion: '' });
      fetchDashboard();
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const outgoing = chatInput.trim();
    setChatMessages((current) => [...current, { id: `user-${Date.now()}`, role: 'user', content: outgoing }]);
    setChatInput('');
    setChatting(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: outgoing, language: chatLanguage }),
      });
      const result = await response.json();
      await animateBotReply(result.success ? stripHtml(result.response) : (result.message || 'No response received.'));
    } finally {
      setChatting(false);
    }
  };

  if (loading) {
    return <main className="page-shell centered-page">Loading your dashboard...</main>;
  }

  return (
    <main className="page-shell dashboard-shell">
      <section className="dashboard-header">
        <div>
          <span className="section-kicker">Career command center</span>
          <h1>Hello, {dashboard?.user_name || 'there'}.</h1>
          <p>Upload your latest resume, review ATS insights, and build a cleaner export from the same workspace.</p>
        </div>
        <Link to="/resume_builder" className="button button-primary">
          Open Resume Builder
        </Link>
      </section>

      <section className="dashboard-grid">
        <article
          className="surface-card upload-dropzone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleUpload(event.dataTransfer.files?.[0]);
          }}
        >
          <div className="card-icon"><FileUp size={22} /></div>
          <h2>Upload a resume</h2>
          <p>PDF, DOC, or DOCX up to 16MB. Your backend analyzer will extract text, validate the file, and score it.</p>
          <button type="button" className="button button-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <span className="circular-spinner" /> : null}
            {uploading ? 'Processing PDF...' : 'Choose file'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            hidden
            onChange={(event) => handleUpload(event.target.files?.[0])}
          />
        </article>

        <article className="surface-card builder-promo">
          <div className="card-icon"><Sparkles size={22} /></div>
          <h2>Build a fresh resume</h2>
          <p>Create a structured ATS-friendly resume with sections for education, experience, projects, skills, and certifications.</p>
          <Link to="/resume_builder" className="button button-light">Start building</Link>
        </article>
      </section>

      {dashboard?.generated_resume ? (
        <section className="surface-card">
          <div className="split-heading">
            <div>
              <span className="section-kicker">Latest generated resume</span>
              <h2>Download your saved PDF</h2>
            </div>
            <a className="button button-ghost" href={`/download_resume_pdf/${dashboard.generated_resume.id}`}>
              <Download size={16} />
              Download
            </a>
          </div>
          <p className="muted-copy">Created on {dashboard.generated_resume.created_at}</p>
        </section>
      ) : null}

      {dashboard?.last_analysis ? (
        <>
          <section className="metrics-grid">
            <article className="surface-card metric-card">
              <div className="metric-icon score"><Star size={20} /></div>
              <span className="metric-label">Resume score</span>
              <strong>{dashboard.last_analysis.resume_score}/100</strong>
              <p>{recommendationFromScore(dashboard.last_analysis.resume_score)}</p>
            </article>
            <article className="surface-card metric-card">
              <div className="metric-icon role"><Target size={20} /></div>
              <span className="metric-label">Predicted roles</span>
              <strong>{dashboard.last_analysis.predicted_roles?.join(', ') || dashboard.last_analysis.predicted_role}</strong>
              <p>Derived from your uploaded resume content.</p>
            </article>
            <article className="surface-card metric-card">
              <div className="metric-icon analysis"><FileSearch size={20} /></div>
              <span className="metric-label">Top strength</span>
              <strong>{dashboard.last_analysis.top_strength}</strong>
              <p>{dashboard.last_analysis.key_improvement}</p>
            </article>
          </section>

          <section className="dashboard-details">
            {dashboard.last_analysis.resume_score <= 65 && (
              <article className="surface-card" style={{ gridColumn: '1 / -1', border: '2px solid var(--warning)' }}>
                <span className="section-kicker" style={{ background: '#fff7ed', color: '#c2410c' }}>Low Score Detected</span>
                <h2>Your ATS score is holding you back</h2>
                <p>Scores of 65 and below typically get filtered out by modern Applicant Tracking Systems. We strongly recommend using the Careevo Resume Builder to craft a cleaner, highly-optimized format that guarantees accurate parsing and better keyword alignment.</p>
                <Link to="/resume_builder" className="button button-primary" style={{ marginTop: '0.8rem' }}>
                  Build an efficient resume now
                </Link>
              </article>
            )}
            <article className="surface-card ats-hero-card">
              <span className="section-kicker">ATS overview</span>
              <h2>Visual score summary</h2>
              <div className="ats-hero-layout">
                <div className="score-ring" style={{ background: `conic-gradient(var(--brand) 0 ${Math.max(12, Math.round((dashboard.last_analysis.resume_score / 100) * 360))}deg, rgba(57, 184, 135, 0.12) ${Math.max(12, Math.round((dashboard.last_analysis.resume_score / 100) * 360))}deg)` }}>
                  <div className="score-ring-inner">
                    <span>{dashboard.last_analysis.resume_score}</span>
                    <small>/100</small>
                  </div>
                </div>
                <div className="ats-hero-copy">
                  <strong>{recommendationFromScore(dashboard.last_analysis.resume_score)}</strong>
                  <p>{dashboard.last_analysis.ats_explanation}</p>
                  <div className="bar-chart compact">
                    {atsBreakdown.map((item) => (
                      <div key={item.label} className="bar-row">
                        <div className="bar-row-head">
                          <strong>{item.label}</strong>
                          <span>{item.value}%</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${Math.max(item.value, 4)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            <article className="surface-card">
              <span className="section-kicker">ATS fix plan</span>
              <h2>How to improve your score</h2>
              <div className="ats-action-list">
                {atsActionItems.length ? atsActionItems.map((item, index) => (
                  <div key={`${index}-${item}`} className="ats-action-item">
                    <span>{index + 1}</span>
                    <p>{stripHtml(item)}</p>
                  </div>
                )) : <p>No ATS action items yet. Upload a resume to generate improvement steps.</p>}
              </div>
              {dashboard.last_analysis.summary_suggestions ? (
                <div className="gap-section">
                  <strong>Suggested professional summary</strong>
                  <p>{stripHtml(dashboard.last_analysis.summary_suggestions)}</p>
                </div>
              ) : null}
            </article>
          </section>

          <section className="dashboard-details">
            <article className="surface-card">
              <span className="section-kicker">Role match graph</span>
              <h2>How your resume maps to roles</h2>
              <div className="bar-chart">
                {roleMatches.length ? roleMatches.map((match) => (
                  <div key={match.role} className="bar-row">
                    <div className="bar-row-head">
                      <strong>{match.role}</strong>
                      <span>{match.match_percentage}%</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${Math.max(match.match_percentage, 4)}%` }} />
                    </div>
                    <p className="muted-copy">
                      Matched: {match.matched_skills?.slice(0, 4).join(', ') || 'No strong matches yet'}
                    </p>
                  </div>
                )) : <p>No role graph available yet.</p>}
              </div>
            </article>

            <article className="surface-card">
              <span className="section-kicker">Score history</span>
              <h2>Previous resume analyses</h2>
              <div className="bar-chart compact">
                {analysisTrend.length ? analysisTrend.map((item) => (
                  <div key={item.analysis_id || `${item.timestamp}-${item.source_name}`} className="bar-row">
                    <div className="bar-row-head">
                      <strong>{item.source_name || 'Resume analysis'}</strong>
                      <span>{item.resume_score}/100</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill alt" style={{ width: `${Math.max(item.resume_score || 0, 4)}%` }} />
                    </div>
                    <p className="muted-copy">{formatDateTime(item.timestamp)}</p>
                  </div>
                )) : <p>No saved analysis history yet.</p>}
              </div>
            </article>
          </section>

          <section className="dashboard-details">
            <article className="surface-card">
              <div className="split-heading">
                <div>
                  <span className="section-kicker">AI summary</span>
                  <h2>What your resume is doing well</h2>
                </div>
              </div>
              <p>{dashboard.last_analysis.ai_executive_summary}</p>

              <div className="chip-list">
                {dashboard.last_analysis.keywords?.map((keyword, idx) => (
                  <span key={idx} className="skill-chip">{typeof keyword === 'object' ? keyword.keyword || keyword.skill || JSON.stringify(keyword) : keyword}</span>
                ))}
              </div>
            </article>

            <article className="surface-card">
              <span className="section-kicker">Priority gap</span>
              <h2>Skills to strengthen next</h2>
              {topSkillGap ? (
                <>
                  <div className="gap-section">
                    <strong>Critical gaps</strong>
                    <div className="chip-list warning">
                      {(topSkillGap.gap_analysis?.critical_gaps || topSkillGap.critical_gaps || []).slice(0, 8).map((skill, idx) => (
                        <span key={idx} className="warning-chip">{typeof skill === 'object' ? skill.skill : skill}</span>
                      ))}
                    </div>
                  </div>
                  <div className="gap-section">
                    <strong>Moderate gaps</strong>
                    <div className="chip-list">
                      {(topSkillGap.gap_analysis?.moderate_gaps || []).slice(0, 8).map((skill, idx) => (
                        <span key={idx} className="skill-chip">{typeof skill === 'object' ? skill.skill : skill}</span>
                      ))}
                    </div>
                  </div>
                  <div className="gap-section">
                    <strong>Nice to have</strong>
                    <div className="chip-list">
                      {(topSkillGap.gap_analysis?.nice_to_have || []).slice(0, 8).map((skill, idx) => (
                        <span key={idx} className="skill-chip">{typeof skill === 'object' ? skill.skill : skill}</span>
                      ))}
                    </div>
                  </div>
                  <div className="gap-section">
                    <strong>Recommended courses</strong>
                    <div className="course-grid">
                      {(topSkillGap.recommended_courses || []).slice(0, 6).map((course) => (
                        <a
                          key={`${course.skill}-${course.provider}`}
                          href={course.url}
                          target="_blank"
                          rel="noreferrer"
                          className="course-card"
                        >
                          <span className="course-skill">{course.skill}</span>
                          <span className="course-provider">{course.provider}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                  <p>{stripHtml(topSkillGap.gap_analysis?.recommendations?.[0]) || 'Continue improving missing skills to raise your strongest match.'}</p>
                </>
              ) : (
                <p>No clear skill gaps were detected from the latest analysis.</p>
              )}
            </article>
          </section>

          <section className="surface-card">
            <span className="section-kicker">Analysis history</span>
            <h2>What changed across uploads</h2>
            <div className="history-list">
              {analysisHistory.length ? analysisHistory.map((item) => (
                <article key={item.analysis_id || `${item.timestamp}-${item.source_name}`} className="history-item">
                  <div>
                    <strong>{item.source_name || 'Resume analysis'}</strong>
                    <p>{item.predicted_roles?.join(', ') || item.predicted_role || 'No role summary'}</p>
                  </div>
                  <div className="history-meta">
                    <span>{item.resume_score}/100</span>
                    <small>{formatDateTime(item.timestamp)}</small>
                  </div>
                </article>
              )) : <p>No analysis history saved yet.</p>}
            </div>
          </section>

          <section className="surface-card">
            <span className="section-kicker">Job recommendations</span>
            <h2>Suggested roles from your analysis</h2>
            <div className="jobs-list">
              {dashboard.last_analysis.jobs?.length ? dashboard.last_analysis.jobs.map((job, index) => (
                <article key={`${job.title}-${job.company_name}-${index}`} className="job-card-detailed">
                  <div className="job-card-top">
                    <div>
                      <h3>{job.title}</h3>
                      <p>{job.company_name} {job.location ? `- ${job.location}` : ''}</p>
                    </div>
                    <span className="job-match-tag">{job.match_score}% match</span>
                  </div>
                  <p className="muted-copy">
                    Skill match {job.skill_match_score}% and role alignment {job.role_alignment_score}%.
                  </p>
                  <div className="job-skill-columns">
                    <div>
                      <strong>Matched skills</strong>
                      <div className="chip-list">
                        {(job.matched_skills || []).slice(0, 6).map((skill, idx) => (
                          <span key={idx} className="skill-chip">{typeof skill === 'object' ? skill.skill || skill.keyword || JSON.stringify(skill) : skill}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <strong>Missing skills</strong>
                      <div className="chip-list warning">
                        {(job.missing_skills || []).slice(0, 6).map((skill, idx) => (
                          <span key={idx} className="warning-chip">{typeof skill === 'object' ? skill.skill || skill.keyword || JSON.stringify(skill) : skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {!job.is_live_posting ? (
                    <p className="muted-copy">This item comes from the local catalog, so the button opens a job search for the same title/company instead of a confirmed live posting.</p>
                  ) : null}
                  <a href={job.url} target="_blank" rel="noreferrer" className="button button-ghost">
                    {job.action_label || 'Open job'}
                  </a>
                </article>
              )) : <p>No jobs were matched yet.</p>}
            </div>
          </section>
        </>
      ) : (
        <section className="surface-card empty-state">
          <Bot size={26} />
          <h2>No active analysis yet</h2>
          <p>Your dashboard starts blank after login. Upload a resume in this session to see ATS score, graphs, jobs, and improvement advice.</p>
          {dashboard?.has_saved_history ? (
            <p className="muted-copy">Saved history exists in your account, but it is not auto-loaded into the fresh dashboard view.</p>
          ) : null}
        </section>
      )}

      <section className="bottom-grid">
        <article className="surface-card">
          <span className="section-kicker">Feedback</span>
          <h2>Tell us how the analysis feels</h2>
          <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
            <label className="field">
              <span>Rating</span>
              <select
                value={feedback.rating}
                onChange={(event) => setFeedback((current) => ({ ...current, rating: Number(event.target.value) }))}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>{value} / 5</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Suggestion</span>
              <textarea
                rows="4"
                value={feedback.suggestion}
                onChange={(event) => setFeedback((current) => ({ ...current, suggestion: event.target.value }))}
                placeholder="What should improve in the dashboard or analysis?"
              />
            </label>
            <button type="submit" className="button button-primary">Submit feedback</button>
            {feedbackStatus ? <p className="muted-copy">{feedbackStatus}</p> : null}
          </form>
        </article>

        <article className="surface-card">
          <span className="section-kicker">Previous feedback</span>
          <h2>Your latest notes</h2>
          <div className="feedback-list">
            {dashboard?.user_feedback?.length ? dashboard.user_feedback.slice(0, 4).map((item, index) => (
              <div key={index} className="feedback-item">
                <strong>{item.rating}/5</strong>
                <p>{item.suggestion || 'No written note added.'}</p>
              </div>
            )) : <p>No feedback submitted yet.</p>}
          </div>
        </article>
      </section>

      <button type="button" className="floating-chat-button" onClick={() => setChatOpen((current) => !current)}>
        <MessageSquare size={20} />
      </button>

      {chatOpen ? (
        <section className="chat-panel">
          <div className="chat-panel-header">
            <div>
              <strong>Careevo Assistant</strong>
              <span>Uses your latest resume context and selected language</span>
            </div>
            <button type="button" className="button button-ghost" onClick={() => setChatOpen(false)}>Close</button>
          </div>

          <div className="chat-toolbar">
            <label className="chat-language-picker">
              <Languages size={16} />
              <select value={chatLanguage} onChange={(event) => setChatLanguage(event.target.value)}>
                {CHAT_LANGUAGES.map((language) => (
                  <option key={language.value} value={language.value}>{language.label}</option>
                ))}
              </select>
            </label>
            <button type="button" className={`button ${isListening ? 'button-primary' : 'button-ghost'}`} onClick={toggleVoiceInput}>
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              {isListening ? 'Stop mic' : 'Use mic'}
            </button>
          </div>

          <div className="chat-messages">
            {chatMessages.map((message, index) => (
              <div key={message.id || index} className={`chat-bubble ${message.role}`}>
                {message.content}
              </div>
            ))}
            {chatting ? <div className="chat-bubble bot typing-bubble">Careevo is typing<span /><span /><span /></div> : null}
          </div>

          <div className="chat-compose">
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  sendChat();
                }
              }}
              placeholder={isListening ? 'Listening...' : 'Ask about skills, ATS score, or best-fit jobs'}
            />
            <button type="button" className="button button-ghost" onClick={toggleVoiceInput}>
              <Mic size={16} />
            </button>
            <button type="button" className="button button-primary" onClick={sendChat}>
              <Send size={16} />
            </button>
          </div>
        </section>
      ) : null}

      {chatNotice ? (
        <div className="chat-notice">
          <strong>New reply</strong>
          <span>{chatNotice.slice(0, 96)}{chatNotice.length > 96 ? '...' : ''}</span>
        </div>
      ) : null}
    </main>
  );
}
