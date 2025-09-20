#!/usr/bin/env python3
"""
Forensic Processing API
======================

FastAPI-based REST API for processing forensic report ZIP files and converting
TSV exports to UFDR JSON format. Provides endpoints for file upload, processing,
and result retrieval with comprehensive error handling and logging.

Features:
- File upload with multipart form data
- Optional case_id and device_id parameters with defaults
- Two processing modes: file output and sync (direct JSON response)
- Permanent output directory creation
- Comprehensive error handling and logging
- CORS support for web frontend integration

Author: TSV Converter Team
Version: 1.0.0
"""

import os
import sys
import tempfile
from pathlib import Path
from typing import Optional
import logging

# Add current directory to path for imports to ensure local modules can be imported
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend_processor import BackendForensicProcessor

# Create FastAPI application with metadata for API documentation
app = FastAPI(
    title="Forensic Report Processor API",
    description="API for processing forensic report ZIP files and converting TSV exports to UFDR JSON format",
    version="1.0.0"
)

# Configure CORS middleware to allow cross-origin requests from web frontend
# WARNING: allow_origins=["*"] is for development only - configure properly for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup logging configuration for the application
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.get("/")
async def root():
    """
    Root endpoint providing API information and available endpoints.
    
    Returns:
        dict: API metadata including version and available endpoints
    """
    return {
        "message": "Forensic Report Processor API",
        "version": "1.0.0",
        "endpoints": {
            "process": "/process-forensic-report",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring API status.
    
    Returns:
        dict: Service health status
    """
    return {"status": "healthy", "service": "forensic-processor"}


@app.post("/process-forensic-report")
async def process_forensic_report(
    zip_file: UploadFile = File(..., description="Forensic report ZIP file"),
    case_id: str = Form(default="AUTO-CASE-001", description="Case identifier (optional, defaults to AUTO-CASE-001)"),
    device_id: str = Form(default="AUTO-DEVICE-001", description="Device identifier (optional, defaults to AUTO-DEVICE-001)")
):
    """
    Process a forensic report ZIP file and convert TSV exports to UFDR JSON format.
    
    This endpoint accepts a ZIP file containing forensic report data, extracts TSV files,
    converts them to UFDR JSON format, and saves the results to a permanent output directory.
    
    Args:
        zip_file (UploadFile): The uploaded ZIP file containing forensic report data.
                              Must be a valid ZIP file with TSV exports.
        case_id (str, optional): Case identifier for UFDR documents. 
                                Defaults to "AUTO-CASE-001" if not provided.
        device_id (str, optional): Device identifier for UFDR documents.
                                 Defaults to "AUTO-DEVICE-001" if not provided.
    
    Returns:
        JSONResponse: Processing results including:
            - success: Boolean indicating if processing was successful
            - message: Human-readable status message
            - results: Detailed processing statistics and file locations
    
    Raises:
        HTTPException: 400 if file is not a ZIP file
        HTTPException: 500 if processing fails or unexpected error occurs
    
    Example:
        POST /process-forensic-report
        Content-Type: multipart/form-data
        
        Form Data:
        - zip_file: forensic_report.zip
        - case_id: CASE-2024-001 (optional)
        - device_id: DEVICE-001 (optional)
    """
    temp_zip_path = None
    
    try:
        # Validate that the uploaded file is a ZIP file
        if not zip_file.filename.endswith('.zip'):
            raise HTTPException(
                status_code=400, 
                detail="File must be a ZIP file"
            )
        
        # Log processing start with file and parameter information
        logger.info(f"Processing forensic report: {zip_file.filename}")
        logger.info(f"Case ID: {case_id}, Device ID: {device_id}")
        
        # Create a temporary file to store the uploaded ZIP content
        # This is necessary because the processor expects a file path, not file content
        with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as temp_file:
            content = await zip_file.read()
            temp_file.write(content)
            temp_zip_path = temp_file.name
        
        logger.info(f"Temporary ZIP file created: {temp_zip_path}")
        
        # Initialize the backend processor with case and device identifiers
        processor = BackendForensicProcessor(
            case_id=case_id,
            device_id=device_id
        )
        
        # Create a permanent output directory in the tsv_converter folder
        # Directory structure: tsv_converter/output/{case_id}_{device_id}/
        output_dir = os.path.join(os.path.dirname(__file__), "output", f"{case_id}_{device_id}")
        os.makedirs(output_dir, exist_ok=True)
        
        # Process the ZIP file with the permanent output directory
        results = processor.process_uploaded_zip(temp_zip_path, output_dir)
        
        # Check if processing was successful
        if results['success']:
            logger.info(f"Processing completed successfully: {results['total_records']} records")
            
            # Return successful response with comprehensive processing statistics
            return JSONResponse(
                status_code=200,
                content={
                    'success': True,
                    'message': 'Forensic report processed successfully',
                    'results': {
                        'case_id': case_id,
                        'device_id': device_id,
                        'zip_filename': zip_file.filename,
                        'tsv_files_processed': results['tsv_files_processed'],
                        'total_records': results['total_records'],
                        'json_files_created': results['json_files_created'],
                        'processing_time': results['processing_time'],
                        'output_directory': results['output_dir'],
                        'permanent_output_path': output_dir,
                        'conversion_report': results['conversion_report'],
                        'processing_report': results['processing_report']
                    }
                }
            )
        else:
            # Processing failed - log error and raise HTTP exception
            logger.error(f"Processing failed: {results['error']}")
            raise HTTPException(
                status_code=500, 
                detail=f"Processing failed: {results['error']}"
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions (like file validation errors) as-is
        raise
    except Exception as e:
        # Catch any unexpected errors and return a 500 response
        logger.error(f"Unexpected error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'error': f'Failed to process forensic report: {str(e)}'
            }
        )
    finally:
        # Clean up temporary ZIP file to free disk space
        # This runs regardless of success or failure
        if temp_zip_path and os.path.exists(temp_zip_path):
            try:
                os.unlink(temp_zip_path)
                logger.info(f"Cleaned up temporary file: {temp_zip_path}")
            except Exception as e:
                # Log warning if cleanup fails but don't raise exception
                logger.warning(f"Failed to clean up temporary file: {e}")


@app.post("/process-forensic-report-sync")
async def process_forensic_report_sync(
    zip_file: UploadFile = File(..., description="Forensic report ZIP file"),
    case_id: str = Form(default="AUTO-CASE-001", description="Case identifier (optional, defaults to AUTO-CASE-001)"),
    device_id: str = Form(default="AUTO-DEVICE-001", description="Device identifier (optional, defaults to AUTO-DEVICE-001)")
):
    """
    Process a forensic report ZIP file synchronously and return JSON data directly.
    
    This endpoint is similar to /process-forensic-report but returns the actual JSON data
    from conversion and processing reports instead of file paths. This is useful for
    applications that need immediate access to the data without file system operations.
    
    Args:
        zip_file (UploadFile): The uploaded ZIP file containing forensic report data.
                              Must be a valid ZIP file with TSV exports.
        case_id (str, optional): Case identifier for UFDR documents. 
                                Defaults to "AUTO-CASE-001" if not provided.
        device_id (str, optional): Device identifier for UFDR documents.
                                 Defaults to "AUTO-DEVICE-001" if not provided.
    
    Returns:
        JSONResponse: Processing results including:
            - success: Boolean indicating if processing was successful
            - message: Human-readable status message
            - results: Detailed processing statistics with embedded JSON data
    
    Raises:
        HTTPException: 400 if file is not a ZIP file
        HTTPException: 500 if processing fails or unexpected error occurs
    
    Note:
        This endpoint still creates permanent output files but also returns the data
        directly in the response for immediate use by client applications.
    """
    temp_zip_path = None
    
    try:
        # Validate file type
        if not zip_file.filename.endswith('.zip'):
            raise HTTPException(
                status_code=400, 
                detail="File must be a ZIP file"
            )
        
        logger.info(f"Processing forensic report (sync): {zip_file.filename}")
        
        # Create temporary file for the uploaded ZIP
        with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as temp_file:
            content = await zip_file.read()
            temp_file.write(content)
            temp_zip_path = temp_file.name
        
        # Create processor
        processor = BackendForensicProcessor(
            case_id=case_id,
            device_id=device_id
        )
        
        # Create permanent output directory in tsv_converter folder
        output_dir = os.path.join(os.path.dirname(__file__), "output", f"{case_id}_{device_id}")
        os.makedirs(output_dir, exist_ok=True)
        
        # Process the ZIP file with permanent output directory
        results = processor.process_uploaded_zip(temp_zip_path, output_dir)
        
        if results['success']:
            # Read the conversion report
            conversion_report_path = results['conversion_report']
            processing_report_path = results['processing_report']
            
            conversion_data = {}
            processing_data = {}
            
            if os.path.exists(conversion_report_path):
                import json
                with open(conversion_report_path, 'r') as f:
                    conversion_data = json.load(f)
            
            if os.path.exists(processing_report_path):
                import json
                with open(processing_report_path, 'r') as f:
                    processing_data = json.load(f)
            
            return JSONResponse(
                status_code=200,
                content={
                    'success': True,
                    'message': 'Forensic report processed successfully',
                    'results': {
                        'case_id': case_id,
                        'device_id': device_id,
                        'zip_filename': zip_file.filename,
                        'tsv_files_processed': results['tsv_files_processed'],
                        'total_records': results['total_records'],
                        'json_files_created': results['json_files_created'],
                        'processing_time': results['processing_time'],
                        'permanent_output_path': output_dir,
                        'conversion_report': conversion_data,
                        'processing_report': processing_data
                    }
                }
            )
        else:
            raise HTTPException(
                status_code=500, 
                detail=f"Processing failed: {results['error']}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'error': f'Failed to process forensic report: {str(e)}'
            }
        )
    finally:
        # Clean up temporary file
        if temp_zip_path and os.path.exists(temp_zip_path):
            try:
                os.unlink(temp_zip_path)
            except Exception as e:
                logger.warning(f"Failed to clean up temporary file: {e}")


if __name__ == "__main__":
    """
    Main entry point for the Forensic Report Processor API server.
    
    This function starts the FastAPI server using Uvicorn with the following configuration:
    - Host: 0.0.0.0 (accepts connections from any IP address)
    - Port: 8000 (standard port for the API)
    - Log level: info (provides detailed logging information)
    
    The server provides the following endpoints:
    - GET /: API information and available endpoints
    - GET /health: Health check for monitoring
    - POST /process-forensic-report: Process ZIP files with file output
    - POST /process-forensic-report-sync: Process ZIP files with direct JSON response
    
    Usage:
        python forensic_api.py
    
    Access Points:
        - API Documentation: http://localhost:8000/docs
        - Health Check: http://localhost:8000/health
        - Process Endpoint: http://localhost:8000/process-forensic-report
    """
    import uvicorn
    
    # Display startup information for users
    print("🚀 Starting Forensic Report Processor API...")
    print("📡 API Documentation: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/health")
    print("📤 Process Endpoint: http://localhost:8000/process-forensic-report")
    
    # Start the Uvicorn server with the FastAPI application
    uvicorn.run(
        app, 
        host="0.0.0.0",  # Listen on all interfaces
        port=8000,       # Standard API port
        log_level="info" # Provide detailed logging
    )
