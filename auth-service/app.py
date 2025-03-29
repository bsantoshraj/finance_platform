# auth-service/app.py
from flask import Flask
from flask_cors import CORS
from routes.auth import bp as auth_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(auth_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
