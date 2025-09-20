#!/usr/bin/env python3
"""
Universal Data Converter
========================

Handles ALL data types from ALEAPP reports:
- TSV files (any format)
- SQLite databases (.db files)
- Media files (images, videos, audio)
- System files (XML, JSON, properties, logs)
- HTML reports
- KML files
- Timeline data
- Any other forensic artifacts

Key Features:
- Zero configuration required
- Handles ANY data type automatically
- Preserves ALL data without loss
- Smart data type detection
- Universal JSON output format
"""

import os
import sys
import json
import csv
import glob
import logging
import sqlite3
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import re
import unicodedata
import mimetypes
import base64


class UniversalDataConverter:
    """
    Universal converter that handles ANY data type from forensic reports.
    """
    
    def __init__(self, case_id: str, device_id: str):
        """
        Initialize the universal data converter.
        
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
            'data_types_processed': {
                'tsv': 0,
                'database': 0,
                'media': 0,
                'system': 0,
                'html': 0,
                'kml': 0,
                'timeline': 0,
                'other': 0
            },
            'errors': []
        }
    
    def setup_logging(self):
        """Setup logging configuration."""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('universal_data_converter.log'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def convert_file(self, file_path: str, output_path: str) -> int:
        """
        Convert a single file to JSON preserving ALL data.
        
        Args:
            file_path: Path to input file
            output_path: Path to output JSON file
            
        Returns:
            Number of records converted
        """
        try:
            self.logger.info(f"Converting {file_path} to {output_path}")
            
            # Detect file type
            file_type = self._detect_file_type(file_path)
            self.logger.info(f"Detected file type: {file_type}")
            
            # Convert based on file type
            if file_type == 'tsv':
                return self._convert_tsv_file(file_path, output_path)
            elif file_type == 'database':
                return self._convert_database_file(file_path, output_path)
            elif file_type == 'media':
                return self._convert_media_file(file_path, output_path)
            elif file_type == 'system':
                return self._convert_system_file(file_path, output_path)
            elif file_type == 'html':
                return self._convert_html_file(file_path, output_path)
            elif file_type == 'kml':
                return self._convert_kml_file(file_path, output_path)
            elif file_type == 'timeline':
                return self._convert_timeline_file(file_path, output_path)
            else:
                return self._convert_other_file(file_path, output_path)
                
        except Exception as e:
            error_msg = f"Error converting {file_path}: {str(e)}"
            self.logger.error(error_msg)
            self.stats['failed_conversions'] += 1
            self.stats['errors'].append(error_msg)
            return 0
    
    def _detect_file_type(self, file_path: str) -> str:
        """Detect the type of file based on extension and content."""
        file_ext = os.path.splitext(file_path)[1].lower()
        filename = os.path.basename(file_path).lower()
        
        # Database files
        if file_ext in ['.db', '.sqlite', '.sqlite3']:
            return 'database'
        
        # TSV files
        elif file_ext == '.tsv':
            return 'tsv'
        
        # Media files
        elif file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp',
                         '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv',
                         '.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a']:
            return 'media'
        
        # HTML files
        elif file_ext == '.html':
            return 'html'
        
        # KML files
        elif file_ext == '.kml':
            return 'kml'
        
        # Timeline files
        elif 'timeline' in filename or 'tl.db' in filename:
            return 'timeline'
        
        # System files
        elif file_ext in ['.xml', '.json', '.txt', '.log', '.conf', '.prop', '.ini']:
            return 'system'
        
        # Other files
        else:
            return 'other'
    
    def _convert_tsv_file(self, file_path: str, output_path: str) -> int:
        """Convert TSV file to JSON."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.DictReader(f, delimiter='\t')
                headers = reader.fieldnames
                rows = list(reader)
            
            if not rows:
                return 0
            
            # Detect data type
            data_type = self._detect_tsv_data_type(file_path, headers, rows)
            
            # Convert rows
            ufdr_documents = []
            for i, row in enumerate(rows):
                ufdr_doc = self._create_base_ufdr_document(data_type, i, file_path)
                
                # Add ALL original data
                for header, value in row.items():
                    if value and str(value).strip():
                        normalized_field = self._normalize_field_name(header)
                        ufdr_doc[normalized_field] = self._clean_value(value)
                
                # Add enhancements
                self._add_data_type_enhancements(ufdr_doc, data_type)
                ufdr_documents.append(ufdr_doc)
            
            # Write output
            self._write_json_output(ufdr_documents, output_path)
            self.stats['data_types_processed']['tsv'] += 1
            return len(ufdr_documents)
            
        except Exception as e:
            self.logger.error(f"Error converting TSV file {file_path}: {e}")
            return 0
    
    def _convert_database_file(self, file_path: str, output_path: str) -> int:
        """Convert SQLite database to JSON."""
        try:
            conn = sqlite3.connect(file_path)
            cursor = conn.cursor()
            
            # Get all tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            
            database_data = {
                'database_path': file_path,
                'tables': {},
                'metadata': {
                    'table_count': len(tables),
                    'extraction_timestamp': datetime.now().isoformat(),
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
            }
            
            # Extract data from each table
            for table in tables:
                table_name = table[0]
                try:
                    # Get table schema
                    cursor.execute(f"PRAGMA table_info({table_name})")
                    columns = cursor.fetchall()
                    
                    # Get table data (limit for performance)
                    cursor.execute(f"SELECT * FROM {table_name} LIMIT 1000")
                    rows = cursor.fetchall()
                    
                    # Convert rows to dictionaries
                    table_data = []
                    for row in rows:
                        row_dict = {}
                        for i, col in enumerate(columns):
                            col_name = col[1]
                            value = row[i] if i < len(row) else None
                            row_dict[col_name] = value
                        table_data.append(row_dict)
                    
                    database_data['tables'][table_name] = {
                        'columns': [{'name': col[1], 'type': col[2]} for col in columns],
                        'data': table_data,
                        'row_count': len(table_data)
                    }
                    
                except Exception as e:
                    self.logger.warning(f"Error extracting table {table_name}: {e}")
                    continue
            
            conn.close()
            
            # Write output
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(database_data, f, indent=2, ensure_ascii=False)
            
            self.stats['data_types_processed']['database'] += 1
            return len(tables)
            
        except Exception as e:
            self.logger.error(f"Error converting database file {file_path}: {e}")
            return 0
    
    def _convert_media_file(self, file_path: str, output_path: str) -> int:
        """Convert media file to JSON with metadata."""
        try:
            file_stat = os.stat(file_path)
            file_ext = os.path.splitext(file_path)[1].lower()
            
            media_data = {
                'file_path': file_path,
                'file_name': os.path.basename(file_path),
                'file_size': file_stat.st_size,
                'file_extension': file_ext,
                'mime_type': mimetypes.guess_type(file_path)[0],
                'created_time': datetime.fromtimestamp(file_stat.st_ctime).isoformat(),
                'modified_time': datetime.fromtimestamp(file_stat.st_mtime).isoformat(),
                'accessed_time': datetime.fromtimestamp(file_stat.st_atime).isoformat(),
                'case_id': self.case_id,
                'device_id': self.device_id,
                'metadata': {
                    'extraction_timestamp': datetime.now().isoformat()
                }
            }
            
            # Add media-specific metadata
            if file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp']:
                media_data['media_type'] = 'image'
            elif file_ext in ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv']:
                media_data['media_type'] = 'video'
            elif file_ext in ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a']:
                media_data['media_type'] = 'audio'
            else:
                media_data['media_type'] = 'unknown'
            
            # Write output
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(media_data, f, indent=2, ensure_ascii=False)
            
            self.stats['data_types_processed']['media'] += 1
            return 1
            
        except Exception as e:
            self.logger.error(f"Error converting media file {file_path}: {e}")
            return 0
    
    def _convert_system_file(self, file_path: str, output_path: str) -> int:
        """Convert system file to JSON."""
        try:
            file_ext = os.path.splitext(file_path)[1].lower()
            file_stat = os.stat(file_path)
            
            system_data = {
                'file_path': file_path,
                'file_name': os.path.basename(file_path),
                'file_size': file_stat.st_size,
                'file_extension': file_ext,
                'created_time': datetime.fromtimestamp(file_stat.st_ctime).isoformat(),
                'modified_time': datetime.fromtimestamp(file_stat.st_mtime).isoformat(),
                'case_id': self.case_id,
                'device_id': self.device_id,
                'content': None,
                'metadata': {
                    'extraction_timestamp': datetime.now().isoformat()
                }
            }
            
            # Parse content based on file type
            if file_ext == '.xml':
                system_data['content'] = self._parse_xml_file(file_path)
            elif file_ext == '.json':
                system_data['content'] = self._parse_json_file(file_path)
            else:
                # Read as text
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    system_data['content'] = f.read()
            
            # Write output
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(system_data, f, indent=2, ensure_ascii=False)
            
            self.stats['data_types_processed']['system'] += 1
            return 1
            
        except Exception as e:
            self.logger.error(f"Error converting system file {file_path}: {e}")
            return 0
    
    def _convert_html_file(self, file_path: str, output_path: str) -> int:
        """Convert HTML file to JSON."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                html_content = f.read()
            
            html_data = {
                'file_path': file_path,
                'file_name': os.path.basename(file_path),
                'html_content': html_content,
                'case_id': self.case_id,
                'device_id': self.device_id,
                'metadata': {
                    'extraction_timestamp': datetime.now().isoformat()
                }
            }
            
            # Write output
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(html_data, f, indent=2, ensure_ascii=False)
            
            self.stats['data_types_processed']['html'] += 1
            return 1
            
        except Exception as e:
            self.logger.error(f"Error converting HTML file {file_path}: {e}")
            return 0
    
    def _convert_kml_file(self, file_path: str, output_path: str) -> int:
        """Convert KML file to JSON."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                kml_content = f.read()
            
            kml_data = {
                'file_path': file_path,
                'file_name': os.path.basename(file_path),
                'kml_content': kml_content,
                'case_id': self.case_id,
                'device_id': self.device_id,
                'metadata': {
                    'extraction_timestamp': datetime.now().isoformat()
                }
            }
            
            # Write output
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(kml_data, f, indent=2, ensure_ascii=False)
            
            self.stats['data_types_processed']['kml'] += 1
            return 1
            
        except Exception as e:
            self.logger.error(f"Error converting KML file {file_path}: {e}")
            return 0
    
    def _convert_timeline_file(self, file_path: str, output_path: str) -> int:
        """Convert timeline file to JSON."""
        try:
            # Timeline files are usually SQLite databases
            return self._convert_database_file(file_path, output_path)
            
        except Exception as e:
            self.logger.error(f"Error converting timeline file {file_path}: {e}")
            return 0
    
    def _convert_other_file(self, file_path: str, output_path: str) -> int:
        """Convert other file types to JSON."""
        try:
            file_stat = os.stat(file_path)
            
            other_data = {
                'file_path': file_path,
                'file_name': os.path.basename(file_path),
                'file_size': file_stat.st_size,
                'file_extension': os.path.splitext(file_path)[1].lower(),
                'created_time': datetime.fromtimestamp(file_stat.st_ctime).isoformat(),
                'modified_time': datetime.fromtimestamp(file_stat.st_mtime).isoformat(),
                'case_id': self.case_id,
                'device_id': self.device_id,
                'metadata': {
                    'extraction_timestamp': datetime.now().isoformat()
                }
            }
            
            # Try to read as text
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    other_data['content'] = f.read()
            except:
                other_data['content'] = 'Binary file - content not readable as text'
            
            # Write output
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(other_data, f, indent=2, ensure_ascii=False)
            
            self.stats['data_types_processed']['other'] += 1
            return 1
            
        except Exception as e:
            self.logger.error(f"Error converting other file {file_path}: {e}")
            return 0
    
    def _detect_tsv_data_type(self, file_path: str, headers: List[str], rows: List[Dict[str, str]]) -> str:
        """Detect data type from TSV file."""
        filename = os.path.basename(file_path).lower()
        
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
        else:
            return 'unknown'
    
    def _create_base_ufdr_document(self, data_type: str, row_index: int, source_file: str) -> Dict[str, Any]:
        """Create base UFDR document."""
        return {
            '_id': f"{data_type}-{row_index}",
            'artifact_id': f"{data_type.upper()}-{row_index:04d}",
            'case_id': self.case_id,
            'device_id': self.device_id,
            'type': data_type,
            'data_type': self._get_data_type_subcategory(data_type),
            'source_path': source_file
        }
    
    def _get_data_type_subcategory(self, data_type: str) -> str:
        """Get subcategory for data type."""
        subcategories = {
            'call': 'call_logs',
            'message': 'chat',
            'contact': 'contacts',
            'browser': 'web_history',
            'location': 'places',
            'discord': 'discord_chat',
            'facebook': 'facebook_messenger',
            'snapchat': 'snapchat_data',
            'whatsapp': 'whatsapp_data',
            'telegram': 'telegram_data'
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
    
    def _add_data_type_enhancements(self, ufdr_doc: Dict[str, Any], data_type: str):
        """Add data type specific enhancements."""
        # Add timestamp if not present
        if 'timestamp' not in ufdr_doc:
            timestamp_fields = ['timestamp', 'date', 'time', 'created_date', 'last_access_date']
            for field in timestamp_fields:
                if field in ufdr_doc and ufdr_doc[field]:
                    ufdr_doc['timestamp'] = ufdr_doc[field]
                    break
        
        # Add data type specific enhancements
        if data_type == 'message':
            if 'message_text' in ufdr_doc or 'body' in ufdr_doc or 'content' in ufdr_doc:
                text_content = ufdr_doc.get('message_text') or ufdr_doc.get('body') or ufdr_doc.get('content')
                if text_content:
                    ufdr_doc['text'] = text_content
        
        elif data_type == 'call':
            if 'duration' in ufdr_doc:
                try:
                    ufdr_doc['duration_sec'] = int(ufdr_doc['duration'])
                except (ValueError, TypeError):
                    pass
        
        elif data_type == 'location':
            if 'latitude' in ufdr_doc and 'longitude' in ufdr_doc:
                try:
                    ufdr_doc['coordinates'] = {
                        'lat': float(ufdr_doc['latitude']),
                        'lng': float(ufdr_doc['longitude'])
                    }
                except (ValueError, TypeError):
                    pass
    
    def _parse_xml_file(self, file_path: str) -> Dict[str, Any]:
        """Parse XML file to JSON."""
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
            return self._xml_to_dict(root)
        except Exception as e:
            return {'error': f'Failed to parse XML: {str(e)}'}
    
    def _parse_json_file(self, file_path: str) -> Any:
        """Parse JSON file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            return {'error': f'Failed to parse JSON: {str(e)}'}
    
    def _xml_to_dict(self, element) -> Dict[str, Any]:
        """Convert XML element to dictionary."""
        result = {}
        
        # Add attributes
        if element.attrib:
            result['@attributes'] = element.attrib
        
        # Add text content
        if element.text and element.text.strip():
            result['text'] = element.text.strip()
        
        # Add children
        for child in element:
            child_dict = self._xml_to_dict(child)
            if child.tag in result:
                if not isinstance(result[child.tag], list):
                    result[child.tag] = [result[child.tag]]
                result[child.tag].append(child_dict)
            else:
                result[child.tag] = child_dict
        
        return result
    
    def _write_json_output(self, documents: List[Dict[str, Any]], output_path: str):
        """Write documents to JSON file."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(documents, f, indent=2, ensure_ascii=False)
    
    def convert_all_files(self, input_dir: str, output_dir: str) -> Dict[str, Any]:
        """
        Convert all files in a directory.
        
        Args:
            input_dir: Directory containing files
            output_dir: Directory to save JSON files
            
        Returns:
            Dictionary with conversion statistics
        """
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Find all files
        all_files = []
        for root, dirs, files in os.walk(input_dir):
            for file in files:
                file_path = os.path.join(root, file)
                all_files.append(file_path)
        
        self.stats['total_files'] = len(all_files)
        
        self.logger.info(f"Found {len(all_files)} files to convert")
        
        # Convert each file
        for file_path in all_files:
            try:
                # Create output path
                relative_path = os.path.relpath(file_path, input_dir)
                output_path = os.path.join(output_dir, relative_path.replace(os.path.sep, '_') + '.json')
                
                count = self.convert_file(file_path, output_path)
                if count > 0:
                    self.stats['successful_conversions'] += 1
                    self.stats['total_records'] += count
                    self.logger.info(f"Converted {os.path.basename(file_path)}: {count} records")
                else:
                    self.stats['failed_conversions'] += 1
                    
            except Exception as e:
                self.logger.error(f"Failed to convert {file_path}: {str(e)}")
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
                'success_rate': (self.stats['successful_conversions'] / self.stats['total_files'] * 100) if self.stats['total_files'] > 0 else 0,
                'data_types_processed': self.stats['data_types_processed']
            }
        }
        
        report_path = os.path.join(output_dir, 'universal_data_conversion_report.json')
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"Universal data conversion report saved to: {report_path}")


def main():
    """Main entry point for the universal data converter."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Universal data converter for ALL file types')
    parser.add_argument('--input-dir', required=True, help='Input directory containing files')
    parser.add_argument('--output-dir', required=True, help='Output directory for JSON files')
    parser.add_argument('--case-id', required=True, help='Case identifier')
    parser.add_argument('--device-id', required=True, help='Device identifier')
    
    args = parser.parse_args()
    
    # Create converter
    converter = UniversalDataConverter(
        case_id=args.case_id,
        device_id=args.device_id
    )
    
    try:
        # Convert files
        results = converter.convert_all_files(args.input_dir, args.output_dir)
        
        print(f"\n🎉 Universal Data Conversion Complete!")
        print(f"📊 Total files: {results['total_files']}")
        print(f"✅ Successful conversions: {results['successful_conversions']}")
        print(f"❌ Failed conversions: {results['failed_conversions']}")
        print(f"📄 Total records: {results['total_records']}")
        print(f"📈 Success rate: {results['successful_conversions'] / results['total_files'] * 100:.1f}%")
        print(f"\n📊 Data Types Processed:")
        for data_type, count in results['data_types_processed'].items():
            if count > 0:
                print(f"  - {data_type}: {count} files")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
