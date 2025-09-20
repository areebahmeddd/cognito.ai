#!/usr/bin/env python3
"""
Fixed TSV to JSON Converter
===========================

Fixed version of the TSV to JSON converter that properly maps all headers
and captures all relevant data from forensic reports.
"""

import os
import sys
import json
import csv
import glob
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import re

from utils.timestamp_parser import TimestampParser
from utils.entity_extractor import EntityExtractor
from utils.data_cleaner import DataCleaner
from utils.data_type_detector import DataTypeDetector
from enhanced_header_mapper import EnhancedHeaderMapper


class FixedTSVToJSONConverter:
    """Fixed converter class for TSV to JSON conversion."""
    
    def __init__(self, case_id: str, device_id: str, config_path: Optional[str] = None):
        """
        Initialize the converter.
        
        Args:
            case_id: Case identifier for UFDR documents
            device_id: Device identifier for UFDR documents
            config_path: Path to configuration file (optional)
        """
        self.case_id = case_id
        self.device_id = device_id
        
        # Initialize utilities
        self.timestamp_parser = TimestampParser()
        self.entity_extractor = EntityExtractor()
        self.data_cleaner = DataCleaner()
        self.data_type_detector = DataTypeDetector({})
        self.header_mapper = EnhancedHeaderMapper(config_path)
        
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
                logging.FileHandler('fixed_converter.log'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def convert_file(self, tsv_path: str, output_path: str) -> int:
        """
        Convert a single TSV file to JSON.
        
        Args:
            tsv_path: Path to input TSV file
            output_path: Path to output JSON file
            
        Returns:
            Number of records converted
        """
        try:
            self.logger.info(f"Converting {tsv_path} to {output_path}")
            
            # Read TSV file
            with open(tsv_path, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.DictReader(f, delimiter='\t')
                headers = reader.fieldnames
                rows = list(reader)
            
            if not rows:
                self.logger.warning(f"No data rows found in {tsv_path}")
                return 0
            
            # Map headers to standardized keys
            header_mapping = self.header_mapper.map_headers(headers)
            self.logger.info(f"Header mapping: {header_mapping}")
            
            # Detect data type
            data_type = self._detect_data_type(tsv_path, headers, rows)
            self.logger.info(f"Detected data type: {data_type}")
            
            # Convert rows to UFDR format
            ufdr_documents = []
            for i, row in enumerate(rows):
                try:
                    ufdr_doc = self._convert_row_to_ufdr(
                        row, header_mapping, data_type, i, tsv_path
                    )
                    ufdr_documents.append(ufdr_doc)
                except Exception as e:
                    error_msg = f"Error converting row {i} in {tsv_path}: {str(e)}"
                    self.logger.error(error_msg)
                    self.stats['errors'].append(error_msg)
                    continue
            
            # Write JSON output
            self._write_json_output(ufdr_documents, output_path)
            
            self.stats['successful_conversions'] += 1
            self.stats['total_records'] += len(ufdr_documents)
            
            self.logger.info(f"Successfully converted {len(ufdr_documents)} records")
            return len(ufdr_documents)
            
        except Exception as e:
            error_msg = f"Error converting {tsv_path}: {str(e)}"
            self.logger.error(error_msg)
            self.stats['failed_conversions'] += 1
            self.stats['errors'].append(error_msg)
            return 0
    
    def _detect_data_type(self, tsv_path: str, headers: List[str], rows: List[Dict[str, str]]) -> str:
        """Detect data type from file path and content."""
        filename = os.path.basename(tsv_path).lower()
        
        # File name based detection
        if 'call' in filename:
            return 'call'
        elif 'sms' in filename or 'message' in filename:
            return 'message'
        elif 'contact' in filename:
            return 'contact'
        elif 'chrome' in filename or 'browser' in filename or 'web' in filename:
            return 'browser'
        elif 'location' in filename or 'gps' in filename or 'maps' in filename:
            return 'location'
        elif 'media' in filename or 'image' in filename or 'video' in filename:
            return 'media'
        elif 'wifi' in filename or 'bluetooth' in filename:
            return 'system'
        elif 'usage' in filename or 'battery' in filename:
            return 'system'
        elif 'notification' in filename:
            return 'system'
        
        # Content based detection
        if rows:
            sample_row = rows[0]
            if 'body' in sample_row or 'message' in sample_row or 'text' in sample_row:
                return 'message'
            elif 'phone' in sample_row or 'address' in sample_row:
                return 'call'
            elif 'latitude' in sample_row or 'longitude' in sample_row:
                return 'location'
            elif 'url' in sample_row:
                return 'browser'
        
        return 'unknown'
    
    def _convert_row_to_ufdr(self, row: Dict[str, str], header_mapping: Dict[str, str], 
                           data_type: str, row_index: int, source_file: str) -> Dict[str, Any]:
        """Convert a single row to UFDR format."""
        
        # Create base UFDR document
        ufdr_doc = {
            '_id': f"{data_type}-{row_index}",
            'artifact_id': f"{data_type.upper()}-{row_index:04d}",
            'case_id': self.case_id,
            'device_id': self.device_id,
            'type': data_type,
            'data_type': self._get_data_type_subcategory(data_type, row),
            'timestamp': self._extract_timestamp(row, header_mapping),
            'source_path': source_file
        }
        
        # Map all fields using enhanced header mapper
        mapped_data = self.header_mapper.map_row_data(row, header_mapping, data_type)
        
        # Add mapped data to UFDR document
        for key, value in mapped_data.items():
            if value and str(value).strip():
                ufdr_doc[key] = value
        
        # Add data type specific fields
        self._add_data_type_specific_fields(ufdr_doc, row, header_mapping, data_type)
        
        # Extract entities
        self._extract_entities(ufdr_doc, row, header_mapping)
        
        return ufdr_doc
    
    def _get_data_type_subcategory(self, data_type: str, row: Dict[str, str]) -> str:
        """Get subcategory for data type."""
        subcategories = {
            'call': 'call_logs',
            'message': 'chat',
            'contact': 'contacts',
            'browser': 'web_history',
            'location': 'places',
            'media': 'files',
            'system': 'system_data'
        }
        return subcategories.get(data_type, data_type)
    
    def _extract_timestamp(self, row: Dict[str, str], header_mapping: Dict[str, str]) -> Optional[str]:
        """Extract and parse timestamp from row."""
        timestamp_fields = ['timestamp', 'date', 'time', 'created_date', 'last_access_date', 'date_sent']
        
        for field in timestamp_fields:
            if field in header_mapping.values():
                key = next(k for k, v in header_mapping.items() if v == field)
                if row.get(key) and row[key].strip():
                    return self.timestamp_parser.parse_timestamp(row[key])
        
        return None
    
    def _add_data_type_specific_fields(self, ufdr_doc: Dict[str, Any], row: Dict[str, str], 
                                     header_mapping: Dict[str, str], data_type: str):
        """Add data type specific fields."""
        
        if data_type == 'message':
            # Add message specific fields
            if 'message_text' in ufdr_doc:
                ufdr_doc['text'] = ufdr_doc['message_text']
            if 'message_type' in ufdr_doc:
                ufdr_doc['direction'] = 'inbound' if 'received' in ufdr_doc['message_type'].lower() else 'outbound'
            if 'read_status' in ufdr_doc:
                ufdr_doc['read'] = ufdr_doc['read_status'] == '1'
            if 'thread_id' in ufdr_doc:
                ufdr_doc['thread_id'] = ufdr_doc['thread_id']
            if 'message_id' in ufdr_doc:
                ufdr_doc['message_id'] = ufdr_doc['message_id']
            
            # Set channel
            if 'sms' in str(row).lower() or 'sms' in ufdr_doc.get('text', '').lower():
                ufdr_doc['channel'] = 'sms'
            elif 'whatsapp' in str(row).lower():
                ufdr_doc['channel'] = 'whatsapp'
            elif 'telegram' in str(row).lower():
                ufdr_doc['channel'] = 'telegram'
            else:
                ufdr_doc['channel'] = 'sms'  # Default
        
        elif data_type == 'call':
            # Add call specific fields
            if 'duration' in ufdr_doc:
                try:
                    ufdr_doc['duration_sec'] = int(ufdr_doc['duration'])
                except ValueError:
                    pass
            if 'call_type' in ufdr_doc:
                call_type = ufdr_doc['call_type'].lower()
                if 'incoming' in call_type:
                    ufdr_doc['direction'] = 'inbound'
                elif 'outgoing' in call_type:
                    ufdr_doc['direction'] = 'outbound'
                elif 'missed' in call_type:
                    ufdr_doc['direction'] = 'missed'
                elif 'rejected' in call_type:
                    ufdr_doc['direction'] = 'rejected'
                ufdr_doc['call_type'] = 'voice'
        
        elif data_type == 'location':
            # Add location specific fields
            if 'latitude' in ufdr_doc and 'longitude' in ufdr_doc:
                ufdr_doc['coordinates'] = {
                    'lat': float(ufdr_doc['latitude']) if ufdr_doc['latitude'] else None,
                    'lng': float(ufdr_doc['longitude']) if ufdr_doc['longitude'] else None
                }
        
        elif data_type == 'browser':
            # Add browser specific fields
            if 'url' in ufdr_doc:
                ufdr_doc['url'] = ufdr_doc['url']
            if 'title' in ufdr_doc:
                ufdr_doc['title'] = ufdr_doc['title']
    
    def _extract_entities(self, ufdr_doc: Dict[str, Any], row: Dict[str, str], 
                         header_mapping: Dict[str, str]):
        """Extract entities from text content."""
        text_content = ufdr_doc.get('text', '') or ufdr_doc.get('message_text', '') or ufdr_doc.get('body', '')
        
        if text_content:
            # Extract phone numbers
            phone_numbers = self.entity_extractor.extract_phone_numbers(text_content)
            if phone_numbers:
                ufdr_doc['extracted_phone_numbers'] = phone_numbers
            
            # Extract emails
            emails = self.entity_extractor.extract_emails(text_content)
            if emails:
                ufdr_doc['extracted_emails'] = emails
            
            # Extract URLs
            urls = self.entity_extractor.extract_urls(text_content)
            if urls:
                ufdr_doc['extracted_urls'] = urls
    
    def _write_json_output(self, ufdr_documents: List[Dict[str, Any]], output_path: str):
        """Write UFDR documents to JSON file."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(ufdr_documents, f, indent=2, ensure_ascii=False)
    
    def convert_all_files(self, input_dir: str, output_dir: str) -> Dict[str, Any]:
        """
        Convert all TSV files in a directory.
        
        Args:
            input_dir: Directory containing TSV files
            output_dir: Directory to save JSON files
            
        Returns:
            Dictionary with conversion statistics
        """
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Find all TSV files
        tsv_files = glob.glob(os.path.join(input_dir, "*.tsv"))
        self.stats['total_files'] = len(tsv_files)
        
        self.logger.info(f"Found {len(tsv_files)} TSV files to convert")
        
        # Convert each file
        for tsv_file in tsv_files:
            filename = os.path.basename(tsv_file)
            json_file = os.path.join(output_dir, filename.replace('.tsv', '.json'))
            
            try:
                count = self.convert_file(tsv_file, json_file)
                self.logger.info(f"Converted {filename}: {count} records")
            except Exception as e:
                self.logger.error(f"Failed to convert {filename}: {str(e)}")
                self.stats['failed_conversions'] += 1
        
        # Generate summary report
        self._generate_summary_report(output_dir)
        
        return self.stats
    
    def _generate_summary_report(self, output_dir: str):
        """Generate a summary report of the conversion."""
        report = {
            'conversion_date': datetime.now().isoformat(),
            'case_id': self.case_id,
            'device_id': self.device_id,
            'statistics': self.stats,
            'summary': {
                'total_files': self.stats['total_files'],
                'successful_conversions': self.stats['successful_conversions'],
                'failed_conversions': self.stats['failed_conversions'],
                'total_records': self.stats['total_records'],
                'success_rate': (self.stats['successful_conversions'] / self.stats['total_files'] * 100) if self.stats['total_files'] > 0 else 0
            }
        }
        
        report_path = os.path.join(output_dir, 'conversion_report.json')
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"Conversion report saved to: {report_path}")


def main():
    """Main entry point for the fixed converter."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Fixed TSV to JSON converter')
    parser.add_argument('--input-dir', required=True, help='Input directory containing TSV files')
    parser.add_argument('--output-dir', required=True, help='Output directory for JSON files')
    parser.add_argument('--case-id', required=True, help='Case identifier')
    parser.add_argument('--device-id', required=True, help='Device identifier')
    parser.add_argument('--config', help='Path to configuration file')
    
    args = parser.parse_args()
    
    # Create converter
    converter = FixedTSVToJSONConverter(
        case_id=args.case_id,
        device_id=args.device_id,
        config_path=args.config
    )
    
    try:
        # Convert files
        results = converter.convert_all_files(args.input_dir, args.output_dir)
        
        print(f"\n🎉 Fixed Conversion Complete!")
        print(f"📊 Total files: {results['total_files']}")
        print(f"✅ Successful conversions: {results['successful_conversions']}")
        print(f"❌ Failed conversions: {results['failed_conversions']}")
        print(f"📄 Total records: {results['total_records']}")
        print(f"📈 Success rate: {results['successful_conversions'] / results['total_files'] * 100:.1f}%")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
