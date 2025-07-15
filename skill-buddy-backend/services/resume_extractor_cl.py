# services/resume_extractor_cl.py
import os
import json
import PyPDF2
import time
import re
import requests
import logging
from typing import Dict, Any, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure upload folder
UPLOAD_FOLDER = 'uploads/resumes'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

class ClaudeHTTPClient:
    """
    HTTP-based Claude client to avoid library conflicts
    """
    
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.anthropic.com/v1"
        self.headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
    
    def messages_create(self, model, max_tokens, system=None, messages=None, temperature=None):
        """Create a message using direct HTTP request"""
        url = f"{self.base_url}/messages"
        
        payload = {
            "model": model,
            "max_tokens": max_tokens,
            "messages": messages or []
        }
        
        if system:
            payload["system"] = system
        
        if temperature is not None:
            payload["temperature"] = temperature
        
        try:
            # Remove any proxies configuration that might cause issues
            session = requests.Session()
            response = session.post(url, headers=self.headers, json=payload, timeout=60)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"HTTP request failed: {e}")
            raise Exception(f"Claude API request failed: {str(e)}")

def get_claude_client():
    """Get Claude client with proper error handling"""
    claude_api_key = os.environ.get('CLAUDE_API_KEY')
    if not claude_api_key or claude_api_key == "your-claude-api-key":
        # Return a mock client for testing/development
        logger.warning("No valid CLAUDE_API_KEY found, using mock client")
        return MockClaudeClient()
    return ClaudeHTTPClient(claude_api_key)

class MockClaudeClient:
    """Mock Claude client for testing when API key is not available"""
    
    def messages_create(self, model, max_tokens, system=None, messages=None, temperature=None):
        """Return mock response for testing"""
        logger.info("Using mock Claude client - returning sample data")
        
        # Return a sample resume extraction result
        sample_response = {
            "content": [{
                "text": json.dumps({
                    "personal_information": {
                        "name": "Sample User",
                        "email": "sample@example.com",
                        "phone": "+1-555-0123",
                        "city": "Sample City",
                        "country": "Sample Country"
                    },
                    "summary": "Experienced software developer with expertise in Python, JavaScript, and React.",
                    "education": [
                        {
                            "school": "Sample University",
                            "degree": "Bachelor of Science",
                            "start_year": "2018",
                            "end_year": "2022",
                            "major": "Computer Science",
                            "gpa": "3.8"
                        }
                    ],
                    "work_experience": [
                        {
                            "company": "Sample Tech Corp",
                            "role": "Software Engineer",
                            "start_year": "2022",
                            "end_year": "Present",
                            "city": "Sample City",
                            "country": "Sample Country",
                            "description": "Developed web applications using React and Node.js"
                        }
                    ],
                    "projects": [
                        {
                            "name": "Sample Project",
                            "start_year": "2021",
                            "end_year": "2022",
                            "description": "Built a full-stack web application"
                        }
                    ],
                    "certifications": [],
                    "awards": [],
                    "skills": ["Python", "JavaScript", "React", "Node.js", "SQL", "Git"],
                    "is_resume": True
                })
            }]
        }
        
        return sample_response

