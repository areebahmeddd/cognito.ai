#!/usr/bin/env python3
"""
Simple Universal TSV to JSON Converter
=====================================

A truly universal converter that takes ANY TSV file and converts it to JSON
without hardcoding column names or overcomplicating the process.

Key Features:
- Works with ANY TSV file structure
- Preserves original column names
- Clean, simple JSON output
- Zero configuration required
- Fast processing
"""

import os
import sys
import json
import csv
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime


class TSVToJSONConverter:
    """
    Simple universal TSV to JSON converter.
    Takes ANY TSV file and converts it to clean JSON.
    """
    
    def __init__(self, case_id: str, device_id: str):
        """Initialize the simple TSV converter."""
        self.case_id = case_id
        self.device_id = device_id
        
        # Setup logging
        self.setup_logging()
        
        # Statistics
        self.stats = {
            'total_files': 0,
            'successful_conversions': 0,
            'failed_conversions': 0,
            'total_records': 0,
            'errors': []
        }
    
    def setup_logging(self):
        """Setup logging configuration."""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('simple_tsv_converter.log'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def convert_tsv_file(self, tsv_path: str, output_path: str) -> int:
        """
        Convert a single TSV file to JSON.
        
        Args:
            tsv_path: Path to input TSV file
            output_path: Path to output JSON file
            
        Returns:
            Number of records converted
        """
        try:
            self.logger.info(f"Converting TSV file: {tsv_path}")
            
            # Check if file exists
            if not os.path.exists(tsv_path):
                self.logger.error(f"TSV file not found: {tsv_path}")
                return 0
            
            # Check file size
            file_size = os.path.getsize(tsv_path)
            if file_size == 0:
                self.logger.warning(f"Empty TSV file: {tsv_path}")
                return 0
            
            # Read TSV file with better error handling
            try:
                with open(tsv_path, 'r', encoding='utf-8', errors='ignore') as f:
                    # Try to read first few lines to check format
                    first_line = f.readline()
                    if not first_line or not first_line.strip():
                        self.logger.warning(f"Empty or invalid TSV file: {tsv_path}")
                        return 0
                    
                    # Reset file pointer
                    f.seek(0)
                    reader = csv.DictReader(f, delimiter='\t')
                    headers = reader.fieldnames
                    
                    if not headers:
                        self.logger.warning(f"No headers found in {tsv_path}")
                        return 0
                    
                    rows = list(reader)
                    
            except Exception as e:
                self.logger.error(f"Error reading TSV file {tsv_path}: {str(e)}")
                return 0
            
            if not rows:
                self.logger.warning(f"No data rows found in {tsv_path}")
                return 0
            
            self.logger.info(f"Found {len(rows)} rows with {len(headers)} columns")
            
            # Convert to UFDR format with original structure preserved
            ufdr_documents = []
            for i, row in enumerate(rows):
                try:
                    ufdr_doc = self._create_ufdr_document(row, i, tsv_path)
                    ufdr_documents.append(ufdr_doc)
                except Exception as e:
                    self.logger.warning(f"Error processing row {i} in {tsv_path}: {str(e)}")
                    continue
            
            if not ufdr_documents:
                self.logger.warning(f"No valid records found in {tsv_path}")
                return 0
            
            # Write JSON output
            self._write_json_output(ufdr_documents, output_path)
            
            self.stats['successful_conversions'] += 1
            self.stats['total_records'] += len(ufdr_documents)
            
            self.logger.info(f"Successfully converted {len(ufdr_documents)} records")
            return len(ufdr_documents)
            
        except Exception as e:
            error_msg = f"Error converting TSV file {tsv_path}: {str(e)}"
            self.logger.error(error_msg)
            self.stats['failed_conversions'] += 1
            self.stats['errors'].append(error_msg)
            return 0
    
    def _create_ufdr_document(self, row: Dict[str, str], index: int, source_file: str) -> Dict[str, Any]:
        """Create a UFDR document from a TSV row."""
        # Create base UFDR document
        ufdr_doc = {
            '_id': f"record-{index:04d}",
            'artifact_id': f"RECORD-{index:04d}",
            'case_id': self.case_id,
            'device_id': self.device_id,
            'type': 'forensic_record',
            'data_type': 'tsv_record',
            'timestamp': self._extract_timestamp(row),
            'source_path': source_file,
            'conversion_timestamp': datetime.now().isoformat()
        }
        
        # Add ALL original TSV data as-is
        for header, value in row.items():
            if value and str(value).strip():
                # Clean header name for JSON key
                clean_header = header.strip().replace(' ', '_').replace('-', '_').lower()
                ufdr_doc[clean_header] = self._clean_value(value)
        
        return ufdr_doc
    
    def _extract_timestamp(self, row: Dict[str, str]) -> Optional[str]:
        """Extract timestamp from row if available."""
        # Look for common timestamp field names
        timestamp_fields = ['call_date', 'date', 'timestamp', 'time', 'created_date', 'last_access_date']
        
        for field in timestamp_fields:
            if field in row and row[field] and str(row[field]).strip():
                return str(row[field]).strip()
        
        # Look for any field that might contain a timestamp
        for header, value in row.items():
            if value and str(value).strip():
                # Check if it looks like a timestamp
                if self._looks_like_timestamp(str(value).strip()):
                    return str(value).strip()
        
        return None
    
    def _looks_like_timestamp(self, value: str) -> bool:
        """Check if a value looks like a timestamp."""
        import re
        
        timestamp_patterns = [
            r'\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
            r'\d{2}/\d{2}/\d{4}',   # MM/DD/YYYY
            r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}',  # ISO format
            r'\d{10,13}',  # Unix timestamp
        ]
        
        for pattern in timestamp_patterns:
            if re.search(pattern, value):
                return True
        
        return False
    
    def _clean_value(self, value: str) -> Any:
        """Clean and convert value to appropriate type."""
        if not value or not str(value).strip():
            return None
        
        value = str(value).strip()
        
        # Try to convert to number
        try:
            if '.' in value:
                return float(value)
            else:
                return int(value)
        except ValueError:
            pass
        
        # Try to convert to boolean
        if value.lower() in ['true', 'false', '1', '0', 'yes', 'no']:
            return value.lower() in ['true', '1', 'yes']
        
        # Return as string
        return value
    
    def _write_json_output(self, documents: List[Dict[str, Any]], output_path: str):
        """Write UFDR documents to JSON file."""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(documents, f, indent=2, ensure_ascii=False)
    
    def convert_tsv_directory(self, input_dir: str, output_dir: str) -> Dict[str, Any]:
        """Convert all TSV files in a directory."""
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Find all TSV files
        tsv_files = []
        for root, dirs, files in os.walk(input_dir):
            for file in files:
                if file.endswith('.tsv'):
                    tsv_files.append(os.path.join(root, file))
        
        self.stats['total_files'] = len(tsv_files)
        self.logger.info(f"Found {len(tsv_files)} TSV files to convert")
        
        # Convert each TSV file
        for tsv_file in tsv_files:
            filename = os.path.basename(tsv_file)
            json_file = os.path.join(output_dir, filename + '.json')
            
            try:
                count = self.convert_tsv_file(tsv_file, json_file)
                self.logger.info(f"Converted {filename}: {count} records")
            except Exception as e:
                self.logger.error(f"Failed to convert {filename}: {str(e)}")
                self.stats['failed_conversions'] += 1
        
        # Generate summary report
        self._generate_summary_report(output_dir)
        
        return self.stats
    
    def _generate_summary_report(self, output_dir: str):
        """Generate conversion summary report."""
        report_path = os.path.join(output_dir, 'simple_tsv_conversion_report.json')
        
        report = {
            'conversion_date': datetime.now().isoformat(),
            'case_id': self.case_id,
            'device_id': self.device_id,
            'converter_type': 'SimpleTSVToJSONConverter',
            'statistics': self.stats,
            'summary': {
                'total_tsv_files_processed': self.stats['total_files'],
                'successful_conversions': self.stats['successful_conversions'],
                'failed_conversions': self.stats['failed_conversions'],
                'total_records_converted': self.stats['total_records'],
                'success_rate': (self.stats['successful_conversions'] / self.stats['total_files'] * 100) if self.stats['total_files'] > 0 else 0
            }
        }
        
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"Simple TSV conversion report saved to {report_path}")


def main():
    """Main entry point for the simple TSV converter."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Simple Universal TSV to JSON Converter')
    parser.add_argument('--input-dir', required=True, help='Directory containing TSV files')
    parser.add_argument('--output-dir', required=True, help='Directory to save JSON files')
    parser.add_argument('--case-id', required=True, help='Case identifier')
    parser.add_argument('--device-id', required=True, help='Device identifier')
    
    args = parser.parse_args()
    
    # Create converter
    converter = SimpleTSVToJSONConverter(
        case_id=args.case_id,
        device_id=args.device_id
    )
    
    # Convert TSV files
    results = converter.convert_tsv_directory(args.input_dir, args.output_dir)
    
    # Print summary
    print(f"\n🚀 Simple TSV Conversion Summary:")
    print(f"Total TSV files: {results['total_files']}")
    print(f"Successful: {results['successful_conversions']}")
    print(f"Failed: {results['failed_conversions']}")
    print(f"Total records: {results['total_records']}")
    
    if results['errors']:
        print(f"\nErrors encountered:")
        for error in results['errors'][:5]:  # Show first 5 errors
            print(f"  - {error}")


if __name__ == '__main__':
    main()
