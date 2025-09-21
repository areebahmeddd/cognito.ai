#!/usr/bin/env python3
"""
Simple TSV to JSON API
=====================

FastAPI endpoint for the simple TSV to JSON converter.
Provides a clean API for converting TSV files to JSON format.
"""

import os
import sys
import json
import tempfile
import zipfile
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from tsv_to_json import TSVToJSONConverter
import uvicorn


# Create FastAPI app
app = FastAPI(
    title="Simple TSV to JSON Converter API",
    description="Universal TSV to JSON conversion with intelligent processing",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
MAX_TSV_FILES = 1000  # Maximum number of TSV files to process
MAX_POTENTIAL_TSV_FILES = 500  # Maximum number of potential TSV files to check

# Global variables for processing
processing_status = {
    "is_processing": False,
    "progress": 0,
    "current_file": "",
    "total_files": 0,
    "completed_files": 0,
    "errors": [],
    "results_zip_path": None
}


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Simple TSV to JSON Converter API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "convert": "/convert",
            "status": "/status",
            "download": "/download/{filename}",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "processing": processing_status["is_processing"]
    }


@app.post("/cleanup")
async def cleanup_files():
    """Clean up temporary files."""
    try:
        if processing_status.get("results_zip_path") and os.path.exists(processing_status["results_zip_path"]):
            os.remove(processing_status["results_zip_path"])
            processing_status["results_zip_path"] = None
            logger.info("Cleaned up results zip file")
        
        return {"status": "success", "message": "Files cleaned up"}
    except Exception as e:
        logger.error(f"Cleanup error: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/config")
async def get_config():
    """Get current configuration."""
    return {
        "max_tsv_files": MAX_TSV_FILES,
        "max_potential_tsv_files": MAX_POTENTIAL_TSV_FILES,
        "processing": processing_status["is_processing"]
    }


@app.get("/status")
async def get_status():
    """Get current processing status."""
    return processing_status


