"""
skill_normalizer.py
Master skill alias dictionary and normalizer for ALL professions.
Shared by: ATS scorer, job recommender, skill gap analyzer, resume parser.
"""

import re

# ─── MASTER SKILL ALIAS DICTIONARY ───────────────────────────────────────────
# Maps every known alias/abbreviation → canonical skill name
SKILL_ALIASES = {
    # Programming languages
    "py": "Python", "python3": "Python", "python2": "Python",
    "js": "JavaScript", "javascript": "JavaScript", "es6": "JavaScript",
    "ts": "TypeScript", "tsx": "TypeScript",
    "ml": "Machine Learning", "machine learning": "Machine Learning",
    "dl": "Deep Learning", "deep learning": "Deep Learning",
    "ai": "Artificial Intelligence",
    "c#": "C#", "csharp": "C#", "c sharp": "C#",
    "c++": "C++", "cpp": "C++",
    "golang": "Go", "go lang": "Go",
    "rb": "Ruby", "ruby on rails": "Ruby on Rails", "ror": "Ruby on Rails",
    "php": "PHP",
    "kotlin": "Kotlin", "swift": "Swift",
    "rs": "Rust", "rust lang": "Rust",
    "scala": "Scala", "r language": "R", "r programming": "R",

    # Web frameworks
    "reactjs": "React", "react.js": "React", "react js": "React",
    "nextjs": "Next.js", "next js": "Next.js", "next.js": "Next.js",
    "vuejs": "Vue.js", "vue js": "Vue.js", "vue": "Vue.js",
    "angularjs": "Angular", "angular js": "Angular",
    "nodejs": "Node.js", "node js": "Node.js", "node": "Node.js",
    "expressjs": "Express.js", "express js": "Express.js", "express": "Express.js",
    "django rest": "Django REST Framework", "drf": "Django REST Framework",
    "fastapi": "FastAPI", "flask": "Flask", "django": "Django",
    "laravel": "Laravel", "spring": "Spring Boot", "spring boot": "Spring Boot",
    "nuxt": "Nuxt.js", "svelte": "Svelte",
    "graphql": "GraphQL", "grpc": "gRPC", "rest api": "REST API", "restful": "REST API",

    # Data / AI / ML
    "nlp": "Natural Language Processing", "natural language processing": "Natural Language Processing",
    "cv": "Computer Vision", "computer vision": "Computer Vision",
    "tf": "TensorFlow", "tensorflow": "TensorFlow",
    "pytorch": "PyTorch", "torch": "PyTorch",
    "sklearn": "Scikit-learn", "scikit learn": "Scikit-learn", "scikit-learn": "Scikit-learn",
    "keras": "Keras", "huggingface": "HuggingFace", "hugging face": "HuggingFace",
    "pandas": "Pandas", "numpy": "NumPy", "matplotlib": "Matplotlib",
    "seaborn": "Seaborn", "plotly": "Plotly",
    "tableau": "Tableau", "powerbi": "Power BI", "power bi": "Power BI",
    "looker": "Looker", "superset": "Apache Superset",
    "spark": "Apache Spark", "hadoop": "Hadoop", "kafka": "Apache Kafka",
    "airflow": "Apache Airflow", "dbt": "dbt",
    "sql": "SQL", "mysql": "MySQL", "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL", "sqlite": "SQLite", "mssql": "SQL Server",
    "oracle db": "Oracle Database", "nosql": "NoSQL",
    "mongodb": "MongoDB", "mongo": "MongoDB",
    "redis": "Redis", "cassandra": "Cassandra", "elasticsearch": "Elasticsearch",
    "neo4j": "Neo4j", "dynamodb": "DynamoDB",

    # Cloud / DevOps
    "aws": "AWS", "amazon web services": "AWS",
    "gcp": "GCP", "google cloud": "GCP", "google cloud platform": "GCP",
    "azure": "Azure", "microsoft azure": "Azure",
    "docker": "Docker", "kubernetes": "Kubernetes", "k8s": "Kubernetes",
    "terraform": "Terraform", "ansible": "Ansible", "puppet": "Puppet",
    "jenkins": "Jenkins", "github actions": "GitHub Actions",
    "gitlab ci": "GitLab CI/CD", "ci/cd": "CI/CD", "cicd": "CI/CD",
    "linux": "Linux", "ubuntu": "Linux", "centos": "Linux",
    "git": "Git", "github": "GitHub", "gitlab": "GitLab", "bitbucket": "Bitbucket",

    # Business / Finance
    "excel": "Microsoft Excel", "ms excel": "Microsoft Excel",
    "powerpoint": "Microsoft PowerPoint", "ms office": "Microsoft Office",
    "word": "Microsoft Word",
    "quickbooks": "QuickBooks", "sap": "SAP", "erp": "ERP",
    "tally": "Tally", "xero": "Xero",
    "financial modelling": "Financial Modeling", "financial modeling": "Financial Modeling",
    "fp&a": "FP&A", "budgeting": "Budgeting", "forecasting": "Forecasting",
    "ifrs": "IFRS", "gaap": "GAAP", "cpa": "CPA",
    "risk management": "Risk Management", "compliance": "Compliance",

    # Marketing / Sales
    "seo": "SEO", "sem": "SEM", "ppc": "PPC", "google ads": "Google Ads",
    "facebook ads": "Facebook Ads", "meta ads": "Facebook Ads",
    "email marketing": "Email Marketing", "content marketing": "Content Marketing",
    "social media marketing": "Social Media Marketing", "smm": "Social Media Marketing",
    "hubspot": "HubSpot", "salesforce": "Salesforce", "crm": "CRM",
    "mailchimp": "Mailchimp", "hootsuite": "Hootsuite",
    "google analytics": "Google Analytics", "ga4": "Google Analytics",
    "lead generation": "Lead Generation", "b2b": "B2B Sales", "b2c": "B2C Sales",

    # Design / Creative
    "figma": "Figma", "sketch": "Sketch", "adobe xd": "Adobe XD",
    "photoshop": "Adobe Photoshop", "illustrator": "Adobe Illustrator",
    "indesign": "Adobe InDesign", "premiere": "Adobe Premiere Pro",
    "after effects": "Adobe After Effects",
    "ux": "UX Design", "ui": "UI Design", "ux/ui": "UX/UI Design",
    "wireframing": "Wireframing", "prototyping": "Prototyping",
    "user research": "User Research", "usability testing": "Usability Testing",

    # Healthcare
    "emr": "EMR Systems", "ehr": "EHR Systems",
    "icd-10": "ICD-10 Coding", "cpt": "CPT Coding",
    "hipaa": "HIPAA Compliance",
    "phlebotomy": "Phlebotomy", "venipuncture": "Venipuncture",
    "patient care": "Patient Care", "clinical research": "Clinical Research",
    "pharmacovigilance": "Pharmacovigilance",

    # Education
    "curriculum development": "Curriculum Development",
    "lesson planning": "Lesson Planning", "lms": "LMS",
    "e-learning": "E-Learning", "instructional design": "Instructional Design",
    "bloom's taxonomy": "Bloom's Taxonomy",

    # Project Management
    "agile": "Agile", "scrum": "Scrum", "kanban": "Kanban",
    "waterfall": "Waterfall", "prince2": "PRINCE2",
    "pmp": "PMP", "jira": "JIRA", "confluence": "Confluence",
    "asana": "Asana", "trello": "Trello", "ms project": "MS Project",
    "lean": "Lean", "six sigma": "Six Sigma", "kaizen": "Kaizen",

    # Soft skills
    "communication": "Communication", "leadership": "Leadership",
    "teamwork": "Teamwork", "problem solving": "Problem Solving",
    "problem-solving": "Problem Solving",
    "critical thinking": "Critical Thinking", "time management": "Time Management",
    "adaptability": "Adaptability", "creativity": "Creativity",
    "negotiation": "Negotiation", "presentation": "Presentation Skills",
}

