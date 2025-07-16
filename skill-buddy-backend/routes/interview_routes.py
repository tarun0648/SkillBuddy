# routes/interview_routes.py
from flask import Blueprint, request, jsonify
from config.firebase_config import firebase_config
from models.user_model import UserModel
import logging
from datetime import datetime
import uuid

# Create blueprint
interview_bp = Blueprint('interview', __name__)

# Initialize components
db = firebase_config.get_db()
if db:
    user_model = UserModel(db)
else:
    user_model = None

logger = logging.getLogger(__name__)

def auth_required(f):
    """Local auth decorator for interview routes"""
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = request.headers.get('X-User-ID')
        if not user_id:
            return jsonify({'error': 'User ID required in X-User-ID header'}), 401
        
        # Verify user exists in database
        if db:
            try:
                doc_ref = db.collection('users').document(user_id)
                doc = doc_ref.get()
                if not doc.exists:
                    return jsonify({'error': 'Invalid user ID'}), 401
            except Exception as e:
                return jsonify({'error': 'User verification failed'}), 401
        
        request.user_id = user_id
        return f(*args, **kwargs)
    
    return decorated

@interview_bp.route('/questions/<career_path>', methods=['GET'])
@auth_required
def get_interview_questions(career_path):
    """Get interview questions for a specific career path"""
    try:
        user_id = request.user_id
        count = request.args.get('count', type=int)
        
        # Get user profile for context
        user_doc = db.collection('users').document(user_id).get()
        if not user_doc.exists:
            return jsonify({'error': 'User profile not found'}), 404
        
        user_data = user_doc.to_dict()
        user_profile = user_data.get('profile', {})
        
        # Generate questions based on career path and user profile
        questions = generate_questions_for_career(career_path, user_profile, count)
        
        return jsonify({
            'career_path': career_path,
            'questions': questions,
            'count': len(questions),
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting interview questions: {e}")
        return jsonify({'error': 'Failed to get interview questions', 'details': str(e)}), 500

@interview_bp.route('/submit', methods=['POST'])
@auth_required
def submit_interview():
    """Submit interview results"""
    try:
        user_id = request.user_id
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No interview data provided'}), 400
        
        # Validate required fields
        required_fields = ['career_path', 'questions', 'answers', 'scores']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        # Create interview record
        interview_id = str(uuid.uuid4())
        interview_data = {
            'interview_id': interview_id,
            'user_id': user_id,
            'career_path': data['career_path'],
            'questions': data['questions'],
            'answers': data['answers'],
            'scores': data['scores'],
            'total_score': sum(data['scores']),
            'average_score': sum(data['scores']) / len(data['scores']),
            'submitted_at': datetime.utcnow().isoformat(),
            'status': 'completed'
        }
        
        # Save to database
        db.collection('interviews').document(interview_id).set(interview_data)
        
        # Award XP for completing interview
        xp_earned = 25  # Base XP for completing interview
        user_model.update_user(user_id, {
            'xp.total_xp': user_model.get_user(user_id).get('xp', {}).get('total_xp', 0) + xp_earned
        })
        
        logger.info(f"Interview submitted for user {user_id}, interview_id: {interview_id}")
        
        return jsonify({
            'message': 'Interview submitted successfully',
            'interview_id': interview_id,
            'xp_earned': xp_earned,
            'total_score': interview_data['total_score'],
            'average_score': interview_data['average_score']
        }), 201
        
    except Exception as e:
        logger.error(f"Error submitting interview: {e}")
        return jsonify({'error': 'Failed to submit interview', 'details': str(e)}), 500

@interview_bp.route('/history', methods=['GET'])
@auth_required
def get_interview_history():
    """Get user's interview history"""
    try:
        user_id = request.user_id
        
        # Get interviews from database
        interviews_ref = db.collection('interviews').where('user_id', '==', user_id)
        interviews = interviews_ref.order_by('submitted_at', direction='DESCENDING').limit(20).stream()
        
        interview_list = []
        for interview in interviews:
            interview_data = interview.to_dict()
            interview_list.append({
                'interview_id': interview_data['interview_id'],
                'career_path': interview_data['career_path'],
                'total_score': interview_data['total_score'],
                'average_score': interview_data['average_score'],
                'submitted_at': interview_data['submitted_at'],
                'status': interview_data['status']
            })
        
        return jsonify({
            'interviews': interview_list,
            'count': len(interview_list)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting interview history: {e}")
        return jsonify({'error': 'Failed to get interview history', 'details': str(e)}), 500

@interview_bp.route('/results/<interview_id>', methods=['GET'])
@auth_required
def get_interview_results(interview_id):
    """Get detailed interview results"""
    try:
        user_id = request.user_id
        
        # Get interview from database
        interview_doc = db.collection('interviews').document(interview_id).get()
        if not interview_doc.exists:
            return jsonify({'error': 'Interview not found'}), 404
        
        interview_data = interview_doc.to_dict()
        
        # Verify user owns this interview
        if interview_data['user_id'] != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Generate detailed analysis
        analysis = analyze_interview_results(interview_data)
        
        return jsonify({
            'interview_id': interview_id,
            'career_path': interview_data['career_path'],
            'questions': interview_data['questions'],
            'answers': interview_data['answers'],
            'scores': interview_data['scores'],
            'total_score': interview_data['total_score'],
            'average_score': interview_data['average_score'],
            'analysis': analysis,
            'submitted_at': interview_data['submitted_at']
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting interview results: {e}")
        return jsonify({'error': 'Failed to get interview results', 'details': str(e)}), 500

def generate_questions_for_career(career_path, user_profile, count=None):
    """Generate interview questions for a specific career path"""
    # Default questions per career path
    career_questions = {
        'software_developer': [
            "What programming languages are you most comfortable with?",
            "Describe a challenging project you've worked on.",
            "How do you handle debugging complex issues?",
            "What's your experience with version control systems?",
            "How do you stay updated with technology trends?",
            "Describe your experience with agile methodologies.",
            "What's your approach to code optimization?"
        ],
        'data_analyst': [
            "What tools do you use for data analysis?",
            "Describe a data visualization project you've created.",
            "How do you handle missing or incomplete data?",
            "What's your experience with SQL?",
            "How do you validate your analysis results?",
            "Describe a time you found insights in unexpected data.",
            "What statistical methods are you familiar with?"
        ],
        'ui_designer': [
            "What design tools do you prefer?",
            "Describe your design process from concept to final.",
            "How do you gather user requirements?",
            "What's your experience with prototyping?",
            "How do you handle design feedback?",
            "Describe a project where you improved user experience.",
            "What's your approach to responsive design?"
        ],
        'digital_marketer': [
            "What marketing channels have you worked with?",
            "Describe a successful campaign you've run.",
            "How do you measure campaign performance?",
            "What's your experience with SEO?",
            "How do you create engaging content?",
            "Describe your experience with social media marketing.",
            "What tools do you use for marketing analytics?"
        ]
    }
    
    # Get questions for the career path
    questions = career_questions.get(career_path.lower(), [
        "Tell me about your background and experience.",
        "What are your strengths and weaknesses?",
        "Where do you see yourself in 5 years?",
        "Why are you interested in this role?",
        "Describe a challenging situation you've faced.",
        "How do you handle stress and pressure?",
        "What motivates you in your work?"
    ])
    
    # Limit number of questions if specified
    if count and count < len(questions):
        questions = questions[:count]
    
    return questions

def analyze_interview_results(interview_data):
    """Analyze interview results and provide feedback"""
    total_score = interview_data['total_score']
    max_possible = len(interview_data['scores']) * 10  # Assuming 10-point scale
    percentage = (total_score / max_possible) * 100
    
    if percentage >= 90:
        performance = "Excellent"
        feedback = "Outstanding performance! You demonstrated strong knowledge and skills."
    elif percentage >= 80:
        performance = "Very Good"
        feedback = "Strong performance with room for minor improvements."
    elif percentage >= 70:
        performance = "Good"
        feedback = "Good performance, consider focusing on areas for improvement."
    elif percentage >= 60:
        performance = "Fair"
        feedback = "Adequate performance, significant improvement needed."
    else:
        performance = "Needs Improvement"
        feedback = "Consider additional preparation and practice."
    
    return {
        'performance_level': performance,
        'percentage_score': round(percentage, 1),
        'feedback': feedback,
        'strengths': identify_strengths(interview_data['scores']),
        'areas_for_improvement': identify_weaknesses(interview_data['scores'])
    }

def identify_strengths(scores):
    """Identify areas of strength based on scores"""
    strengths = []
    if len(scores) >= 3:
        # Find questions with highest scores
        high_scores = [i for i, score in enumerate(scores) if score >= 8]
        if high_scores:
            strengths.append(f"Strong performance in {len(high_scores)} areas")
    return strengths

def identify_weaknesses(scores):
    """Identify areas for improvement based on scores"""
    weaknesses = []
    if len(scores) >= 3:
        # Find questions with lowest scores
        low_scores = [i for i, score in enumerate(scores) if score <= 5]
        if low_scores:
            weaknesses.append(f"Focus on improving {len(low_scores)} areas")
    return weaknesses 