def validate_resume_file(file_path: str) -> Tuple[bool, str]:
    """
    Validate resume file before processing
    
    Args:
        file_path: Path to the resume file
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            return False, "File does not exist"
        
        # Check file size
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            return False, "File is empty"
        
        if file_size > 50 * 1024 * 1024:  # 50MB limit
            return False, "File size exceeds 50MB limit"
        
        # Check file extension
        if not file_path.lower().endswith('.pdf'):
            return False, "Only PDF files are supported"
        
        # Try to open and read PDF
        try:
            with open(file_path, 'rb') as pdf_file:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                if len(pdf_reader.pages) == 0:
                    return False, "PDF has no pages"
                
                # Try to extract text from first page
                first_page = pdf_reader.pages[0]
                text = first_page.extract_text()
                if not text.strip():
                    return False, "PDF appears to be empty or unreadable"
                
        except Exception as e:
            return False, f"PDF reading failed: {str(e)}"
        
        return True, "File is valid"
        
    except Exception as e:
        return False, f"Validation error: {str(e)}"

def extract_text_from_pdf(file_path: str) -> Tuple[str, Dict[str, Any]]:
    """
    Extract text from PDF with detailed metadata
    
    Args:
        file_path: Path to the PDF file
        
    Returns:
        Tuple of (extracted_text, metadata)
    """
    metadata = {
        'file_path': file_path,
        'file_size': os.path.getsize(file_path),
        'extraction_time': 0,
        'pages_count': 0,
        'characters_count': 0,
        'words_count': 0,
        'extraction_errors': []
    }
    
    extraction_start = time.time()
    pdf_text = ""
    
    try:
        with open(file_path, 'rb') as pdf_file:
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            metadata['pages_count'] = len(pdf_reader.pages)
            
            for page_num in range(len(pdf_reader.pages)):
                try:
                    page = pdf_reader.pages[page_num]
                    page_text = page.extract_text()
                    pdf_text += page_text + "\n"
                except Exception as e:
                    error_msg = f"Error extracting page {page_num + 1}: {str(e)}"
                    metadata['extraction_errors'].append(error_msg)
                    logger.warning(error_msg)
            
            # Calculate text statistics
            metadata['characters_count'] = len(pdf_text)
            metadata['words_count'] = len(pdf_text.split())
            
    except Exception as e:
        error_msg = f"PDF extraction failed: {str(e)}"
        metadata['extraction_errors'].append(error_msg)
        logger.error(error_msg)
        raise Exception(error_msg)
    
    metadata['extraction_time'] = time.time() - extraction_start
    
    if not pdf_text.strip():
        raise Exception("No text could be extracted from the PDF")
    
    return pdf_text, metadata

def verify_resume_with_claude(client, pdf_text):
    """
    Use Claude to verify if the document appears to be a resume
    """
    logger.info("Verifying document is a resume...")
    verification_start = time.time()
    
    try:
        # Check if we're using mock client
        if isinstance(client, MockClaudeClient):
            logger.info("Using mock client for verification")
            return {
                "is_resume": True,
                "confidence": 95,
                "reason": "Mock verification - assuming valid resume"
            }
        
        verification_message = client.messages_create(
            model="claude-3-sonnet-20240229",
            max_tokens=150,
            system="You are an expert at identifying resumes from document text.",
            messages=[
                {
                    "role": "user", 
                    "content": f"""Here is text extracted from a document. Analyze it and determine if it appears to be a resume/CV.

                      TEXT:
                      {pdf_text[:2000]}

                      Is this document a resume/CV? Respond with a JSON object containing:
                      1. "is_resume": true or false
                      2. "confidence": a score from 0-100
                      3. "reason": brief explanation for your determination

                      Return ONLY the JSON object with no additional text."""
                }
            ]
        )
        
        verification_time = time.time() - verification_start
        logger.info(f"Verification completed in {verification_time:.2f} seconds")
        
        # Extract content from response
        if isinstance(verification_message, dict) and 'content' in verification_message:
            response_text = verification_message['content'][0]['text']
        else:
            response_text = str(verification_message)
        
        # Parse JSON response
        try:
            verification_result = json.loads(response_text)
            return verification_result
        except json.JSONDecodeError:
            # Try to extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                try:
                    verification_result = json.loads(json_match.group())
                    return verification_result
                except json.JSONDecodeError:
                    pass
            
            # Fallback to assuming it's a resume
            logger.warning("Could not parse verification response, assuming resume")
            return {
                "is_resume": True,
                "confidence": 70,
                "reason": "Could not parse verification response"
            }
            
    except Exception as e:
        logger.error(f"Error in resume verification: {e}")
        # Fallback to assuming it's a resume
        return {
            "is_resume": True,
            "confidence": 60,
            "reason": f"Verification failed: {str(e)}"
        }

def extract_resume_details(resume_file_path):
    """
    Extract structured details from a resume using Claude
    """
    logger.info("Starting Resume Parsing Process")
    
    try:
        # Validate file first
        is_valid, error_message = validate_resume_file(resume_file_path)
        if not is_valid:
            return {"error": error_message}, None, 0
        
        # Initialize client with proper error handling
        client = get_claude_client()
        
        # Extract text from PDF
        logger.info("Extracting text from PDF...")
        text_extraction_start = time.time()
        
        try:
            pdf_text, extraction_metadata = extract_text_from_pdf(resume_file_path)
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            return {"error": f"PDF extraction failed: {str(e)}"}, None, 0
        
        text_extraction_time = time.time() - text_extraction_start
        logger.info(f"Text extraction completed in {text_extraction_time:.2f} seconds")
        logger.info(f"Extracted {len(pdf_text)} characters from PDF")
        
        # Verify the document is a resume
        verification_result = verify_resume_with_claude(client, pdf_text)
        
        if not verification_result.get('is_resume', True) and verification_result.get('confidence', 0) > 70:
            return verification_result, None, 0
        
        # Create the JSON structure template
        json_structure = """
        {
          "personal_information": {
            "name": "",
            "email": "",
            "phone": "",
            "city": "",
            "country": ""
          },
          "summary": "",
          "education": [
            {
              "school": "",
              "degree": "",
              "start_year": "",
              "end_year": "",
              "major": "",
              "gpa": ""
            }
          ],
          "work_experience": [
            {
              "company": "",
              "role": "",
              "start_year": "",
              "end_year": "",
              "city": "",
              "country": "",
              "description": ""
            }
          ],
          "projects": [
            {
              "name": "",
              "start_year": "",
              "end_year": "",
              "description": ""
            }
          ],
          "certifications": [
            {
              "name": "",
              "issuer": "",
              "date": "",
              "id": ""
            }
          ],
          "awards": [
            {
              "title": "",
              "issuer": "",
              "year": ""
            }
          ],
          "skills": [],
          "is_resume": true
        }
        """
        
        # Send the text to Claude
        logger.info("Sending request to Claude API for resume parsing...")
        api_call_start = time.time()
        
        try:
            message = client.messages_create(
                model="claude-3-sonnet-20240229",
                max_tokens=4096,
                system="You are an expert resume parser that extracts structured information from resumes. You will return the parsed data in valid JSON format ONLY. No explanations or other text.",
                messages=[
                    {
                        "role": "user", 
                        "content": f"""Here is the resume text extracted from a PDF:

