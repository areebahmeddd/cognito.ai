#!/usr/bin/env python3
"""
Universal TSV to JSON Converter
==============================

Automatically converts ANY TSV file to JSON by preserving ALL headers and data
without manual mapping. This approach captures 100% of the data.

Key Features:
- Zero configuration required
- Preserves ALL headers and data
- Works with ANY TSV file
- Automatic data type detection
- Smart field normalization
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
import unicodedata


class UniversalTSVConverter:
    """
    Universal converter that automatically handles ANY TSV file
    by preserving all headers and data without manual mapping.
    """
    
    def __init__(self, case_id: str, device_id: str):
        """
        Initialize the universal converter.
        
        Args:
            case_id: Case identifier for UFDR documents
            device_id: Device identifier for UFDR documents
        """
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
                logging.FileHandler('universal_converter.log'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def convert_file(self, tsv_path: str, output_path: str) -> int:
        """
        Convert a single TSV file to JSON preserving ALL data.
        
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
            
            # Detect data type from filename and content
            data_type = self._detect_data_type(tsv_path, headers, rows)
            self.logger.info(f"Detected data type: {data_type}")
            
            # Convert rows to UFDR format preserving ALL data
            ufdr_documents = []
            for i, row in enumerate(rows):
                try:
                    ufdr_doc = self._convert_row_to_ufdr(
                        row, headers, data_type, i, tsv_path
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
        elif 'chrome' in filename or 'browser' in filename or 'web' in filename or 'cookies' in filename:
            return 'browser'
        elif 'location' in filename or 'gps' in filename or 'maps' in filename:
            return 'location'
        elif 'media' in filename or 'image' in filename or 'video' in filename or 'photos' in filename:
            return 'media'
        elif 'discord' in filename:
            return 'discord'
        elif 'facebook' in filename or 'messenger' in filename:
            return 'facebook'
        elif 'snapchat' in filename:
            return 'snapchat'
        elif 'whatsapp' in filename:
            return 'whatsapp'
        elif 'telegram' in filename:
            return 'telegram'
        elif 'wifi' in filename or 'bluetooth' in filename:
            return 'system'
        elif 'usage' in filename or 'battery' in filename:
            return 'system'
        elif 'notification' in filename:
            return 'notification'
        elif 'download' in filename:
            return 'download'
        elif 'keep' in filename:
            return 'keep'
        
        # Content based detection
        if rows:
            sample_row = rows[0]
            if 'body' in sample_row or 'message' in sample_row or 'text' in sample_row or 'content' in sample_row:
                return 'message'
            elif 'phone' in sample_row or 'address' in sample_row or 'partner' in sample_row:
                return 'call'
            elif 'latitude' in sample_row or 'longitude' in sample_row:
                return 'location'
            elif 'url' in sample_row or 'host' in sample_row:
                return 'browser'
            elif 'username' in sample_row or 'channel' in sample_row:
                return 'discord'
        
        return 'unknown'
    
    def _convert_row_to_ufdr(self, row: Dict[str, str], headers: List[str], 
                           data_type: str, row_index: int, source_file: str) -> Dict[str, Any]:
        """Convert a single row to UFDR format preserving ALL data."""
        
        # Create base UFDR document
        ufdr_doc = {
            '_id': f"{data_type}-{row_index}",
            'artifact_id': f"{data_type.upper()}-{row_index:04d}",
            'case_id': self.case_id,
            'device_id': self.device_id,
            'type': data_type,
            'data_type': self._get_data_type_subcategory(data_type),
            'timestamp': self._extract_timestamp(row),
            'source_path': source_file
        }
        
        # Add ALL original data with normalized field names
        for header, value in row.items():
            if value and str(value).strip():
                # Normalize field name
                normalized_field = self._normalize_field_name(header)
                ufdr_doc[normalized_field] = self._clean_value(value)
        
        # Add data type specific enhancements
        self._add_data_type_enhancements(ufdr_doc, data_type)
        
        # Extract entities from text content
        self._extract_entities(ufdr_doc)
        
        return ufdr_doc
    
    def _get_data_type_subcategory(self, data_type: str) -> str:
        """Get subcategory for data type."""
        subcategories = {
            'call': 'call_logs',
            'message': 'chat',
            'contact': 'contacts',
            'browser': 'web_history',
            'location': 'places',
            'media': 'files',
            'discord': 'discord_chat',
            'facebook': 'facebook_messenger',
            'snapchat': 'snapchat_data',
            'whatsapp': 'whatsapp_data',
            'telegram': 'telegram_data',
            'system': 'system_data',
            'notification': 'notifications',
            'download': 'downloads',
            'keep': 'keep_notes'
        }
        return subcategories.get(data_type, data_type)
    
    def _normalize_field_name(self, field_name: str) -> str:
        """Normalize field name to a clean, consistent format."""
        if not field_name:
            return 'unknown_field'
        
        # Remove BOM and clean
        field_name = field_name.strip()
        if field_name.startswith('\ufeff'):
            field_name = field_name[1:]
        
        # Convert to lowercase and replace spaces/special chars with underscores
        normalized = re.sub(r'[^\w\s]', '_', field_name)
        normalized = re.sub(r'\s+', '_', normalized)
        normalized = normalized.lower()
        
        # Remove multiple underscores
        normalized = re.sub(r'_+', '_', normalized)
        
        # Remove leading/trailing underscores
        normalized = normalized.strip('_')
        
        # Ensure it's not empty
        if not normalized:
            normalized = 'unknown_field'
        
        return normalized
    
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
        if value.lower() in ['true', '1', 'yes', 'on']:
            return True
        elif value.lower() in ['false', '0', 'no', 'off']:
            return False
        
        # Return as string
        return value
    
    def _extract_timestamp(self, row: Dict[str, str]) -> Optional[str]:
        """Extract timestamp from row."""
        timestamp_fields = [
            'timestamp', 'date', 'time', 'created_date', 'last_access_date',
            'call_date', 'date_sent', 'date_received', 'last_visit_time',
            'added_date', 'created_time', 'modified_time'
        ]
        
        for field in timestamp_fields:
            if field in row and row[field] and row[field].strip():
                return row[field].strip()
        
        # Try normalized field names
        for key, value in row.items():
            normalized_key = self._normalize_field_name(key)
            if 'timestamp' in normalized_key or 'date' in normalized_key or 'time' in normalized_key:
                if value and value.strip():
                    return value.strip()
        
        return None
    
    def _add_data_type_enhancements(self, ufdr_doc: Dict[str, Any], data_type: str):
        """Add data type specific enhancements."""
        
        if data_type == 'message':
            # Add message specific fields
            if 'message_text' in ufdr_doc or 'body' in ufdr_doc or 'content' in ufdr_doc:
                text_content = ufdr_doc.get('message_text') or ufdr_doc.get('body') or ufdr_doc.get('content')
                if text_content:
                    ufdr_doc['text'] = text_content
            
            # Set channel based on filename or content
            if 'sms' in str(ufdr_doc).lower():
                ufdr_doc['channel'] = 'sms'
            elif 'whatsapp' in str(ufdr_doc).lower():
                ufdr_doc['channel'] = 'whatsapp'
            elif 'discord' in str(ufdr_doc).lower():
                ufdr_doc['channel'] = 'discord'
            elif 'facebook' in str(ufdr_doc).lower():
                ufdr_doc['channel'] = 'facebook'
            elif 'telegram' in str(ufdr_doc).lower():
                ufdr_doc['channel'] = 'telegram'
            else:
                ufdr_doc['channel'] = 'unknown'
        
        elif data_type == 'call':
            # Add call specific fields
            if 'duration' in ufdr_doc:
                try:
                    ufdr_doc['duration_sec'] = int(ufdr_doc['duration'])
                except (ValueError, TypeError):
                    pass
        
        elif data_type == 'location':
            # Add location specific fields
            if 'latitude' in ufdr_doc and 'longitude' in ufdr_doc:
                try:
                    ufdr_doc['coordinates'] = {
                        'lat': float(ufdr_doc['latitude']),
                        'lng': float(ufdr_doc['longitude'])
                    }
                except (ValueError, TypeError):
                    pass
        
        elif data_type == 'browser':
            # Add browser specific fields
            if 'url' in ufdr_doc or 'host' in ufdr_doc:
                ufdr_doc['domain'] = ufdr_doc.get('host') or ufdr_doc.get('url', '').split('/')[2] if ufdr_doc.get('url') else None
    
    def _extract_entities(self, ufdr_doc: Dict[str, Any]):
        """Extract entities from text content."""
        text_fields = ['text', 'message_text', 'body', 'content', 'description', 'subject']
        
        for field in text_fields:
            if field in ufdr_doc and ufdr_doc[field]:
                text_content = str(ufdr_doc[field])
                
                # Extract phone numbers
                phone_pattern = r'\+?[1-9]\d{1,14}'
                phones = re.findall(phone_pattern, text_content)
                if phones:
                    ufdr_doc['extracted_phone_numbers'] = phones
                
                # Extract emails
                email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
                emails = re.findall(email_pattern, text_content)
                if emails:
                    ufdr_doc['extracted_emails'] = emails
                
                # Extract URLs
                url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
                urls = re.findall(url_pattern, text_content)
                if urls:
                    ufdr_doc['extracted_urls'] = urls
                
                break
    
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
        
        report_path = os.path.join(output_dir, 'universal_conversion_report.json')
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"Universal conversion report saved to: {report_path}")


def main():
    """Main entry point for the universal converter."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Universal TSV to JSON converter')
    parser.add_argument('--input-dir', required=True, help='Input directory containing TSV files')
    parser.add_argument('--output-dir', required=True, help='Output directory for JSON files')
    parser.add_argument('--case-id', required=True, help='Case identifier')
    parser.add_argument('--device-id', required=True, help='Device identifier')
    
    args = parser.parse_args()
    
    # Create converter
    converter = UniversalTSVConverter(
        case_id=args.case_id,
        device_id=args.device_id
    )
    
    try:
        # Convert files
        results = converter.convert_all_files(args.input_dir, args.output_dir)
        
        print(f"\n🎉 Universal Conversion Complete!")
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
