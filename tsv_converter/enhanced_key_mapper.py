#!/usr/bin/env python3
"""
Enhanced Key-Value Mapper for Forensic Data
==========================================

This module provides intelligent key-value mapping for all types of forensic data,
ensuring that data is properly structured for analysis and visualization.

Key Features:
- Universal field mapping for all data types
- Intelligent data type detection
- Forensic-specific entity extraction
- Relationship mapping between entities
- Standardized output format for analysis
"""

import re
import json
import logging
from typing import Dict, List, Any, Optional, Tuple, Union
from datetime import datetime
from dataclasses import dataclass
from enum import Enum


class ForensicEntityType(Enum):
    """Types of forensic entities."""
    CONTACT = "contact"
    MESSAGE = "message"
    CALL = "call"
    LOCATION = "location"
    BROWSER_ACTIVITY = "browser_activity"
    FILE = "file"
    MEDIA = "media"
    TRANSACTION = "transaction"
    EMAIL = "email"
    SOCIAL_MEDIA = "social_media"
    SYSTEM_EVENT = "system_event"
    NETWORK_ACTIVITY = "network_activity"


@dataclass
class ForensicEntity:
    """Represents a forensic entity with standardized fields."""
    entity_id: str
    entity_type: ForensicEntityType
    source_file: str
    raw_data: Dict[str, Any]
    mapped_data: Dict[str, Any]
    relationships: List[str]
    confidence_score: float
    extraction_timestamp: str


