# utils/file_utils.py
import os
import uuid
import hashlib
import PyPDF2
import logging
from werkzeug.utils import secure_filename
from typing import Optional, Tuple, Dict, Any, List
import time

logger = logging.getLogger(__name__)

def allowed_file(filename: str, allowed_extensions: set) -> bool:
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename while preserving the extension"""
    filename, ext = os.path.splitext(secure_filename(original_filename))
    unique_id = str(uuid.uuid4())
    return f"{filename}_{unique_id}{ext}"

def save_uploaded_file(file, upload_folder: str, allowed_extensions: set) -> Tuple[Optional[str], Optional[str]]:
    """Save uploaded file to the specified folder"""
    try:
        if not file or file.filename == '':
            return None, "No file selected"
        
        if not allowed_file(file.filename, allowed_extensions):
            return None, f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
        
        # Generate unique filename
        unique_filename = generate_unique_filename(file.filename)
        file_path = os.path.join(upload_folder, unique_filename)
        
        # Create directory if it doesn't exist
        os.makedirs(upload_folder, exist_ok=True)
        
        # Save file
        file.save(file_path)
        
        logger.info(f"File saved successfully: {file_path}")
        return file_path, None
        
    except Exception as e:
        logger.error(f"Error saving file: {e}")
        return None, f"Error saving file: {str(e)}"

def get_file_size(file_path: str) -> int:
    """Get file size in bytes"""
    try:
        return os.path.getsize(file_path)
    except OSError:
        return 0

def calculate_file_hash(file_path: str) -> str:
    """Calculate MD5 hash of file"""
    try:
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    except Exception as e:
        logger.error(f"Error calculating file hash: {e}")
        return ""

def delete_file(file_path: str) -> bool:
    """Delete file from filesystem"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"File deleted: {file_path}")
            return True
        return False
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        return False

def validate_pdf_file(file_path: str) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Validate PDF file and extract basic information
    
    Args:
        file_path: Path to the PDF file
        
    Returns:
        Tuple of (is_valid, error_message, metadata)
    """
    metadata = {
        'file_path': file_path,
        'file_size': 0,
        'pages_count': 0,
        'is_encrypted': False,
        'is_valid_pdf': False,
        'validation_time': 0
    }
    
    validation_start = time.time()
    
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            return False, "File does not exist", metadata
        
        # Get file size
        file_size = os.path.getsize(file_path)
        metadata['file_size'] = file_size
        
        if file_size == 0:
            return False, "File is empty", metadata
        
        if file_size > 50 * 1024 * 1024:  # 50MB limit
            return False, "File size exceeds 50MB limit", metadata
        
        # Check file extension
        if not file_path.lower().endswith('.pdf'):
            return False, "Only PDF files are supported", metadata
        
        # Try to open and read PDF
        try:
            with open(file_path, 'rb') as pdf_file:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                
                # Check if PDF is encrypted
                if pdf_reader.is_encrypted:
                    metadata['is_encrypted'] = True
                    return False, "PDF is encrypted and cannot be processed", metadata
                
                # Get page count
                pages_count = len(pdf_reader.pages)
                metadata['pages_count'] = pages_count
                
                if pages_count == 0:
                    return False, "PDF has no pages", metadata
                
                # Try to extract text from first page
                try:
                    first_page = pdf_reader.pages[0]
                    text = first_page.extract_text()
                    if not text.strip():
                        return False, "PDF appears to be empty or unreadable", metadata
                except Exception as e:
                    return False, f"Could not extract text from PDF: {str(e)}", metadata
                
                metadata['is_valid_pdf'] = True
                
        except Exception as e:
            return False, f"PDF reading failed: {str(e)}", metadata
        
        metadata['validation_time'] = time.time() - validation_start
        return True, "File is valid", metadata
        
    except Exception as e:
        metadata['validation_time'] = time.time() - validation_start
        return False, f"Validation error: {str(e)}", metadata

def extract_pdf_text(file_path: str, max_pages: int = None) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Extract text from PDF file
    
    Args:
        file_path: Path to the PDF file
        max_pages: Maximum number of pages to extract (None for all pages)
        
    Returns:
        Tuple of (success, text_or_error, metadata)
    """
    metadata = {
        'file_path': file_path,
        'pages_processed': 0,
        'total_pages': 0,
        'characters_extracted': 0,
        'words_extracted': 0,
        'extraction_time': 0,
        'errors': []
    }
    
    extraction_start = time.time()
    
    try:
        # Validate PDF first
        is_valid, error_message, validation_metadata = validate_pdf_file(file_path)
        if not is_valid:
            return False, error_message, metadata
        
        metadata.update(validation_metadata)
        
        # Extract text
        extracted_text = ""
        
        with open(file_path, 'rb') as pdf_file:
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            total_pages = len(pdf_reader.pages)
            metadata['total_pages'] = total_pages
            
            # Determine pages to process
            pages_to_process = total_pages
            if max_pages and max_pages < total_pages:
                pages_to_process = max_pages
            
            for page_num in range(pages_to_process):
                try:
                    page = pdf_reader.pages[page_num]
                    page_text = page.extract_text()
                    extracted_text += page_text + "\n"
                    metadata['pages_processed'] += 1
                except Exception as e:
                    error_msg = f"Error extracting page {page_num + 1}: {str(e)}"
                    metadata['errors'].append(error_msg)
                    logger.warning(error_msg)
            
            # Calculate text statistics
            metadata['characters_extracted'] = len(extracted_text)
            metadata['words_extracted'] = len(extracted_text.split())
        
        metadata['extraction_time'] = time.time() - extraction_start
        
        if not extracted_text.strip():
            return False, "No text could be extracted from the PDF", metadata
        
        return True, extracted_text, metadata
        
    except Exception as e:
        metadata['extraction_time'] = time.time() - extraction_start
        error_msg = f"PDF extraction failed: {str(e)}"
        metadata['errors'].append(error_msg)
        return False, error_msg, metadata