@app.post("/convert")
async def convert_tsv_files(
    file: UploadFile = File(...),
    case_id: str = Form(default="DEFAULT_CASE"),
    device_id: str = Form(default="DEFAULT_DEVICE"),
    output_format: str = Form(default="json")
):
    """
    Convert TSV files from uploaded ZIP to JSON format.
    
    Args:
        file: ZIP file containing TSV files
        case_id: Case identifier for UFDR documents
        device_id: Device identifier for UFDR documents
        output_format: Output format (json or jsonl)
    
    Returns:
        Conversion results and download links
    """
    global processing_status
    
    if processing_status["is_processing"]:
        raise HTTPException(status_code=409, detail="Another conversion is already in progress")
    
    try:
        # Reset processing status
        processing_status = {
            "is_processing": True,
            "progress": 0,
            "current_file": "",
            "total_files": 0,
            "completed_files": 0,
            "errors": []
        }
        
        logger.info(f"Starting conversion for case: {case_id}, device: {device_id}")
        
        # Create temporary directories
        temp_dir = tempfile.mkdtemp(prefix='tsv_conversion_')
        input_dir = os.path.join(temp_dir, 'input')
        output_dir = os.path.join(temp_dir, 'output')
        os.makedirs(input_dir, exist_ok=True)
        os.makedirs(output_dir, exist_ok=True)
        
        # Save uploaded file
        zip_path = os.path.join(temp_dir, file.filename)
        with open(zip_path, 'wb') as f:
            content = await file.read()
            f.write(content)
        
        logger.info(f"Saved uploaded file: {zip_path}")
        
        # Extract ZIP file with better error handling
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # Get list of files first
                file_list = zip_ref.namelist()
                logger.info(f"ZIP contains {len(file_list)} files")
                
                # Extract only TSV files to avoid path issues
                tsv_files = []
                extracted_count = 0
                
                for file_info in zip_ref.infolist():
                    # Skip directories and non-TSV files
                    if file_info.is_dir() or not file_info.filename.endswith('.tsv'):
                        continue
                    
                    try:
                        # Create safe filename - use only the basename
                        safe_filename = os.path.basename(file_info.filename)
                        if not safe_filename or safe_filename == '.tsv':
                            safe_filename = f"tsv_file_{extracted_count}.tsv"
                        
                        # Ensure filename is safe for Windows
                        safe_filename = "".join(c for c in safe_filename if c.isalnum() or c in '._-')
                        if not safe_filename.endswith('.tsv'):
                            safe_filename += '.tsv'
                        
                        # Extract to safe location
                        safe_path = os.path.join(input_dir, safe_filename)
                        
                        # Read file content and write to safe location
                        with zip_ref.open(file_info) as source:
                            content = source.read()
                            with open(safe_path, 'wb') as target:
                                target.write(content)
                        
                        tsv_files.append(safe_path)
                        extracted_count += 1
                        logger.info(f"Extracted TSV: {safe_filename} ({len(content)} bytes)")
                        
                        # Limit number of files to prevent memory issues
                        if extracted_count >= MAX_TSV_FILES:
                            logger.warning(f"Reached file limit ({MAX_TSV_FILES}), stopping extraction")
                            break
                            
                    except Exception as e:
                        logger.warning(f"Could not extract {file_info.filename}: {e}")
                        continue
                
                if not tsv_files:
                    logger.warning("No TSV files found in ZIP")
                    # Try to find any files that might be TSV data
                    for file_info in zip_ref.infolist():
                        if not file_info.is_dir() and file_info.filename:
                            try:
                                # Check if file might contain TSV data
                                with zip_ref.open(file_info) as source:
                                    content = source.read(1024)  # Read first 1KB
                                    if b'\t' in content:  # Contains tab characters
                                        safe_filename = f"potential_tsv_{extracted_count}.tsv"
                                        safe_path = os.path.join(input_dir, safe_filename)
                                        
                                        # Read full content
                                        source.seek(0)
                                        full_content = source.read()
                                        with open(safe_path, 'wb') as target:
                                            target.write(full_content)
                                        
                                        tsv_files.append(safe_path)
                                        extracted_count += 1
                                        logger.info(f"Extracted potential TSV: {safe_filename}")
                                        
                                        if extracted_count >= MAX_POTENTIAL_TSV_FILES:  # Limit for potential TSV files
                                            break
                            except Exception as e:
                                logger.warning(f"Could not check {file_info.filename}: {e}")
                                continue
                
                logger.info(f"Successfully extracted {len(tsv_files)} TSV files")
                
        except Exception as e:
            logger.error(f"Error extracting ZIP: {e}")
            raise HTTPException(status_code=400, detail=f"Error extracting ZIP file: {str(e)}")
        
        logger.info(f"Extracted ZIP to: {input_dir}")
        
        # Find TSV files (use extracted tsv_files if available, otherwise search)
        if not tsv_files:
            tsv_files = []
            for root, dirs, files in os.walk(input_dir):
                for file in files:
                    if file.endswith('.tsv'):
                        tsv_files.append(os.path.join(root, file))
        
        processing_status["total_files"] = len(tsv_files)
        logger.info(f"Found {len(tsv_files)} TSV files")
        
        if not tsv_files:
            processing_status["status"] = "failed"
            processing_status["error"] = "No TSV files found in the uploaded ZIP"
            logger.error("No TSV files found in the uploaded ZIP file")
            return JSONResponse(content={
                "status": "error",
                "message": "No TSV files found in the uploaded ZIP file. Please ensure your ZIP contains TSV files.",
                "results": {
                    "total_files": 0,
                    "successful_conversions": 0,
                    "failed_conversions": 0,
                    "total_records": 0,
                    "converted_files": [],
                    "errors": ["No TSV files found in the uploaded ZIP file"]
                }
            })
        
        # Create converter
        converter = TSVToJSONConverter(
            case_id=case_id,
            device_id=device_id
        )
        
        # Convert TSV files
        conversion_results = {
            "total_files": len(tsv_files),
            "successful_conversions": 0,
            "failed_conversions": 0,
            "total_records": 0,
            "converted_files": [],
            "errors": []
        }
        
        for i, tsv_file in enumerate(tsv_files):
            try:
                filename = os.path.basename(tsv_file)
                processing_status["current_file"] = filename
                processing_status["progress"] = int((i / len(tsv_files)) * 100)
                
                logger.info(f"Converting {filename} ({i+1}/{len(tsv_files)})")
                
                # Check if file exists and is readable
                if not os.path.exists(tsv_file):
                    error_msg = f"TSV file not found: {filename}"
                    logger.error(error_msg)
                    conversion_results["failed_conversions"] += 1
                    conversion_results["errors"].append(error_msg)
                    processing_status["errors"].append(error_msg)
                    continue
                
                # Check file size (skip very large files)
                file_size = os.path.getsize(tsv_file)
                if file_size > 100 * 1024 * 1024:  # 100MB limit
                    error_msg = f"File too large to process: {filename} ({file_size} bytes)"
                    logger.warning(error_msg)
                    conversion_results["failed_conversions"] += 1
                    conversion_results["errors"].append(error_msg)
                    continue
                
                # Convert TSV file
                json_filename = filename + '.json'
                json_path = os.path.join(output_dir, json_filename)
                
                count = converter.convert_tsv_file(tsv_file, json_path)
                
                if count > 0:
                    conversion_results["successful_conversions"] += 1
                    conversion_results["total_records"] += count
                    conversion_results["converted_files"].append({
                        "filename": json_filename,
                        "records": count,
                        "download_url": f"/download/{json_filename}"
                    })
                    logger.info(f"Successfully converted {filename}: {count} records")
                else:
                    conversion_results["failed_conversions"] += 1
                    conversion_results["errors"].append(f"No records converted from {filename}")
                    logger.warning(f"No records converted from {filename}")
                
                processing_status["completed_files"] = i + 1
                
            except Exception as e:
                error_msg = f"Error converting {filename}: {str(e)}"
                logger.error(error_msg)
                conversion_results["failed_conversions"] += 1
                conversion_results["errors"].append(error_msg)
                processing_status["errors"].append(error_msg)
        
        # Generate summary report
        report_path = os.path.join(output_dir, 'conversion_report.json')
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump({
                "conversion_date": datetime.now().isoformat(),
                "case_id": case_id,
                "device_id": device_id,
                "converter_type": "TSVToJSONConverter",
                "statistics": conversion_results,
                "summary": {
                    "total_tsv_files_processed": conversion_results["total_files"],
                    "successful_conversions": conversion_results["successful_conversions"],
                    "failed_conversions": conversion_results["failed_conversions"],
                    "total_records_converted": conversion_results["total_records"],
                    "success_rate": (conversion_results["successful_conversions"] / conversion_results["total_files"] * 100) if conversion_results["total_files"] > 0 else 0
                }
            }, f, indent=2, ensure_ascii=False)
        
        # Create final ZIP with results
        results_zip_path = os.path.join(temp_dir, 'conversion_results.zip')
        with zipfile.ZipFile(results_zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_ref:
            for root, dirs, files in os.walk(output_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, output_dir)
                    zip_ref.write(file_path, arcname)
        
        # Store the results zip path for download
        processing_status["results_zip_path"] = results_zip_path
        
        # Update processing status
        processing_status["is_processing"] = False
        processing_status["progress"] = 100
        processing_status["current_file"] = "Completed"
        
        # Return results
        return {
            "success": True,
            "message": "Conversion completed successfully",
            "results": conversion_results,
            "download_url": f"/download/conversion_results.zip",
            "temp_dir": temp_dir  # For cleanup later
        }
        
    except Exception as e:
        processing_status["is_processing"] = False
        error_msg = f"Conversion failed: {str(e)}"
        logger.error(error_msg)
        processing_status["errors"].append(error_msg)
        
        raise HTTPException(status_code=500, detail=error_msg)


@app.get("/download/{filename}")
async def download_file(filename: str):
    """Download converted files."""
    try:
        # Check if we have a results zip path stored
        if "results_zip_path" in processing_status and processing_status["results_zip_path"]:
            results_zip_path = processing_status["results_zip_path"]
            if os.path.exists(results_zip_path):
                logger.info(f"Serving download: {results_zip_path}")
                return FileResponse(
                    path=results_zip_path,
                    filename=filename,
                    media_type='application/zip'
                )
        
        # Fallback: look in temp directory
        temp_dir = tempfile.gettempdir()
        file_path = os.path.join(temp_dir, filename)
        
        if os.path.exists(file_path):
            logger.info(f"Serving download from temp: {file_path}")
            return FileResponse(
                path=file_path,
                filename=filename,
                media_type='application/zip' if filename.endswith('.zip') else 'application/octet-stream'
            )
        
        # Look in all temp directories for the file
        for root, dirs, files in os.walk(temp_dir):
            if filename in files:
                file_path = os.path.join(root, filename)
                logger.info(f"Serving download from search: {file_path}")
                return FileResponse(
                    path=file_path,
                    filename=filename,
                    media_type='application/zip' if filename.endswith('.zip') else 'application/octet-stream'
                )
        
        logger.error(f"File not found: {filename}")
        raise HTTPException(status_code=404, detail=f"File not found: {filename}")
        
    except Exception as e:
        logger.error(f"Download error: {e}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@app.get("/sample")
async def get_sample_data():
    """Get sample TSV data for testing."""
    sample_tsv = """Call Date	Phone Number	Duration	Type	Direction
2024-01-15 10:30:00	+1234567890	120	Voice	Incoming
2024-01-16 14:45:00	+0987654321	90	Voice	Outgoing
2024-01-17 09:15:00	+1122334450	0	Voice	Missed"""
    
    return {
        "sample_tsv": sample_tsv,
        "description": "Sample TSV data for testing the converter"
    }


@app.post("/test")
async def test_conversion():
    """Test the conversion with sample data."""
    try:
        # Create temporary test data
        temp_dir = tempfile.mkdtemp(prefix='tsv_test_')
        input_dir = os.path.join(temp_dir, 'input')
        output_dir = os.path.join(temp_dir, 'output')
        os.makedirs(input_dir, exist_ok=True)
        os.makedirs(output_dir, exist_ok=True)
        
        # Create sample TSV file
        sample_tsv = """Call Date	Phone Number	Duration	Type	Direction
2024-01-15 10:30:00	+1234567890	120	Voice	Incoming
2024-01-16 14:45:00	+0987654321	90	Voice	Outgoing
2024-01-17 09:15:00	+1122334450	0	Voice	Missed"""
        
        tsv_path = os.path.join(input_dir, 'sample_calls.tsv')
        with open(tsv_path, 'w', encoding='utf-8') as f:
            f.write(sample_tsv)
        
        # Convert
        converter = SimpleTSVToJSONConverter(
            case_id="TEST_CASE",
            device_id="TEST_DEVICE"
        )
        
        json_path = os.path.join(output_dir, 'sample_calls.tsv.json')
        count = converter.convert_tsv_file(tsv_path, json_path)
        
        # Read result
        with open(json_path, 'r', encoding='utf-8') as f:
            result = json.load(f)
        
        return {
            "success": True,
            "message": "Test conversion successful",
            "records_converted": count,
            "sample_output": result[0] if result else None
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Test conversion failed: {str(e)}"
        }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
