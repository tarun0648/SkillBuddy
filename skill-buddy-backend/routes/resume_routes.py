# routes/resume_routes.py
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from config.firebase_config import firebase_config
from services.resume_processing_service import resume_service
from utils.file_utils import get_file_size, calculate_file_hash
import logging
import os
import uuid

# Create blueprint
resume_bp = Blueprint('resume', __name__)

# Initialize components
db = firebase_config.get_db()
logger = logging.getLogger(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads/resumes'
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'pdf'}

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def auth_required(f):
    """Local auth decorator for resume routes"""
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

@resume_bp.route('/upload', methods=['POST'])
@auth_required
def upload_resume():
    """Upload and process resume with real processing"""
    try:
        user_id = request.user_id
        
        # Check if file is present
        if 'resume' not in request.files:
            return jsonify({'error': 'No resume file provided'}), 400
        
        file = request.files['resume']
        job_description = request.form.get('job_description', '')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check file extension
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'Only PDF files are allowed'}), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({'error': f'File size exceeds maximum limit of {MAX_FILE_SIZE // (1024*1024)}MB'}), 400
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_id = str(uuid.uuid4())
        unique_filename = f"{unique_id}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        # Save file
        file.save(file_path)
        
        # Start real resume processing
        resume_id, success = resume_service.start_resume_processing(
            user_id=user_id,
            file_path=file_path,
            filename=filename,
            job_description=job_description
        )
        
        if not success:
            # Clean up file if processing failed to start
            try:
                os.remove(file_path)
            except:
                pass
            return jsonify({'error': 'Failed to start resume processing'}), 500
        
        logger.info(f"Resume upload successful for user {user_id}, resume_id: {resume_id}")
        
        return jsonify({
            'message': 'Resume uploaded successfully. Processing started.',
            'resume_id': resume_id,
            'status': 'pending'
        }), 201
        
    except Exception as e:
        logger.error(f"Resume upload error: {e}")
        return jsonify({'error': 'Resume upload failed', 'details': str(e)}), 500

@resume_bp.route('/batch-upload', methods=['POST'])
@auth_required
def batch_upload_resumes():
    """Upload and process multiple resumes"""
    try:
        user_id = request.user_id
        
        # Check if files are present
        if 'resumes' not in request.files:
            return jsonify({'error': 'No resume files provided'}), 400
        
        files = request.files.getlist('resumes')
        job_description = request.form.get('job_description', '')
        
        if not files or all(f.filename == '' for f in files):
            return jsonify({'error': 'No files selected'}), 400
        
        # Validate files
        valid_files = []
        for file in files:
            if file.filename.lower().endswith('.pdf'):
                # Check file size
                file.seek(0, os.SEEK_END)
                file_size = file.tell()
                file.seek(0)
                
                if file_size <= MAX_FILE_SIZE:
                    valid_files.append(file)
                else:
                    logger.warning(f"File {file.filename} exceeds size limit")
            else:
                logger.warning(f"File {file.filename} is not a PDF")
        
        if not valid_files:
            return jsonify({'error': 'No valid PDF files found'}), 400
        
        # Process each file
        results = []
        for file in valid_files:
            try:
                # Generate unique filename
                filename = secure_filename(file.filename)
                unique_id = str(uuid.uuid4())
                unique_filename = f"{unique_id}_{filename}"
                file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
                
                # Save file
                file.save(file_path)
                
                # Start processing
                resume_id, success = resume_service.start_resume_processing(
                    user_id=user_id,
                    file_path=file_path,
                    filename=filename,
                    job_description=job_description
                )
                
                results.append({
                    'filename': filename,
                    'resume_id': resume_id,
                    'success': success,
                    'status': 'pending' if success else 'failed'
                })
                
            except Exception as e:
                logger.error(f"Error processing {file.filename}: {e}")
                results.append({
                    'filename': file.filename,
                    'resume_id': None,
                    'success': False,
                    'error': str(e)
                })
        
        successful_uploads = sum(1 for r in results if r['success'])
        
        return jsonify({
            'message': f'Batch upload completed. {successful_uploads}/{len(results)} files processed successfully.',
            'results': results,
            'total_files': len(results),
            'successful_uploads': successful_uploads
        }), 201
        
    except Exception as e:
        logger.error(f"Batch upload error: {e}")
        return jsonify({'error': 'Batch upload failed', 'details': str(e)}), 500