# ─── SKILL TAXONOMY: groups of related/interchangeable skills ─────────────────
# Used for semantic matching (if you have A in group, partial credit for group)
SKILL_GROUPS = {
    "python_ecosystem": ["Python", "Django", "Flask", "FastAPI", "Pandas", "NumPy", "Scikit-learn"],
    "js_ecosystem": ["JavaScript", "TypeScript", "React", "Next.js", "Vue.js", "Angular", "Node.js", "Express.js"],
    "java_ecosystem": ["Java", "Spring Boot", "Kotlin", "Maven", "Gradle"],
    "data_science": ["Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn", "NLP", "Computer Vision"],
    "data_analytics": ["SQL", "Python", "R", "Tableau", "Power BI", "Excel", "Google Analytics"],
    "cloud": ["AWS", "GCP", "Azure", "Terraform", "Kubernetes", "Docker"],
    "devops": ["Docker", "Kubernetes", "CI/CD", "Jenkins", "GitHub Actions", "Ansible", "Terraform", "Linux"],
    "databases": ["SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Cassandra", "DynamoDB"],
    "marketing_digital": ["SEO", "SEM", "Google Ads", "Facebook Ads", "Email Marketing", "Content Marketing", "Social Media Marketing"],
    "design": ["Figma", "Adobe XD", "UX Design", "UI Design", "Prototyping", "Wireframing"],
    "finance": ["Financial Modeling", "Excel", "Budgeting", "Forecasting", "IFRS", "SAP", "QuickBooks"],
    "project_management": ["Agile", "Scrum", "JIRA", "Kanban", "Lean", "Six Sigma", "PMP"],
    "sales_crm": ["Salesforce", "HubSpot", "CRM", "Lead Generation", "B2B Sales", "B2C Sales"],
}

