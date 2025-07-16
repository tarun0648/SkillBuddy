# routes/portfolio_routes.py
from flask import Blueprint, request, jsonify
from config.firebase_config import firebase_config
from models.user_model import UserModel
import logging
from datetime import datetime
import uuid
import requests
import os

# Create blueprint
portfolio_bp = Blueprint('portfolio', __name__)

# Initialize components
db = firebase_config.get_db()
if db:
    user_model = UserModel(db)
else:
    user_model = None

logger = logging.getLogger(__name__)

def auth_required(f):
    """Local auth decorator for portfolio routes"""
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

@portfolio_bp.route('/analyze', methods=['POST'])
@auth_required
def analyze_portfolio():
    """Analyze a portfolio URL"""
    try:
        user_id = request.user_id
        data = request.get_json()
        
        if not data or 'portfolio_url' not in data:
            return jsonify({'error': 'Portfolio URL is required'}), 400
        
        portfolio_url = data['portfolio_url'].strip()
        
        # Validate URL format
        if not portfolio_url.startswith(('http://', 'https://')):
            return jsonify({'error': 'Invalid URL format'}), 400
        
        # Create analysis record
        analysis_id = str(uuid.uuid4())
        analysis_data = {
            'analysis_id': analysis_id,
            'user_id': user_id,
            'portfolio_url': portfolio_url,
            'status': 'pending',
            'created_at': datetime.utcnow().isoformat(),
            'results': None,
            'error': None
        }
        
        # Save to database
        db.collection('portfolio_analyses').document(analysis_id).set(analysis_data)
        
        # Start analysis in background (simulated for now)
        try:
            # Simulate portfolio analysis
            analysis_results = analyze_portfolio_content(portfolio_url)
            
            # Update analysis with results
            db.collection('portfolio_analyses').document(analysis_id).update({
                'status': 'completed',
                'results': analysis_results,
                'completed_at': datetime.utcnow().isoformat()
            })
            
            logger.info(f"Portfolio analysis completed for user {user_id}, analysis_id: {analysis_id}")
            
        except Exception as analysis_error:
            # Update analysis with error
            db.collection('portfolio_analyses').document(analysis_id).update({
                'status': 'failed',
                'error': str(analysis_error),
                'completed_at': datetime.utcnow().isoformat()
            })
            logger.error(f"Portfolio analysis failed: {analysis_error}")
        
        return jsonify({
            'message': 'Portfolio analysis started',
            'analysis_id': analysis_id,
            'status': 'pending'
        }), 201
        
    except Exception as e:
        logger.error(f"Error starting portfolio analysis: {e}")
        return jsonify({'error': 'Failed to start portfolio analysis', 'details': str(e)}), 500