{pdf_text}

Extract the following information from the resume and return it as a JSON object with the following structure:

{json_structure}

If any field is not present in the resume, use null or an empty string as appropriate. Do not make up information. Extract information directly from the resume. Return ONLY the JSON with no additional text or explanations."""
                    }
                ]
            )
        except Exception as e:
            logger.error(f"Error calling Claude API: {e}")
            return {"error": f"Claude API call failed: {str(e)}"}, None, 0
        
        api_response_time = time.time() - api_call_start
        logger.info(f"Claude API response received in {api_response_time:.2f} seconds")
        
        # Extract the JSON content
        if isinstance(message, dict) and 'content' in message:
            response_text = message['content'][0]['text']
        else:
            response_text = str(message)
        
        # Parse the JSON response
        try:
            parsed_json = json.loads(response_text)
            logger.info("Successfully parsed JSON response")
        except json.JSONDecodeError:
            logger.warning("Initial JSON parsing failed, attempting to extract JSON from response...")
            json_match = re.search(r'```json\n([\s\S]*?)\n```', response_text)
            if json_match:
                try:
                    parsed_json = json.loads(json_match.group(1))
                    logger.info("Successfully extracted and parsed JSON from response")
                except json.JSONDecodeError:
                    logger.error("Could not parse extracted JSON")
                    return {"error": "Could not parse JSON from Claude's response", "raw_response": response_text}, None, 0
            else:
                logger.error("Could not find JSON block in response")
                return {"error": "Could not find JSON in Claude's response", "raw_response": response_text}, None, 0
        
        # Add extraction metadata to the result
        parsed_json['extraction_metadata'] = extraction_metadata
        
        # Save the extracted data to a JSON file
        logger.info("Saving extracted data to JSON file...")
        filename_without_ext = os.path.splitext(os.path.basename(resume_file_path))[0]
        json_output_path = os.path.join(UPLOAD_FOLDER, f"{filename_without_ext}_extracted_resume.json")
        
        try:
            with open(json_output_path, 'w', encoding='utf-8') as json_file:
                json.dump(parsed_json, json_file, indent=2)
            logger.info(f"Extracted resume data saved to: {json_output_path}")
        except Exception as e:
            logger.warning(f"Could not save JSON file: {e}")
            json_output_path = None
        
        logger.info("Resume Parsing Complete")
        return parsed_json, json_output_path, 1
        
    except Exception as e:
        logger.error(f"Unexpected error in extract_resume_details: {e}")
        return {"error": f"Resume extraction failed: {str(e)}"}, None, 0

def process_resume_file(file_path, job_description=""):
    """
    Process a resume file and extract structured information
    
    Args:
        file_path: Path to the resume file
        job_description: Job description for matching analysis
        
    Returns:
        Tuple containing (extracted_resume, questions, summary)
    """
    try:
        logger.info(f"Processing resume file: {file_path}")
        
        # Extract resume details
        extracted_resume, json_output_path, flag = extract_resume_details(file_path)
        
        if flag == 0:
            return extracted_resume, None, None
        
        # Generate interview questions
        try:
            from services.resume_questions import generate_interview_questions_from_data
            questions = generate_interview_questions_from_data(extracted_resume)
        except ImportError:
            logger.warning("resume_questions module not found, skipping question generation")
            questions = None
        except Exception as e:
            logger.error(f"Error generating questions: {e}")
            questions = None
        
        # Generate job match summary if job description is provided
        summary = None
        if job_description and job_description.strip():
            try:
                from services.resume_summarizer import compare_resume_with_job
                summary = compare_resume_with_job(extracted_resume, job_description)
            except ImportError:
                logger.warning("resume_summarizer module not found, skipping job match analysis")
            except Exception as e:
                logger.error(f"Error in job match analysis: {e}")
                summary = None
        
        return extracted_resume, questions, summary
        
    except Exception as e:
        logger.error(f"Error processing resume file: {e}")
        return {"error": f"Resume processing failed: {str(e)}"}, None, None

def batch_process_resumes(file_paths: List[str], job_description: str = "", max_workers: int = 3) -> List[Dict[str, Any]]:
    """
    Process multiple resume files in parallel
    
    Args:
        file_paths: List of resume file paths
        job_description: Job description for matching analysis
        max_workers: Maximum number of parallel workers
        
    Returns:
        List of processing results
    """
    results = []
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        future_to_file = {
            executor.submit(process_resume_file, file_path, job_description): file_path 
            for file_path in file_paths
        }
        
        # Collect results as they complete
        for future in as_completed(future_to_file):
            file_path = future_to_file[future]
            try:
                result = future.result()
                results.append({
                    'file_path': file_path,
                    'result': result
                })
            except Exception as e:
                logger.error(f"Error processing {file_path}: {e}")
                results.append({
                    'file_path': file_path,
                    'error': str(e)
                })
    
    return results

def analyze_resume_quality(resume_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze the quality and completeness of extracted resume data
    
    Args:
        resume_data: Extracted resume data
        
    Returns:
        Quality analysis results
    """
    try:
        quality_score = 0
        max_score = 100
        feedback = []
        
        # Check personal information
        personal_info = resume_data.get('personal_information', {})
        if personal_info.get('name'):
            quality_score += 10
        else:
            feedback.append("Missing name")
        
        if personal_info.get('email'):
            quality_score += 10
        else:
            feedback.append("Missing email")
        
        if personal_info.get('phone'):
            quality_score += 5
        else:
            feedback.append("Missing phone number")
        
        # Check work experience
        work_experience = resume_data.get('work_experience', [])
        if work_experience:
            quality_score += min(len(work_experience) * 5, 25)
        else:
            feedback.append("No work experience found")
        
        # Check education
        education = resume_data.get('education', [])
        if education:
            quality_score += min(len(education) * 5, 15)
        else:
            feedback.append("No education found")
        
        # Check skills
        skills = resume_data.get('skills', [])
        if skills:
            quality_score += min(len(skills) * 2, 20)
        else:
            feedback.append("No skills listed")
        
        # Check projects
        projects = resume_data.get('projects', [])
        if projects:
            quality_score += min(len(projects) * 3, 15)
        
        # Determine quality level
        if quality_score >= 80:
            quality_level = "Excellent"
        elif quality_score >= 60:
            quality_level = "Good"
        elif quality_score >= 40:
            quality_level = "Fair"
        else:
            quality_level = "Poor"
        
        return {
            'quality_score': quality_score,
            'quality_level': quality_level,
            'max_score': max_score,
            'feedback': feedback,
            'sections_found': {
                'personal_info': bool(personal_info),
                'work_experience': len(work_experience),
                'education': len(education),
                'skills': len(skills),
                'projects': len(projects),
                'certifications': len(resume_data.get('certifications', [])),
                'awards': len(resume_data.get('awards', []))
            }
        }
        
    except Exception as e:
        logger.error(f"Error analyzing resume quality: {e}")
        return {
            'quality_score': 0,
            'quality_level': 'Error',
            'max_score': 100,
            'feedback': [f"Analysis error: {str(e)}"],
            'sections_found': {}
        }

