# Careevo

Careevo is a modern, AI-powered Resume Builder and ATS (Applicant Tracking System) platform. It provides high-accuracy, universal resume parsing, weighted ATS scoring, actionable feedback, and a seamless resume building experience.

## ✨ Features

### 🧠 Intelligent Resume Analysis
- **Universal Skill Extraction**: Accurately extracts skills from uploaded resumes across all professional domains.
- **Advanced ATS Scoring**: Weighted scoring system that grades resumes based on keyword matches, skill relevance, experience depth, educational background, and ATS-friendly formatting.
- **Semantic Job Matching**: Uses AI-powered similarity algorithms to match candidate skills against a wide variety of job roles and provides top recommendations.
- **Skill Gap Analysis**: Identifies missing critical and bonus skills for your target role and suggests actionable improvements and courses.
- **Comprehensive Resume Overview**: Generates a detailed narrative on strengths, weaknesses, and concrete steps to improve your profile.

### 📝 Resume Builder
- **Dynamic React Builder**: An interactive, modern UI for building resumes block-by-block.
- **ATS-Optimized Templates**: Generates clean, easily parsable PDFs (`CV_John_Doe.pdf`) designed specifically to beat automated ATS screeners.
- **Skill Recommendations**: AI-driven live skill and career summary suggestions during the resume creation process.

### 🔐 Authentication & UI
- **Google OAuth Integration**: Streamlined login and registration using Google credentials.
- **Modern UI/UX**: Soft Mint and Charcoal design system with circular loading indicators, micro-animations, and a highly responsive layout.

---

## 🚀 How to Host on Another System

To host Careevo locally or on a server, follow these instructions. 

### Prerequisites
- **Python 3.8+** installed
- **Node.js 16+** and npm (for the frontend builder)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/lintothoppil/Careevo.git
cd Careevo
```

### 2. Environment Variables Setup
Create a `.env` file in the root of the project directory. You will need to add your API credentials here:
```env
# Google Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Google OAuth Credentials (for Login/Signup)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Flask App Secret
SECRET_KEY=your_random_flask_secret_key_here
```

### 3. Backend Setup (Flask)
Set up a Python virtual environment to keep dependencies isolated:

**On Windows:**
```powershell
python -m venv venv
venv\Scripts\activate
```

**On macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

Install the required Python packages:
```bash
pip install -r requirements.txt
pip install python-dotenv  # Required for loading the .env file
```

### 4. Frontend Setup (React/Vite)
The modern resume builder is built using React. Navigate to the frontend directory to install dependencies and build it.

```bash
cd frontend
npm install
npm run build
cd ..
```
*(Note: If your Flask app serves the React build from the `static` folder, you might need to copy the `dist` contents over, or just let Flask serve it directly if configured to do so).*

### 5. Running the Application
Initialize the database and start the Flask development server:

```bash
python app.py
```
The server will typically start on `http://127.0.0.1:5000/`. Open this URL in your browser to access the Careevo application.

### 6. Production Deployment Notes
For a true production environment, **do not use the Flask development server**. Instead, use a production-ready WSGI server like **Gunicorn** or **Waitress** and set up a reverse proxy like **Nginx**:
- **Gunicorn (Linux)**: `gunicorn -w 4 -b 127.0.0.1:5000 app:app`
- **Waitress (Windows)**: `waitress-serve --port=5000 app:app`