# ─── UNIVERSAL JOB TAXONOMY ───────────────────────────────────────────────────
# Maps every job role → required skills (required) + nice-to-have (preferred)
UNIVERSAL_JOB_ROLES = {
    # ── Technology ──
    "Python Developer": {
        "required": ["Python", "Django", "Flask", "REST API", "SQL", "Git"],
        "preferred": ["FastAPI", "Docker", "AWS", "Celery", "Redis"],
        "context_keywords": ["python", "backend", "api", "django", "flask"],
    },
    "JavaScript Developer": {
        "required": ["JavaScript", "Node.js", "React", "HTML", "CSS", "Git"],
        "preferred": ["TypeScript", "Next.js", "GraphQL", "Docker"],
        "context_keywords": ["javascript", "frontend", "react", "node", "web"],
    },
    "Full Stack Developer": {
        "required": ["JavaScript", "React", "Node.js", "SQL", "REST API", "Git"],
        "preferred": ["TypeScript", "Docker", "AWS", "MongoDB", "GraphQL"],
        "context_keywords": ["fullstack", "full stack", "mern", "mean", "web development"],
    },
    "Data Scientist": {
        "required": ["Python", "Machine Learning", "SQL", "Pandas", "NumPy", "Scikit-learn"],
        "preferred": ["TensorFlow", "PyTorch", "NLP", "Deep Learning", "Spark", "Tableau"],
        "context_keywords": ["data science", "machine learning", "model", "algorithm", "statistics"],
    },
    "Data Analyst": {
        "required": ["SQL", "Excel", "Python", "Tableau", "Power BI", "Data Visualization"],
        "preferred": ["R", "Google Analytics", "Looker", "dbt", "Apache Spark"],
        "context_keywords": ["data analysis", "reporting", "dashboard", "analytics", "insights"],
    },
    "ML Engineer": {
        "required": ["Python", "Machine Learning", "TensorFlow", "PyTorch", "Docker", "REST API"],
        "preferred": ["Kubernetes", "MLflow", "Airflow", "Spark", "AWS"],
        "context_keywords": ["ml engineer", "model deployment", "mlops", "deep learning"],
    },
    "DevOps Engineer": {
        "required": ["Docker", "Kubernetes", "CI/CD", "Linux", "AWS", "Git"],
        "preferred": ["Terraform", "Ansible", "Jenkins", "Prometheus", "Grafana"],
        "context_keywords": ["devops", "infrastructure", "deployment", "pipeline", "automation"],
    },
    "Cloud Engineer": {
        "required": ["AWS", "Azure", "GCP", "Docker", "Terraform", "Linux"],
        "preferred": ["Kubernetes", "CI/CD", "Python", "Ansible"],
        "context_keywords": ["cloud", "aws", "azure", "gcp", "infrastructure"],
    },
    "Cybersecurity Analyst": {
        "required": ["Network Security", "SIEM", "Penetration Testing", "Vulnerability Assessment", "Compliance"],
        "preferred": ["Python", "Forensics", "Cloud Security", "HIPAA", "ISO 27001"],
        "context_keywords": ["security", "cyber", "penetration", "vulnerability", "soc"],
    },
    "Mobile Developer": {
        "required": ["React Native", "Flutter", "JavaScript", "iOS", "Android", "API Integration"],
        "preferred": ["Swift", "Kotlin", "Firebase", "Redux"],
        "context_keywords": ["mobile", "app development", "android", "ios", "flutter"],
    },
    "QA Engineer": {
        "required": ["Testing", "Selenium", "Test Cases", "JIRA", "Agile"],
        "preferred": ["Python", "Automation", "Postman", "JMeter", "Cypress"],
        "context_keywords": ["quality assurance", "testing", "qa", "automation", "bugs"],
    },
    "Database Administrator": {
        "required": ["SQL", "MySQL", "PostgreSQL", "Database Administration", "Backup Recovery"],
        "preferred": ["Oracle Database", "MongoDB", "Performance Tuning", "AWS RDS"],
        "context_keywords": ["database", "dba", "sql", "oracle", "performance"],
    },

    # ── Business ──
    "Business Analyst": {
        "required": ["Business Analysis", "Requirements Gathering", "Documentation", "SQL", "Communication"],
        "preferred": ["Agile", "JIRA", "Tableau", "Power BI", "Six Sigma"],
        "context_keywords": ["business analyst", "requirements", "process", "stakeholder", "brd"],
    },
    "Product Manager": {
        "required": ["Product Management", "Roadmap", "Agile", "User Stories", "Strategy", "Leadership"],
        "preferred": ["SQL", "Analytics", "Figma", "JIRA", "A/B Testing"],
        "context_keywords": ["product manager", "roadmap", "product strategy", "user stories"],
    },
    "Project Manager": {
        "required": ["Agile", "Scrum", "JIRA", "Leadership", "Stakeholder Management", "Risk Management"],
        "preferred": ["PMP", "MS Project", "Budgeting", "Six Sigma", "Confluence"],
        "context_keywords": ["project manager", "delivery", "stakeholder", "sprint", "pmp"],
    },
    "Operations Manager": {
        "required": ["Operations Management", "Process Improvement", "Leadership", "Supply Chain", "Budgeting"],
        "preferred": ["Lean", "Six Sigma", "ERP", "SAP", "Data Analysis"],
        "context_keywords": ["operations", "supply chain", "logistics", "process", "efficiency"],
    },
    "Management Consultant": {
        "required": ["Business Analysis", "Strategy", "Problem Solving", "Presentation Skills", "Excel"],
        "preferred": ["Financial Modeling", "SQL", "Power BI", "Six Sigma", "MBA"],
        "context_keywords": ["consulting", "strategy", "mckinsey", "bcg", "advisory"],
    },

    # ── Finance & Accounting ──
    "Financial Analyst": {
        "required": ["Financial Modeling", "Excel", "Forecasting", "Budgeting", "Accounting"],
        "preferred": ["SQL", "Power BI", "SAP", "Python", "IFRS", "CPA"],
        "context_keywords": ["finance", "financial", "analyst", "modeling", "valuation"],
    },
    "Accountant": {
        "required": ["Accounting", "Tally", "Microsoft Excel", "GAAP", "Budgeting", "Taxation"],
        "preferred": ["SAP", "QuickBooks", "Xero", "IFRS", "Audit"],
        "context_keywords": ["accounting", "accountant", "tally", "bookkeeping", "audit"],
    },
    "Investment Banker": {
        "required": ["Financial Modeling", "Valuation", "Excel", "Mergers & Acquisitions", "Capital Markets"],
        "preferred": ["Bloomberg", "Python", "SQL", "IFRS", "CFA"],
        "context_keywords": ["investment banking", "m&a", "valuation", "ipo", "capital"],
    },
    "Risk Analyst": {
        "required": ["Risk Management", "Excel", "Compliance", "Data Analysis", "Reporting"],
        "preferred": ["SQL", "Python", "IFRS", "Tableau", "FRM"],
        "context_keywords": ["risk", "compliance", "regulatory", "audit", "exposure"],
    },

    # ── Marketing & Sales ──
    "Digital Marketing Specialist": {
        "required": ["SEO", "Google Ads", "Facebook Ads", "Google Analytics", "Content Marketing", "Social Media Marketing"],
        "preferred": ["Email Marketing", "HubSpot", "Mailchimp", "PPC", "Copywriting"],
        "context_keywords": ["digital marketing", "seo", "ppc", "campaign", "ads"],
    },
    "Content Writer": {
        "required": ["Content Writing", "Copywriting", "SEO", "Research", "Communication"],
        "preferred": ["WordPress", "Social Media Marketing", "Email Marketing", "HubSpot"],
        "context_keywords": ["content", "writer", "copywriting", "blog", "editing"],
    },
    "Sales Representative": {
        "required": ["Sales", "CRM", "Salesforce", "Lead Generation", "Negotiation", "Communication"],
        "preferred": ["HubSpot", "B2B Sales", "LinkedIn Sales Navigator", "Presentation Skills"],
        "context_keywords": ["sales", "revenue", "quota", "pipeline", "crm", "lead"],
    },
    "Marketing Manager": {
        "required": ["Marketing Strategy", "Campaign Management", "SEO", "Social Media Marketing", "Google Analytics", "Leadership"],
        "preferred": ["HubSpot", "Salesforce", "Budgeting", "Content Marketing", "PPC"],
        "context_keywords": ["marketing manager", "brand", "campaign", "marketing strategy"],
    },

    # ── HR ──
    "HR Specialist": {
        "required": ["Recruitment", "Onboarding", "Employee Relations", "HRIS", "Compliance", "Communication"],
        "preferred": ["Workday", "Talent Acquisition", "HR Analytics", "SHRM", "Performance Management"],
        "context_keywords": ["hr", "human resources", "recruitment", "talent", "employee"],
    },
    "Recruiter": {
        "required": ["Sourcing", "Interviewing", "Applicant Tracking System", "LinkedIn Recruiting", "Communication"],
        "preferred": ["Workday", "Greenhouse", "Lever", "Employer Branding", "HR Analytics"],
        "context_keywords": ["recruiter", "talent acquisition", "hiring", "sourcing", "interview"],
    },

    # ── Design ──
    "UX Designer": {
        "required": ["UX Design", "User Research", "Wireframing", "Prototyping", "Figma"],
        "preferred": ["Adobe XD", "Usability Testing", "Sketch", "HTML", "CSS"],
        "context_keywords": ["ux", "user experience", "wireframe", "prototype", "research"],
    },
    "Graphic Designer": {
        "required": ["Adobe Photoshop", "Adobe Illustrator", "Creativity", "Typography", "Branding"],
        "preferred": ["Figma", "InDesign", "Adobe After Effects", "Video Editing"],
        "context_keywords": ["graphic design", "visual", "branding", "illustrator", "photoshop"],
    },

    # ── Healthcare ──
    "Nurse": {
        "required": ["Patient Care", "Clinical Skills", "EMR Systems", "HIPAA Compliance", "Communication"],
        "preferred": ["ICU", "Phlebotomy", "Medication Administration", "BLS", "ACLS"],
        "context_keywords": ["nurse", "nursing", "patient", "clinical", "hospital"],
    },
    "Doctor": {
        "required": ["Clinical Research", "Diagnosis", "Patient Care", "ICD-10 Coding", "HIPAA Compliance"],
        "preferred": ["EMR Systems", "Research", "Surgery", "Pharmacology"],
        "context_keywords": ["doctor", "physician", "mbbs", "clinical", "diagnosis"],
    },
    "Medical Lab Technician": {
        "required": ["Lab Testing", "Phlebotomy", "Microscopy", "Quality Control", "HIPAA Compliance"],
        "preferred": ["PCR", "ELISA", "Lab Information Systems", "Data Entry"],
        "context_keywords": ["lab", "technician", "laboratory", "specimen", "testing"],
    },

    # ── Education ──
    "Teacher": {
        "required": ["Lesson Planning", "Curriculum Development", "Communication", "Classroom Management", "Assessment"],
        "preferred": ["LMS", "E-Learning", "Microsoft Office", "Differentiated Instruction"],
        "context_keywords": ["teacher", "teaching", "education", "school", "students"],
    },
    "Instructional Designer": {
        "required": ["Instructional Design", "E-Learning", "LMS", "Curriculum Development", "Content Writing"],
        "preferred": ["Articulate Storyline", "Adobe Captivate", "Bloom's Taxonomy", "Video Editing"],
        "context_keywords": ["instructional designer", "e-learning", "lms", "curriculum", "training"],
    },

    # ── Legal ──
    "Lawyer": {
        "required": ["Legal Research", "Contract Drafting", "Litigation", "Compliance", "Communication"],
        "preferred": ["Corporate Law", "IP Law", "Negotiation", "LexisNexis", "Microsoft Office"],
        "context_keywords": ["lawyer", "attorney", "legal", "law", "litigation"],
    },

    # ── Engineering (non-software) ──
    "Mechanical Engineer": {
        "required": ["AutoCAD", "SolidWorks", "CATIA", "Thermodynamics", "Manufacturing"],
        "preferred": ["ANSYS", "Lean", "Six Sigma", "Project Management", "MATLAB"],
        "context_keywords": ["mechanical", "cad", "solidworks", "manufacturing", "autocad"],
    },
    "Civil Engineer": {
        "required": ["AutoCAD", "Structural Analysis", "Project Management", "Construction", "Surveying"],
        "preferred": ["STAAD Pro", "Revit", "GIS", "MS Project", "Budgeting"],
        "context_keywords": ["civil", "construction", "structural", "autocad", "project site"],
    },
    "Electrical Engineer": {
        "required": ["Circuit Design", "MATLAB", "PLC Programming", "Power Systems", "AutoCAD Electrical"],
        "preferred": ["Embedded Systems", "SCADA", "Python", "IoT", "PCB Design"],
        "context_keywords": ["electrical", "circuit", "power", "plc", "embedded"],
    },

    # ── Customer Support ──
    "Customer Support Specialist": {
        "required": ["Customer Service", "Communication", "CRM", "Problem Solving", "Ticketing Systems"],
        "preferred": ["Zendesk", "Salesforce", "Email Support", "Live Chat", "Empathy"],
        "context_keywords": ["customer support", "help desk", "service", "ticket", "zendesk"],
    },
}

