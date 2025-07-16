from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import firebase_admin
from firebase_admin import credentials, auth, firestore
from functools import wraps
import datetime
import os
from werkzeug.security import generate_password_hash, check_password_hash
import re
import logging

# Create required directories
os.makedirs('logs', exist_ok=True)
os.makedirs('uploads/resumes', exist_ok=True)
os.makedirs('config', exist_ok=True)
os.makedirs('models', exist_ok=True)
os.makedirs('routes', exist_ok=True)
os.makedirs('utils', exist_ok=True)
os.makedirs('services', exist_ok=True)

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')

# CORS setup
CORS(app, origins=[
    "http://localhost:3000",
    "http://localhost:8081",
    "http://172.20.10.7:8081",
    "exp://192.168.1.100:8081"
])

# Rate limiting
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=["2000 per day", "500 per hour"]
)

# Initialize Firebase Admin SDK
try:
    if os.path.exists('serviceAccountKey.json'):
        cred = credentials.Certificate('serviceAccountKey.json')
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase initialized")
    else:
        print("serviceAccountKey.json not found")
        db = None
except Exception as e:
    print(f"Firebase error: {e}")
    db = None

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler('logs/app.log'), logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Auth decorator
def auth_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = request.headers.get('X-User-ID')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401

        if db:
            try:
                doc = db.collection('users').document(user_id).get()
                if not doc.exists:
                    return jsonify({'error': 'Invalid user ID'}), 401
            except:
                return jsonify({'error': 'Verification failed'}), 401

        request.user_id = user_id
        return f(*args, **kwargs)
    return decorated

# Register Blueprints
try:
    from routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    print("✓ Auth routes loaded")
except Exception as e:
    print(f"✗ Auth routes error: {e}")

try:
    from routes.user_routes import user_bp
    app.register_blueprint(user_bp, url_prefix='/api/user')
    print("✓ User routes loaded")
except Exception as e:
    print(f"✗ User routes error: {e}")

try:
    from routes.resume_routes import resume_bp
    app.register_blueprint(resume_bp, url_prefix='/api/resume')
    print("✓ Resume routes loaded")
except Exception as e:
    print(f"✗ Resume routes error: {e}")

try:
    from routes.profile_analysis_routes import profile_analysis_bp
    app.register_blueprint(profile_analysis_bp, url_prefix='/api/profile-analysis')
    print("✓ Profile analysis routes loaded")
except Exception as e:
    print(f"✗ Profile analysis error: {e}")

try:
    from routes.community_routes import community_bp
    app.register_blueprint(community_bp, url_prefix='/api/community')
    print("✓ Community routes loaded")
except Exception as e:
    print(f"✗ Community routes error: {e}")

try:
    from routes.interview_routes import interview_bp
    app.register_blueprint(interview_bp, url_prefix='/api/interview')
    print("✓ Interview routes loaded")
except Exception as e:
    print(f"✗ Interview routes error: {e}")

try:
    from routes.portfolio_routes import portfolio_bp
    app.register_blueprint(portfolio_bp, url_prefix='/api/portfolio-analysis')
    print("✓ Portfolio analysis routes loaded")
except Exception as e:
    print(f"✗ Portfolio routes error: {e}")

# Profile Completion Info Endpoint
@app.route("/api/profile-completion/info", methods=["GET"])
def get_profile_completion_info():
    try:
        from utils.profile_completion_utils import ProfileCompletionManager
        return jsonify({
            "completion_system": {
                "basic_profile_percentage": 55,
                "additional_elements_percentage": 45,
                "total_percentage": 100
            },
            "steps": ProfileCompletionManager.COMPLETION_STEPS,
            "milestones": ProfileCompletionManager.get_milestones_info(),
            "xp_rewards": ProfileCompletionManager.XP_REWARDS
        }), 200
    except Exception as e:
        logger.error(f"Profile completion info error: {e}")
        return jsonify({"error": "Failed to get profile info"}), 500

# Status Check Endpoint
@app.route('/api/status', methods=['GET'])
def api_status():
    try:
        stats = {
            'api_status': 'healthy',
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'database_connected': db is not None,
            'features_available': {
                'authentication': auth_bp is not None,
                'user_management': user_bp is not None,
                'resume_processing': resume_bp is not None,
                'profile_analysis': profile_analysis_bp is not None,
                'community': community_bp is not None,
                'interview_system': interview_bp is not None,
                'portfolio_analysis': portfolio_bp is not None
            }
        }

        if db:
            try:
                from models.user_model import UserModel
                from models.resume_model import ResumeModel
                from models.profile_analysis_model import ProfileAnalysisModel

                stats.update({
                    'user_statistics': UserModel(db).get_user_statistics(),
                    'resume_statistics': ResumeModel(db).get_processing_statistics(),
                    'profile_analysis_statistics': ProfileAnalysisModel(db).get_analysis_statistics()
                })
            except Exception as e:
                stats['statistics_error'] = str(e)

        return jsonify(stats), 200
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        return jsonify({'error': str(e)}), 500

# Root Route
@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        'message': 'Skill Buddy API is running',
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'status': 'healthy',
        'version': '2.0.0',
        'features': [
            'Resume Processing',
            'User Management',
            'LinkedIn Profile Analysis',
            'GitHub Profile Analysis',
            'Interview System',
            'Portfolio Analysis'
        ]
    })

# Auth Test
@app.route('/api/test-auth', methods=['GET'])
@auth_required
def test_auth():
    return jsonify({
        'message': 'Authentication success',
        'user_id': request.user_id,
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
    })

# Profile Analysis Test
@app.route('/api/test-profile-analysis', methods=['GET'])
@auth_required
def test_profile_analysis():
    try:
        claude_api_key = os.environ.get('CLAUDE_API_KEY')
        github_token = os.environ.get('GITHUB_TOKEN')
        return jsonify({
            'message': 'Profile analysis test',
            'user_id': request.user_id,
            'claude_api_configured': bool(claude_api_key),
            'github_token_configured': bool(github_token),
            'features_status': {
                'linkedin_analysis': profile_analysis_bp is not None,
                'github_analysis': profile_analysis_bp is not None,
                'claude_integration': bool(claude_api_key),
                'interview_system': interview_bp is not None,
                'portfolio_analysis': portfolio_bp is not None
            }
        }), 200
    except Exception as e:
        logger.error(f"Profile test error: {e}")
        return jsonify({'error': 'Profile test failed', 'details': str(e)}), 500

# Error Handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(429)
def rate_limit_error(e):
    return jsonify({'error': 'Rate limit exceeded'}), 429

# Run Server
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') == 'development'
    print("=== Skill Buddy API Starting ===")
    print(f"Port: {port} | Debug: {debug}")
    app.run(host='0.0.0.0', port=port, debug=debug)