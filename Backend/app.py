from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/test')
def test():
    return jsonify({"message": "Hurrah! Flask backend is running successfully!"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from auth import auth

load_dotenv()

def create_app():
    app = Flask(__name__)

    # CORS: allow your React dev server to call this API
    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://127.0.0.1:5173")
    CORS(
        app,
        resources={r"/*": {"origins": [FRONTEND_ORIGIN, "http://localhost:5173"]}},
        supports_credentials=True,
    )

    # Health check
    @app.get("/")
    def root():
        return jsonify({"message": "IADS Flask Backend Running ✅"})

    # Register blueprints
    app.register_blueprint(auth)

    return app

if __name__ == "__main__":
    from flask_cors import CORS
    app = create_app()  # or however you're creating your app
    CORS(app)
    app.run(debug=True, use_reloader=False)