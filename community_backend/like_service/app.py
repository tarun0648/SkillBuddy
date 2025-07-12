from flask import Flask, jsonify
import uuid
import sys
import os

# Add parent directory to path so we can import from shared
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from shared.firebase_config import db

app = Flask(__name__)

@app.route('/like/<post_id>', methods=['POST'])
def like_post(post_id):
    like_id = str(uuid.uuid4())
    db.child("posts").child(post_id).child("likes").child(like_id).set(True)
    return jsonify({"message": "Post liked"})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "OK"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)
