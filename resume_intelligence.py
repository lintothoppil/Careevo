"""
resume_intelligence.py
Accurate, universal resume analysis engine.
Replaces the inaccurate logic in app.py for:
  1. Skill extraction (universal, all professions)
  2. ATS scoring (weighted, structured)
  3. Job recommendation (cosine similarity across all job types)
  4. Skill gap analysis (critical / improvement / bonus, actionable)
  5. Resume overview (strengths, weaknesses, how to fix)
"""

import os
import re
import math
import json
import google.generativeai as genai
from collections import Counter
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
from skill_normalizer import (
    skills_from_text, normalize_skill, normalize_skills_list,
    UNIVERSAL_JOB_ROLES, SKILL_GROUPS, get_course_for_skill
)

# ─── HELPERS ──────────────────────────────────────────────────────────────────

def _tokenize(text: str) -> list:
    return re.findall(r'[a-zA-Z0-9#+./]+', text.lower())

def _cosine_sim(vec_a: Counter, vec_b: Counter) -> float:
    if not vec_a or not vec_b:
        return 0.0
    dot = sum(vec_a[k] * vec_b.get(k, 0) for k in vec_a)
    mag_a = math.sqrt(sum(v**2 for v in vec_a.values()))
    mag_b = math.sqrt(sum(v**2 for v in vec_b.values()))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)

def _extract_years_experience(text: str) -> float:
    """Return best-estimate years of experience from resume text."""
    patterns = [
        r'(\d+(?:\.\d+)?)\s*\+?\s*years?\s+of\s+experience',
        r'(\d+(?:\.\d+)?)\s*\+?\s*years?\s+experience',
        r'experience\s+of\s+(\d+(?:\.\d+)?)\s*\+?\s*years?',
        r'(\d+(?:\.\d+)?)\s*\+?\s*yrs?\s+exp',
    ]
    candidates = []
    for p in patterns:
        for m in re.finditer(p, text.lower()):
            try:
                candidates.append(float(m.group(1)))
            except ValueError:
                pass
    return max(candidates) if candidates else 0.0

def _detect_education_level(text: str) -> str:
    text_l = text.lower()
    if any(w in text_l for w in ["ph.d", "phd", "doctorate", "doctor of"]):
        return "PhD"
    if any(w in text_l for w in ["master", "m.sc", "m.tech", "mba", "m.e.", "ms in", "m.s."]):
        return "Masters"
    if any(w in text_l for w in ["bachelor", "b.e.", "b.tech", "b.sc", "b.com", "b.a.", "undergraduate"]):
        return "Bachelors"
    if any(w in text_l for w in ["diploma", "associate", "certificate course", "high school"]):
        return "Diploma"
    return "Unknown"

def _seniority_score(text: str) -> float:
    """0-1 seniority multiplier from text signals."""
    text_l = text.lower()
    if any(w in text_l for w in ["chief", "vp ", "vice president", "director", "head of", "c-level"]):
        return 1.0
    if any(w in text_l for w in ["senior", "lead ", "principal", "manager", "architect"]):
        return 0.75
    if any(w in text_l for w in ["mid", "associate ", "specialist"]):
        return 0.5
    if any(w in text_l for w in ["junior", "fresher", "intern", "entry level", "graduate"]):
        return 0.25
    return 0.4  # Default mid-level assumption


# ─── 1. SKILL EXTRACTION ─────────────────────────────────────────────────────

def extract_skills_from_resume(text: str) -> list:
    """
    Universal skill extractor for all professions.
    Returns normalized canonical skill names.
    """
    return skills_from_text(text)


# ─── 2. ATS SCORING ──────────────────────────────────────────────────────────

