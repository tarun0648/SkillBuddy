# services/resume_processing_service.py
import os
import json
import threading
import logging
from typing import Dict, Any, Optional, Tuple, List
from config.firebase_config import firebase_config
from models.resume_model import ResumeModel
from utils.file_utils import get_file_size, calculate_file_hash, validate_pdf_file, cleanup_temp_files
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)

class ResumeProcessingService:
    """Service for handling resume processing operations"""
    
    def __init__(self):
        self.db = firebase_config.get_db()
        self.resume_model = ResumeModel(self.db)
        self._processing_threads = {}
        self._max_concurrent_processes = 3
    
    def start_resume_processing(self, user_id: str, file_path: str, filename: str, job_description: str = "") -> Tuple[str, bool]:
        """
        Start asynchronous resume processing
        
        Returns:
            Tuple of (resume_id, success)
        """
        try:
            # Validate file before processing
            is_valid, error_message, validation_metadata = validate_pdf_file(file_path)
            if not is_valid:
                logger.error(f"File validation failed for {file_path}: {error_message}")
                return "", False
            
            # Create initial resume record with processing status
            resume_data = {
                'filename': filename,
                'file_path': file_path,
                'file_size': get_file_size(file_path),
                'file_hash': calculate_file_hash(file_path),
                'job_description': job_description,
                'validation_metadata': validation_metadata
            }
            
            resume_id = self.resume_model.create_resume_record_processing(user_id, resume_data)
            
            # Check if we can start processing immediately
            active_processes = len([t for t in self._processing_threads.values() if t.is_alive()])
            
            if active_processes < self._max_concurrent_processes:
                # Start processing immediately
                processing_thread = threading.Thread(
                    target=self._process_resume_async,
                    args=(resume_id, file_path, job_description),
                    daemon=True
                )
                processing_thread.start()
                
                # Track the thread
                self._processing_threads[resume_id] = processing_thread
                
                logger.info(f"Started immediate resume processing for resume_id: {resume_id}")
            else:
                logger.info(f"Resume {resume_id} queued for processing (active processes: {active_processes})")
            
            return resume_id, True
            
        except Exception as e:
            logger.error(f"Error starting resume processing: {e}")
            return "", False
    
    def start_batch_processing(self, user_id: str, file_paths: List[str], filenames: List[str], job_description: str = "") -> List[Dict[str, Any]]:
        """
        Start batch processing of multiple resumes
        
        Args:
            user_id: User ID
            file_paths: List of file paths
            filenames: List of filenames
            job_description: Job description for matching
            
        Returns:
            List of processing results
        """
        results = []
        
        try:
            # Create resume records for all files
            for i, (file_path, filename) in enumerate(zip(file_paths, filenames)):
                try:
                    resume_id, success = self.start_resume_processing(
                        user_id=user_id,
                        file_path=file_path,
                        filename=filename,
                        job_description=job_description
                    )
                    
                    results.append({
                        'filename': filename,
                        'resume_id': resume_id,
                        'success': success,
                        'index': i
                    })
                    
                except Exception as e:
                    logger.error(f"Error creating resume record for {filename}: {e}")
                    results.append({
                        'filename': filename,
                        'resume_id': None,
                        'success': False,
                        'error': str(e),
                        'index': i
                    })
            
            # Start processing threads for queued resumes
            self._process_queued_resumes()
            
        except Exception as e:
            logger.error(f"Error in batch processing: {e}")
        
        return results
    
    def _process_queued_resumes(self):
        """Process resumes that are queued"""
        try:
            # Get all pending resumes
            pending_resumes = self.resume_model.get_pending_resumes()
            
            active_processes = len([t for t in self._processing_threads.values() if t.is_alive()])
            available_slots = self._max_concurrent_processes - active_processes
            
            if available_slots > 0 and pending_resumes:
                # Start processing for available slots
                for resume in pending_resumes[:available_slots]:
                    resume_id = resume['id']
                    file_path = resume['file_path']
                    job_description = resume.get('job_description', '')
                    
                    # Check if not already being processed
                    if resume_id not in self._processing_threads or not self._processing_threads[resume_id].is_alive():
                        processing_thread = threading.Thread(
                            target=self._process_resume_async,
                            args=(resume_id, file_path, job_description),
                            daemon=True
                        )
                        processing_thread.start()
                        
                        self._processing_threads[resume_id] = processing_thread
                        logger.info(f"Started processing for queued resume: {resume_id}")
                        
        except Exception as e:
            logger.error(f"Error processing queued resumes: {e}")
    
    def _process_resume_async(self, resume_id: str, file_path: str, job_description: str):
        """Process resume asynchronously"""
        try:
            logger.info(f"Starting async processing for resume: {resume_id}")
            
            # Update status to processing
            self.resume_model.update_resume_status(resume_id, 'processing')
            
            # Import and use the actual resume processing functions
            from services.resume_extractor_cl import process_resume_file
            
            # Process the resume using the actual implementation
            extracted_data, questions, analysis = process_resume_file(file_path, job_description)
            
            # Check if processing was successful
            if isinstance(extracted_data, dict) and 'error' in extracted_data:
                # Handle processing error
                error_message = extracted_data.get('error', 'Unknown processing error')
                self.resume_model.update_resume_status(resume_id, 'failed', error_message)
                logger.error(f"Resume processing failed for {resume_id}: {error_message}")
                return
            
            # Check if it's not a resume
            if isinstance(extracted_data, dict) and not extracted_data.get('is_resume', True):
                error_message = f"Document verification failed: {extracted_data.get('reason', 'Not a resume')}"
                self.resume_model.update_resume_status(resume_id, 'failed', error_message)
                logger.warning(f"Document is not a resume for {resume_id}: {error_message}")
                return
            
            # Generate additional analysis
            additional_analysis = {}
            
            try:
                from services.resume_extractor_cl import analyze_resume_quality, extract_resume_keywords, generate_resume_summary
                
                # Quality analysis
                quality_analysis = analyze_resume_quality(extracted_data)
                additional_analysis['quality_analysis'] = quality_analysis
                
                # Keywords extraction
                keywords = extract_resume_keywords(extracted_data)
                additional_analysis['keywords'] = keywords
                
                # Resume summary
                summary = generate_resume_summary(extracted_data)
                additional_analysis['summary'] = summary
                
            except Exception as e:
                logger.warning(f"Error generating additional analysis for {resume_id}: {e}")
            
            # Prepare complete resume data for Firebase
            complete_data = {}
            
            # Update with extracted data
            if extracted_data:
                complete_data['extracted_data'] = extracted_data
            
            # Update with interview questions
            if questions:
                complete_data['interview_questions'] = questions
            
            # Update with job match analysis
            if analysis:
                complete_data['job_match_analysis'] = analysis
            
            # Update with additional analysis
            if additional_analysis:
                complete_data['additional_analysis'] = additional_analysis
            
            # Update Firebase with all processed data
            self.resume_model.update_resume_with_processed_data(resume_id, complete_data)
            
            # Mark as completed
            self.resume_model.update_resume_status(resume_id, 'completed')
            
            logger.info(f"Resume processing completed successfully for: {resume_id}")
            
        except Exception as e:
            logger.error(f"Error in async resume processing: {e}")
            self.resume_model.update_resume_status(resume_id, 'failed', str(e))
        
        finally:
            # Clean up thread tracking
            if resume_id in self._processing_threads:
                del self._processing_threads[resume_id]
            
            # Try to process more queued resumes
            self._process_queued_resumes()
    
    def get_processing_status(self, resume_id: str) -> Optional[Dict[str, Any]]:
        """Get processing status of a resume"""
        try:
            resume_data = self.resume_model.get_resume_by_id(resume_id)
            if not resume_data:
                return None
            
            # Check if thread is still active
            thread_active = False
            if resume_id in self._processing_threads:
                thread_active = self._processing_threads[resume_id].is_alive()
            
            return {
                'resume_id': resume_id,
                'status': resume_data.get('processing_status', 'unknown'),
                'created_at': resume_data.get('created_at'),
                'processed_at': resume_data.get('processed_at'),
                'error_message': resume_data.get('error_message'),
                'filename': resume_data.get('filename', ''),
                'thread_active': thread_active,
                'active_processes': len([t for t in self._processing_threads.values() if t.is_alive()])
            }
            
        except Exception as e:
            logger.error(f"Error getting processing status: {e}")
            return None
    
    def get_resume_results(self, resume_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get complete resume processing results"""
        try:
            resume_data = self.resume_model.get_resume_by_id(resume_id)
            if not resume_data or resume_data.get('user_id') != user_id:
                return None
            
            if resume_data.get('processing_status') != 'completed':
                return {
                    'status': resume_data.get('processing_status', 'unknown'),
                    'message': 'Resume processing not completed yet'
                }
            
            return {
                'status': 'completed',
                'extracted_data': resume_data.get('extracted_data'),
                'interview_questions': resume_data.get('interview_questions'),
                'job_match_analysis': resume_data.get('job_match_analysis'),
                'additional_analysis': resume_data.get('additional_analysis'),
                'filename': resume_data.get('filename', ''),
                'processed_at': resume_data.get('processed_at')
            }
            
        except Exception as e:
            logger.error(f"Error getting resume results: {e}")
            return None
    
    def get_processing_statistics(self) -> Dict[str, Any]:
        """Get processing statistics"""
        try:
            # Get database statistics
            db_stats = self.resume_model.get_processing_statistics()
            
            # Get thread statistics
            active_threads = len([t for t in self._processing_threads.values() if t.is_alive()])
            total_threads = len(self._processing_threads)
            
            return {
                **db_stats,
                'active_processing_threads': active_threads,
                'total_processing_threads': total_threads,
                'max_concurrent_processes': self._max_concurrent_processes
            }
            
        except Exception as e:
            logger.error(f"Error getting processing statistics: {e}")
            return {
                'total_resumes': 0,
                'completed': 0,
                'processing': 0,
                'pending': 0,
                'failed': 0,
                'success_rate': 0,
                'active_processing_threads': 0,
                'total_processing_threads': 0,
                'max_concurrent_processes': self._max_concurrent_processes
            }
    
    def cleanup_old_files(self, max_age_hours: int = 24) -> Dict[str, Any]:
        """Clean up old temporary and processed files"""
        try:
            upload_folder = 'uploads/resumes'
            
            # Clean up temp files
            temp_files_deleted = cleanup_temp_files(upload_folder, max_age_hours)
            
            # Clean up old JSON files
            json_files_deleted = 0
            if os.path.exists(upload_folder):
                current_time = time.time()
                max_age_seconds = max_age_hours * 3600
                
                for filename in os.listdir(upload_folder):
                    if filename.endswith('_extracted_resume.json') or filename.endswith('_interview_questions.json'):
                        file_path = os.path.join(upload_folder, filename)
                        file_age = current_time - os.path.getmtime(file_path)
                        
                        if file_age > max_age_seconds:
                            try:
                                os.remove(file_path)
                                json_files_deleted += 1
                            except Exception as e:
                                logger.warning(f"Could not delete JSON file {file_path}: {e}")
            
            return {
                'temp_files_deleted': temp_files_deleted,
                'json_files_deleted': json_files_deleted,
                'total_files_deleted': temp_files_deleted + json_files_deleted
            }
            
        except Exception as e:
            logger.error(f"Error cleaning up old files: {e}")
            return {
                'temp_files_deleted': 0,
                'json_files_deleted': 0,
                'total_files_deleted': 0,
                'error': str(e)
            }
    
    def reprocess_resume(self, resume_id: str, user_id: str, new_job_description: str = "") -> Tuple[str, bool]:
        """Reprocess a resume with new job description"""
        try:
            # Get original resume data
            resume_data = self.resume_model.get_resume_by_id(resume_id)
            if not resume_data or resume_data.get('user_id') != user_id:
                return "", False
            
            # Check if original file exists
            file_path = resume_data.get('file_path')
            if not file_path or not os.path.exists(file_path):
                return "", False
            
            # Create new resume record
            new_resume_id, success = self.start_resume_processing(
                user_id=user_id,
                file_path=file_path,
                filename=f"reprocessed_{resume_data.get('filename', 'resume.pdf')}",
                job_description=new_job_description
            )
            
            return new_resume_id, success
            
        except Exception as e:
            logger.error(f"Error reprocessing resume: {e}")
            return "", False

# Create global instance
resume_service = ResumeProcessingService()