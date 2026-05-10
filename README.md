<p align="center">
  <img src="https://raw.githubusercontent.com/lintothoppil/Careevo/main/static/images/careevo-logo.png" alt="CareEvo Logo" width="120"/>
</p>

<h1 align="center">CareEvo</h1>

<p align="center">
  <b>AI-Powered Resume Builder & ATS Platform</b><br/>
  <i>Build smarter resumes. Beat the bots. Land the job.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/Flask-Backend-000000?style=for-the-badge&logo=flask&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Gemini_AI-Powered-4285F4?style=for-the-badge&logo=google&logoColor=white"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge"/>
</p>

---

## 🌿 What is CareEvo?

**CareEvo** is a modern, AI-powered Resume Builder and ATS (Applicant Tracking System) platform. It provides high-accuracy, universal resume parsing, weighted ATS scoring, actionable feedback, and a seamless resume building experience — all in one place.

> 🔁 CareEvo is the evolved successor of [Rezumai](https://github.com/lintothoppil/rezumai), rebuilt from the ground up with a new stack, smarter AI, and a refined UX.

---

## ✨ Features

### 🧠 Intelligent Resume Analysis
- **Universal Skill Extraction** — Accurately extracts skills across all professional domains
- **Advanced ATS Scoring** — Weighted scoring based on keywords, experience depth, education, and ATS-friendly formatting
- **Semantic Job Matching** — AI-powered similarity algorithms match you to top job roles
- **Skill Gap Analysis** — Identifies missing critical and bonus skills for your target role with actionable course suggestions
- **Comprehensive Resume Overview** — Generates a detailed narrative on strengths, weaknesses, and improvement steps

### 📝 Resume Builder
- **Dynamic React Builder** — Interactive, modern UI for building resumes block-by-block
- **ATS-Optimized Templates** — Clean, parsable PDFs (`CV_John_Doe.pdf`) designed to beat automated screeners
- **Live AI Suggestions** — Real-time skill and career summary recommendations during resume creation

### 🔐 Authentication & UI
- **Google OAuth Integration** — Streamlined login and registration using Google credentials
- **Modern UI/UX** — Soft Mint & Charcoal design system with micro-animations and a fully responsive layout

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Python / Flask |
| AI Engine | Google Gemini API |
| Auth | Google OAuth 2.0 |
| PDF Output | ATS-optimized templates |
| Styling | Custom design system (Mint & Charcoal) |

---

## 🚀 Getting Started

### Prerequisites

- Python `3.8+`
- Node.js `16+` and npm
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/lintothoppil/Careevo.git
cd Careevo
```

---

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Flask
SECRET_KEY=your_random_flask_secret_key_here
```

---

### 3. Backend Setup (Flask)

**Windows:**
```powershell
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
pip install python-dotenv
```

---

### 4. Frontend Setup (React + Vite)

```bash
cd frontend
npm install
npm run build
cd ..
```

---

### 5. Run the App

```bash
python app.py
```

Open your browser at **http://127.0.0.1:5000**

---

## 🏭 Production Deployment

> ⚠️ Do **not** use the Flask development server in production.

**Linux — Gunicorn:**
```bash
gunicorn -w 4 -b 127.0.0.1:5000 app:app
```

**Windows — Waitress:**
```bash
waitress-serve --port=5000 app:app
```

Pair with **Nginx** as a reverse proxy for best results.

---

## 📁 Project Structure

```
Careevo/
├── app.py                  # Flask entry point
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (not committed)
├── frontend/               # React + Vite frontend
│   ├── src/
│   └── dist/               # Built frontend (served by Flask)
├── static/                 # Flask static files
└── templates/              # Flask HTML templates
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repo
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

**Linto Thoppil**
GitHub: [@lintothoppil](https://github.com/lintothoppil)

---

<p align="center">
  Made with 💚 by the CareEvo team · <i>Evolve your career.</i>
</p>