class EnhancedKeyMapper:
    """
    Enhanced key-value mapper that intelligently maps forensic data
    to standardized entities for analysis.
    """
    
    def __init__(self, case_id: str, device_id: str):
        """Initialize the enhanced key mapper."""
        self.case_id = case_id
        self.device_id = device_id
        self.logger = logging.getLogger(__name__)
        
        # Field mapping patterns
        self.field_patterns = self._initialize_field_patterns()
        
        # Entity extraction rules
        self.entity_rules = self._initialize_entity_rules()
        
        # Relationship patterns
        self.relationship_patterns = self._initialize_relationship_patterns()
    
    def _initialize_field_patterns(self) -> Dict[str, Dict[str, List[str]]]:
        """Initialize field mapping patterns for different data types."""
        return {
            'timestamp': {
                'patterns': [
                    r'timestamp', r'date', r'time', r'created', r'last_access',
                    r'last_visit', r'added_date', r'modified', r'accessed'
                ],
                'formats': [
                    '%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%SZ', '%Y-%m-%dT%H:%M:%S.%fZ',
                    '%Y-%m-%dT%H:%M:%S.%f%z', '%Y-%m-%dT%H:%M:%S%z', '%Y-%m-%d %H:%M:%S.%f',
                    '%Y-%m-%d %H:%M:%S.%f%z', '%Y-%m-%d %H:%M:%S%z', '%Y-%m-%d',
                    '%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%d %H:%M:%S.%f%z',
                    '%Y-%m-%d %H:%M:%S.%f+00:00'
                ]
            },
            'phone_number': {
                'patterns': [
                    r'phone', r'number', r'address', r'partner', r'from', r'to',
                    r'phone_account_address', r'contact_number', r'mobile'
                ],
                'validation': r'\+?[1-9]\d{1,14}|\(\d{3}\)\s?\d{3}-\d{4}|\d{3}-\d{3}-\d{4}'
            },
            'message_content': {
                'patterns': [
                    r'body', r'message', r'text', r'content', r'subject', r'title',
                    r'message_text', r'chat_content', r'sms_body'
                ]
            },
            'participant': {
                'patterns': [
                    r'from', r'to', r'sender', r'receiver', r'participant', r'contact',
                    r'user', r'author', r'creator'
                ]
            },
            'location': {
                'patterns': [
                    r'location', r'address', r'place', r'country', r'city', r'coordinates',
                    r'latitude', r'longitude', r'lat', r'lng', r'gps', r'position'
                ]
            },
            'url': {
                'patterns': [
                    r'url', r'link', r'address', r'website', r'domain', r'host',
                    r'web_address', r'browser_url'
                ],
                'validation': r'https?://[^\s<>"{}|\\^`\[\]]+|www\.[^\s<>"{}|\\^`\[\]]+'
            },
            'file_info': {
                'patterns': [
                    r'filename', r'file', r'name', r'source_file', r'path', r'size',
                    r'hash', r'mime_type', r'extension'
                ]
            },
            'duration': {
                'patterns': [
                    r'duration', r'length', r'time', r'call_duration', r'video_duration',
                    r'audio_duration', r'session_length'
                ]
            },
            'amount': {
                'patterns': [
                    r'amount', r'value', r'price', r'cost', r'total', r'sum',
                    r'money', r'currency', r'payment'
                ]
            },
            'email': {
                'patterns': [
                    r'email', r'mail', r'email_address', r'contact_email', r'user_email'
                ],
                'validation': r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
            }
        }
    
    def _initialize_entity_rules(self) -> Dict[ForensicEntityType, Dict[str, Any]]:
        """Initialize entity extraction rules."""
        return {
            ForensicEntityType.CONTACT: {
                'required_fields': ['name', 'phone_number'],
                'optional_fields': ['email', 'address', 'organization'],
                'confidence_boosters': ['contact', 'phone', 'email', 'address'],
                'min_confidence': 0.7
            },
            ForensicEntityType.MESSAGE: {
                'required_fields': ['message_content', 'timestamp'],
                'optional_fields': ['participant', 'thread_id', 'message_id'],
                'confidence_boosters': ['message', 'sms', 'chat', 'text', 'body'],
                'min_confidence': 0.6
            },
            ForensicEntityType.CALL: {
                'required_fields': ['phone_number', 'timestamp'],
                'optional_fields': ['duration', 'call_type', 'direction'],
                'confidence_boosters': ['call', 'phone', 'duration', 'incoming', 'outgoing'],
                'min_confidence': 0.7
            },
            ForensicEntityType.LOCATION: {
                'required_fields': ['latitude', 'longitude'],
                'optional_fields': ['address', 'timestamp', 'accuracy'],
                'confidence_boosters': ['location', 'gps', 'coordinates', 'latitude', 'longitude'],
                'min_confidence': 0.8
            },
            ForensicEntityType.BROWSER_ACTIVITY: {
                'required_fields': ['url'],
                'optional_fields': ['title', 'timestamp', 'visit_count', 'browser'],
                'confidence_boosters': ['url', 'browser', 'history', 'bookmark', 'cookie'],
                'min_confidence': 0.6
            },
            ForensicEntityType.FILE: {
                'required_fields': ['filename'],
                'optional_fields': ['path', 'size', 'hash', 'mime_type', 'timestamp'],
                'confidence_boosters': ['file', 'download', 'media', 'document'],
                'min_confidence': 0.5
            },
            ForensicEntityType.MEDIA: {
                'required_fields': ['filename', 'mime_type'],
                'optional_fields': ['path', 'size', 'timestamp', 'duration', 'resolution'],
                'confidence_boosters': ['image', 'video', 'audio', 'photo', 'media'],
                'min_confidence': 0.6
            },
            ForensicEntityType.TRANSACTION: {
                'required_fields': ['amount', 'timestamp'],
                'optional_fields': ['from', 'to', 'method', 'currency'],
                'confidence_boosters': ['transaction', 'payment', 'money', 'amount', 'upi'],
                'min_confidence': 0.7
            },
            ForensicEntityType.EMAIL: {
                'required_fields': ['subject', 'from', 'to'],
                'optional_fields': ['body', 'timestamp', 'attachments'],
                'confidence_boosters': ['email', 'subject', 'from', 'to', 'mail'],
                'min_confidence': 0.7
            },
            ForensicEntityType.SOCIAL_MEDIA: {
                'required_fields': ['platform', 'content'],
                'optional_fields': ['user', 'timestamp', 'likes', 'shares'],
                'confidence_boosters': ['facebook', 'twitter', 'instagram', 'linkedin', 'social'],
                'min_confidence': 0.6
            }
        }
    
    def _initialize_relationship_patterns(self) -> Dict[str, List[str]]:
        """Initialize relationship patterns between entities."""
        return {
            'contact_to_message': ['phone_number', 'participant', 'from', 'to'],
            'contact_to_call': ['phone_number', 'participant'],
            'message_to_location': ['timestamp', 'location_context'],
            'file_to_media': ['filename', 'mime_type', 'path'],
            'browser_to_location': ['url', 'location_context'],
            'transaction_to_contact': ['from', 'to', 'participant'],
            'email_to_contact': ['from', 'to', 'participant']
        }
    
    def map_tsv_data(self, file_path: str, headers: List[str], rows: List[Dict[str, str]]) -> List[ForensicEntity]:
        """
        Map TSV data to forensic entities.
        
        Args:
            file_path: Path to the TSV file
            headers: List of column headers
            rows: List of data rows
            
        Returns:
            List of mapped forensic entities
        """
        entities = []
        
        # Detect file type and entity type
        entity_type = self._detect_entity_type(file_path, headers, rows)
        
        for i, row in enumerate(rows):
            try:
                # Create base entity
                entity_id = f"{entity_type.value}-{i:04d}"
                
                # Map fields
                mapped_data = self._map_fields(row, entity_type)
                
                # Calculate confidence score
                confidence = self._calculate_confidence(mapped_data, entity_type)
                
                # Create forensic entity
                entity = ForensicEntity(
                    entity_id=entity_id,
                    entity_type=entity_type,
                    source_file=file_path,
                    raw_data=row,
                    mapped_data=mapped_data,
                    relationships=[],
                    confidence_score=confidence,
                    extraction_timestamp=datetime.now().isoformat()
                )
                
                # Add relationships
                entity.relationships = self._extract_relationships(entity, entities)
                
                entities.append(entity)
                
            except Exception as e:
                self.logger.error(f"Error mapping row {i} in {file_path}: {e}")
                continue
        
        return entities
    
    def map_database_data(self, file_path: str, database_data: Dict[str, Any]) -> List[ForensicEntity]:
        """
        Map database data to forensic entities.
        
        Args:
            file_path: Path to the database file
            database_data: Extracted database data
            
        Returns:
            List of mapped forensic entities
        """
        entities = []
        
        for table_name, table_data in database_data.get('tables', {}).items():
            # Detect entity type from table name and structure
            entity_type = self._detect_database_entity_type(table_name, table_data)
            
            if entity_type:
                # Convert table data to entities
                for i, row in enumerate(table_data.get('data', [])):
                    try:
                        # Create row dictionary
                        row_dict = {}
                        columns = table_data.get('columns', [])
                        for j, col in enumerate(columns):
                            if j < len(row):
                                row_dict[col['name']] = row[j]
                        
                        # Map fields
                        mapped_data = self._map_fields(row_dict, entity_type)
                        
                        # Calculate confidence
                        confidence = self._calculate_confidence(mapped_data, entity_type)
                        
                        # Create entity
                        entity = ForensicEntity(
                            entity_id=f"{entity_type.value}-{table_name}-{i:04d}",
                            entity_type=entity_type,
                            source_file=file_path,
                            raw_data=row_dict,
                            mapped_data=mapped_data,
                            relationships=[],
                            confidence_score=confidence,
                            extraction_timestamp=datetime.now().isoformat()
                        )
                        
                        entities.append(entity)
                        
                    except Exception as e:
                        self.logger.error(f"Error mapping database row {i} in {table_name}: {e}")
                        continue
        
        return entities
    
    def map_media_data(self, file_path: str, media_data: Dict[str, Any]) -> List[ForensicEntity]:
        """
        Map media data to forensic entities.
        
        Args:
            file_path: Path to the media file
            media_data: Media file metadata
            
        Returns:
            List of mapped forensic entities
        """
        entities = []
        
        # Create media entity
        entity = ForensicEntity(
            entity_id=f"media-{os.path.basename(file_path)}",
            entity_type=ForensicEntityType.MEDIA,
            source_file=file_path,
            raw_data=media_data,
            mapped_data=self._map_media_fields(media_data),
            relationships=[],
            confidence_score=0.9,  # High confidence for media files
            extraction_timestamp=datetime.now().isoformat()
        )
        
        entities.append(entity)
        return entities
    
    def _detect_entity_type(self, file_path: str, headers: List[str], rows: List[Dict[str, str]]) -> ForensicEntityType:
        """Detect the entity type from file path and headers."""
        filename = os.path.basename(file_path).lower()
        
        # File name based detection
        if any(keyword in filename for keyword in ['contact', 'contacts']):
            return ForensicEntityType.CONTACT
        elif any(keyword in filename for keyword in ['message', 'sms', 'chat', 'messenger']):
            return ForensicEntityType.MESSAGE
        elif any(keyword in filename for keyword in ['call', 'calls']):
            return ForensicEntityType.CALL
        elif any(keyword in filename for keyword in ['location', 'gps', 'maps', 'places']):
            return ForensicEntityType.LOCATION
        elif any(keyword in filename for keyword in ['browser', 'chrome', 'firefox', 'edge', 'history', 'bookmark']):
            return ForensicEntityType.BROWSER_ACTIVITY
        elif any(keyword in filename for keyword in ['download', 'file', 'media']):
            return ForensicEntityType.FILE
        elif any(keyword in filename for keyword in ['transaction', 'payment', 'upi']):
            return ForensicEntityType.TRANSACTION
        elif any(keyword in filename for keyword in ['email', 'gmail']):
            return ForensicEntityType.EMAIL
        elif any(keyword in filename for keyword in ['facebook', 'twitter', 'instagram', 'linkedin']):
            return ForensicEntityType.SOCIAL_MEDIA
        
        # Header based detection
        header_text = ' '.join(headers).lower()
        
        if any(keyword in header_text for keyword in ['phone', 'contact', 'name']):
            return ForensicEntityType.CONTACT
        elif any(keyword in header_text for keyword in ['message', 'body', 'text', 'sms']):
            return ForensicEntityType.MESSAGE
        elif any(keyword in header_text for keyword in ['call', 'duration', 'phone']):
            return ForensicEntityType.CALL
        elif any(keyword in header_text for keyword in ['latitude', 'longitude', 'location']):
            return ForensicEntityType.LOCATION
        elif any(keyword in header_text for keyword in ['url', 'browser', 'history']):
            return ForensicEntityType.BROWSER_ACTIVITY
        elif any(keyword in header_text for keyword in ['file', 'download', 'media']):
            return ForensicEntityType.FILE
        elif any(keyword in header_text for keyword in ['amount', 'transaction', 'payment']):
            return ForensicEntityType.TRANSACTION
        elif any(keyword in header_text for keyword in ['email', 'subject', 'from', 'to']):
            return ForensicEntityType.EMAIL
        
        # Default to file if no specific type detected
        return ForensicEntityType.FILE
    
    def _detect_database_entity_type(self, table_name: str, table_data: Dict[str, Any]) -> Optional[ForensicEntityType]:
        """Detect entity type from database table."""
        table_name_lower = table_name.lower()
        columns = [col['name'].lower() for col in table_data.get('columns', [])]
        column_text = ' '.join(columns)
        
        # Table name based detection
        if any(keyword in table_name_lower for keyword in ['contact', 'contacts']):
            return ForensicEntityType.CONTACT
        elif any(keyword in table_name_lower for keyword in ['message', 'sms', 'chat', 'messenger']):
            return ForensicEntityType.MESSAGE
        elif any(keyword in table_name_lower for keyword in ['call', 'calls']):
            return ForensicEntityType.CALL
        elif any(keyword in table_name_lower for keyword in ['location', 'gps', 'maps']):
            return ForensicEntityType.LOCATION
        elif any(keyword in table_name_lower for keyword in ['browser', 'history', 'bookmark']):
            return ForensicEntityType.BROWSER_ACTIVITY
        elif any(keyword in table_name_lower for keyword in ['download', 'file', 'media']):
            return ForensicEntityType.FILE
        elif any(keyword in table_name_lower for keyword in ['transaction', 'payment']):
            return ForensicEntityType.TRANSACTION
        elif any(keyword in table_name_lower for keyword in ['email', 'mail']):
            return ForensicEntityType.EMAIL
        
        # Column based detection
        if any(keyword in column_text for keyword in ['phone', 'contact', 'name']):
            return ForensicEntityType.CONTACT
        elif any(keyword in column_text for keyword in ['message', 'body', 'text']):
            return ForensicEntityType.MESSAGE
        elif any(keyword in column_text for keyword in ['call', 'duration']):
            return ForensicEntityType.CALL
        elif any(keyword in column_text for keyword in ['latitude', 'longitude']):
            return ForensicEntityType.LOCATION
        elif any(keyword in column_text for keyword in ['url', 'browser']):
            return ForensicEntityType.BROWSER_ACTIVITY
        elif any(keyword in column_text for keyword in ['file', 'download']):
            return ForensicEntityType.FILE
        elif any(keyword in column_text for keyword in ['amount', 'transaction']):
            return ForensicEntityType.TRANSACTION
        elif any(keyword in column_text for keyword in ['email', 'subject']):
            return ForensicEntityType.EMAIL
        
        return None
    
    def _map_fields(self, row: Dict[str, Any], entity_type: ForensicEntityType) -> Dict[str, Any]:
        """Map raw fields to standardized forensic fields."""
        mapped_data = {}
        
        # Get entity rules
        rules = self.entity_rules.get(entity_type, {})
        required_fields = rules.get('required_fields', [])
        optional_fields = rules.get('optional_fields', [])
        
        # Map each field
        for field_name, field_value in row.items():
            if not field_value or str(field_value).strip() == '':
                continue
            
            # Find matching pattern
            mapped_field = self._find_matching_field(field_name, field_value)
            if mapped_field:
                mapped_data[mapped_field] = self._clean_value(field_value)
        
        # Add entity-specific enhancements
        mapped_data = self._add_entity_enhancements(mapped_data, entity_type)
        
        return mapped_data
    
    def _find_matching_field(self, field_name: str, field_value: Any) -> Optional[str]:
        """Find the standardized field name for a given field."""
        field_name_lower = field_name.lower()
        field_value_str = str(field_value).lower()
        
        # Check each field pattern
        for standard_field, pattern_info in self.field_patterns.items():
            patterns = pattern_info.get('patterns', [])
            
            # Check if field name matches
            for pattern in patterns:
                if re.search(pattern, field_name_lower):
                    # Validate if validation pattern exists
                    if 'validation' in pattern_info:
                        if re.search(pattern_info['validation'], str(field_value)):
                            return standard_field
                    else:
                        return standard_field
            
            # Check if field value matches
            for pattern in patterns:
                if re.search(pattern, field_value_str):
                    return standard_field
        
        return None
    
    def _clean_value(self, value: Any) -> Any:
        """Clean and convert value to appropriate type."""
        if not value or str(value).strip() == '':
            return None
        
        value_str = str(value).strip()
        
        # Try to convert to number
        try:
            if '.' in value_str:
                return float(value_str)
            else:
                return int(value_str)
        except ValueError:
            pass
        
        # Try to convert to boolean
        if value_str.lower() in ['true', '1', 'yes', 'on']:
            return True
        elif value_str.lower() in ['false', '0', 'no', 'off']:
            return False
        
        # Return as string
        return value_str
    
    def _add_entity_enhancements(self, mapped_data: Dict[str, Any], entity_type: ForensicEntityType) -> Dict[str, Any]:
        """Add entity-specific enhancements."""
        enhanced_data = mapped_data.copy()
        
        if entity_type == ForensicEntityType.MESSAGE:
            # Extract text content
            text_fields = ['message_content', 'body', 'text', 'content']
            for field in text_fields:
                if field in enhanced_data:
                    enhanced_data['text'] = enhanced_data[field]
                    break
            
            # Extract participants
            participant_fields = ['participant', 'from', 'to', 'sender', 'receiver']
            participants = []
            for field in participant_fields:
                if field in enhanced_data:
                    participants.append(enhanced_data[field])
            if participants:
                enhanced_data['participants'] = participants
        
        elif entity_type == ForensicEntityType.CALL:
            # Add duration in seconds
            if 'duration' in enhanced_data:
                try:
                    enhanced_data['duration_seconds'] = int(enhanced_data['duration'])
                except (ValueError, TypeError):
                    pass
        
        elif entity_type == ForensicEntityType.LOCATION:
            # Add coordinates
            if 'latitude' in enhanced_data and 'longitude' in enhanced_data:
                try:
                    enhanced_data['coordinates'] = {
                        'lat': float(enhanced_data['latitude']),
                        'lng': float(enhanced_data['longitude'])
                    }
                except (ValueError, TypeError):
                    pass
        
        elif entity_type == ForensicEntityType.BROWSER_ACTIVITY:
            # Extract domain from URL
            if 'url' in enhanced_data:
                try:
                    from urllib.parse import urlparse
                    parsed = urlparse(enhanced_data['url'])
                    enhanced_data['domain'] = parsed.netloc
                except:
                    pass
        
        elif entity_type == ForensicEntityType.MEDIA:
            # Add media type
            if 'mime_type' in enhanced_data:
                mime_type = enhanced_data['mime_type']
                if mime_type.startswith('image/'):
                    enhanced_data['media_type'] = 'image'
                elif mime_type.startswith('video/'):
                    enhanced_data['media_type'] = 'video'
                elif mime_type.startswith('audio/'):
                    enhanced_data['media_type'] = 'audio'
                else:
                    enhanced_data['media_type'] = 'unknown'
        
        return enhanced_data
    
    def _map_media_fields(self, media_data: Dict[str, Any]) -> Dict[str, Any]:
        """Map media file fields."""
        mapped_data = {}
        
        # Map basic fields
        field_mapping = {
            'file_name': 'filename',
            'file_size': 'size',
            'file_extension': 'extension',
            'mime_type': 'mime_type',
            'created_time': 'timestamp',
            'modified_time': 'modified_timestamp'
        }
        
        for source_field, target_field in field_mapping.items():
            if source_field in media_data:
                mapped_data[target_field] = media_data[source_field]
        
        return mapped_data
    
    def _calculate_confidence(self, mapped_data: Dict[str, Any], entity_type: ForensicEntityType) -> float:
        """Calculate confidence score for the mapped entity."""
        rules = self.entity_rules.get(entity_type, {})
        required_fields = rules.get('required_fields', [])
        optional_fields = rules.get('optional_fields', [])
        min_confidence = rules.get('min_confidence', 0.5)
        
        # Check required fields
        required_score = 0
        for field in required_fields:
            if field in mapped_data and mapped_data[field]:
                required_score += 1
        
        if not required_fields:
            required_score = 1
        else:
            required_score = required_score / len(required_fields)
        
        # Check optional fields
        optional_score = 0
        for field in optional_fields:
            if field in mapped_data and mapped_data[field]:
                optional_score += 1
        
        if optional_fields:
            optional_score = optional_score / len(optional_fields)
        
        # Calculate final confidence
        confidence = (required_score * 0.7) + (optional_score * 0.3)
        
        return max(confidence, min_confidence)
    
    def _extract_relationships(self, entity: ForensicEntity, existing_entities: List[ForensicEntity]) -> List[str]:
        """Extract relationships between entities."""
        relationships = []
        
        for existing_entity in existing_entities:
            # Check for relationship patterns
            for pattern_name, pattern_fields in self.relationship_patterns.items():
                if self._entities_related(entity, existing_entity, pattern_fields):
                    relationships.append(f"{pattern_name}:{existing_entity.entity_id}")
        
        return relationships
    
    def _entities_related(self, entity1: ForensicEntity, entity2: ForensicEntity, pattern_fields: List[str]) -> bool:
        """Check if two entities are related based on pattern fields."""
        for field in pattern_fields:
            if (field in entity1.mapped_data and field in entity2.mapped_data and
                entity1.mapped_data[field] == entity2.mapped_data[field]):
                return True
        return False
    
    def export_entities(self, entities: List[ForensicEntity], output_path: str) -> Dict[str, Any]:
        """Export entities to JSON format."""
        export_data = {
            'case_id': self.case_id,
            'device_id': self.device_id,
            'extraction_timestamp': datetime.now().isoformat(),
            'total_entities': len(entities),
            'entity_types': {},
            'entities': []
        }
        
        # Group entities by type
        for entity in entities:
            entity_type = entity.entity_type.value
            if entity_type not in export_data['entity_types']:
                export_data['entity_types'][entity_type] = 0
            export_data['entity_types'][entity_type] += 1
        
        # Convert entities to dictionaries
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
            export_data['entities'].append(entity_dict)
        
        # Write to file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
        
        return export_data