# ─── COURSE RESOURCES ────────────────────────────────────────────────────────
COURSE_RESOURCES = {
    "Python": {"provider": "Coursera", "url": "https://www.coursera.org/learn/python", "time": "6 weeks"},
    "Machine Learning": {"provider": "Coursera", "url": "https://www.coursera.org/learn/machine-learning", "time": "11 weeks"},
    "Deep Learning": {"provider": "Coursera", "url": "https://www.coursera.org/specializations/deep-learning", "time": "16 weeks"},
    "SQL": {"provider": "Udemy", "url": "https://www.udemy.com/courses/search/?q=sql", "time": "4 weeks"},
    "JavaScript": {"provider": "freeCodeCamp", "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", "time": "6 weeks"},
    "React": {"provider": "Udemy", "url": "https://www.udemy.com/courses/search/?q=react", "time": "4 weeks"},
    "AWS": {"provider": "AWS Training", "url": "https://aws.amazon.com/training/", "time": "6 weeks"},
    "Docker": {"provider": "Udemy", "url": "https://www.udemy.com/courses/search/?q=docker", "time": "2 weeks"},
    "Kubernetes": {"provider": "Udemy", "url": "https://www.udemy.com/courses/search/?q=kubernetes", "time": "3 weeks"},
    "Tableau": {"provider": "Udemy", "url": "https://www.udemy.com/courses/search/?q=tableau", "time": "3 weeks"},
    "Power BI": {"provider": "Microsoft Learn", "url": "https://learn.microsoft.com/en-us/training/powerplatform/power-bi", "time": "4 weeks"},
    "SEO": {"provider": "HubSpot Academy", "url": "https://academy.hubspot.com/courses/seo-training-course", "time": "2 weeks"},
    "Google Ads": {"provider": "Google Skillshop", "url": "https://skillshop.withgoogle.com/", "time": "2 weeks"},
    "Figma": {"provider": "Udemy", "url": "https://www.udemy.com/courses/search/?q=figma", "time": "2 weeks"},
    "Agile": {"provider": "Coursera", "url": "https://www.coursera.org/learn/agile-development", "time": "4 weeks"},
    "Financial Modeling": {"provider": "CFI", "url": "https://corporatefinanceinstitute.com/resources/financial-modeling/", "time": "6 weeks"},
    "default": {"provider": "Udemy", "url": "https://www.udemy.com/courses/search/?q=", "time": "4 weeks"},
}


