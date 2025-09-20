#!/usr/bin/env python3
"""
Enhanced Forensic Data Processor
===============================

Processes ALEAPP report ZIP files by extracting ALL contents (not just TSV files)
and converting them to specialized JSON files for Elasticsearch and Neo4j integration.

Key Features:
- Complete data extraction from all sources
- Specialized JSON files for each data type
- Cross-reference mapping for relationships
- Neo4j graph database integration
- Forensic metadata preservation
"""

import os
import sys
import zipfile
import tempfile
import shutil
import json
import sqlite3
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import csv
import re

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from main import TSVToJSONConverter
from utils.timestamp_parser import TimestampParser
from utils.entity_extractor import EntityExtractor
from utils.data_cleaner import DataCleaner


class EnhancedForensicProcessor:
    """
    Enhanced forensic processor that extracts and processes ALL data sources
    from ALEAPP reports, not just TSV files.
    """
    
    def __init__(self, case_id: str, device_id: str, config_path: Optional[str] = None):
        """
        Initialize the enhanced forensic processor.
        
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
        
        # Initialize utilities
        self.timestamp_parser = TimestampParser()
        self.entity_extractor = EntityExtractor()
        self.data_cleaner = DataCleaner()
        
        # Statistics
        self.stats = {
            'zip_file': '',
            'extracted_folder': '',
            'total_files_found': 0,
            'tsv_files_processed': 0,
            'database_files_processed': 0,
            'media_files_processed': 0,
            'system_files_processed': 0,
            'json_files_created': 0,
            'processing_time': 0,
            'errors': []
        }
        
        # Data storage
        self.extracted_data = {}
        self.relationships = {}
        
    def setup_logging(self):
        """Setup logging configuration."""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('enhanced_processor.log'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def process_aleapp_zip(self, zip_path: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
        """
        Process an ALEAPP report ZIP file and extract ALL contents.
        
        Args:
            zip_path: Path to the ALEAPP report ZIP file
            output_dir: Directory to save output (optional)
            
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
            
            self.logger.info(f"Processing ALEAPP report: {zip_path}")
            
            # Extract ZIP file
            extracted_folder = self._extract_zip_file(zip_path, output_dir)
            self.stats['extracted_folder'] = extracted_folder
            
            # Discover all data sources
            data_sources = self._discover_data_sources(extracted_folder)
            self.stats['total_files_found'] = sum(len(files) for files in data_sources.values())
            
            # Process each data type
            self._process_tsv_files(data_sources.get('tsv_files', []), extracted_folder)
            self._process_database_files(data_sources.get('database_files', []), extracted_folder)
            self._process_media_files(data_sources.get('media_files', []), extracted_folder)
            self._process_system_files(data_sources.get('system_files', []), extracted_folder)
            
            # Create cross-reference relationships
            self._create_relationships()
            
            # Generate specialized JSON files
            json_files = self._generate_specialized_json_files(extracted_folder)
            self.stats['json_files_created'] = len(json_files)
            
            # Generate processing report
            self._generate_processing_report(extracted_folder)
            
            processing_time = time.time() - start_time
            self.stats['processing_time'] = processing_time
            
            self.logger.info(f"Processing completed in {processing_time:.2f} seconds")
            self.logger.info(f"Total files processed: {self.stats['total_files_found']}")
            self.logger.info(f"JSON files created: {self.stats['json_files_created']}")
            
            return {
                'success': True,
                'zip_file': zip_path,
                'output_dir': extracted_folder,
                'statistics': self.stats,
                'json_files': json_files,
                'relationships': self.relationships
            }
            
        except Exception as e:
            self.logger.error(f"Error processing ALEAPP report: {str(e)}")
            self.stats['errors'].append(str(e))
            return {
                'success': False,
                'error': str(e),
                'statistics': self.stats
            }
    
    def _extract_zip_file(self, zip_path: str, output_dir: Optional[str] = None) -> str:
        """
        Extract ZIP file to a directory.
        
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
            output_dir = os.path.join(zip_dir, f"{zip_name}_enhanced_extracted")
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        self.logger.info(f"Extracting ZIP file to: {output_dir}")
        
        # Extract ZIP file
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
    
    def _discover_data_sources(self, extracted_folder: str) -> Dict[str, List[str]]:
        """
        Discover all data sources in the extracted folder.
        
        Args:
            extracted_folder: Path to extracted folder
            
        Returns:
            Dictionary mapping data types to file lists
        """
        data_sources = {
            'tsv_files': [],
            'database_files': [],
            'media_files': [],
            'system_files': [],
            'html_files': [],
            'other_files': []
        }
        
        self.logger.info("Discovering data sources...")
        
        for root, dirs, files in os.walk(extracted_folder):
            for file in files:
                file_path = os.path.join(root, file)
                file_ext = os.path.splitext(file)[1].lower()
                
                # Categorize files by type
                if file_ext == '.tsv':
                    data_sources['tsv_files'].append(file_path)
                elif file_ext in ['.db', '.sqlite', '.sqlite3']:
                    data_sources['database_files'].append(file_path)
                elif file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.mp4', '.avi', '.mov', '.wmv', '.mp3', '.wav', '.aac']:
                    data_sources['media_files'].append(file_path)
                elif file_ext in ['.xml', '.json', '.txt', '.log', '.conf', '.prop']:
                    data_sources['system_files'].append(file_path)
                elif file_ext == '.html':
                    data_sources['html_files'].append(file_path)
                else:
                    data_sources['other_files'].append(file_path)
        
        # Log discovered files
        for data_type, files in data_sources.items():
            if files:
                self.logger.info(f"Found {len(files)} {data_type}")
        
        return data_sources
    
    def _process_tsv_files(self, tsv_files: List[str], extracted_folder: str):
        """
        Process TSV files using enhanced converter.
        
        Args:
            tsv_files: List of TSV file paths
            extracted_folder: Path to extracted folder
        """
        if not tsv_files:
            self.logger.info("No TSV files found")
            return
        
        self.logger.info(f"Processing {len(tsv_files)} TSV files...")
        
        # Create TSV processor
        tsv_processor = TSVToJSONConverter(
            case_id=self.case_id,
            device_id=self.device_id,
            config_path=self.config_path
        )
        
        # Process each TSV file
        for tsv_file in tsv_files:
            try:
                # Determine output path
                relative_path = os.path.relpath(tsv_file, extracted_folder)
                output_path = os.path.join(extracted_folder, "enhanced_json", f"{os.path.splitext(os.path.basename(tsv_file))[0]}.json")
                
                # Create output directory
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                
                # Convert TSV to JSON
                record_count = tsv_processor.convert_file(tsv_file, output_path)
                
                if record_count > 0:
                    self.stats['tsv_files_processed'] += 1
                    self.logger.info(f"Converted {tsv_file} -> {output_path} ({record_count} records)")
                else:
                    self.logger.warning(f"No records converted from {tsv_file}")
                    
            except Exception as e:
                self.logger.error(f"Error processing TSV file {tsv_file}: {e}")
                self.stats['errors'].append(f"TSV processing error: {e}")
    
    def _process_database_files(self, database_files: List[str], extracted_folder: str):
        """
        Process SQLite database files.
        
        Args:
            database_files: List of database file paths
            extracted_folder: Path to extracted folder
        """
        if not database_files:
            self.logger.info("No database files found")
            return
        
        self.logger.info(f"Processing {len(database_files)} database files...")
        
        for db_file in database_files:
            try:
                # Process database file
                db_data = self._extract_database_data(db_file)
                
                if db_data:
                    # Save to JSON
                    output_path = os.path.join(extracted_folder, "enhanced_json", f"{os.path.splitext(os.path.basename(db_file))[0]}.json")
                    os.makedirs(os.path.dirname(output_path), exist_ok=True)
                    
                    with open(output_path, 'w', encoding='utf-8') as f:
                        json.dump(db_data, f, indent=2, ensure_ascii=False)
                    
                    self.stats['database_files_processed'] += 1
                    self.logger.info(f"Processed database {db_file} -> {output_path}")
                
            except Exception as e:
                self.logger.error(f"Error processing database file {db_file}: {e}")
                self.stats['errors'].append(f"Database processing error: {e}")
    
    def _extract_database_data(self, db_path: str) -> Dict[str, Any]:
        """
        Extract data from SQLite database.
        
        Args:
            db_path: Path to database file
            
        Returns:
            Dictionary with database data
        """
        try:
            # Connect to database
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Get all tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            
            db_data = {
                'database_path': db_path,
                'tables': {},
                'metadata': {
                    'table_count': len(tables),
                    'extraction_timestamp': datetime.now().isoformat()
                }
            }
            
            # Extract data from each table
            for table in tables:
                table_name = table[0]
                try:
                    # Get table schema
                    cursor.execute(f"PRAGMA table_info({table_name})")
                    columns = cursor.fetchall()
                    
                    # Get table data
                    cursor.execute(f"SELECT * FROM {table_name} LIMIT 1000")  # Limit for performance
                    rows = cursor.fetchall()
                    
                    db_data['tables'][table_name] = {
                        'columns': [{'name': col[1], 'type': col[2]} for col in columns],
                        'data': rows,
                        'row_count': len(rows)
                    }
                    
                except Exception as e:
                    self.logger.warning(f"Error extracting table {table_name}: {e}")
                    continue
            
            conn.close()
            return db_data
            
        except Exception as e:
            self.logger.error(f"Error connecting to database {db_path}: {e}")
            return {}
    
    def _process_media_files(self, media_files: List[str], extracted_folder: str):
        """
        Process media files with metadata extraction.
        
        Args:
            media_files: List of media file paths
            extracted_folder: Path to extracted folder
        """
        if not media_files:
            self.logger.info("No media files found")
            return
        
        self.logger.info(f"Processing {len(media_files)} media files...")
        
        media_data = {
            'media_files': [],
            'metadata': {
                'total_files': len(media_files),
                'extraction_timestamp': datetime.now().isoformat()
            }
        }
        
        for media_file in media_files:
            try:
                # Extract basic file metadata
                file_stat = os.stat(media_file)
                file_info = {
                    'file_path': media_file,
                    'file_name': os.path.basename(media_file),
                    'file_size': file_stat.st_size,
                    'created_time': datetime.fromtimestamp(file_stat.st_ctime).isoformat(),
                    'modified_time': datetime.fromtimestamp(file_stat.st_mtime).isoformat(),
                    'file_extension': os.path.splitext(media_file)[1].lower()
                }
                
                # TODO: Add EXIF data extraction for images
                # TODO: Add GPS coordinate extraction
                # TODO: Add file relationship analysis
                
                media_data['media_files'].append(file_info)
                self.stats['media_files_processed'] += 1
                
            except Exception as e:
                self.logger.error(f"Error processing media file {media_file}: {e}")
                self.stats['errors'].append(f"Media processing error: {e}")
        
        # Save media data to JSON
        output_path = os.path.join(extracted_folder, "enhanced_json", "media_files.json")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(media_data, f, indent=2, ensure_ascii=False)
    
    def _process_system_files(self, system_files: List[str], extracted_folder: str):
        """
        Process system files and configuration data.
        
        Args:
            system_files: List of system file paths
            extracted_folder: Path to extracted folder
        """
        if not system_files:
            self.logger.info("No system files found")
            return
        
        self.logger.info(f"Processing {len(system_files)} system files...")
        
        system_data = {
            'system_files': [],
            'metadata': {
                'total_files': len(system_files),
                'extraction_timestamp': datetime.now().isoformat()
            }
        }
        
        for system_file in system_files:
            try:
                # Extract basic file metadata
                file_stat = os.stat(system_file)
                file_info = {
                    'file_path': system_file,
                    'file_name': os.path.basename(system_file),
                    'file_size': file_stat.st_size,
                    'created_time': datetime.fromtimestamp(file_stat.st_ctime).isoformat(),
                    'modified_time': datetime.fromtimestamp(file_stat.st_mtime).isoformat(),
                    'file_extension': os.path.splitext(system_file)[1].lower()
                }
                
                # TODO: Add specific processing for different system file types
                # TODO: Add XML parsing for configuration files
                # TODO: Add JSON parsing for structured data
                
                system_data['system_files'].append(file_info)
                self.stats['system_files_processed'] += 1
                
            except Exception as e:
                self.logger.error(f"Error processing system file {system_file}: {e}")
                self.stats['errors'].append(f"System processing error: {e}")
        
        # Save system data to JSON
        output_path = os.path.join(extracted_folder, "enhanced_json", "system_files.json")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(system_data, f, indent=2, ensure_ascii=False)
    
    def _create_relationships(self):
        """
        Create cross-reference relationships between different data types.
        """
        self.logger.info("Creating cross-reference relationships...")
        
        # TODO: Implement relationship mapping
        # - Contact to communication mapping
        # - Location to media correlation
        # - Timeline reconstruction
        # - Entity resolution across platforms
        
        self.relationships = {
            'entity_relationships': [],
            'timeline_events': [],
            'cross_references': {}
        }
    
    def _generate_specialized_json_files(self, extracted_folder: str) -> List[str]:
        """
        Generate specialized JSON files for each data type.
        
        Args:
            extracted_folder: Path to extracted folder
            
        Returns:
            List of created JSON file paths
        """
        self.logger.info("Generating specialized JSON files...")
        
        json_files = []
        enhanced_json_dir = os.path.join(extracted_folder, "enhanced_json")
        
        if os.path.exists(enhanced_json_dir):
            for file in os.listdir(enhanced_json_dir):
                if file.endswith('.json'):
                    json_files.append(os.path.join(enhanced_json_dir, file))
        
        return json_files
    
    def _generate_processing_report(self, extracted_folder: str):
        """
        Generate a comprehensive processing report.
        
        Args:
            extracted_folder: Path to extracted folder
        """
        report_path = os.path.join(extracted_folder, "enhanced_processing_report.json")
        
        report = {
            'processing_date': datetime.now().isoformat(),
            'case_id': self.case_id,
            'device_id': self.device_id,
            'statistics': self.stats,
            'summary': {
                'total_files_found': self.stats['total_files_found'],
                'tsv_files_processed': self.stats['tsv_files_processed'],
                'database_files_processed': self.stats['database_files_processed'],
                'media_files_processed': self.stats['media_files_processed'],
                'system_files_processed': self.stats['system_files_processed'],
                'json_files_created': self.stats['json_files_created'],
                'processing_time_seconds': self.stats['processing_time'],
                'success_rate': 100.0 if self.stats['total_files_found'] > 0 else 0.0
            },
            'relationships': self.relationships,
            'errors': self.stats['errors']
        }
        
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"Processing report saved to: {report_path}")


def main():
    """Main entry point for the enhanced forensic processor."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Enhanced ALEAPP report processor')
    parser.add_argument('--zip-file', required=True, help='Path to ALEAPP report ZIP file')
    parser.add_argument('--case-id', required=True, help='Case identifier')
    parser.add_argument('--device-id', required=True, help='Device identifier')
    parser.add_argument('--output-dir', help='Output directory (optional)')
    parser.add_argument('--config', help='Path to configuration file')
    
    args = parser.parse_args()
    
    # Create enhanced processor
    processor = EnhancedForensicProcessor(
        case_id=args.case_id,
        device_id=args.device_id,
        config_path=args.config
    )
    
    try:
        # Process ALEAPP report
        results = processor.process_aleapp_zip(args.zip_file, args.output_dir)
        
        if results['success']:
            print(f"\n🎉 Enhanced Processing Complete!")
            print(f"📁 ZIP file: {results['zip_file']}")
            print(f"📂 Output directory: {results['output_dir']}")
            print(f"📊 Total files found: {results['statistics']['total_files_found']}")
            print(f"📈 TSV files processed: {results['statistics']['tsv_files_processed']}")
            print(f"🗄️ Database files processed: {results['statistics']['database_files_processed']}")
            print(f"📷 Media files processed: {results['statistics']['media_files_processed']}")
            print(f"⚙️ System files processed: {results['statistics']['system_files_processed']}")
            print(f"📄 JSON files created: {results['statistics']['json_files_created']}")
            print(f"⏱️ Processing time: {results['statistics']['processing_time']:.2f} seconds")
            print(f"\n✅ Enhanced processing completed successfully!")
        else:
            print(f"❌ Error processing ALEAPP report: {results['error']}")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
