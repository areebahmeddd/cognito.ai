#!/usr/bin/env python3
"""
Main TSV to JSON Converter
==========================

Converts TSV files from forensic reports to UFDR JSON format.
Supports dynamic header mapping and automatic data type detection.
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
from config.mapping_config import load_config


class TSVToJSONConverter:
    """Main converter class for TSV to JSON conversion."""
    
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
        self.config = load_config(config_path)
        
        # Initialize utilities
        self.timestamp_parser = TimestampParser()
        self.entity_extractor = EntityExtractor()
        self.data_cleaner = DataCleaner()
        self.data_type_detector = DataTypeDetector(self.config)
        
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
                logging.FileHandler('tsv_converter.log'),
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
            header_mapping = self._map_headers_to_keys(headers)
            
            # Detect data type
            data_type = self.data_type_detector.detect_data_type(headers, rows)
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
    
    def _map_headers_to_keys(self, headers: List[str]) -> Dict[str, str]:
        """Map TSV headers to standardized JSON keys."""
        header_mapping = {}
        
        for header in headers:
            # Clean header name
            clean_header = header.strip().lower().replace(' ', '_')
            
            # Find best match in configuration
            best_match = self._find_best_match(clean_header)
            if best_match:
                header_mapping[header] = best_match
            else:
                # Use cleaned header as fallback
                header_mapping[header] = clean_header
        
        return header_mapping
    
    def _find_best_match(self, header: str) -> Optional[str]:
        """Find the best matching standardized key for a header."""
        header_variations = self.config.get('header_variations', {})
        
        for standard_key, variations in header_variations.items():
            for variation in variations:
                if variation.lower().replace(' ', '_') == header:
                    return standard_key
        
        return None
    
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
            'source_path': self._extract_source_path(row, header_mapping, source_file)
        }
        
        # Map common fields
        self._map_common_fields(ufdr_doc, row, header_mapping)
        
        # Map data-type specific fields
        self._map_specific_fields(ufdr_doc, row, header_mapping, data_type)
        
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
            'file': 'files'
        }
        return subcategories.get(data_type, data_type)
    
    def _extract_timestamp(self, row: Dict[str, str], header_mapping: Dict[str, str]) -> Optional[str]:
        """Extract and parse timestamp from row."""
        timestamp_fields = ['timestamp', 'date', 'time', 'created_date', 'last_access_date']
        
        for field in timestamp_fields:
            if field in header_mapping.values():
                key = next(k for k, v in header_mapping.items() if v == field)
                if row.get(key) and row[key].strip():
                    return self.timestamp_parser.parse_timestamp(row[key])
        
        return None
    
    def _extract_source_path(self, row: Dict[str, str], header_mapping: Dict[str, str], 
                           default_source: str) -> str:
        """Extract source path from row."""
        source_fields = ['source_file', 'source_path', 'file_path']
        
        for field in source_fields:
            if field in header_mapping.values():
                key = next(k for k, v in header_mapping.items() if v == field)
                if row.get(key) and row[key].strip():
                    return row[key]
        
        return default_source
    
    def _map_common_fields(self, ufdr_doc: Dict[str, Any], row: Dict[str, str], 
                          header_mapping: Dict[str, str]):
        """Map common fields that appear in most TSV files."""
        
        # Map text content
        text_fields = ['text', 'body', 'message', 'content', 'description', 'subject']
        for field in text_fields:
            if field in header_mapping.values():
                key = next(k for k, v in header_mapping.items() if v == field)
                if row.get(key) and row[key].strip():
                    ufdr_doc['text'] = self.data_cleaner.clean_text(row[key])
                    break
        
        # Map participants
        participants = self._extract_participants(row, header_mapping)
        if participants:
            ufdr_doc['participants'] = participants
        
        # Map location
        location = self._extract_location(row, header_mapping)
        if location:
            ufdr_doc['location'] = location
    
    def _map_specific_fields(self, ufdr_doc: Dict[str, Any], row: Dict[str, str], 
                            header_mapping: Dict[str, str], data_type: str):
        """Map fields specific to data type."""
        
        if data_type == 'call':
            self._map_call_fields(ufdr_doc, row, header_mapping)
        elif data_type == 'message':
            self._map_message_fields(ufdr_doc, row, header_mapping)
        elif data_type == 'contact':
            self._map_contact_fields(ufdr_doc, row, header_mapping)
        elif data_type == 'browser':
            self._map_browser_fields(ufdr_doc, row, header_mapping)
        elif data_type == 'location':
            self._map_location_fields(ufdr_doc, row, header_mapping)
    
    def _map_call_fields(self, ufdr_doc: Dict[str, Any], row: Dict[str, str], 
                        header_mapping: Dict[str, str]):
        """Map call-specific fields."""
        # Duration
        if 'duration' in header_mapping.values():
            key = next(k for k, v in header_mapping.items() if v == 'duration')
            if row.get(key) and row[key].strip():
                try:
                    ufdr_doc['duration_sec'] = int(row[key])
                except ValueError:
                    pass
        
        # Call type and direction
        if 'type' in header_mapping.values():
            key = next(k for k, v in header_mapping.items() if v == 'type')
            if row.get(key) and row[key].strip():
                call_type = row[key].lower()
                if 'incoming' in call_type:
                    ufdr_doc['direction'] = 'inbound'
                elif 'outgoing' in call_type:
                    ufdr_doc['direction'] = 'outbound'
                elif 'missed' in call_type:
                    ufdr_doc['direction'] = 'missed'
                elif 'rejected' in call_type:
                    ufdr_doc['direction'] = 'rejected'
                
                ufdr_doc['call_type'] = 'voice'
    
    def _map_message_fields(self, ufdr_doc: Dict[str, Any], row: Dict[str, str], 
                           header_mapping: Dict[str, str]):
        """Map message-specific fields."""
        # Message ID and Thread ID
        if 'message_id' in header_mapping.values():
            key = next(k for k, v in header_mapping.items() if v == 'message_id')
            if row.get(key) and row[key].strip():
                ufdr_doc['message_id'] = row[key]
        
        if 'thread_id' in header_mapping.values():
            key = next(k for k, v in header_mapping.items() if v == 'thread_id')
            if row.get(key) and row[key].strip():
                ufdr_doc['thread_id'] = row[key]
        
        # Channel detection
        if 'sms' in ufdr_doc.get('text', '').lower() or 'sms' in str(row).lower():
            ufdr_doc['channel'] = 'sms'
        elif 'whatsapp' in str(row).lower():
            ufdr_doc['channel'] = 'whatsapp'
        else:
            ufdr_doc['channel'] = 'sms'  # Default
    
    def _map_contact_fields(self, ufdr_doc: Dict[str, Any], row: Dict[str, str], 
                          header_mapping: Dict[str, str]):
        """Map contact-specific fields."""
        # Display names
        if 'display_name' in header_mapping.values():
            key = next(k for k, v in header_mapping.items() if v == 'display_name')
            if row.get(key) and row[key].strip():
                ufdr_doc['display_from'] = row[key]
        
        # Email
        if 'email' in header_mapping.values():
            key = next(k for k, v in header_mapping.items() if v == 'email')
            if row.get(key) and row[key].strip():
                ufdr_doc['email'] = row[key]
    
    def _map_browser_fields(self, ufdr_doc: Dict[str, Any], row: Dict[str, str], 
                          header_mapping: Dict[str, str]):
        """Map browser-specific fields."""
        # URL
        if 'url' in header_mapping.values():
            key = next(k for k, v in header_mapping.items() if v == 'url')
            if row.get(key) and row[key].strip():
                ufdr_doc['url'] = row[key]
        
        # Title
        if 'title' in header_mapping.values():
            key = next(k for k, v in header_mapping.items() if v == 'title')
            if row.get(key) and row[key].strip():
                ufdr_doc['text'] = row[key]
    
    def _map_location_fields(self, ufdr_doc: Dict[str, Any], row: Dict[str, str], 
                           header_mapping: Dict[str, str]):
        """Map location-specific fields."""
        # Address
        if 'address' in header_mapping.values():
            key = next(k for k, v in header_mapping.items() if v == 'address')
            if row.get(key) and row[key].strip():
                ufdr_doc['text'] = row[key]
    
    def _extract_participants(self, row: Dict[str, str], header_mapping: Dict[str, str]) -> List[str]:
        """Extract participants from row."""
        participants = []
        
        # Phone numbers
        phone_fields = ['phone_number', 'address', 'from', 'to']
        for field in phone_fields:
            if field in header_mapping.values():
                key = next(k for k, v in header_mapping.items() if v == field)
                if row.get(key) and row[key].strip():
                    phone = self.data_cleaner.normalize_phone(row[key])
                    if phone:
                        participants.append(phone)
        
        return list(set(participants))  # Remove duplicates
    
    def _extract_location(self, row: Dict[str, str], header_mapping: Dict[str, str]) -> Optional[Dict[str, float]]:
        """Extract location coordinates from row."""
        lat = None
        lon = None
        
        # Latitude
        if 'latitude' in header_mapping.values():
            key = next(k for k, v in header_mapping.items() if v == 'latitude')
            if row.get(key) and row[key].strip():
                try:
                    lat = float(row[key])
                except ValueError:
                    pass
        
        # Longitude
        if 'longitude' in header_mapping.values():
            key = next(k for k, v in header_mapping.items() if v == 'longitude')
            if row.get(key) and row[key].strip():
                try:
                    lon = float(row[key])
                except ValueError:
                    pass
        
        if lat is not None and lon is not None:
            return {'lat': lat, 'lon': lon}
        
        return None
    
    def _extract_entities(self, ufdr_doc: Dict[str, Any], row: Dict[str, str], 
                     header_mapping: Dict[str, str]):
        """Extract entities from text content."""
        text_content = ufdr_doc.get('text', '')
        if not text_content:
            return
        
        entities = self.entity_extractor.extract_entities(text_content)
        if entities:
            ufdr_doc['entities'] = entities
    
    def _write_json_output(self, documents: List[Dict[str, Any]], output_path: str):
        """Write UFDR documents to JSON file."""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(documents, f, indent=2, ensure_ascii=False)
    
    def _generate_summary_report(self, output_dir: str):
        """Generate conversion summary report."""
        report_path = os.path.join(output_dir, 'conversion_report.json')
        
        report = {
            'conversion_date': datetime.now().isoformat(),
            'case_id': self.case_id,
            'device_id': self.device_id,
            'statistics': self.stats,
            'summary': {
                'total_files_processed': self.stats['total_files'],
                'successful_conversions': self.stats['successful_conversions'],
                'failed_conversions': self.stats['failed_conversions'],
                'total_records_converted': self.stats['total_records'],
                'success_rate': (self.stats['successful_conversions'] / self.stats['total_files'] * 100) if self.stats['total_files'] > 0 else 0
            }
        }
        
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"Conversion report saved to {report_path}")


def main():
    """Main entry point for the converter."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Convert TSV files to UFDR JSON format')
    parser.add_argument('--input-dir', required=True, help='Directory containing TSV files')
    parser.add_argument('--output-dir', required=True, help='Directory to save JSON files')
    parser.add_argument('--case-id', required=True, help='Case identifier')
    parser.add_argument('--device-id', required=True, help='Device identifier')
    parser.add_argument('--config', help='Path to configuration file')
    
    args = parser.parse_args()
    
    # Create converter
    converter = TSVToJSONConverter(
        case_id=args.case_id,
        device_id=args.device_id,
        config_path=args.config
    )
    
    # Convert files
    results = converter.convert_all_files(args.input_dir, args.output_dir)
    
    # Print summary
    print(f"\nConversion Summary:")
    print(f"Total files: {results['total_files']}")
    print(f"Successful: {results['successful_conversions']}")
    print(f"Failed: {results['failed_conversions']}")
    print(f"Total records: {results['total_records']}")
    
    if results['errors']:
        print(f"\nErrors encountered:")
        for error in results['errors'][:5]:  # Show first 5 errors
            print(f"  - {error}")


if __name__ == '__main__':
    main()