def main():
    """Main entry point for testing the enhanced key mapper."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Enhanced Key-Value Mapper for Forensic Data')
    parser.add_argument('--input-file', required=True, help='Input file to process')
    parser.add_argument('--output-file', required=True, help='Output file for mapped entities')
    parser.add_argument('--case-id', required=True, help='Case identifier')
    parser.add_argument('--device-id', required=True, help='Device identifier')
    
    args = parser.parse_args()
    
    # Create mapper
    mapper = EnhancedKeyMapper(args.case_id, args.device_id)
    
    # Process file based on type
    if args.input_file.endswith('.tsv'):
        # Process TSV file
        import csv
        with open(args.input_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter='\t')
            headers = reader.fieldnames
            rows = list(reader)
        
        entities = mapper.map_tsv_data(args.input_file, headers, rows)
    
    elif args.input_file.endswith('.json'):
        # Process JSON file
        with open(args.input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'tables' in data:
            entities = mapper.map_database_data(args.input_file, data)
        else:
            entities = mapper.map_media_data(args.input_file, data)
    
    else:
        print(f"Unsupported file type: {args.input_file}")
        return
    
    # Export entities
    export_data = mapper.export_entities(entities, args.output_file)
    
    print(f"✅ Mapped {len(entities)} entities")
    print(f"📊 Entity types: {export_data['entity_types']}")
    print(f"💾 Exported to: {args.output_file}")


if __name__ == '__main__':
    main()