def compute_ats_score(text: str, extracted_skills: list, job_description: str = "") -> dict:
    """
    Accurate ATS score with weighted breakdown.
    Total = 100 points:
      keyword_match  35 pts  (TF-IDF cosine against JD, or density if no JD)
      skills_match   25 pts  (extracted skills count vs expected)
      experience     20 pts  (years detected vs. seniority signals)
      education      10 pts  (degree level detected)
      formatting     10 pts  (ATS readability signals)
    """
    text_l = text.lower()
    word_count = len(re.findall(r'\w+', text))

    # — Keyword match (35 pts) —
    if job_description:
        resume_vec = Counter(_tokenize(text))
        jd_vec = Counter(_tokenize(job_description))
        sim = _cosine_sim(resume_vec, jd_vec)
        kw_score = round(sim * 35, 2)
    else:
        # Fallback: skill density approach
        kw_score = min(35, len(extracted_skills) * 2.5)

    # — Skills match (25 pts) —
    # Estimate: 10+ skills = full marks, linear below
    skill_count = len(extracted_skills)
    skill_score = min(25, skill_count * 2.5)

    # — Experience (20 pts) —
    yoe = _extract_years_experience(text)
    seniority = _seniority_score(text)
    if yoe == 0 and seniority > 0.4:
        # No explicit YoE but senior signals → give partial credit
        exp_score = seniority * 15
    else:
        exp_score = min(20, yoe * 2 + seniority * 10)

    # — Education (10 pts) —
    edu = _detect_education_level(text)
    edu_map = {"PhD": 10, "Masters": 9, "Bachelors": 7, "Diploma": 5, "Unknown": 3}
    edu_score = edu_map.get(edu, 3)

    # — Formatting (10 pts) —
    fmt_score = 0
    if re.search(r'[\w.+-]+@[\w.-]+', text):         fmt_score += 2  # email present
    if re.search(r'\+?[\d\s\-()]{9,}', text):        fmt_score += 1  # phone
    if 300 <= word_count <= 1200:                     fmt_score += 3  # ideal length
    elif 200 <= word_count < 300:                     fmt_score += 1
    if any(s in text_l for s in ['experience', 'education', 'skills', 'summary', 'projects']):
        fmt_score += 2  # sections present
    # Penalise very short or very long resumes
    if word_count < 150:                              fmt_score = max(0, fmt_score - 3)
    if word_count > 1500:                             fmt_score = max(0, fmt_score - 2)
    # Action verbs
    action_verbs = ["developed","built","led","managed","designed","implemented",
                    "improved","created","analysed","analyzed","delivered","deployed",
                    "reduced","increased","achieved","coordinated","launched","established"]
    if any(v in text_l for v in action_verbs):        fmt_score += 2
    fmt_score = min(10, fmt_score)

    total = round(kw_score + skill_score + exp_score + edu_score + fmt_score)
    total = max(0, min(100, total))

    return {
        "overall_score": total,
        "breakdown": {
            "keyword_match":  round(kw_score, 1),
            "skills_match":   round(skill_score, 1),
            "experience":     round(exp_score, 1),
            "education":      round(edu_score, 1),
            "formatting":     round(fmt_score, 1),
        },
        "education_level": edu,
        "years_experience": round(yoe, 1),
        "seniority_level": (
            "Senior" if seniority >= 0.75 else
            "Mid-level" if seniority >= 0.45 else
            "Junior/Entry"
        ),
    }


# ─── 3. JOB RECOMMENDATION ───────────────────────────────────────────────────

def _skill_set_match(candidate_skills: set, required: list, preferred: list) -> dict:
    """Return matched/missing skills and scores for a job role."""
    req_set = {s.lower() for s in required}
    pref_set = {s.lower() for s in preferred}
    cand_set = {s.lower() for s in candidate_skills}

    matched_req = [s for s in required if s.lower() in cand_set]
    missing_req = [s for s in required if s.lower() not in cand_set]
    matched_pref = [s for s in preferred if s.lower() in cand_set]
    missing_pref = [s for s in preferred if s.lower() not in cand_set]

    req_score = (len(matched_req) / len(required)) if required else 0
    pref_score = (len(matched_pref) / len(preferred)) if preferred else 0

    return {
        "matched_required": matched_req,
        "missing_required": missing_req,
        "matched_preferred": matched_pref,
        "missing_preferred": missing_pref,
        "required_match_pct": round(req_score * 100, 1),
        "preferred_match_pct": round(pref_score * 100, 1),
    }


