import os
import subprocess
import sys
from pathlib import Path


def _configure_windows_dll_paths(project_root: Path):
    """Expose venv DLL directories when loading native wheels on Windows."""
    if os.name != "nt":
        return

    dll_dirs = [
        project_root / ".venv" / "Scripts",
        project_root / ".venv" / "Library" / "bin",
        project_root / ".venv" / "Lib" / "site-packages" / "torch" / "lib",
    ]

    for dll_dir in dll_dirs:
        if not dll_dir.exists():
            continue

        os.environ["PATH"] = f"{dll_dir}{os.pathsep}{os.environ.get('PATH', '')}"
        try:
            os.add_dll_directory(str(dll_dir))
        except (AttributeError, FileNotFoundError):
            pass


def _ensure_project_venv_runtime():
    """Re-exec with local .venv python so AI dependencies load consistently."""
    project_root = Path(__file__).resolve().parent.parent
    venv_python = project_root / ".venv" / "Scripts" / "python.exe"

    if os.name == "nt" and venv_python.exists():
        current = Path(sys.executable).resolve()
        target = venv_python.resolve()
        if current != target and os.environ.get("DENTALAI_VENV_BOOTSTRAPPED") != "1":
            env = os.environ.copy()
            env["DENTALAI_VENV_BOOTSTRAPPED"] = "1"
            env["VIRTUAL_ENV"] = str(project_root / ".venv")
            code = subprocess.call(
                [str(target), str(Path(__file__).resolve()), *sys.argv[1:]],
                cwd=str(Path(__file__).resolve().parent),
                env=env,
            )
            raise SystemExit(code)

    _configure_windows_dll_paths(project_root)


_ensure_project_venv_runtime()

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.exceptions import HTTPException
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

    def _wants_json_errors() -> bool:
        if request.path.startswith("/api/") or request.path == "/predict":
            return True
        return "application/json" in (request.headers.get("Accept") or "")

    @app.errorhandler(HTTPException)
    def handle_http_exception(exc: HTTPException):
        if _wants_json_errors():
            return jsonify({"error": exc.description}), exc.code
        return exc

    @app.errorhandler(Exception)
    def handle_unexpected_exception(exc: Exception):
        app.logger.exception("Unhandled backend error")
        if _wants_json_errors():
            return jsonify({"error": "Internal server error", "details": str(exc)}), 500
        return jsonify({"error": "Internal server error"}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)