@portfolio_bp.route('/status/<analysis_id>', methods=['GET'])
@auth_required
def get_portfolio_analysis_status(analysis_id):
    """Get portfolio analysis status"""
    try:
        user_id = request.user_id
        
        # Get analysis from database
        analysis_doc = db.collection('portfolio_analyses').document(analysis_id).get()
        if not analysis_doc.exists:
            return jsonify({'error': 'Analysis not found'}), 404
        
        analysis_data = analysis_doc.to_dict()
        
        # Verify user owns this analysis
        if analysis_data['user_id'] != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify({
            'analysis_id': analysis_id,
            'status': analysis_data['status'],
            'portfolio_url': analysis_data['portfolio_url'],
            'created_at': analysis_data['created_at'],
            'completed_at': analysis_data.get('completed_at'),
            'error': analysis_data.get('error')
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting portfolio analysis status: {e}")
        return jsonify({'error': 'Failed to get analysis status', 'details': str(e)}), 500

@portfolio_bp.route('/results/<analysis_id>', methods=['GET'])
@auth_required
def get_portfolio_analysis_results(analysis_id):
    """Get portfolio analysis results"""
    try:
        user_id = request.user_id
        
        # Get analysis from database
        analysis_doc = db.collection('portfolio_analyses').document(analysis_id).get()
        if not analysis_doc.exists:
            return jsonify({'error': 'Analysis not found'}), 404
        
        analysis_data = analysis_doc.to_dict()
        
        # Verify user owns this analysis
        if analysis_data['user_id'] != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Check if analysis is completed
        if analysis_data['status'] != 'completed':
            return jsonify({
                'error': 'Analysis not completed',
                'status': analysis_data['status']
            }), 400
        
        return jsonify({
            'analysis_id': analysis_id,
            'portfolio_url': analysis_data['portfolio_url'],
            'results': analysis_data['results'],
            'created_at': analysis_data['created_at'],
            'completed_at': analysis_data['completed_at']
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting portfolio analysis results: {e}")
        return jsonify({'error': 'Failed to get analysis results', 'details': str(e)}), 500

def analyze_portfolio_content(portfolio_url):
    """Analyze portfolio content (simulated)"""
    # This is a simulated analysis - in a real implementation, you would:
    # 1. Fetch the portfolio website
    # 2. Extract content and structure
    # 3. Analyze design, content, and functionality
    # 4. Use AI to provide insights
    
    try:
        # Simulate fetching the website
        response = requests.get(portfolio_url, timeout=10)
        
        # Simulate analysis based on response
        if response.status_code == 200:
            content_length = len(response.text)
            
            # Generate simulated analysis results
            analysis_results = {
                'overall_score': 85,
                'design_score': 88,
                'content_score': 82,
                'functionality_score': 80,
                'accessibility_score': 85,
                'performance_score': 87,
                'insights': [
                    'Clean and professional design',
                    'Good use of whitespace and typography',
                    'Responsive layout detected',
                    'Fast loading times',
                    'Clear navigation structure'
                ],
                'recommendations': [
                    'Consider adding more interactive elements',
                    'Include testimonials or case studies',
                    'Optimize images for better performance',
                    'Add a contact form for better lead generation',
                    'Consider adding a blog section'
                ],
                'technical_details': {
                    'page_size': f"{content_length} characters",
                    'load_time': '1.2 seconds',
                    'responsive': True,
                    'seo_friendly': True
                }
            }
        else:
            analysis_results = {
                'overall_score': 0,
                'error': f'Failed to access portfolio: HTTP {response.status_code}',
                'insights': ['Unable to analyze portfolio - access denied'],
                'recommendations': ['Check if the portfolio URL is correct and accessible']
            }
        
        return analysis_results
        
    except requests.RequestException as e:
        return {
            'overall_score': 0,
            'error': f'Failed to access portfolio: {str(e)}',
            'insights': ['Unable to analyze portfolio - connection failed'],
            'recommendations': ['Check if the portfolio URL is correct and accessible']
        }
    except Exception as e:
        return {
            'overall_score': 0,
            'error': f'Analysis failed: {str(e)}',
            'insights': ['Unable to complete portfolio analysis'],
            'recommendations': ['Try again later or contact support']
        }
from flask import Blueprint, request, jsonify
from config.firebase_config import firebase_config
from models.user_model import UserModel
import logging
from datetime import datetime
import uuid
import requests
import os

# Create blueprint
portfolio_bp = Blueprint('portfolio', __name__)

# Initialize components
db = firebase_config.get_db()
if db:
    user_model = UserModel(db)
else:
    user_model = None

logger = logging.getLogger(__name__)

def auth_required(f):
    """Local auth decorator for portfolio routes"""
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

@portfolio_bp.route('/analyze', methods=['POST'])
@auth_required
def analyze_portfolio():
    """Analyze a portfolio URL"""
    try:
        user_id = request.user_id
        data = request.get_json()
        
        if not data or 'portfolio_url' not in data:
            return jsonify({'error': 'Portfolio URL is required'}), 400
        
        portfolio_url = data['portfolio_url'].strip()
        
        # Validate URL format
        if not portfolio_url.startswith(('http://', 'https://')):
            return jsonify({'error': 'Invalid URL format'}), 400
        
        # Create analysis record
        analysis_id = str(uuid.uuid4())
        analysis_data = {
            'analysis_id': analysis_id,
            'user_id': user_id,
            'portfolio_url': portfolio_url,
            'status': 'pending',
            'created_at': datetime.utcnow().isoformat(),
            'results': None,
            'error': None
        }
        
        # Save to database
        db.collection('portfolio_analyses').document(analysis_id).set(analysis_data)
        
        # Start analysis in background (simulated for now)
        try:
            # Simulate portfolio analysis
            analysis_results = analyze_portfolio_content(portfolio_url)
            
            # Update analysis with results
            db.collection('portfolio_analyses').document(analysis_id).update({
                'status': 'completed',
                'results': analysis_results,
                'completed_at': datetime.utcnow().isoformat()
            })
            
            logger.info(f"Portfolio analysis completed for user {user_id}, analysis_id: {analysis_id}")
            
        except Exception as analysis_error:
            # Update analysis with error
            db.collection('portfolio_analyses').document(analysis_id).update({
                'status': 'failed',
                'error': str(analysis_error),
                'completed_at': datetime.utcnow().isoformat()
            })
            logger.error(f"Portfolio analysis failed: {analysis_error}")
        
        return jsonify({
            'message': 'Portfolio analysis started',
            'analysis_id': analysis_id,
            'status': 'pending'
        }), 201
        
    except Exception as e:
        logger.error(f"Error starting portfolio analysis: {e}")
        return jsonify({'error': 'Failed to start portfolio analysis', 'details': str(e)}), 500

@portfolio_bp.route('/status/<analysis_id>', methods=['GET'])
@auth_required
def get_portfolio_analysis_status(analysis_id):
    """Get portfolio analysis status"""
    try:
        user_id = request.user_id
        
        # Get analysis from database
        analysis_doc = db.collection('portfolio_analyses').document(analysis_id).get()
        if not analysis_doc.exists:
            return jsonify({'error': 'Analysis not found'}), 404
        
        analysis_data = analysis_doc.to_dict()
        
        # Verify user owns this analysis
        if analysis_data['user_id'] != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify({
            'analysis_id': analysis_id,
            'status': analysis_data['status'],
            'portfolio_url': analysis_data['portfolio_url'],
            'created_at': analysis_data['created_at'],
            'completed_at': analysis_data.get('completed_at'),
            'error': analysis_data.get('error')
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting portfolio analysis status: {e}")
        return jsonify({'error': 'Failed to get analysis status', 'details': str(e)}), 500

@portfolio_bp.route('/results/<analysis_id>', methods=['GET'])
@auth_required
def get_portfolio_analysis_results(analysis_id):
    """Get portfolio analysis results"""
    try:
        user_id = request.user_id
        
        # Get analysis from database
        analysis_doc = db.collection('portfolio_analyses').document(analysis_id).get()
        if not analysis_doc.exists:
            return jsonify({'error': 'Analysis not found'}), 404
        
        analysis_data = analysis_doc.to_dict()
        
        # Verify user owns this analysis
        if analysis_data['user_id'] != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Check if analysis is completed
        if analysis_data['status'] != 'completed':
            return jsonify({
                'error': 'Analysis not completed',
                'status': analysis_data['status']
            }), 400
        
        return jsonify({
            'analysis_id': analysis_id,
            'portfolio_url': analysis_data['portfolio_url'],
            'results': analysis_data['results'],
            'created_at': analysis_data['created_at'],
            'completed_at': analysis_data['completed_at']
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting portfolio analysis results: {e}")
        return jsonify({'error': 'Failed to get analysis results', 'details': str(e)}), 500

def analyze_portfolio_content(portfolio_url):
    """Analyze portfolio content (simulated)"""
    # This is a simulated analysis - in a real implementation, you would:
    # 1. Fetch the portfolio website
    # 2. Extract content and structure
    # 3. Analyze design, content, and functionality
    # 4. Use AI to provide insights
    
    try:
        # Simulate fetching the website
        response = requests.get(portfolio_url, timeout=10)
        
        # Simulate analysis based on response
        if response.status_code == 200:
            content_length = len(response.text)
            
            # Generate simulated analysis results
            analysis_results = {
                'overall_score': 85,
                'design_score': 88,
                'content_score': 82,
                'functionality_score': 80,
                'accessibility_score': 85,
                'performance_score': 87,
                'insights': [
                    'Clean and professional design',
                    'Good use of whitespace and typography',
                    'Responsive layout detected',
                    'Fast loading times',
                    'Clear navigation structure'
                ],
                'recommendations': [
                    'Consider adding more interactive elements',
                    'Include testimonials or case studies',
                    'Optimize images for better performance',
                    'Add a contact form for better lead generation',
                    'Consider adding a blog section'
                ],
                'technical_details': {
                    'page_size': f"{content_length} characters",
                    'load_time': '1.2 seconds',
                    'responsive': True,
                    'seo_friendly': True
                }
            }
        else:
            analysis_results = {
                'overall_score': 0,
                'error': f'Failed to access portfolio: HTTP {response.status_code}',
                'insights': ['Unable to analyze portfolio - access denied'],
                'recommendations': ['Check if the portfolio URL is correct and accessible']
            }
        
        return analysis_results
        
    except requests.RequestException as e:
        return {
            'overall_score': 0,
            'error': f'Failed to access portfolio: {str(e)}',
            'insights': ['Unable to analyze portfolio - connection failed'],
            'recommendations': ['Check if the portfolio URL is correct and accessible']
        }
    except Exception as e:
        return {
            'overall_score': 0,
            'error': f'Analysis failed: {str(e)}',
            'insights': ['Unable to complete portfolio analysis'],
            'recommendations': ['Try again later or contact support']
        } 