def extract_resume_keywords(resume_data: Dict[str, Any]) -> List[str]:
    """
    Extract key terms and keywords from resume data
    
    Args:
        resume_data: Extracted resume data
        
    Returns:
        List of keywords
    """
    keywords = set()
    
    try:
        # Extract from skills
        skills = resume_data.get('skills', [])
        keywords.update([skill.lower().strip() for skill in skills])
        
        # Extract from work experience
        work_experience = resume_data.get('work_experience', [])
        for exp in work_experience:
            # Company name
            if exp.get('company'):
                keywords.add(exp['company'].lower().strip())
            
            # Role/title
            if exp.get('role'):
                keywords.add(exp['role'].lower().strip())
            
            # Description
            if exp.get('description'):
                # Extract potential keywords from description
                desc_words = exp['description'].lower().split()
                # Filter for potential technical terms (words with 3+ characters)
                tech_terms = [word.strip('.,!?()[]{}') for word in desc_words if len(word) >= 3]
                keywords.update(tech_terms[:10])  # Limit to first 10 terms
        
        # Extract from education
        education = resume_data.get('education', [])
        for edu in education:
            if edu.get('school'):
                keywords.add(edu['school'].lower().strip())
            if edu.get('degree'):
                keywords.add(edu['degree'].lower().strip())
            if edu.get('major'):
                keywords.add(edu['major'].lower().strip())
        
        # Extract from projects
        projects = resume_data.get('projects', [])
        for project in projects:
            if project.get('name'):
                keywords.add(project['name'].lower().strip())
            if project.get('description'):
                desc_words = project['description'].lower().split()
                tech_terms = [word.strip('.,!?()[]{}') for word in desc_words if len(word) >= 3]
                keywords.update(tech_terms[:5])
        
        # Remove common words and short terms
        common_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'within', 'without', 'against', 'toward', 'towards', 'upon', 'across', 'behind', 'beneath', 'beside', 'beyond', 'inside', 'outside', 'under', 'over', 'around', 'along', 'down', 'off', 'out', 'away', 'back', 'forward', 'upward', 'downward', 'inward', 'outward', 'northward', 'southward', 'eastward', 'westward', 'homeward', 'heavenward', 'earthward', 'seaward', 'landward', 'leeward', 'windward', 'leftward', 'rightward', 'frontward', 'backward', 'sideward', 'upward', 'downward', 'inward', 'outward', 'northward', 'southward', 'eastward', 'westward', 'homeward', 'heavenward', 'earthward', 'seaward', 'landward', 'leeward', 'windward', 'leftward', 'rightward', 'frontward', 'backward', 'sideward'}
        
        filtered_keywords = {kw for kw in keywords if kw not in common_words and len(kw) >= 3}
        
        return sorted(list(filtered_keywords))
        
    except Exception as e:
        logger.error(f"Error extracting keywords: {e}")
        return []

