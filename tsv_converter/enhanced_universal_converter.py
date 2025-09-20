#!/usr/bin/env python3
"""
Enhanced Universal Data Converter with Intelligent Key-Value Mapping
================================================================

This module provides a complete solution for converting ALL types of forensic data
from ALEAPP reports into properly mapped, structured JSON format for analysis.

Key Features:
- Universal data processing for all file types
- Intelligent key-value mapping for forensic entities
- Relationship extraction between entities
- Standardized output format for analysis
- Complete data preservation with enhanced structure
"""

import os
import sys
import json
import csv
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

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from enhanced_key_mapper import EnhancedKeyMapper, ForensicEntity, ForensicEntityType


class EnhancedUniversalConverter:
    """
    Enhanced universal converter that handles ALL data types with intelligent mapping.
    """
    
    def __init__(self, case_id: str, device_id: str):
        """Initialize the enhanced universal converter."""
        self.case_id = case_id
        self.device_id = device_id
        
        # Setup logging
        self.setup_logging()
        
        # Initialize key mapper
        self.key_mapper = EnhancedKeyMapper(case_id, device_id)
        
        # Statistics
        self.stats = {
            'total_files': 0,
            'successful_conversions': 0,
            'failed_conversions': 0,
            'total_entities': 0,
            'entity_types': {},
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
                logging.FileHandler('enhanced_universal_converter.log'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def convert_file(self, file_path: str, output_path: str) -> int:
        """
        Convert a single file to JSON with intelligent mapping.
        
        Args:
            file_path: Path to input file
            output_path: Path to output JSON file
            
        Returns:
            Number of entities converted
        """
        try:
            self.logger.info(f"Converting {file_path} to {output_path}")
            
            # Detect file type
            file_type = self._detect_file_type(file_path)
            self.logger.info(f"Detected file type: {file_type}")
            
            # Convert based on file type
            entities = []
            if file_type == 'tsv':
                entities = self._convert_tsv_file(file_path)
            elif file_type == 'database':
                entities = self._convert_database_file(file_path)
            elif file_type == 'media':
                entities = self._convert_media_file(file_path)
            elif file_type == 'system':
                entities = self._convert_system_file(file_path)
            elif file_type == 'html':
                entities = self._convert_html_file(file_path)
            elif file_type == 'kml':
                entities = self._convert_kml_file(file_path)
            elif file_type == 'timeline':
                entities = self._convert_timeline_file(file_path)
            else:
                entities = self._convert_other_file(file_path)
            
            # Export entities
            if entities:
                self._export_entities(entities, output_path)
                self.stats['total_entities'] += len(entities)
                
                # Update entity type statistics
                for entity in entities:
                    entity_type = entity.entity_type.value
                    if entity_type not in self.stats['entity_types']:
                        self.stats['entity_types'][entity_type] = 0
                    self.stats['entity_types'][entity_type] += 1
                
                self.stats['data_types_processed'][file_type] += 1
                self.stats['successful_conversions'] += 1
                
                self.logger.info(f"Converted {len(entities)} entities from {file_path}")
                return len(entities)
            else:
                self.stats['failed_conversions'] += 1
                return 0
                
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
    
    def _convert_tsv_file(self, file_path: str) -> List[ForensicEntity]:
        """Convert TSV file to forensic entities."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.DictReader(f, delimiter='\t')
                headers = reader.fieldnames
                rows = list(reader)
            
            if not rows:
                return []
            
            # Use key mapper to convert to entities
            entities = self.key_mapper.map_tsv_data(file_path, headers, rows)
            
            self.logger.info(f"Converted TSV file {file_path}: {len(entities)} entities")
            return entities
            
        except Exception as e:
            self.logger.error(f"Error converting TSV file {file_path}: {e}")
            return []
    
    def _convert_database_file(self, file_path: str) -> List[ForensicEntity]:
        """Convert SQLite database to forensic entities."""
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
            
            # Use key mapper to convert to entities
            entities = self.key_mapper.map_database_data(file_path, database_data)
            
            self.logger.info(f"Converted database file {file_path}: {len(entities)} entities")
            return entities
            
        except Exception as e:
            self.logger.error(f"Error converting database file {file_path}: {e}")
            return []
    
    def _convert_media_file(self, file_path: str) -> List[ForensicEntity]:
        """Convert media file to forensic entities."""
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
            
            # Use key mapper to convert to entities
            entities = self.key_mapper.map_media_data(file_path, media_data)
            
            self.logger.info(f"Converted media file {file_path}: {len(entities)} entities")
            return entities
            
        except Exception as e:
            self.logger.error(f"Error converting media file {file_path}: {e}")
            return []
    
    def _convert_system_file(self, file_path: str) -> List[ForensicEntity]:
        """Convert system file to forensic entities."""
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
            
            # Create system event entity
            entity = ForensicEntity(
                entity_id=f"system-{os.path.basename(file_path)}",
                entity_type=ForensicEntityType.SYSTEM_EVENT,
                source_file=file_path,
                raw_data=system_data,
                mapped_data=self._map_system_fields(system_data),
                relationships=[],
                confidence_score=0.8,
                extraction_timestamp=datetime.now().isoformat()
            )
            
            self.logger.info(f"Converted system file {file_path}: 1 entity")
            return [entity]
            
        except Exception as e:
            self.logger.error(f"Error converting system file {file_path}: {e}")
            return []
    
    def _convert_html_file(self, file_path: str) -> List[ForensicEntity]:
        """Convert HTML file to forensic entities."""
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
            
            # Create browser activity entity
            entity = ForensicEntity(
                entity_id=f"html-{os.path.basename(file_path)}",
                entity_type=ForensicEntityType.BROWSER_ACTIVITY,
                source_file=file_path,
                raw_data=html_data,
                mapped_data=self._map_html_fields(html_data),
                relationships=[],
                confidence_score=0.7,
                extraction_timestamp=datetime.now().isoformat()
            )
            
            self.logger.info(f"Converted HTML file {file_path}: 1 entity")
            return [entity]
            
        except Exception as e:
            self.logger.error(f"Error converting HTML file {file_path}: {e}")
            return []
    
    def _convert_kml_file(self, file_path: str) -> List[ForensicEntity]:
        """Convert KML file to forensic entities."""
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
            
            # Create location entity
            entity = ForensicEntity(
                entity_id=f"kml-{os.path.basename(file_path)}",
                entity_type=ForensicEntityType.LOCATION,
                source_file=file_path,
                raw_data=kml_data,
                mapped_data=self._map_kml_fields(kml_data),
                relationships=[],
                confidence_score=0.8,
                extraction_timestamp=datetime.now().isoformat()
            )
            
            self.logger.info(f"Converted KML file {file_path}: 1 entity")
            return [entity]
            
        except Exception as e:
            self.logger.error(f"Error converting KML file {file_path}: {e}")
            return []
    
    def _convert_timeline_file(self, file_path: str) -> List[ForensicEntity]:
        """Convert timeline file to forensic entities."""
        try:
            # Timeline files are usually SQLite databases
            return self._convert_database_file(file_path)
            
        except Exception as e:
            self.logger.error(f"Error converting timeline file {file_path}: {e}")
            return []
    
    def _convert_other_file(self, file_path: str) -> List[ForensicEntity]:
        """Convert other file types to forensic entities."""
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
            
            # Create file entity
            entity = ForensicEntity(
                entity_id=f"file-{os.path.basename(file_path)}",
                entity_type=ForensicEntityType.FILE,
                source_file=file_path,
                raw_data=other_data,
                mapped_data=self._map_file_fields(other_data),
                relationships=[],
                confidence_score=0.6,
                extraction_timestamp=datetime.now().isoformat()
            )
            
            self.logger.info(f"Converted other file {file_path}: 1 entity")
            return [entity]
            
        except Exception as e:
            self.logger.error(f"Error converting other file {file_path}: {e}")
            return []
    
    def _map_system_fields(self, system_data: Dict[str, Any]) -> Dict[str, Any]:
        """Map system file fields."""
        mapped_data = {}
        
        # Map basic fields
        field_mapping = {
            'file_name': 'filename',
            'file_size': 'size',
            'file_extension': 'extension',
            'created_time': 'timestamp',
            'modified_time': 'modified_timestamp',
            'content': 'content'
        }
        
        for source_field, target_field in field_mapping.items():
            if source_field in system_data:
                mapped_data[target_field] = system_data[source_field]
        
        return mapped_data
    
    def _map_html_fields(self, html_data: Dict[str, Any]) -> Dict[str, Any]:
        """Map HTML file fields."""
        mapped_data = {}
        
        # Map basic fields
        field_mapping = {
            'file_name': 'filename',
            'html_content': 'content'
        }
        
        for source_field, target_field in field_mapping.items():
            if source_field in html_data:
                mapped_data[target_field] = html_data[source_field]
        
        return mapped_data
    
    def _map_kml_fields(self, kml_data: Dict[str, Any]) -> Dict[str, Any]:
        """Map KML file fields."""
        mapped_data = {}
        
        # Map basic fields
        field_mapping = {
            'file_name': 'filename',
            'kml_content': 'content'
        }
        
        for source_field, target_field in field_mapping.items():
            if source_field in kml_data:
                mapped_data[target_field] = kml_data[source_field]
        
        return mapped_data
    
    def _map_file_fields(self, file_data: Dict[str, Any]) -> Dict[str, Any]:
        """Map file fields."""
        mapped_data = {}
        
        # Map basic fields
        field_mapping = {
            'file_name': 'filename',
            'file_size': 'size',
            'file_extension': 'extension',
            'created_time': 'timestamp',
            'modified_time': 'modified_timestamp',
            'content': 'content'
        }
        
        for source_field, target_field in field_mapping.items():
            if source_field in file_data:
                mapped_data[target_field] = file_data[source_field]
        
        return mapped_data
    
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
    
    def _export_entities(self, entities: List[ForensicEntity], output_path: str):
        """Export entities to JSON file."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Convert entities to dictionaries
        entities_data = []
        for entity in entities:
            entity_dict = {
                'entity_id': entity.entity_id,
                'entity_type': entity.entity_type.value,
                'source_file': entity.source_file,
                'mapped_data': entity.mapped_data,
                'relationships': entity.relationships,
                'confidence_score': entity.confidence_score,
                'extraction_timestamp': entity.extraction_timestamp,
                'raw_data': entity.raw_data
            }
            entities_data.append(entity_dict)
        
        # Write to file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(entities_data, f, indent=2, ensure_ascii=False)
    
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
                    self.logger.info(f"Converted {os.path.basename(file_path)}: {count} entities")
                else:
                    self.logger.warning(f"No entities converted from {os.path.basename(file_path)}")
                    
            except Exception as e:
                self.logger.error(f"Failed to convert {file_path}: {str(e)}")
        
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
                'total_entities': self.stats['total_entities'],
                'success_rate': (self.stats['successful_conversions'] / self.stats['total_files'] * 100) if self.stats['total_files'] > 0 else 0,
                'data_types_processed': self.stats['data_types_processed'],
                'entity_types': self.stats['entity_types']
            }
        }
        
        report_path = os.path.join(output_dir, 'enhanced_universal_conversion_report.json')
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"Enhanced universal conversion report saved to: {report_path}")