def _context_score(text: str, context_keywords: list) -> float:
    """0-1 score based on how many context keywords appear in text."""
    text_l = text.lower()
    hits = sum(1 for kw in context_keywords if kw in text_l)
    return min(1.0, hits / max(len(context_keywords), 1))


def recommend_jobs(
    extracted_skills: list,
    text: str,
    yoe: float = 0.0,
    education_level: str = "Unknown",
    seniority: str = "Mid-level",
) -> list:
    """
    Rank ALL jobs in UNIVERSAL_JOB_ROLES by cosine similarity.
    Scoring formula:
      skills_match  * 0.45
      experience    * 0.30
      education     * 0.15
      context_match * 0.10

    Returns: sorted list of dicts with match %, matched/missing skills, reason.
    """
    cand_skills = set(s.lower() for s in extracted_skills)
    results = []

    # Map seniority string → expected YoE range
    seniority_yoe = {"Senior": 5, "Mid-level": 3, "Junior/Entry": 0}
    expected_yoe = seniority_yoe.get(seniority, 2)

    # Education ordering
    edu_rank = {"PhD": 5, "Masters": 4, "Bachelors": 3, "Diploma": 2, "Unknown": 1}
    cand_edu_rank = edu_rank.get(education_level, 1)

    for role_name, role_data in UNIVERSAL_JOB_ROLES.items():
        required = role_data.get("required", [])
        preferred = role_data.get("preferred", [])
        ctx_kws = role_data.get("context_keywords", [])

        match_data = _skill_set_match(cand_skills, required, preferred)

        # — Skills component (0-1) —
        # Weight required 70%, preferred 30%
        skills_component = (
            match_data["required_match_pct"] / 100 * 0.70 +
            match_data["preferred_match_pct"] / 100 * 0.30
        )

        # — Experience component (0-1) —
        if expected_yoe == 0:
            exp_component = 1.0
        elif yoe == 0:
            exp_component = 0.3  # No YoE mentioned but some credit
        else:
            exp_component = min(1.0, yoe / max(expected_yoe, 1))

        # — Education component (0-1) —
        edu_component = min(1.0, cand_edu_rank / 3)  # Bachelors=1.0, Masters>1 capped

        # — Context component (0-1) —
        context_component = _context_score(text, ctx_kws)

        # — Final weighted score —
        final_score = (
            skills_component   * 0.45 +
            exp_component      * 0.30 +
            edu_component      * 0.15 +
            context_component  * 0.10
        )
        match_pct = round(final_score * 100, 1)

        if match_pct < 10:
            continue  # Skip irrelevant roles

        # Build reason string
        reasons = []
        if match_data["matched_required"]:
            reasons.append(f"Matched required skills: {', '.join(match_data['matched_required'][:3])}")
        if match_data["missing_required"]:
            reasons.append(f"Missing key skills: {', '.join(match_data['missing_required'][:3])}")

        results.append({
            "role": role_name,
            "match_percentage": match_pct,
            "matched_skills": match_data["matched_required"] + match_data["matched_preferred"],
            "missing_required": match_data["missing_required"],
            "missing_preferred": match_data["missing_preferred"],
            "required_match_pct": match_data["required_match_pct"],
            "reason": ". ".join(reasons),
        })

    results.sort(key=lambda x: x["match_percentage"], reverse=True)
    return results[:10]  # Top 10 role matches


# ─── 4. SKILL GAP ANALYSIS ───────────────────────────────────────────────────

