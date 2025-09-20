#!/usr/bin/env python3
"""
Specialized Data Processors
===========================

Specialized processors for different data types in ALEAPP reports.
Each processor handles specific data types with optimized processing.

Processors:
- CallLogsProcessor: Phone calls, voicemails
- SMSProcessor: SMS/MMS messages
- WhatsAppProcessor: WhatsApp data
- TelegramProcessor: Telegram data
- GPSProcessor: GPS locations, routes
- MediaProcessor: Images, videos, audio
- BrowserProcessor: Browser data
- SystemProcessor: System files, notifications
"""

import os
import json
import sqlite3
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import csv
import re


class BaseProcessor:
    """Base class for all specialized processors."""
    
    def __init__(self, case_id: str, device_id: str):
        """
        Initialize the processor.
        
        Args:
            case_id: Case identifier
            device_id: Device identifier
        """
        self.case_id = case_id
        self.device_id = device_id
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def process(self, data: Any) -> Dict[str, Any]:
        """
        Process data and return structured JSON.
        
        Args:
            data: Input data to process
            
        Returns:
            Dictionary with processed data
        """
        raise NotImplementedError("Subclasses must implement process method")


class CallLogsProcessor(BaseProcessor):
    """Processor for call logs and voicemails."""
    
    def process(self, tsv_data: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Process call logs data.
        
        Args:
            tsv_data: List of call log records
            
        Returns:
            Dictionary with processed call logs
        """
        calls = []
        voicemails = []
        
        for record in tsv_data:
            try:
                call_record = {
                    'id': f"call-{len(calls)}",
                    'timestamp': record.get('Call Date', ''),
                    'from_number': record.get('Phone Account Address', ''),
                    'to_number': record.get('Partner', ''),
                    'duration': record.get('Duration in Secs', ''),
                    'call_type': record.get('Type', ''),
                    'location': record.get('Partner Location', ''),
                    'country': record.get('Country ISO', ''),
                    'transcription': record.get('Transcription', ''),
                    'deleted': record.get('Deleted', ''),
                    'source_file': record.get('Source File', ''),
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
                
                # Categorize as call or voicemail
                if 'voicemail' in call_record['call_type'].lower():
                    voicemails.append(call_record)
                else:
                    calls.append(call_record)
                    
            except Exception as e:
                self.logger.error(f"Error processing call record: {e}")
                continue
        
        return {
            'metadata': {
                'case_id': self.case_id,
                'device_id': self.device_id,
                'total_calls': len(calls),
                'total_voicemails': len(voicemails),
                'processing_timestamp': datetime.now().isoformat()
            },
            'calls': calls,
            'voicemails': voicemails
        }


class SMSProcessor(BaseProcessor):
    """Processor for SMS and MMS messages."""
    
    def process(self, tsv_data: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Process SMS/MMS data.
        
        Args:
            tsv_data: List of SMS/MMS records
            
        Returns:
            Dictionary with processed messages
        """
        messages = []
        
        for record in tsv_data:
            try:
                message_record = {
                    'id': f"sms-{record.get('MSG ID', len(messages))}",
                    'timestamp': record.get('Date', ''),
                    'thread_id': record.get('Thread ID', ''),
                    'from_number': record.get('Address', ''),
                    'contact_id': record.get('Contact ID', ''),
                    'date_sent': record.get('Date sent', ''),
                    'read': record.get('Read', ''),
                    'message_type': record.get('Type', ''),
                    'body': record.get('Body', ''),
                    'service_center': record.get('Service Center', ''),
                    'error_code': record.get('Error code', ''),
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
                
                messages.append(message_record)
                
            except Exception as e:
                self.logger.error(f"Error processing SMS record: {e}")
                continue
        
        return {
            'metadata': {
                'case_id': self.case_id,
                'device_id': self.device_id,
                'total_messages': len(messages),
                'processing_timestamp': datetime.now().isoformat()
            },
            'messages': messages
        }


class WhatsAppProcessor(BaseProcessor):
    """Processor for WhatsApp data."""
    
    def process(self, database_path: str) -> Dict[str, Any]:
        """
        Process WhatsApp database.
        
        Args:
            database_path: Path to WhatsApp database
            
        Returns:
            Dictionary with processed WhatsApp data
        """
        try:
            conn = sqlite3.connect(database_path)
            cursor = conn.cursor()
            
            # Extract messages
            messages = self._extract_messages(cursor)
            contacts = self._extract_contacts(cursor)
            groups = self._extract_groups(cursor)
            media = self._extract_media(cursor)
            
            conn.close()
            
            return {
                'metadata': {
                    'case_id': self.case_id,
                    'device_id': self.device_id,
                    'database_path': database_path,
                    'total_messages': len(messages),
                    'total_contacts': len(contacts),
                    'total_groups': len(groups),
                    'total_media': len(media),
                    'processing_timestamp': datetime.now().isoformat()
                },
                'messages': messages,
                'contacts': contacts,
                'groups': groups,
                'media': media
            }
            
        except Exception as e:
            self.logger.error(f"Error processing WhatsApp database: {e}")
            return {'error': str(e)}
    
    def _extract_messages(self, cursor) -> List[Dict[str, Any]]:
        """Extract messages from WhatsApp database."""
        messages = []
        
        try:
            # Query messages table
            cursor.execute("SELECT * FROM messages LIMIT 1000")
            rows = cursor.fetchall()
            
            for row in rows:
                message = {
                    'id': f"whatsapp-msg-{row[0] if row else len(messages)}",
                    'timestamp': row[1] if len(row) > 1 else '',
                    'from_number': row[2] if len(row) > 2 else '',
                    'to_number': row[3] if len(row) > 3 else '',
                    'message_body': row[4] if len(row) > 4 else '',
                    'message_type': row[5] if len(row) > 5 else '',
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
                messages.append(message)
                
        except Exception as e:
            self.logger.warning(f"Error extracting messages: {e}")
        
        return messages
    
    def _extract_contacts(self, cursor) -> List[Dict[str, Any]]:
        """Extract contacts from WhatsApp database."""
        contacts = []
        
        try:
            # Query contacts table
            cursor.execute("SELECT * FROM contacts LIMIT 1000")
            rows = cursor.fetchall()
            
            for row in rows:
                contact = {
                    'id': f"whatsapp-contact-{row[0] if row else len(contacts)}",
                    'phone_number': row[1] if len(row) > 1 else '',
                    'display_name': row[2] if len(row) > 2 else '',
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
                contacts.append(contact)
                
        except Exception as e:
            self.logger.warning(f"Error extracting contacts: {e}")
        
        return contacts
    
    def _extract_groups(self, cursor) -> List[Dict[str, Any]]:
        """Extract groups from WhatsApp database."""
        groups = []
        
        try:
            # Query groups table
            cursor.execute("SELECT * FROM groups LIMIT 1000")
            rows = cursor.fetchall()
            
            for row in rows:
                group = {
                    'id': f"whatsapp-group-{row[0] if row else len(groups)}",
                    'group_name': row[1] if len(row) > 1 else '',
                    'group_description': row[2] if len(row) > 2 else '',
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
                groups.append(group)
                
        except Exception as e:
            self.logger.warning(f"Error extracting groups: {e}")
        
        return groups
    
    def _extract_media(self, cursor) -> List[Dict[str, Any]]:
        """Extract media from WhatsApp database."""
        media = []
        
        try:
            # Query media table
            cursor.execute("SELECT * FROM media LIMIT 1000")
            rows = cursor.fetchall()
            
            for row in rows:
                media_item = {
                    'id': f"whatsapp-media-{row[0] if row else len(media)}",
                    'file_path': row[1] if len(row) > 1 else '',
                    'file_name': row[2] if len(row) > 2 else '',
                    'file_size': row[3] if len(row) > 3 else '',
                    'mime_type': row[4] if len(row) > 4 else '',
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
                media.append(media_item)
                
        except Exception as e:
            self.logger.warning(f"Error extracting media: {e}")
        
        return media


class GPSProcessor(BaseProcessor):
    """Processor for GPS locations and routes."""
    
    def process(self, tsv_data: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Process GPS location data.
        
        Args:
            tsv_data: List of GPS location records
            
        Returns:
            Dictionary with processed GPS data
        """
        locations = []
        routes = []
        
        for record in tsv_data:
            try:
                location_record = {
                    'id': f"gps-{len(locations)}",
                    'timestamp': record.get('Timestamp', ''),
                    'latitude': record.get('Latitude', ''),
                    'longitude': record.get('Longitude', ''),
                    'altitude': record.get('Altitude', ''),
                    'speed': record.get('Speed (mps)', ''),
                    'course': record.get('Course', ''),
                    'bearing': record.get('Bearing', ''),
                    'accuracy': record.get('Horizontal Accuracy (+/- m)', ''),
                    'location_mode': record.get('Location Mode', ''),
                    'wifi_bssid': record.get('Connected Access Point BSSID', ''),
                    'wifi_ssid': record.get('Connected Access Point SSID', ''),
                    'source_file': record.get('Source File', ''),
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
                
                # Categorize as location or route
                if location_record['speed'] and float(location_record['speed']) > 0:
                    routes.append(location_record)
                else:
                    locations.append(location_record)
                    
            except Exception as e:
                self.logger.error(f"Error processing GPS record: {e}")
                continue
        
        return {
            'metadata': {
                'case_id': self.case_id,
                'device_id': self.device_id,
                'total_locations': len(locations),
                'total_routes': len(routes),
                'processing_timestamp': datetime.now().isoformat()
            },
            'locations': locations,
            'routes': routes
        }


class MediaProcessor(BaseProcessor):
    """Processor for media files with metadata."""
    
    def process(self, media_files: List[str]) -> Dict[str, Any]:
        """
        Process media files with metadata extraction.
        
        Args:
            media_files: List of media file paths
            
        Returns:
            Dictionary with processed media data
        """
        processed_media = []
        
        for media_file in media_files:
            try:
                # Extract basic file metadata
                file_stat = os.stat(media_file)
                file_info = {
                    'id': f"media-{len(processed_media)}",
                    'file_path': media_file,
                    'file_name': os.path.basename(media_file),
                    'file_size': file_stat.st_size,
                    'created_time': datetime.fromtimestamp(file_stat.st_ctime).isoformat(),
                    'modified_time': datetime.fromtimestamp(file_stat.st_mtime).isoformat(),
                    'file_extension': os.path.splitext(media_file)[1].lower(),
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
                
                # TODO: Add EXIF data extraction for images
                # TODO: Add GPS coordinate extraction
                # TODO: Add file relationship analysis
                
                processed_media.append(file_info)
                
            except Exception as e:
                self.logger.error(f"Error processing media file {media_file}: {e}")
                continue
        
        return {
            'metadata': {
                'case_id': self.case_id,
                'device_id': self.device_id,
                'total_files': len(processed_media),
                'processing_timestamp': datetime.now().isoformat()
            },
            'media_files': processed_media
        }


class BrowserProcessor(BaseProcessor):
    """Processor for browser data (Chrome, Firefox, etc.)."""
    
    def process(self, browser_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process browser data.
        
        Args:
            browser_data: Dictionary with browser data
            
        Returns:
            Dictionary with processed browser data
        """
        return {
            'metadata': {
                'case_id': self.case_id,
                'device_id': self.device_id,
                'processing_timestamp': datetime.now().isoformat()
            },
            'browser_data': browser_data
        }


class SystemProcessor(BaseProcessor):
    """Processor for system files and notifications."""
    
    def process(self, system_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process system data.
        
        Args:
            system_data: Dictionary with system data
            
        Returns:
            Dictionary with processed system data
        """
        return {
            'metadata': {
                'case_id': self.case_id,
                'device_id': self.device_id,
                'processing_timestamp': datetime.now().isoformat()
            },
            'system_data': system_data
        }


class ProcessorFactory:
    """Factory class for creating specialized processors."""
    
    @staticmethod
    def create_processor(processor_type: str, case_id: str, device_id: str) -> BaseProcessor:
        """
        Create a specialized processor.
        
        Args:
            processor_type: Type of processor to create
            case_id: Case identifier
            device_id: Device identifier
            
        Returns:
            Specialized processor instance
        """
        processors = {
            'call_logs': CallLogsProcessor,
            'sms': SMSProcessor,
            'whatsapp': WhatsAppProcessor,
            'gps': GPSProcessor,
            'media': MediaProcessor,
            'browser': BrowserProcessor,
            'system': SystemProcessor
        }
        
        if processor_type not in processors:
            raise ValueError(f"Unknown processor type: {processor_type}")
        
        return processors[processor_type](case_id, device_id)
