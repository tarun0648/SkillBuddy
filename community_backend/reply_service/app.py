from flask import Flask, request, jsonify
import uuid
from datetime import datetime
import sys
import os

# Allow import from shared/
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from shared.firebase_config import db

app = Flask(__name__)

@app.route('/reply/<post_id>', methods=['POST'])
def reply_to_post(post_id):
    data = request.json
    reply_id = str(uuid.uuid4())
    timestamp = datetime.now().isoformat()

    reply_data = {
        "reply_id": reply_id,
        "text": data["text"],
        "timestamp": timestamp
    }

    db.child("posts").child(post_id).child("replies").child(reply_id).set(reply_data)
    return jsonify({"message": "Reply added", "reply_id": reply_id})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "OK"})

if __name__ == '__main__':
    print("Reply service running on port 5003")
    app.run(host='0.0.0.0', port=5003)