def normalize_skill(raw: str) -> str:
    """Normalize a raw skill string to its canonical name."""
    if not raw:
        return ""
    cleaned = re.sub(r'\s+', ' ', raw.strip().lower())
    # Check alias map first (exact match)
    if cleaned in SKILL_ALIASES:
        return SKILL_ALIASES[cleaned]
    # Try title-case lookup
    title = raw.strip().title()
    if title in SKILL_ALIASES:
        return SKILL_ALIASES[title]
    # Return cleaned title-cased version
    return raw.strip().title()


def normalize_skills_list(skills: list) -> list:
    """Normalize a list of raw skills."""
    seen = {}
    for s in skills:
        norm = normalize_skill(s)
        key = norm.lower()
        if key not in seen:
            seen[key] = norm
    return list(seen.values())


def skills_from_text(text: str) -> list:
    """
    Extract ALL known skills from free text by scanning against the full
    SKILL_ALIASES + UNIVERSAL_JOB_ROLES required/preferred skill pool.
    Returns normalized canonical skill names.
    """
    text_l = text.lower()
    found = set()

    # Build a unified lookup: alias/canonical → canonical
    lookup = {}
    for alias, canonical in SKILL_ALIASES.items():
        lookup[alias.lower()] = canonical
    # Also add all role required/preferred skills as their own aliases
    for role_data in UNIVERSAL_JOB_ROLES.values():
        for skill in role_data.get("required", []) + role_data.get("preferred", []):
            lookup[skill.lower()] = skill

    # Sort longest-first to catch multi-word skills before sub-words
    for phrase in sorted(lookup.keys(), key=len, reverse=True):
        pattern = r'(?<![a-z0-9+#./])' + re.escape(phrase) + r'(?![a-z0-9+#./])'
        if re.search(pattern, text_l):
            found.add(lookup[phrase])

    return sorted(found)


def get_course_for_skill(skill: str) -> dict:
    """Return course resource dict for a skill."""
    res = COURSE_RESOURCES.get(skill)
    if res:
        return {"skill": skill, **res}
    # Fuzzy fallback
    skill_l = skill.lower()
    for key, val in COURSE_RESOURCES.items():
        if key.lower() in skill_l or skill_l in key.lower():
            return {"skill": skill, **val}
    default = COURSE_RESOURCES["default"].copy()
    default["url"] += skill.lower().replace(" ", "+")
    return {"skill": skill, **default}