def main():
    """Main entry point for the enhanced universal converter."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Enhanced Universal Data Converter with Intelligent Mapping')
    parser.add_argument('--input-dir', required=True, help='Input directory containing files')
    parser.add_argument('--output-dir', required=True, help='Output directory for JSON files')
    parser.add_argument('--case-id', required=True, help='Case identifier')
    parser.add_argument('--device-id', required=True, help='Device identifier')
    
    args = parser.parse_args()
    
    # Create converter
    converter = EnhancedUniversalConverter(
        case_id=args.case_id,
        device_id=args.device_id
    )
    
    try:
        # Convert files
        results = converter.convert_all_files(args.input_dir, args.output_dir)
        
        print(f"\n🎉 Enhanced Universal Data Conversion Complete!")
        print(f"📊 Total files: {results['total_files']}")
        print(f"✅ Successful conversions: {results['successful_conversions']}")
        print(f"❌ Failed conversions: {results['failed_conversions']}")
        print(f"🔍 Total entities: {results['total_entities']}")
        print(f"📈 Success rate: {results['successful_conversions'] / results['total_files'] * 100:.1f}%")
        print(f"\n📊 Data Types Processed:")
        for data_type, count in results['data_types_processed'].items():
            if count > 0:
                print(f"  - {data_type}: {count} files")
        print(f"\n🔍 Entity Types Found:")
        for entity_type, count in results['entity_types'].items():
            print(f"  - {entity_type}: {count} entities")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
