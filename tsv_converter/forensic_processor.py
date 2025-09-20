#!/usr/bin/env python3
"""
Forensic Report Processor
========================

Processes forensic report ZIP files by extracting TSV files and converting them to UFDR JSON format.
"""

import os
import sys
import zipfile
import tempfile
import shutil
import argparse
from pathlib import Path
from typing import Optional, Tuple, List
import logging
import tkinter as tk
from tkinter import filedialog

from main import TSVToJSONConverter


class ForensicReportProcessor:
    """Processes forensic report ZIP files."""
    
    def __init__(self, case_id: str, device_id: str, config_path: Optional[str] = None):
        """
        Initialize the forensic report processor.
        
        Args:
            case_id: Case identifier for UFDR documents
            device_id: Device identifier for UFDR documents
            config_path: Path to configuration file (optional)
        """
        self.case_id = case_id
        self.device_id = device_id
        self.config_path = config_path
        
        # Setup logging
        self.setup_logging()
        
        # Statistics
        self.stats = {
            'zip_file': '',
            'extracted_folder': '',
            'tsv_files_found': 0,
            'conversion_results': {},
            'total_records': 0,
            'processing_time': 0
        }
    
    def setup_logging(self):
        """Setup logging configuration."""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('forensic_processor.log'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def select_zip_file(self) -> Optional[str]:
        """
        Open a file picker dialog to select a ZIP file.
        
        Returns:
            Path to selected ZIP file, or None if cancelled
        """
        # Create a root window and hide it
        root = tk.Tk()
        root.withdraw()  # Hide the main window
        
        # Open file dialog
        zip_file = filedialog.askopenfilename(
            title="Select Forensic Report ZIP File",
            filetypes=[
                ("ZIP files", "*.zip"),
                ("All files", "*.*")
            ]
        )
        
        # Destroy the root window
        root.destroy()
        
        return zip_file if zip_file else None
    
    def process_zip_file(self, zip_path: str, output_dir: Optional[str] = None) -> dict:
        """
        Process a forensic report ZIP file.
        
        Args:
            zip_path: Path to the ZIP file
            output_dir: Directory to save output (optional, defaults to same as ZIP)
            
        Returns:
            Dictionary with processing results
        """
        import time
        start_time = time.time()
        
        self.stats['zip_file'] = zip_path
        
        try:
            # Validate ZIP file
            if not os.path.exists(zip_path):
                raise FileNotFoundError(f"ZIP file not found: {zip_path}")
            
            if not zipfile.is_zipfile(zip_path):
                raise ValueError(f"Not a valid ZIP file: {zip_path}")
            
            self.logger.info(f"Processing forensic report: {zip_path}")
            
            # Extract ZIP file
            extracted_folder = self._extract_zip_file(zip_path, output_dir)
            self.stats['extracted_folder'] = extracted_folder
            
            # Find TSV exports folder
            tsv_folder = self._find_tsv_exports_folder(extracted_folder)
            if not tsv_folder:
                raise ValueError("No '_TSV Exports' folder found in the ZIP file")
            
            self.logger.info(f"Found TSV exports folder: {tsv_folder}")
            
            # Count TSV files
            tsv_files = self._count_tsv_files(tsv_folder)
            self.stats['tsv_files_found'] = tsv_files
            self.logger.info(f"Found {tsv_files} TSV files to convert")
            
            # Convert TSV files to JSON
            conversion_results = self._convert_tsv_files(tsv_folder, extracted_folder)
            self.stats['conversion_results'] = conversion_results
            self.stats['total_records'] = conversion_results.get('total_records', 0)
            
            # Generate processing report
            self._generate_processing_report(extracted_folder)
            
            processing_time = time.time() - start_time
            self.stats['processing_time'] = processing_time
            
            self.logger.info(f"Processing completed in {processing_time:.2f} seconds")
            self.logger.info(f"Total records converted: {self.stats['total_records']}")
            
            return self.stats
            
        except Exception as e:
            self.logger.error(f"Error processing ZIP file: {str(e)}")
            raise
    
    def _extract_zip_file(self, zip_path: str, output_dir: Optional[str] = None) -> str:
        """
        Extract ZIP file to a temporary or specified directory.
        
        Args:
            zip_path: Path to ZIP file
            output_dir: Output directory (optional)
            
        Returns:
            Path to extracted folder
        """
        if output_dir is None:
            # Create output directory next to ZIP file
            zip_dir = os.path.dirname(zip_path)
            zip_name = os.path.splitext(os.path.basename(zip_path))[0]
            output_dir = os.path.join(zip_dir, f"{zip_name}_extracted")
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        self.logger.info(f"Extracting ZIP file to: {output_dir}")
        
        # Extract ZIP file with path length handling
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            for member in zip_ref.infolist():
                # Skip very long paths that cause Windows issues
                if len(member.filename) > 200:
                    self.logger.warning(f"Skipping long path: {member.filename[:100]}...")
                    continue
                
                try:
                    zip_ref.extract(member, output_dir)
                except Exception as e:
                    self.logger.warning(f"Could not extract {member.filename}: {e}")
                    continue
        
        self.logger.info("ZIP file extracted successfully")
        return output_dir
    
    def _find_tsv_exports_folder(self, extracted_folder: str) -> Optional[str]:
        """
        Find the _TSV Exports folder in the extracted directory.
        
        Args:
            extracted_folder: Path to extracted folder
            
        Returns:
            Path to _TSV Exports folder or None if not found
        """
        # Look for _TSV Exports folder
        tsv_folder = os.path.join(extracted_folder, "_TSV Exports")
        if os.path.exists(tsv_folder) and os.path.isdir(tsv_folder):
            return tsv_folder
        
        # Look for TSV Exports folder (without underscore)
        tsv_folder = os.path.join(extracted_folder, "TSV Exports")
        if os.path.exists(tsv_folder) and os.path.isdir(tsv_folder):
            return tsv_folder
        
        # Search recursively for any folder containing TSV files
        for root, dirs, files in os.walk(extracted_folder):
            for file in files:
                if file.endswith('.tsv'):
                    # Found TSV files, check if this is a TSV exports folder
                    folder_name = os.path.basename(root)
                    if 'tsv' in folder_name.lower() and 'export' in folder_name.lower():
                        return root
        
        return None
    
    def _count_tsv_files(self, tsv_folder: str) -> int:
        """
        Count TSV files in the folder.
        
        Args:
            tsv_folder: Path to TSV folder
            
        Returns:
            Number of TSV files
        """
        tsv_files = [f for f in os.listdir(tsv_folder) if f.endswith('.tsv')]
        return len(tsv_files)
    
    def _convert_tsv_files(self, tsv_folder: str, output_base_dir: str) -> dict:
        """
        Convert TSV files to JSON using the existing converter.
        
        Args:
            tsv_folder: Path to TSV folder
            output_base_dir: Base output directory
            
        Returns:
            Conversion results
        """
        # Create JSON exports folder
        json_folder = os.path.join(output_base_dir, "_JSON Exports")
        os.makedirs(json_folder, exist_ok=True)
        
        self.logger.info(f"Converting TSV files from {tsv_folder} to {json_folder}")
        
        # Create converter
        converter = TSVToJSONConverter(
            case_id=self.case_id,
            device_id=self.device_id,
            config_path=self.config_path
        )
        
        # Convert all TSV files
        results = converter.convert_all_files(tsv_folder, json_folder)
        
        self.logger.info(f"Conversion completed: {results['successful_conversions']} successful, {results['failed_conversions']} failed")
        
        return results
    
    def _generate_processing_report(self, output_dir: str):
        """
        Generate a comprehensive processing report.
        
        Args:
            output_dir: Output directory
        """
        report_path = os.path.join(output_dir, "forensic_processing_report.json")
        
        report = {
            'processing_date': self._get_current_timestamp(),
            'zip_file': self.stats['zip_file'],
            'extracted_folder': self.stats['extracted_folder'],
            'case_id': self.case_id,
            'device_id': self.device_id,
            'statistics': self.stats,
            'summary': {
                'tsv_files_found': self.stats['tsv_files_found'],
                'total_records_converted': self.stats['total_records'],
                'processing_time_seconds': self.stats['processing_time'],
                'success_rate': 100.0 if self.stats['tsv_files_found'] > 0 else 0.0
            }
        }
        
        import json
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"Processing report saved to: {report_path}")
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format."""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def cleanup_temp_files(self, extracted_folder: str, keep_extracted: bool = True):
        """
        Clean up temporary files.
        
        Args:
            extracted_folder: Path to extracted folder
            keep_extracted: Whether to keep the extracted folder
        """
        if not keep_extracted:
            if os.path.exists(extracted_folder):
                shutil.rmtree(extracted_folder)
                self.logger.info(f"Cleaned up extracted folder: {extracted_folder}")
    
    def cleanup_extracted_files(self, extracted_folder: str):
        """
        Clean up extracted files but preserve JSON exports and processing report.
        
        Args:
            extracted_folder: Path to extracted folder
        """
        try:
            # Find the JSON exports folder
            json_folder = os.path.join(extracted_folder, "_JSON Exports")
            processing_report = os.path.join(extracted_folder, "forensic_processing_report.json")
            
            # Create a temporary directory to preserve JSON files
            temp_dir = os.path.join(os.path.dirname(extracted_folder), "temp_json_preserve")
            os.makedirs(temp_dir, exist_ok=True)
            
            # Move JSON exports to temp directory
            if os.path.exists(json_folder):
                temp_json_folder = os.path.join(temp_dir, "_JSON Exports")
                shutil.move(json_folder, temp_json_folder)
                self.logger.info(f"Moved JSON exports to temp location: {temp_json_folder}")
            
            # Move processing report to temp directory
            if os.path.exists(processing_report):
                temp_report = os.path.join(temp_dir, "forensic_processing_report.json")
                shutil.move(processing_report, temp_report)
                self.logger.info(f"Moved processing report to temp location: {temp_report}")
            
            # Remove the entire extracted folder
            if os.path.exists(extracted_folder):
                shutil.rmtree(extracted_folder)
                self.logger.info(f"Removed extracted folder: {extracted_folder}")
            
            # Create json_report folder and move preserved files there
            if os.path.exists(temp_dir):
                # Create json_report folder
                json_report_folder = os.path.join(os.path.dirname(extracted_folder), "json_report")
                os.makedirs(json_report_folder, exist_ok=True)
                self.logger.info(f"Created json_report folder: {json_report_folder}")
                
                # Move JSON exports to json_report folder
                temp_json_folder = os.path.join(temp_dir, "_JSON Exports")
                if os.path.exists(temp_json_folder):
                    final_json_folder = os.path.join(json_report_folder, "_JSON Exports")
                    shutil.move(temp_json_folder, final_json_folder)
                    self.logger.info(f"Moved JSON exports to: {final_json_folder}")
                
                # Move processing report to json_report folder
                temp_report = os.path.join(temp_dir, "forensic_processing_report.json")
                if os.path.exists(temp_report):
                    final_report = os.path.join(json_report_folder, "forensic_processing_report.json")
                    shutil.move(temp_report, final_report)
                    self.logger.info(f"Moved processing report to: {final_report}")
                
                # Clean up temp directory
                shutil.rmtree(temp_dir)
                self.logger.info(f"Cleaned up temp directory: {temp_dir}")
            
            self.logger.info("Successfully cleaned up extracted files while preserving JSON exports")
            
        except Exception as e:
            self.logger.error(f"Error during cleanup: {e}")
            raise


def main():
    """Main entry point for the forensic report processor."""
    parser = argparse.ArgumentParser(description='Process forensic report ZIP files')
    parser.add_argument('--zip-file', help='Path to forensic report ZIP file (if not provided, file picker will open)')
    parser.add_argument('--case-id', required=True, help='Case identifier')
    parser.add_argument('--device-id', required=True, help='Device identifier')
    parser.add_argument('--output-dir', help='Output directory (optional)')
    parser.add_argument('--config', help='Path to configuration file')
    
    args = parser.parse_args()
    
    # Create processor
    processor = ForensicReportProcessor(
        case_id=args.case_id,
        device_id=args.device_id,
        config_path=args.config
    )
    
    try:
        # Get ZIP file path
        if args.zip_file:
            zip_file = args.zip_file
        else:
            print("🔍 Opening file picker to select ZIP file...")
            zip_file = processor.select_zip_file()
            if not zip_file:
                print("❌ No ZIP file selected. Exiting.")
                return
        
        # Create json_report folder in the same directory as the ZIP file
        zip_dir = os.path.dirname(os.path.abspath(zip_file))
        json_report_dir = os.path.join(zip_dir, "json_report")
        
        # Process ZIP file
        results = processor.process_zip_file(zip_file, json_report_dir)
        
        # Print results
        print(f"\n🎉 Forensic Report Processing Complete!")
        print(f"📁 ZIP file: {results['zip_file']}")
        print(f"📂 Extracted to: {results['extracted_folder']}")
        print(f"📊 TSV files found: {results['tsv_files_found']}")
        print(f"📈 Total records converted: {results['total_records']}")
        print(f"⏱️  Processing time: {results['processing_time']:.2f} seconds")
        
        # Cleanup extracted files but keep JSON exports
        processor.cleanup_extracted_files(results['extracted_folder'])
        print(f"🧹 Cleaned up extracted files, JSON exports moved to json_report folder")
        
        print(f"\n✅ Processing completed successfully!")
        
    except Exception as e:
        print(f"❌ Error processing forensic report: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