def analyze_skill_gaps_universal(extracted_skills: list, top_roles: list) -> dict:
    """
    For each top matched role, classify gaps into:
      CRITICAL  – required skills completely absent
      IMPROVEMENT – preferred/mentioned partially
      BONUS – nice-to-have not present
    Each gap skill gets a course resource and priority.
    Never flags skills the user already has.
    """
    cand_skills_lower = {s.lower() for s in extracted_skills}
    gaps_by_role = {}

    for role_match in top_roles[:5]:
        role_name = role_match["role"]
        role_data = UNIVERSAL_JOB_ROLES.get(role_name, {})
        required = role_data.get("required", [])
        preferred = role_data.get("preferred", [])

        critical = []    # Required — completely missing
        bonus = []       # Preferred — missing

        for skill in required:
            if skill.lower() not in cand_skills_lower:
                course = get_course_for_skill(skill)
                critical.append({
                    "skill": skill,
                    "category": "CRITICAL",
                    "priority": "High",
                    "reason": f"Required for {role_name}",
                    "course": course,
                })

        for skill in preferred:
            if skill.lower() not in cand_skills_lower:
                course = get_course_for_skill(skill)
                bonus.append({
                    "skill": skill,
                    "category": "BONUS",
                    "priority": "Low",
                    "reason": f"Preferred/Nice-to-have for {role_name}",
                    "course": course,
                })

        gaps_by_role[role_name] = {
            "match_percentage": role_match["match_percentage"],
            "critical_gaps": critical[:6],
            "bonus_gaps": bonus[:4],
            "current_skills": [s for s in extracted_skills if s.lower() in {r.lower() for r in required + preferred}],
            "gap_summary": (
                f"{len(critical)} critical skills missing, "
                f"{len(bonus)} preferred skills missing for {role_name}."
            ),
        }

    return gaps_by_role


# ─── 5. RESUME OVERVIEW ──────────────────────────────────────────────────────