@resume_bp.route('/status/<resume_id>', methods=['GET'])
@auth_required
def get_processing_status(resume_id):
    """Get resume processing status"""
    try:
        user_id = request.user_id
        status_data = resume_service.get_processing_status(resume_id)
        
        if not status_data:
            return jsonify({'error': 'Resume not found'}), 404
        
        # Check ownership through resume service
        from models.resume_model import ResumeModel
        resume_model = ResumeModel(db)
        resume_data = resume_model.get_resume_by_id(resume_id)
        
        if not resume_data or resume_data.get('user_id') != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify(status_data), 200
        
    except Exception as e:
        logger.error(f"Error getting processing status: {e}")
        return jsonify({'error': 'Failed to get processing status', 'details': str(e)}), 500

@resume_bp.route('/results/<resume_id>', methods=['GET'])
@auth_required
def get_resume_results(resume_id):
    """Get complete resume processing results"""
    try:
        user_id = request.user_id
        results = resume_service.get_resume_results(resume_id, user_id)
        
        if not results:
            return jsonify({'error': 'Resume not found or access denied'}), 404
        
        return jsonify(results), 200
        
    except Exception as e:
        logger.error(f"Error getting resume results: {e}")
        return jsonify({'error': 'Failed to get resume results', 'details': str(e)}), 500

