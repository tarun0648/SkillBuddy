from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
from datetime import datetime
import sys
import os

# Allow import from shared/
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from shared.firebase_config import db

app = Flask(__name__)

CORS(app)


# Create a new post
@app.route('/posts', methods=['POST'])
def create_post():
    data = request.json
    post_id = str(uuid.uuid4())
    timestamp = datetime.now().isoformat()

    post_data = {
        "post_id": post_id,
        "content": data["content"],
        "timestamp": timestamp,
        "likes": {},
        "replies": {}
    }

    db.child("posts").child(post_id).set(post_data)
    return jsonify({"message": "Post created", "post_id": post_id})


# Get all posts (sorted newest first) with like/reply counts and replies
@app.route('/posts', methods=['GET'])
def get_posts():
    posts = db.child("posts").get().val() or {}
    result = []

    for post_id, post in posts.items():
        content = post.get("content", "")
        timestamp = post.get("timestamp", "")

        # Likes
        likes = post.get("likes", {})
        like_count = len(likes)

        # Replies
        replies_raw = post.get("replies", {})
        reply_count = len(replies_raw)

        replies = []
        if replies_raw:
            replies = sorted(
                replies_raw.values(),
                key=lambda r: r.get("timestamp", ""),
                reverse=True
            )

        post_info = {
            "post_id": post_id,
            "content": content,
            "timestamp": timestamp,
            "like_count": like_count,
            "reply_count": reply_count,
            "replies": replies
        }

        result.append(post_info)

    # Sort posts by timestamp (newest first)
    result.sort(key=lambda post: post["timestamp"], reverse=True)

    return jsonify(result)


# Health check
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "OK"})


# App entry point
if __name__ == '__main__':
    print("Post service running on port 5001")
    app.run(host='0.0.0.0', port=5001)
