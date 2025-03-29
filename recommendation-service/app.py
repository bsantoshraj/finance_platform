# recommendation-service/app.py
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'Recommendation Service is running'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7000, debug=True)
