import os
import site
import sys
from pathlib import Path


def _ensure_project_venv_packages():
    """Load local .venv packages when launched from a non-venv interpreter."""
    if os.environ.get("VIRTUAL_ENV"):
        return

    project_root = Path(__file__).resolve().parent.parent
    venv_site = project_root / ".venv" / "Lib" / "site-packages"
    if venv_site.exists() and str(venv_site) not in sys.path:
        site.addsitedir(str(venv_site))


_ensure_project_venv_packages()

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from auth import auth
from api import api

load_dotenv(override=True)

def create_app():
    app = Flask(__name__)

    @app.route('/')
    def home():
        return "Model Loaded Successfully!"

    # CORS: allow all localhost/127.0.0.1 and any Vite port (5173–5180)
    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://127.0.0.1:5173")
    allowed_origins = [
        FRONTEND_ORIGIN,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ]
    CORS(
        app,
        resources={r"/*": {"origins": allowed_origins}},
        supports_credentials=True,
    )

    # Health check
    @app.get("/")
    def root():
        return jsonify({"message": "IADS Flask Backend Running"})

    # Register blueprints
    app.register_blueprint(auth)
    app.register_blueprint(api)

    # Backward-compatible alias used by current frontend upload page
    app.add_url_rule(
        "/predict",
        endpoint="predict_alias",
        view_func=app.view_functions["api.predict"],
        methods=["POST"],
    )

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)