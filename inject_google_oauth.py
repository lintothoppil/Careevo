"""
Inject Google OAuth routes into app.py.
Run once: python inject_google_oauth.py
"""

OAUTH_BLOCK = '''
# ─────────────────────────────────────────────────────────────────────────────
# GOOGLE OAUTH 2.0 SIGN-IN
# Set these in a .env or directly here (never commit real secrets to git)
# ─────────────────────────────────────────────────────────────────────────────
import os as _os
from google_auth_oauthlib.flow import Flow as _GoogleFlow
import google.auth.transport.requests as _GoogleAuthReq
from google.oauth2 import id_token as _GoogleIdToken
import pathlib as _pathlib

GOOGLE_CLIENT_ID     = _os.environ.get("GOOGLE_CLIENT_ID",     "YOUR_GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = _os.environ.get("GOOGLE_CLIENT_SECRET", "YOUR_GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI  = _os.environ.get("GOOGLE_REDIRECT_URI",  "http://127.0.0.1:5000/auth/google/callback")

# Allow HTTP for local dev (remove in production)
_os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")

_GOOGLE_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]

def _make_google_flow():
    return _GoogleFlow.from_client_config(
        client_config={
            "web": {
                "client_id":     GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri":      "https://accounts.google.com/o/oauth2/auth",
                "token_uri":     "https://oauth2.googleapis.com/token",
                "redirect_uris": [GOOGLE_REDIRECT_URI],
            }
        },
        scopes=_GOOGLE_SCOPES,
        redirect_uri=GOOGLE_REDIRECT_URI,
    )


@app.route("/auth/google")
def google_login():
    """Redirect the browser to Google\'s OAuth consent screen."""
    flow = _make_google_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="select_account",
    )
    session["google_oauth_state"] = state
    return redirect(auth_url)


@app.route("/auth/google/callback")
def google_callback():
    """Handle the redirect back from Google, create/login the user."""
    # Validate state to prevent CSRF
    if session.get("google_oauth_state") != request.args.get("state"):
        flash("OAuth state mismatch. Please try again.", "danger")
        return redirect(url_for("login"))

    flow = _make_google_flow()
    try:
        flow.fetch_token(authorization_response=request.url)
    except Exception as exc:
        flash(f"Google sign-in failed: {exc}", "danger")
        return redirect(url_for("login"))

    credentials = flow.credentials
    request_session = _GoogleAuthReq.Request()

    try:
        id_info = _GoogleIdToken.verify_oauth2_token(
            credentials.id_token, request_session, GOOGLE_CLIENT_ID
        )
    except ValueError as exc:
        flash(f"Could not verify Google token: {exc}", "danger")
        return redirect(url_for("login"))

    google_email = id_info.get("email", "").lower().strip()
    google_name  = id_info.get("name", google_email.split("@")[0].title())
    google_sub   = id_info.get("sub", "")   # unique Google user ID

    if not google_email:
        flash("Google did not return an email address.", "danger")
        return redirect(url_for("login"))

    # ── Upsert user in SQLite ─────────────────────────────────────────────────
    conn = sqlite3.connect("rezumai.db")
    cursor = conn.cursor()

    # Make sure nullable columns exist (migration for existing DBs)
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN google_sub TEXT")
        cursor.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT")
        conn.commit()
    except sqlite3.OperationalError:
        pass  # columns already exist

    cursor.execute("SELECT id, name, is_admin FROM users WHERE email = ?", (google_email,))
    existing = cursor.fetchone()

    if existing:
        user_id   = existing[0]
        user_name = existing[1]
        is_admin  = bool(existing[2])
        # Keep google_sub updated
        cursor.execute(
            "UPDATE users SET google_sub = ?, avatar_url = ? WHERE id = ?",
            (google_sub, id_info.get("picture"), user_id)
        )
    else:
        # New user via Google — no password needed, store sentinel
        cursor.execute(
            """INSERT INTO users
               (email, name, password_hash, security_question, security_answer_hash, google_sub, avatar_url)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                google_email,
                google_name,
                "GOOGLE_OAUTH_NO_PASSWORD",   # sentinel — never matches any hash
                "google_oauth",               # placeholder security question
                "google_oauth",               # placeholder answer
                google_sub,
                id_info.get("picture"),
            ),
        )
        user_id  = cursor.lastrowid
        is_admin = False
        user_name = google_name

    conn.commit()
    conn.close()

    # ── Set Flask session ─────────────────────────────────────────────────────
    session["user_id"]              = user_id
    session["user_email"]           = google_email
    session["user_name"]            = user_name
    session["is_admin"]             = is_admin
    session["current_analysis_id"]  = None
    session["chat_language"]        = "en-US"
    log_login(user_id)

    flash(f"Welcome, {user_name}! Signed in with Google.", "success")
    return redirect(url_for("admin_dashboard" if is_admin else "dashboard"))
# ─────────────────────────────────────────────────────────────────────────────
'''

with open("app.py", "r", encoding="utf-8") as f:
    content = f.read()

# Inject just before the /logout route so it's near the auth cluster
ANCHOR = "@app.route('/logout')"
if ANCHOR not in content:
    ANCHOR = "@app.route(\"/logout\")"

if "google_login" in content:
    print("Google OAuth routes already present — skipping injection.")
elif ANCHOR in content:
    content = content.replace(ANCHOR, OAUTH_BLOCK + "\n" + ANCHOR, 1)
    with open("app.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("Google OAuth routes injected successfully.")
else:
    # Append at end
    with open("app.py", "a", encoding="utf-8") as f:
        f.write(OAUTH_BLOCK)
    print("Google OAuth routes appended to app.py.")
