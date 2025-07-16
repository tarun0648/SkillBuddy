# services/resume_questions.py
import json
import os
import logging
import requests
from typing import Dict, Any, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
            response = session.post(url, headers=self.headers, json=payload, timeout=120)
            response.raise_for_status()
            
            data = response.json()
            
            # Create a simple response object that mimics the anthropic client response
            class SimpleResponse:
                def __init__(self, data):
                    self.content = [SimpleContent(data["content"][0]["text"])]
            
            class SimpleContent:
                def __init__(self, text):
                    self.text = text
            
            return SimpleResponse(data)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"HTTP request to Claude API failed: {e}")
            raise Exception(f"Claude API request failed: {e}")
        except Exception as e:
            logger.error(f"Unexpected error in Claude API call: {e}")
            raise

class MockClaudeClient:
    """Mock Claude client for testing when API key is not available"""
    
    def messages_create(self, model, max_tokens, system=None, messages=None, temperature=None):
        """Return mock response for testing"""
        logger.info("Using mock Claude client for questions - returning sample questions")
        
        # Return sample interview questions
        sample_questions = [
            "Can you walk me through your experience with Python development?",
            "What was the most challenging project you worked on and how did you overcome the obstacles?",
            "How do you stay updated with the latest technologies in software development?",
            "Describe a time when you had to work with a difficult team member. How did you handle it?",
            "What's your approach to debugging complex issues in production code?"
        ]
        
        sample_response = {
            "content": [{
                "text": json.dumps(sample_questions)
            }]
        }
        
        # Create a simple response object that mimics the anthropic client response
        class SimpleResponse:
            def __init__(self, data):
                self.content = [SimpleContent(data["content"][0]["text"])]
        
        class SimpleContent:
            def __init__(self, text):
                self.text = text
        
        return SimpleResponse(sample_response)

def get_claude_client():
    """Get Claude client with proper error handling"""
    claude_api_key = os.environ.get('CLAUDE_API_KEY')
    if not claude_api_key or claude_api_key == "your-claude-api-key":
        # Return a mock client for testing/development
        logger.warning("No valid CLAUDE_API_KEY found, using mock client for questions")
        return MockClaudeClient()
    return ClaudeHTTPClient(claude_api_key)

