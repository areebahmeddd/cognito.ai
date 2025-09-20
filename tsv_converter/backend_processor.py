#!/usr/bin/env python3
"""
Backend Forensic Processor
=========================

Backend API wrapper for processing forensic report ZIP files and converting
TSV exports to UFDR JSON format. This module provides a simplified interface
for the FastAPI backend to interact with the core forensic processing functionality.

Key Features:
- ZIP file extraction and processing
- TSV to UFDR JSON conversion
- Permanent output directory management
- Comprehensive error handling and logging
- Integration with FastAPI backend

Author: TSV Converter Team
Version: 1.0.0
"""

import os
import sys
import tempfile
import shutil
from pathlib import Path
from typing import Optional, Dict, Any
import logging

# Add current directory to path for imports to ensure local modules can be imported
sys.path.insert(0, str(Path(__file__).parent))

from forensic_processor import ForensicReportProcessor


class BackendForensicProcessor:
    """
    Backend processor for forensic reports.
    
    This class provides a simplified interface for processing forensic report ZIP files
    in a backend API context. It handles ZIP file extraction, TSV conversion, and
    output directory management while providing comprehensive error handling.
    
    Attributes:
        case_id (str): Case identifier for UFDR documents
        device_id (str): Device identifier for UFDR documents
        config_path (Optional[str]): Path to configuration file
        logger: Logger instance for this processor
    """
    
    def __init__(self, case_id: str, device_id: str, config_path: Optional[str] = None):
        """
        Initialize the backend forensic processor.
        
        Args:
            case_id (str): Case identifier for UFDR documents. This will be included
                         in all generated UFDR documents for forensic tracking.
            device_id (str): Device identifier for UFDR documents. This will be included
                           in all generated UFDR documents for device tracking.
            config_path (Optional[str]): Path to custom configuration file. If None,
                                       uses default configuration for header mapping
                                       and data type detection.
        
        Raises:
            ValueError: If case_id or device_id are empty or None
        """
        # Validate required parameters
        if not case_id or not case_id.strip():
            raise ValueError("case_id cannot be empty or None")
        if not device_id or not device_id.strip():
            raise ValueError("device_id cannot be empty or None")
        
        self.case_id = case_id.strip()
        self.device_id = device_id.strip()
        self.config_path = config_path
        
        # Setup logging for this processor instance
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def process_uploaded_zip(self, zip_file_path: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
        """
        Process an uploaded ZIP file and convert TSV exports to UFDR JSON format.
        
        This method handles the complete processing pipeline:
        1. Validates the ZIP file path
        2. Creates a ForensicReportProcessor instance
        3. Determines output directory (creates if needed)
        4. Processes the ZIP file (extracts and converts TSV files)
        5. Cleans up temporary extracted files
        6. Counts generated JSON files
        7. Returns comprehensive processing results
        
        Args:
            zip_file_path (str): Path to the uploaded ZIP file containing forensic report data.
                               Must be a valid ZIP file with TSV exports in a '_TSV Exports' folder.
            output_dir (Optional[str]): Output directory for JSON files. If None, creates a
                                      'json_report' directory in the same location as the ZIP file.
        
        Returns:
            Dict[str, Any]: Processing results dictionary containing:
                - success (bool): Whether processing was successful
                - zip_file (str): Original ZIP file path
                - output_dir (str): Output directory path
                - tsv_files_processed (int): Number of TSV files processed
                - total_records (int): Total number of records converted
                - processing_time (float): Processing time in seconds
                - json_files_created (int): Number of JSON files created
                - conversion_report (str): Path to conversion report JSON
                - processing_report (str): Path to processing report JSON
                - error (str): Error message if processing failed
        
        Raises:
            FileNotFoundError: If ZIP file path doesn't exist
            ValueError: If ZIP file is invalid or corrupted
            OSError: If unable to create output directory or write files
        """
        try:
            # Validate that the ZIP file exists
            if not os.path.exists(zip_file_path):
                raise FileNotFoundError(f"ZIP file not found: {zip_file_path}")
            
            # Create the core forensic processor with case and device identifiers
            processor = ForensicReportProcessor(
                case_id=self.case_id,
                device_id=self.device_id,
                config_path=self.config_path
            )
            
            # Determine output directory - use provided path or create default
            if not output_dir:
                zip_dir = os.path.dirname(os.path.abspath(zip_file_path))
                output_dir = os.path.join(zip_dir, "json_report")
            
            # Log processing start with file and directory information
            self.logger.info(f"Processing ZIP file: {zip_file_path}")
            self.logger.info(f"Output directory: {output_dir}")
            
            # Process the ZIP file - this extracts TSV files and converts them to JSON
            results = processor.process_zip_file(zip_file_path, output_dir)
            
            # Clean up extracted files but preserve JSON exports
            # This removes temporary extracted files to save disk space
            processor.cleanup_extracted_files(results['extracted_folder'])
            
            # Count the number of JSON files created in the output directory
            json_exports_dir = os.path.join(output_dir, '_JSON Exports')
            json_files_count = 0
            if os.path.exists(json_exports_dir):
                json_files_count = len([f for f in os.listdir(json_exports_dir) if f.endswith('.json')])
            
            # Return comprehensive processing results
            return {
                'success': True,
                'zip_file': results['zip_file'],
                'output_dir': output_dir,
                'tsv_files_processed': results['tsv_files_found'],
                'total_records': results['total_records'],
                'processing_time': results['processing_time'],
                'json_files_created': json_files_count,
                'conversion_report': os.path.join(output_dir, '_JSON Exports', 'conversion_report.json'),
                'processing_report': os.path.join(output_dir, 'forensic_processing_report.json')
            }
            
        except Exception as e:
            # Log the error and return failure information
            self.logger.error(f"Error processing forensic report: {e}")
            return {
                'success': False,
                'error': str(e),
                'zip_file': zip_file_path,
                'output_dir': output_dir
            }


if __name__ == "__main__":
    # Example usage
    processor = BackendForensicProcessor(
        case_id="BACKEND-CASE-001",
        device_id="BACKEND-DEVICE-001"
    )
    
    # Process a ZIP file
    zip_file = "../aleapp_report.zip"
    if os.path.exists(zip_file):
        results = processor.process_uploaded_zip(zip_file)
        print("Processing Results:")
        print(f"Success: {results['success']}")
        if results['success']:
            print(f"Output Directory: {results['output_dir']}")
            print(f"TSV Files Processed: {results['tsv_files_processed']}")
            print(f"Total Records: {results['total_records']}")
            print(f"Processing Time: {results['processing_time']:.2f} seconds")
        else:
            print(f"Error: {results['error']}")
    else:
        print(f"ZIP file not found: {zip_file}")