def generate_resume_overview(
    text: str,
    extracted_skills: list,
    ats_result: dict,
    top_roles: list,
    skill_gaps: dict,
) -> dict:
    """
    Generates a plain-language narrative:
      - strengths (what's good)
      - weaknesses (what's missing or weak)
      - how_to_improve (actionable steps per weakness)
      - executive_summary (one paragraph)
    """
    score = ats_result.get("overall_score", 0)
    breakdown = ats_result.get("breakdown", {})
    yoe = ats_result.get("years_experience", 0)
    edu = ats_result.get("education_level", "Unknown")
    seniority = ats_result.get("seniority_level", "Mid-level")
    text_l = text.lower()

    strengths = []
    weaknesses = []
    how_to_improve = []

    # ── Skill strengths ──
    if len(extracted_skills) >= 10:
        strengths.append(f"Strong skill portfolio with {len(extracted_skills)} identified skills: {', '.join(extracted_skills[:5])}…")
    elif len(extracted_skills) >= 5:
        strengths.append(f"Decent skill set with {len(extracted_skills)} skills including {', '.join(extracted_skills[:4])}.")
    else:
        weaknesses.append("Too few skills detected — the resume may lack specific technical or domain skills.")
        how_to_improve.append("Add a dedicated Skills section listing all tools, technologies, and competencies relevant to your target role.")

    # ── Role alignment strength ──
    if top_roles:
        top = top_roles[0]
        if top["match_percentage"] >= 70:
            strengths.append(f"Strong alignment with '{top['role']}' ({top['match_percentage']}% match).")
        elif top["match_percentage"] >= 45:
            weaknesses.append(f"Moderate fit for '{top['role']}' ({top['match_percentage']}%). Critical skills are missing.")
            gaps = skill_gaps.get(top["role"], {}).get("critical_gaps", [])
            missing_names = [g["skill"] for g in gaps[:3]]
            if missing_names:
                how_to_improve.append(f"For '{top['role']}', acquire: {', '.join(missing_names)}. These are marked HIGH priority.")
        else:
            weaknesses.append(f"Low fit ({top['match_percentage']}%) for top matched role '{top['role']}'. Resume needs significant skill additions.")
            how_to_improve.append(f"Focus on building skills required for '{top['role']}' — start with the HIGH priority gaps listed below.")

    # ── ATS keyword score ──
    kw = breakdown.get("keyword_match", 0)
    if kw >= 25:
        strengths.append("Good keyword density — resume is likely to pass ATS filters.")
    elif kw >= 15:
        weaknesses.append("Moderate keyword density. ATS filters may partially reject this resume.")
        how_to_improve.append("Sprinkle job-specific keywords throughout the Experience and Summary sections — mirror language from job descriptions.")
    else:
        weaknesses.append("Low keyword density — high risk of ATS rejection before a human reads it.")
        how_to_improve.append("Research 3-5 target job descriptions and incorporate their exact keywords and phrases into your resume.")

    # ── Quantified achievements ──
    metrics_count = len(re.findall(r'\d+\s*(%|x|million|thousand|k\b|lpa|lakh)', text_l))
    if metrics_count >= 5:
        strengths.append(f"Excellent use of quantified achievements ({metrics_count} metrics found — shows real impact).")
    elif metrics_count >= 2:
        weaknesses.append("Only a few quantified achievements. Recruiters prefer data-driven bullet points.")
        how_to_improve.append("Transform weak bullets: instead of 'Managed team', write 'Managed 8-person team, reducing delivery time by 30%'.")
    else:
        weaknesses.append("No quantified achievements detected. This is one of the biggest ATS and recruiter pain points.")
        how_to_improve.append("Add numbers to at least 5 experience bullets: percentages, revenue figures, team sizes, timelines saved.")

    # ── Experience ──
    if yoe >= 3:
        strengths.append(f"{yoe} years of experience detected — meets expectations for mid-to-senior roles.")
    elif yoe > 0:
        weaknesses.append(f"Only {yoe} year(s) of experience found. Suitable for junior roles only.")
        how_to_improve.append("Highlight internships, freelance projects, open-source contributions to compensate for limited experience.")
    else:
        weaknesses.append("No explicit work experience duration detected.")
        how_to_improve.append("State your years of experience explicitly in the summary: e.g., '3+ years of experience in...'")

    # ── Education ──
    if edu in ["Masters", "PhD"]:
        strengths.append(f"{edu} degree detected — strong educational foundation.")
    elif edu == "Bachelors":
        strengths.append("Bachelor's degree detected — meets baseline requirement for most roles.")
    elif edu == "Diploma":
        weaknesses.append("Only a Diploma detected. Some roles require a degree.")
        how_to_improve.append("Consider pursuing a relevant certification or degree to strengthen your profile for competitive roles.")
    else:
        weaknesses.append("Education level could not be detected — ensure your degree is clearly stated.")
        how_to_improve.append("Add an Education section with: Degree Name, Institution, Year of Graduation.")

    # ── Formatting ──
    fmt = breakdown.get("formatting", 0)
    word_count = len(re.findall(r'\w+', text))
    if fmt >= 8:
        strengths.append("Well-structured resume with good formatting and essential sections.")
    if word_count < 200:
        weaknesses.append("Resume is too short. Recruiters expect detailed, substantive resumes.")
        how_to_improve.append("Expand each work experience entry with 3-5 bullet points describing responsibilities and achievements.")
    elif word_count > 1400:
        weaknesses.append("Resume is too long. Aim for 1-2 pages maximum.")
        how_to_improve.append("Trim older or less relevant roles to 1-2 bullets. Remove redundant information.")

    # ── Action verbs ──
    weak_phrases = ["responsible for", "worked on", "assisted", "helped with", "involved in"]
    found_weak = [p for p in weak_phrases if p in text_l]
    if found_weak:
        weaknesses.append(f"Weak action phrases detected: '{found_weak[0]}'. These reduce impact.")
        how_to_improve.append(f"Replace '{found_weak[0]}' with power verbs: Developed, Engineered, Designed, Led, Optimized, Deployed.")

    # ── Executive summary paragraph ──
    if not top_roles:
        exec_summary = (
            f"This resume scores {score}/100 on ATS readiness. "
            "No strong role match was found — the resume may lack industry-specific keywords or skills. "
            "Focus on adding a dedicated skills section and quantifying achievements."
        )
    else:
        top = top_roles[0]
        strength_text = strengths[0] if strengths else "some relevant skills"
        weakness_text = weaknesses[0] if weaknesses else "areas that can be improved"
        exec_summary = (
            f"This resume scores {score}/100 on ATS readiness and best matches '{top['role']}' "
            f"at {top['match_percentage']}% compatibility. "
            f"Key strength: {strength_text}. "
            f"Primary area to improve: {weakness_text}. "
            f"With targeted additions of {len(skill_gaps.get(top['role'], {}).get('critical_gaps', []))} critical skills "
            f"and better quantification of achievements, this resume can realistically reach 80+ ATS score."
        )

    return {
        "executive_summary": exec_summary,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "how_to_improve": how_to_improve,
        "ats_score": score,
        "ats_breakdown": breakdown,
        "education_level": edu,
        "years_experience": yoe,
        "seniority_level": seniority,
        "top_strength": strengths[0] if strengths else "Profile requires more details",
        "key_improvement": how_to_improve[0] if how_to_improve else "Add relevant skills and quantify achievements",
    }