def generate_interview_questions_from_data(resume_data: Dict[str, Any]) -> List[str]:
    """
    Generate personalized interview questions based on resume data
    
    Args:
        resume_data: Dictionary containing parsed resume data
        
    Returns:
        List of interview questions
    """
    logger.info("Generating interview questions from resume data")
    
    try:
        # Get API key from environment
        claude_api_key = os.environ.get('CLAUDE_API_KEY')
        
        if not claude_api_key or claude_api_key == "your-claude-api-key":
            logger.warning("No valid CLAUDE_API_KEY found, returning sample questions")
            return [
                "Can you walk me through your experience with Python development?",
                "What was the most challenging project you worked on and how did you overcome the obstacles?",
                "How do you stay updated with the latest technologies in software development?",
                "Describe a time when you had to work with a difficult team member. How did you handle it?",
                "What's your approach to debugging complex issues in production code?"
            ]
        
        # Initialize Claude client with HTTP approach
        client = get_claude_client()
        
        # Extract key information from resume for question generation
        personal_info = resume_data.get('personal_information', {})
        work_experience = resume_data.get('work_experience', [])
        education = resume_data.get('education', [])
        skills = resume_data.get('skills', [])
        projects = resume_data.get('projects', [])
        
        # Create a summary of candidate profile
        candidate_summary = f"""
        Candidate: {personal_info.get('name', 'Unknown')}
        Skills: {', '.join(skills) if skills else 'Not specified'}
        Years of Experience: {len(work_experience)} positions
        Education Level: {len(education)} qualifications
        Project Experience: {len(projects)} projects
        """
        
        # Construct the prompt for Claude
        prompt = f"""
        You are an expert technical interviewer with 10+ years of experience in software engineering recruitment.

        Based on the following candidate profile, generate 5-7 personalized technical and behavioral interview questions that would be relevant for this candidate.

        **CANDIDATE PROFILE:**
        {candidate_summary}

        **DETAILED RESUME DATA:**
        {json.dumps(resume_data, indent=2)}

        **GUIDELINES:**
        - Generate a mix of technical and behavioral questions
        - Questions should be specific to the candidate's background and skills
        - Include questions about their projects and work experience
        - Make questions challenging but fair
        - Focus on real-world scenarios and problem-solving

        **OUTPUT FORMAT:**
        Return a JSON array of questions like this:
        [
            "Question 1?",
            "Question 2?",
            "Question 3?",
            "Question 4?",
            "Question 5?"
        ]

        Return ONLY the JSON array with no additional text or explanations.
        """

        # Call Claude API
        message = client.messages_create(
            model="claude-3-sonnet-20240229",
            max_tokens=1500,
            temperature=0.7,  # Slightly higher temperature for more creative questions
            system="You are an expert technical interviewer who generates relevant, challenging interview questions. Always return valid JSON.",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        # Extract content from Claude's response
        if isinstance(message, dict) and 'content' in message:
            response_text = message['content'][0]['text']
        else:
            response_text = str(message)
        logger.info("Received response from Claude API for questions")
        
        # Parse JSON response
        try:
            # Try to parse the whole response as JSON
            questions = json.loads(response_text)
            if isinstance(questions, list):
                logger.info(f"Successfully generated {len(questions)} interview questions")
                return questions
            else:
                logger.warning("Response is not a list, using fallback questions")
                return create_fallback_questions(resume_data)
                
        except json.JSONDecodeError:
            logger.warning("Initial JSON parsing failed, attempting to extract JSON from response")
            # Try to extract JSON from code blocks
            import re
            json_match = re.search(r'```json\n([\s\S]*?)\n```', response_text)
            if json_match:
                try:
                    questions = json.loads(json_match.group(1))
                    if isinstance(questions, list):
                        logger.info(f"Successfully extracted {len(questions)} interview questions")
                        return questions
                    else:
                        logger.warning("Extracted response is not a list, using fallback questions")
                        return create_fallback_questions(resume_data)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse extracted JSON: {e}")
                    return create_fallback_questions(resume_data)
            else:
                logger.error("Could not find JSON block in response")
                return create_fallback_questions(resume_data)
                
    except Exception as e:
        logger.error(f"Error generating interview questions: {e}")
        return create_fallback_questions(resume_data)

def create_fallback_questions(resume_data: Dict[str, Any]) -> List[str]:
    """
    Create fallback interview questions when Claude API fails
    
    Args:
        resume_data: Dictionary containing parsed resume data
        
    Returns:
        List of generic interview questions
    """
    logger.info("Creating fallback interview questions")
    
    # Extract basic info for personalized questions
    skills = resume_data.get('skills', [])
    work_experience = resume_data.get('work_experience', [])
    projects = resume_data.get('projects', [])
    
    # Base questions
    base_questions = [
        "Can you tell me about yourself and your background?",
        "What interests you about this position?",
        "What are your greatest strengths and weaknesses?",
        "Where do you see yourself in 5 years?",
        "Why are you looking for a new opportunity?"
    ]
    
    # Technical questions based on skills
    technical_questions = []
    if skills:
        if any('python' in skill.lower() for skill in skills):
            technical_questions.append("Can you walk me through your experience with Python development?")
        if any('javascript' in skill.lower() or 'js' in skill.lower() for skill in skills):
            technical_questions.append("What's your experience with JavaScript and modern frameworks?")
        if any('react' in skill.lower() for skill in skills):
            technical_questions.append("How do you approach building React components and managing state?")
        if any('sql' in skill.lower() or 'database' in skill.lower() for skill in skills):
            technical_questions.append("Can you describe your experience with database design and SQL?")
    
    # Project-based questions
    project_questions = []
    if projects:
        project_questions.append("Can you tell me about one of your recent projects and the challenges you faced?")
        project_questions.append("How do you approach project planning and execution?")
    
    # Experience-based questions
    experience_questions = []
    if work_experience:
        experience_questions.append("What was your most challenging role and how did you grow from it?")
        experience_questions.append("How do you handle working with cross-functional teams?")
    
    # Combine all questions, prioritizing technical and project-specific ones
    all_questions = technical_questions + project_questions + experience_questions + base_questions
    
    # Return top 7 questions
    return all_questions[:7]

def run_generation_with_args(resume_file_path: str, output_file_path: str) -> list:
    """
    Main function to generate interview questions from a resume file
    
    Args:
        resume_file_path: Path to the JSON resume file
        output_file_path: Path where to save the generated questions
        
    Returns:
        List of generated interview questions
    """
    try:
        logger.info(f"Processing resume file: {resume_file_path}")
        
        # Read resume data from file
        with open(resume_file_path, 'r', encoding='utf-8') as file:
            resume_data = json.load(file)
        
        # Generate interview questions
        questions_data = generate_interview_questions_from_data(resume_data)
        
        # Save to output file
        try:
            with open(output_file_path, 'w', encoding='utf-8') as file:
                json.dump(questions_data, file, indent=2)
            logger.info(f"Interview questions saved to: {output_file_path}")
        except Exception as e:
            logger.warning(f"Could not save questions to file: {e}")
        
        return questions_data
        
    except FileNotFoundError:
        logger.error(f"Resume file not found: {resume_file_path}")
        return [{"error": f"Resume file not found: {resume_file_path}"}]
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON in resume file: {resume_file_path}")
        return [{"error": f"Invalid JSON in resume file: {resume_file_path}"}]
    except Exception as e:
        logger.error(f"Error processing resume: {e}")
        return [{"error": f"Error processing resume: {str(e)}"}]