def cleanup_temp_files(directory: str, max_age_hours: int = 24) -> int:
    """
    Clean up temporary files older than specified age
    
    Args:
        directory: Directory to clean up
        max_age_hours: Maximum age of files in hours
        
    Returns:
        Number of files deleted
    """
    try:
        if not os.path.exists(directory):
            return 0
        
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        deleted_count = 0
        
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            
            # Check if it's a file and starts with 'temp_'
            if os.path.isfile(file_path) and filename.startswith('temp_'):
                file_age = current_time - os.path.getmtime(file_path)
                
                if file_age > max_age_seconds:
                    try:
                        os.remove(file_path)
                        deleted_count += 1
                        logger.info(f"Deleted temp file: {file_path}")
                    except Exception as e:
                        logger.warning(f"Could not delete temp file {file_path}: {e}")
        
        return deleted_count
        
    except Exception as e:
        logger.error(f"Error cleaning up temp files: {e}")
        return 0

def get_file_info(file_path: str) -> Dict[str, Any]:
    """
    Get comprehensive file information
    
    Args:
        file_path: Path to the file
        
    Returns:
        Dictionary containing file information
    """
    try:
        if not os.path.exists(file_path):
            return {'error': 'File does not exist'}
        
        stat_info = os.stat(file_path)
        
        file_info = {
            'file_path': file_path,
            'filename': os.path.basename(file_path),
            'directory': os.path.dirname(file_path),
            'file_size': stat_info.st_size,
            'file_size_mb': round(stat_info.st_size / (1024 * 1024), 2),
            'created_time': stat_info.st_ctime,
            'modified_time': stat_info.st_mtime,
            'accessed_time': stat_info.st_atime,
            'file_hash': calculate_file_hash(file_path),
            'extension': os.path.splitext(file_path)[1].lower(),
            'is_pdf': file_path.lower().endswith('.pdf')
        }
        
        # Add PDF-specific information if it's a PDF
        if file_info['is_pdf']:
            try:
                with open(file_path, 'rb') as pdf_file:
                    pdf_reader = PyPDF2.PdfReader(pdf_file)
                    file_info['pdf_pages'] = len(pdf_reader.pages)
                    file_info['pdf_encrypted'] = pdf_reader.is_encrypted
            except Exception as e:
                file_info['pdf_error'] = str(e)
        
        return file_info
        
    except Exception as e:
        logger.error(f"Error getting file info: {e}")
        return {'error': str(e)}

def create_backup_copy(file_path: str, backup_suffix: str = "_backup") -> Optional[str]:
    """
    Create a backup copy of a file
    
    Args:
        file_path: Path to the original file
        backup_suffix: Suffix to add to backup filename
        
    Returns:
        Path to backup file or None if failed
    """
    try:
        if not os.path.exists(file_path):
            return None
        
        directory = os.path.dirname(file_path)
        filename = os.path.basename(file_path)
        name, ext = os.path.splitext(filename)
        
        backup_filename = f"{name}{backup_suffix}{ext}"
        backup_path = os.path.join(directory, backup_filename)
        
        # Copy file
        import shutil
        shutil.copy2(file_path, backup_path)
        
        logger.info(f"Created backup: {backup_path}")
        return backup_path
        
    except Exception as e:
        logger.error(f"Error creating backup: {e}")
        return None

def validate_file_upload(file, max_size: int, allowed_extensions: set) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Validate uploaded file
    
    Args:
        file: Uploaded file object
        max_size: Maximum file size in bytes
        allowed_extensions: Set of allowed file extensions
        
    Returns:
        Tuple of (is_valid, error_message, file_info)
    """
    file_info = {
        'filename': file.filename if file else None,
        'content_type': file.content_type if file else None,
        'file_size': 0,
        'extension': None
    }
    
    try:
        if not file:
            return False, "No file provided", file_info
        
        if file.filename == '':
            return False, "No file selected", file_info
        
        # Check file extension
        if not allowed_file(file.filename, allowed_extensions):
            return False, f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}", file_info
        
        file_info['extension'] = os.path.splitext(file.filename)[1].lower()
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)  # Reset file pointer
        
        file_info['file_size'] = file_size
        
        if file_size > max_size:
            max_size_mb = max_size // (1024 * 1024)
            return False, f"File size exceeds maximum limit of {max_size_mb}MB", file_info
        
        if file_size == 0:
            return False, "File is empty", file_info
        
        return True, "File is valid", file_info
        
    except Exception as e:
        logger.error(f"Error validating uploaded file: {e}")
        return False, f"Validation error: {str(e)}", file_info