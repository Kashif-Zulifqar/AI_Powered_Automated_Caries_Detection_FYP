import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from auth import auth

load_dotenv(override=True)

def create_app():
    app = Flask(__name__)

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

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)