def generate_resume_summary(resume_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a concise summary of the resume
    
    Args:
        resume_data: Extracted resume data
        
    Returns:
        Resume summary
    """
    try:
        personal_info = resume_data.get('personal_information', {})
        work_experience = resume_data.get('work_experience', [])
        education = resume_data.get('education', [])
        skills = resume_data.get('skills', [])
        projects = resume_data.get('projects', [])
        
        # Calculate years of experience
        total_years = 0
        if work_experience:
            for exp in work_experience:
                start_year = exp.get('start_year', '')
                end_year = exp.get('end_year', '')
                if start_year and end_year:
                    try:
                        start = int(start_year)
                        end = int(end_year) if end_year != 'Present' else 2024
                        total_years += (end - start)
                    except ValueError:
                        pass
        
        # Get highest education
        highest_education = "Not specified"
        if education:
            # Sort by end year to get most recent
            sorted_education = sorted(education, key=lambda x: x.get('end_year', '0'), reverse=True)
            highest_edu = sorted_education[0]
            degree = highest_edu.get('degree', '')
            major = highest_edu.get('major', '')
            if degree and major:
                highest_education = f"{degree} in {major}"
            elif degree:
                highest_education = degree
        
        # Get most recent role
        current_role = "Not specified"
        if work_experience:
            sorted_experience = sorted(work_experience, key=lambda x: x.get('end_year', '0'), reverse=True)
            current_role = sorted_experience[0].get('role', 'Not specified')
        
        return {
            'name': personal_info.get('name', 'Not specified'),
            'current_role': current_role,
            'years_experience': total_years,
            'highest_education': highest_education,
            'skills_count': len(skills),
            'projects_count': len(projects),
            'work_experience_count': len(work_experience),
            'education_count': len(education),
            'top_skills': skills[:5] if skills else [],
            'recent_companies': [exp.get('company', '') for exp in work_experience[:3] if exp.get('company')]
        }
        
    except Exception as e:
        logger.error(f"Error generating resume summary: {e}")
        return {
            'name': 'Error generating summary',
            'current_role': 'Unknown',
            'years_experience': 0,
            'highest_education': 'Unknown',
            'skills_count': 0,
            'projects_count': 0,
            'work_experience_count': 0,
            'education_count': 0,
            'top_skills': [],
            'recent_companies': []
        }