# ─── MASTER ANALYSIS ENTRY POINT ─────────────────────────────────────────────

def local_resume_analysis(text: str, job_description: str = "") -> dict:
    """
    Run the complete analysis pipeline.
    Returns a single dict consumed by the Flask dashboard route.
    """
    # Step 1 — Extract skills
    skills = extract_skills_from_resume(text)

    # Step 2 — ATS score
    ats = compute_ats_score(text, skills, job_description)
    yoe = ats["years_experience"]
    edu = ats["education_level"]
    seniority = ats["seniority_level"]

    # Step 3 — Job recommendations (all roles)
    top_roles = recommend_jobs(skills, text, yoe, edu, seniority)

    # Step 4 — Skill gaps for top roles
    gaps = analyze_skill_gaps_universal(skills, top_roles)

    # Step 5 — Overview narrative
    overview = generate_resume_overview(text, skills, ats, top_roles, gaps)

    # Step 6 — Job match chart data
    job_roles_chart = [
        {"role": r["role"], "match_percentage": r["match_percentage"]}
        for r in top_roles[:5]
    ]

    return {
        # Core results
        "skills": skills,
        "ats_score": ats["overall_score"],
        "ats_breakdown": ats["breakdown"],
        "education_level": edu,
        "years_experience": yoe,
        "seniority_level": seniority,

        # Job matching
        "job_matches": top_roles[:5],
        "job_roles_data": job_roles_chart,
        "predicted_role": top_roles[0]["role"] if top_roles else "General Professional",

        # Skill gaps
        "skill_gaps": gaps,

        # Overview / narrative
        "executive_summary": overview["executive_summary"],
        "strengths": overview["strengths"],
        "weaknesses": overview["weaknesses"],
        "how_to_improve": overview["how_to_improve"],
        "top_strength": overview["top_strength"],
        "key_improvement": overview["key_improvement"],
        "ai_executive_summary": overview["executive_summary"],

        # Improvement tips (existing dashboard key)
        "improvements": overview["weaknesses"] + overview["how_to_improve"],
        "recommendation_label": _label(ats["overall_score"]),

        # Legacy keys (for existing templates)
        "keywords": skills,
        "improvement_feedback": [
            f"💪 {s}" for s in overview["strengths"]
        ] + [
            f"🔧 {w}" for w in overview["weaknesses"]
        ],
        "summary_suggestions": overview["executive_summary"],
        "skills_suggestions": f"Detected {len(skills)} skills: {', '.join(skills[:10])}",
        "ats_explanation": f"ATS Score {ats['overall_score']}/100 — {_label(ats['overall_score'])}",
        "quantified_suggestions": [],
        "keyword_analysis": {r["role"]: {
            "found_keywords": r["matched_skills"],
            "missing_keywords": r["missing_required"][:5],
        } for r in top_roles[:3]},
    }