@resume_bp.route('/questions/<resume_id>', methods=['GET'])
@auth_required
def get_interview_questions(resume_id):
    """Get interview questions for a specific resume"""
    try:
        user_id = request.user_id
        
        from models.resume_model import ResumeModel
        resume_model = ResumeModel(db)
        resume_data = resume_model.get_resume_by_id(resume_id)
        
        if not resume_data or resume_data.get('user_id') != user_id:
            return jsonify({'error': 'Resume not found or access denied'}), 404
        
        if resume_data.get('processing_status') != 'completed':
            return jsonify({'error': 'Resume processing not completed yet'}), 400
        
        questions = resume_data.get('interview_questions', [])
        
        return jsonify({
            'resume_id': resume_id,
            'questions': questions,
            'total_questions': len(questions)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting interview questions: {e}")
        return jsonify({'error': 'Failed to get interview questions', 'details': str(e)}), 500

@resume_bp.route('/analysis/<resume_id>', methods=['GET'])
@auth_required
def get_job_match_analysis(resume_id):
    """Get job match analysis for a specific resume"""
    try:
        user_id = request.user_id
        
        from models.resume_model import ResumeModel
        resume_model = ResumeModel(db)
        resume_data = resume_model.get_resume_by_id(resume_id)
        
        if not resume_data or resume_data.get('user_id') != user_id:
            return jsonify({'error': 'Resume not found or access denied'}), 404
        
        if resume_data.get('processing_status') != 'completed':
            return jsonify({'error': 'Resume processing not completed yet'}), 400
        
        analysis = resume_data.get('job_match_analysis', {})
        
        return jsonify({
            'resume_id': resume_id,
            'analysis': analysis
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting job match analysis: {e}")
        return jsonify({'error': 'Failed to get job match analysis', 'details': str(e)}), 500

@resume_bp.route('/quality/<resume_id>', methods=['GET'])
@auth_required
def get_resume_quality_analysis(resume_id):
    """Get resume quality analysis"""
    try:
        user_id = request.user_id
        
        from models.resume_model import ResumeModel
        resume_model = ResumeModel(db)
        resume_data = resume_model.get_resume_by_id(resume_id)
        
        if not resume_data or resume_data.get('user_id') != user_id:
            return jsonify({'error': 'Resume not found or access denied'}), 404
        
        if resume_data.get('processing_status') != 'completed':
            return jsonify({'error': 'Resume processing not completed yet'}), 400
        
        extracted_data = resume_data.get('extracted_data', {})
        if not extracted_data:
            return jsonify({'error': 'No extracted data available'}), 400
        
        # Import and use quality analysis function
        from services.resume_extractor_cl import analyze_resume_quality
        quality_analysis = analyze_resume_quality(extracted_data)
        
        return jsonify({
            'resume_id': resume_id,
            'quality_analysis': quality_analysis
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting quality analysis: {e}")
        return jsonify({'error': 'Failed to get quality analysis', 'details': str(e)}), 500

@resume_bp.route('/keywords/<resume_id>', methods=['GET'])
@auth_required
def get_resume_keywords(resume_id):
    """Get keywords extracted from resume"""
    try:
        user_id = request.user_id
        
        from models.resume_model import ResumeModel
        resume_model = ResumeModel(db)
        resume_data = resume_model.get_resume_by_id(resume_id)
        
        if not resume_data or resume_data.get('user_id') != user_id:
            return jsonify({'error': 'Resume not found or access denied'}), 404
        
        if resume_data.get('processing_status') != 'completed':
            return jsonify({'error': 'Resume processing not completed yet'}), 400
        
        extracted_data = resume_data.get('extracted_data', {})
        if not extracted_data:
            return jsonify({'error': 'No extracted data available'}), 400
        
        # Import and use keywords extraction function
        from services.resume_extractor_cl import extract_resume_keywords
        keywords = extract_resume_keywords(extracted_data)
        
        return jsonify({
            'resume_id': resume_id,
            'keywords': keywords,
            'total_keywords': len(keywords)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting keywords: {e}")
        return jsonify({'error': 'Failed to get keywords', 'details': str(e)}), 500

@resume_bp.route('/summary/<resume_id>', methods=['GET'])
@auth_required
def get_resume_summary(resume_id):
    """Get resume summary"""
    try:
        user_id = request.user_id
        
        from models.resume_model import ResumeModel
        resume_model = ResumeModel(db)
        resume_data = resume_model.get_resume_by_id(resume_id)
        
        if not resume_data or resume_data.get('user_id') != user_id:
            return jsonify({'error': 'Resume not found or access denied'}), 404
        
        if resume_data.get('processing_status') != 'completed':
            return jsonify({'error': 'Resume processing not completed yet'}), 400
        
        extracted_data = resume_data.get('extracted_data', {})
        if not extracted_data:
            return jsonify({'error': 'No extracted data available'}), 400
        
        # Import and use summary generation function
        from services.resume_extractor_cl import generate_resume_summary
        summary = generate_resume_summary(extracted_data)
        
        return jsonify({
            'resume_id': resume_id,
            'summary': summary
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting resume summary: {e}")
        return jsonify({'error': 'Failed to get resume summary', 'details': str(e)}), 500

@resume_bp.route('/reprocess/<resume_id>', methods=['POST'])
@auth_required
def reprocess_resume(resume_id):
    """Reprocess a resume with new job description"""
    try:
        user_id = request.user_id
        data = request.get_json()
        job_description = data.get('job_description', '') if data else ''
        
        from models.resume_model import ResumeModel
        resume_model = ResumeModel(db)
        resume_data = resume_model.get_resume_by_id(resume_id)
        
        if not resume_data or resume_data.get('user_id') != user_id:
            return jsonify({'error': 'Resume not found or access denied'}), 404
        
        # Start reprocessing
        file_path = resume_data.get('file_path')
        filename = resume_data.get('filename')
        
        if not file_path or not os.path.exists(file_path):
            return jsonify({'error': 'Original resume file not found'}), 400
        
        # Start new processing with updated job description
        new_resume_id, success = resume_service.start_resume_processing(
            user_id=user_id,
            file_path=file_path,
            filename=f"reprocessed_{filename}",
            job_description=job_description
        )
        
        if not success:
            return jsonify({'error': 'Failed to start reprocessing'}), 500
        
        return jsonify({
            'message': 'Resume reprocessing started',
            'new_resume_id': new_resume_id,
            'original_resume_id': resume_id,
            'status': 'pending'
        }), 200
        
    except Exception as e:
        logger.error(f"Error reprocessing resume: {e}")
        return jsonify({'error': 'Failed to reprocess resume', 'details': str(e)}), 500

@resume_bp.route('/delete/<resume_id>', methods=['DELETE'])
@auth_required
def delete_resume(resume_id):
    """Delete a resume and its associated data"""
    try:
        user_id = request.user_id
        
        from models.resume_model import ResumeModel
        resume_model = ResumeModel(db)
        resume_data = resume_model.get_resume_by_id(resume_id)
        
        if not resume_data or resume_data.get('user_id') != user_id:
            return jsonify({'error': 'Resume not found or access denied'}), 404
        
        # Delete file from filesystem
        file_path = resume_data.get('file_path')
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Deleted file: {file_path}")
            except Exception as e:
                logger.warning(f"Could not delete file {file_path}: {e}")
        
        # Delete associated JSON files
        if file_path:
            base_path = file_path.replace('.pdf', '')
            json_files = [
                f"{base_path}_extracted_resume.json",
                f"{base_path}_interview_questions.json"
            ]
            
            for json_file in json_files:
                if os.path.exists(json_file):
                    try:
                        os.remove(json_file)
                        logger.info(f"Deleted JSON file: {json_file}")
                    except Exception as e:
                        logger.warning(f"Could not delete JSON file {json_file}: {e}")
        
        # Delete from database
        success = resume_model.delete_resume(resume_id)
        
        if success:
            logger.info(f"Successfully deleted resume: {resume_id}")
            return jsonify({'message': 'Resume deleted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to delete resume from database'}), 500
        
    except Exception as e:
        logger.error(f"Error deleting resume: {e}")
        return jsonify({'error': 'Failed to delete resume', 'details': str(e)}), 500

@resume_bp.route('/validate', methods=['POST'])
@auth_required
def validate_resume_file():
    """Validate a resume file before processing"""
    try:
        user_id = request.user_id
        
        # Check if file is present
        if 'resume' not in request.files:
            return jsonify({'error': 'No resume file provided'}), 400
        
        file = request.files['resume']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save file temporarily for validation
        filename = secure_filename(file.filename)
        temp_id = str(uuid.uuid4())
        temp_filename = f"temp_{temp_id}_{filename}"
        temp_file_path = os.path.join(UPLOAD_FOLDER, temp_filename)
        
        try:
            file.save(temp_file_path)
            
            # Import and use validation function
            from services.resume_extractor_cl import validate_resume_file
            is_valid, error_message = validate_resume_file(temp_file_path)
            
            # Clean up temp file
            try:
                os.remove(temp_file_path)
            except:
                pass
            
            return jsonify({
                'is_valid': is_valid,
                'error_message': error_message if not is_valid else None,
                'filename': filename
            }), 200
            
        except Exception as e:
            # Clean up temp file
            try:
                os.remove(temp_file_path)
            except:
                pass
            raise e
        
    except Exception as e:
        logger.error(f"Error validating resume file: {e}")
        return jsonify({'error': 'Failed to validate resume file', 'details': str(e)}), 500

@resume_bp.route('/statistics', methods=['GET'])
@auth_required
def get_resume_statistics():
    """Get resume processing statistics for the user"""
    try:
        user_id = request.user_id
        
        from models.resume_model import ResumeModel
        resume_model = ResumeModel(db)
        
        # Get user statistics
        user_stats = resume_model.get_user_resume_statistics(user_id)
        
        # Get global statistics
        global_stats = resume_model.get_processing_statistics()
        
        return jsonify({
            'user_statistics': user_stats,
            'global_statistics': global_stats
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting resume statistics: {e}")
        return jsonify({'error': 'Failed to get resume statistics', 'details': str(e)}), 500

@resume_bp.route('/suggestions/<resume_id>', methods=['GET'])
@auth_required
def get_resume_improvement_suggestions(resume_id):
    """Get comprehensive improvement suggestions for a resume"""
    try:
        user_id = request.user_id
        
        from models.resume_model import ResumeModel
        resume_model = ResumeModel(db)
        resume_data = resume_model.get_resume_by_id(resume_id)
        
        if not resume_data or resume_data.get('user_id') != user_id:
            return jsonify({'error': 'Resume not found or access denied'}), 404
        
        if resume_data.get('processing_status') != 'completed':
            return jsonify({'error': 'Resume processing not completed yet'}), 400
        
        extracted_data = resume_data.get('extracted_data', {})
        if not extracted_data:
            return jsonify({'error': 'No extracted data available'}), 400
        
        # Import analysis functions
        from services.resume_extractor_cl import analyze_resume_quality, extract_resume_keywords
        from services.resume_summarizer import compare_resume_with_job
        
        # Get quality analysis
        quality_analysis = analyze_resume_quality(extracted_data)
        
        # Get keywords
        keywords = extract_resume_keywords(extracted_data)
        
        # Get job match analysis if job description exists
        job_description = resume_data.get('job_description', '')
        job_match_analysis = None
        if job_description:
            try:
                job_match_analysis = compare_resume_with_job(extracted_data, job_description)
            except Exception as e:
                logger.warning(f"Could not generate job match analysis: {e}")
        
        # Generate comprehensive improvement suggestions
        suggestions = generate_comprehensive_suggestions(
            quality_analysis, 
            keywords, 
            job_match_analysis, 
            extracted_data
        )
        
        return jsonify({
            'resume_id': resume_id,
            'suggestions': suggestions,
            'quality_score': quality_analysis.get('quality_score', 0),
            'total_suggestions': len(suggestions.get('immediate_actions', [])) + 
                               len(suggestions.get('content_improvements', [])) + 
                               len(suggestions.get('skill_enhancements', []))
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting improvement suggestions: {e}")
        return jsonify({'error': 'Failed to get improvement suggestions', 'details': str(e)}), 500

def generate_comprehensive_suggestions(quality_analysis, keywords, job_match_analysis, extracted_data):
    """Generate comprehensive improvement suggestions"""
    
    suggestions = {
        'immediate_actions': [],
        'content_improvements': [],
        'skill_enhancements': [],
        'formatting_suggestions': [],
        'career_advice': []
    }
    
    # Quality-based suggestions
    quality_score = quality_analysis.get('quality_score', 0)
    feedback = quality_analysis.get('feedback', [])
    
    if quality_score < 70:
        suggestions['immediate_actions'].append({
            'priority': 'high',
            'action': 'Improve overall resume completeness',
            'description': f'Your resume quality score is {quality_score}/100. Focus on completing missing sections.',
            'impact': 'high'
        })
    
    # Feedback-based suggestions
    for item in feedback:
        if 'Missing' in item:
            suggestions['immediate_actions'].append({
                'priority': 'high',
                'action': f'Add {item.lower().replace("missing ", "")}',
                'description': item,
                'impact': 'high'
            })
    
    # Content improvements based on extracted data
    personal_info = extracted_data.get('personal_information', {})
    work_experience = extracted_data.get('work_experience', [])
    education = extracted_data.get('education', [])
    skills = extracted_data.get('skills', [])
    projects = extracted_data.get('projects', [])
    
    # Personal information suggestions
    if not personal_info.get('summary'):
        suggestions['content_improvements'].append({
            'section': 'Personal Information',
            'suggestion': 'Add a professional summary',
            'description': 'Include a compelling 2-3 sentence summary highlighting your key strengths and career objectives'
        })
    
    # Work experience suggestions
    if len(work_experience) < 2:
        suggestions['content_improvements'].append({
            'section': 'Work Experience',
            'suggestion': 'Add more work experience',
            'description': 'Include relevant internships, part-time work, or volunteer experience'
        })
    
    # Skills suggestions
    if len(skills) < 10:
        suggestions['skill_enhancements'].append({
            'category': 'Technical Skills',
            'suggestion': 'Expand your skills section',
            'description': 'Add more relevant technical and soft skills based on your target industry'
        })
    
    # Project suggestions
    if len(projects) < 2:
        suggestions['content_improvements'].append({
            'section': 'Projects',
            'suggestion': 'Add more projects',
            'description': 'Include personal projects, academic projects, or open-source contributions'
        })
    
    # Job match suggestions
    if job_match_analysis:
        match_score = job_match_analysis.get('match_score', 0)
        gaps = job_match_analysis.get('gaps', [])
        
        if match_score < 70:
            suggestions['immediate_actions'].append({
                'priority': 'high',
                'action': 'Improve job match alignment',
                'description': f'Your resume matches {match_score}% with the job requirements. Focus on addressing gaps.',
                'impact': 'high'
            })
        
        for gap in gaps[:3]:  # Limit to top 3 gaps
            suggestions['skill_enhancements'].append({
                'category': 'Job Requirements',
                'suggestion': 'Address skill gap',
                'description': gap
            })
    
    # Formatting suggestions
    suggestions['formatting_suggestions'] = [
        {
            'aspect': 'Consistency',
            'suggestion': 'Ensure consistent formatting throughout',
            'description': 'Use consistent fonts, spacing, and bullet points'
        },
        {
            'aspect': 'Length',
            'suggestion': 'Keep resume to 1-2 pages',
            'description': 'Focus on most relevant and recent experience'
        },
        {
            'aspect': 'Keywords',
            'suggestion': 'Optimize for ATS systems',
            'description': 'Include relevant keywords from job descriptions'
        }
    ]
    
    # Career advice
    suggestions['career_advice'] = [
        {
            'tip': 'Quantify achievements',
            'description': 'Use numbers and metrics to demonstrate impact'
        },
        {
            'tip': 'Use action verbs',
            'description': 'Start bullet points with strong action verbs'
        },
        {
            'tip': 'Tailor for each job',
            'description': 'Customize resume for specific job requirements'
        }
    ]
    
    return suggestions