def full_resume_analysis(text: str, job_description: str = "") -> dict:
    """
    Run the complete analysis pipeline using Google Gemini API.
    Falls back to local rules-based analysis if the API fails.
    """
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""
You are an expert ATS and career coach. Analyze the following resume text.
If a job description is provided, compare the resume against it.
Return ONLY a valid JSON object (no markdown, no code blocks, just raw JSON) matching exactly this schema:

{{
  "skills": ["List", "of", "extracted", "skills"],
  "ats_score": 85, // integer 0-100
  "ats_breakdown": {{
    "keyword_match": 30.0, // float
    "skills_match": 20.0,
    "experience": 15.0,
    "education": 10.0,
    "formatting": 10.0
  }},
  "education_level": "Masters", // e.g. Bachelors, Masters, PhD, Diploma, Unknown
  "years_experience": 5.0, // float
  "seniority_level": "Mid-level", // Junior/Entry, Mid-level, Senior
  "job_matches": [
    {{
      "role": "Frontend Developer",
      "match_percentage": 85.0,
      "matched_skills": ["React", "JavaScript"],
      "missing_required": ["TypeScript"],
      "missing_preferred": ["Docker"],
      "required_match_pct": 80.0,
      "reason": "Strong match based on React experience."
    }} // up to 5 recommended roles
  ],
  "job_roles_data": [
    {{"role": "Frontend Developer", "match_percentage": 85.0}} // must match the 5 roles above
  ],
  "predicted_role": "Frontend Developer", // top role
  "skill_gaps": {{
    "Frontend Developer": {{
      "match_percentage": 85.0,
      "critical_gaps": [
        {{"skill": "TypeScript", "category": "CRITICAL", "priority": "High", "reason": "Required for this role", "course": "TypeScript for Beginners"}}
      ],
      "bonus_gaps": [
        {{"skill": "Docker", "category": "BONUS", "priority": "Low", "reason": "Nice to have", "course": "Docker Essentials"}}
      ],
      "current_skills": ["React", "JavaScript"],
      "gap_summary": "Missing TypeScript which is critical."
    }}
  }}, // Map of role names to gap analysis
  "executive_summary": "A 1 paragraph summary of the resume strengths and weaknesses.",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "how_to_improve": ["Actionable tip 1", "Actionable tip 2"],
  "top_strength": "Best strength here",
  "key_improvement": "Most important improvement here",
  "ai_executive_summary": "A 1 paragraph summary.",
  "improvements": ["Combined weakness 1", "Actionable tip 1"],
  "recommendation_label": "Great 🌟",
  "keywords": ["List", "of", "skills"],
  "improvement_feedback": ["💪 Strength 1", "🔧 Weakness 1"],
  "summary_suggestions": "Summary paragraph here",
  "skills_suggestions": "Detected X skills...",
  "ats_explanation": "ATS Score 85/100 - Great",
  "quantified_suggestions": [],
  "keyword_analysis": {{
    "Frontend Developer": {{
      "found_keywords": ["React"],
      "missing_keywords": ["TypeScript"]
    }}
  }}
}}

Job Description (Optional):
{job_description}

Resume Text:
{text}
"""
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        result = json.loads(response_text.strip())
        return result
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return local_resume_analysis(text, job_description)


def _label(score: int) -> str:
    if score >= 85: return "Great 🌟"
    if score >= 70: return "Good ✅"
    if score >= 50: return "Can be Better 🔧"
    if score >= 30: return "Needs Work ⚠️"
    return "Significant Improvements Needed ❌"
