#!/usr/bin/env python3
"""
Enhanced Header Mapper
======================

Fixed header mapping for TSV to JSON conversion that properly captures
all relevant data from forensic reports.
"""

import re
from typing import Dict, List, Any, Optional
import yaml


class EnhancedHeaderMapper:
    """
    Enhanced header mapper that properly maps TSV headers to meaningful JSON keys.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the enhanced header mapper.
        
        Args:
            config_path: Path to configuration file
        """
        self.config = self._load_config(config_path)
        self.header_mappings = self._build_header_mappings()
    
    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load configuration from file."""
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        return {}
    
    def _build_header_mappings(self) -> Dict[str, str]:
        """Build comprehensive header mappings."""
        return {
            # Timestamp fields
            'date': 'timestamp',
            'time': 'timestamp', 
            'timestamp': 'timestamp',
            'created_date': 'timestamp',
            'last_access_date': 'timestamp',
            'last_visit_time': 'timestamp',
            'added_date': 'timestamp',
            'call_date': 'timestamp',
            'date_sent': 'timestamp',
            'date_received': 'timestamp',
            
            # Phone number fields
            'phone_number': 'phone_number',
            'address': 'phone_number',
            'phone': 'phone_number',
            'number': 'phone_number',
            'partner': 'phone_number',
            'phone_account_address': 'phone_number',
            'from': 'phone_number',
            'to': 'phone_number',
            'contact_id': 'contact_id',
            
            # Message fields
            'body': 'message_text',
            'message': 'message_text',
            'text': 'message_text',
            'content': 'message_text',
            'subject': 'message_text',
            'title': 'message_text',
            'msg_id': 'message_id',
            'message_id': 'message_id',
            'thread_id': 'thread_id',
            'thread': 'thread_id',
            'message_type': 'message_type',
            
            # Call fields
            'duration': 'duration',
            'duration_in_secs': 'duration',
            'duration_sec': 'duration',
            'call_duration': 'duration',
            'call_type': 'call_type',
            'direction': 'direction',
            'read': 'read_status',
            'service_center': 'service_center',
            'error_code': 'error_code',
            
            # Location fields
            'latitude': 'latitude',
            'lat': 'latitude',
            'lat_coord': 'latitude',
            'longitude': 'longitude',
            'lon': 'longitude',
            'lng': 'longitude',
            'lng_coord': 'longitude',
            'location': 'location',
            'address': 'phone_number',
            'place': 'location',
            'country': 'country',
            'city': 'city',
            'altitude': 'altitude',
            'speed': 'speed',
            'course': 'course',
            'bearing': 'bearing',
            'accuracy': 'accuracy',
            'horizontal_accuracy': 'accuracy',
            
            # Browser fields
            'url': 'url',
            'link': 'url',
            'website': 'url',
            'visit_count': 'visit_count',
            'title': 'title',
            'bookmark': 'bookmark',
            'cookie': 'cookie',
            
            # File fields
            'filename': 'filename',
            'file': 'filename',
            'name': 'filename',
            'source_file': 'source_file',
            'file_path': 'file_path',
            'size': 'file_size',
            'hash': 'file_hash',
            
            # Contact fields
            'display_name': 'display_name',
            'name': 'display_name',
            'email': 'email',
            'email_address': 'email',
            'mail': 'email',
            
            # Transaction fields
            'amount': 'amount',
            'value': 'amount',
            'price': 'amount',
            'cost': 'amount',
            'method': 'payment_method',
            
            # System fields
            'app_name': 'app_name',
            'package_name': 'package_name',
            'version': 'version',
            'permissions': 'permissions',
            'battery_usage': 'battery_usage',
            'data_usage': 'data_usage',
            
            # WiFi fields
            'ssid': 'wifi_ssid',
            'bssid': 'wifi_bssid',
            'wifi_name': 'wifi_ssid',
            'wifi_password': 'wifi_password',
            'security': 'wifi_security',
            
            # Bluetooth fields
            'bluetooth_name': 'bluetooth_name',
            'bluetooth_address': 'bluetooth_address',
            'device_type': 'device_type',
            'connection_status': 'connection_status',
            
            # Media fields
            'mime_type': 'mime_type',
            'file_extension': 'file_extension',
            'created_time': 'created_time',
            'modified_time': 'modified_time',
            'file_size': 'file_size',
            'width': 'image_width',
            'height': 'image_height',
            'duration_ms': 'media_duration',
            
            # Notification fields
            'notification_text': 'notification_text',
            'app_package': 'app_package',
            'notification_time': 'notification_time',
            'notification_id': 'notification_id',
            
            # Usage stats fields
            'usage_time': 'usage_time',
            'launch_count': 'launch_count',
            'last_used': 'last_used',
            'foreground_time': 'foreground_time',
            'background_time': 'background_time'
        }
    
    def map_headers(self, headers: List[str]) -> Dict[str, str]:
        """
        Map TSV headers to standardized JSON keys.
        
        Args:
            headers: List of TSV headers
            
        Returns:
            Dictionary mapping original headers to standardized keys
        """
        header_mapping = {}
        
        for header in headers:
            if not header or not header.strip():
                continue
                
            # Clean and normalize header
            clean_header = self._clean_header(header)
            
            # Find best match
            mapped_key = self._find_best_match(clean_header)
            if mapped_key:
                header_mapping[header] = mapped_key
            else:
                # Use cleaned header as fallback
                header_mapping[header] = clean_header
        
        return header_mapping
    
    def _clean_header(self, header: str) -> str:
        """Clean and normalize header name."""
        # Remove extra whitespace
        clean = header.strip()
        
        # Replace spaces and special characters with underscores
        clean = re.sub(r'[^\w\s]', '_', clean)
        clean = re.sub(r'\s+', '_', clean)
        
        # Convert to lowercase
        clean = clean.lower()
        
        # Remove multiple underscores
        clean = re.sub(r'_+', '_', clean)
        
        # Remove leading/trailing underscores
        clean = clean.strip('_')
        
        return clean
    
    def _find_best_match(self, clean_header: str) -> Optional[str]:
        """Find the best matching standardized key for a header."""
        # Direct match
        if clean_header in self.header_mappings:
            return self.header_mappings[clean_header]
        
        # Partial match
        for key, value in self.header_mappings.items():
            if key in clean_header or clean_header in key:
                return value
        
        # Fuzzy match for common patterns
        fuzzy_matches = {
            'date': 'timestamp',
            'time': 'timestamp',
            'phone': 'phone_number',
            'number': 'phone_number',
            'msg': 'message_text',
            'text': 'message_text',
            'body': 'message_text',
            'lat': 'latitude',
            'lng': 'longitude',
            'lon': 'longitude',
            'addr': 'location',
            'loc': 'location',
            'id': 'message_id',
            'thread': 'thread_id',
            'dur': 'duration',
            'type': 'call_type',
            'read': 'read_status',
            'error': 'error_code',
            'service': 'service_center',
            'center': 'service_center',
            'wifi': 'wifi_ssid',
            'ssid': 'wifi_ssid',
            'bssid': 'wifi_bssid',
            'bluetooth': 'bluetooth_name',
            'bt': 'bluetooth_name',
            'app': 'app_name',
            'package': 'package_name',
            'perm': 'permissions',
            'battery': 'battery_usage',
            'data': 'data_usage',
            'usage': 'usage_time',
            'launch': 'launch_count',
            'foreground': 'foreground_time',
            'background': 'background_time',
            'notification': 'notification_text',
            'notif': 'notification_text',
            'mime': 'mime_type',
            'ext': 'file_extension',
            'size': 'file_size',
            'width': 'image_width',
            'height': 'image_height',
            'duration': 'media_duration'
        }
        
        for pattern, value in fuzzy_matches.items():
            if pattern in clean_header:
                return value
        
        return None
    
    def get_field_mapping(self, data_type: str) -> Dict[str, str]:
        """
        Get field mappings for specific data type.
        
        Args:
            data_type: Type of data (call, message, contact, etc.)
            
        Returns:
            Dictionary of field mappings
        """
        field_mappings = {
            'call': {
                'timestamp': 'timestamp',
                'phone_number': 'phone_number',
                'duration': 'duration',
                'call_type': 'call_type',
                'direction': 'direction',
                'location': 'location',
                'country': 'country',
                'transcription': 'transcription',
                'deleted': 'deleted',
                'source_file': 'source_file'
            },
            'message': {
                'timestamp': 'timestamp',
                'message_id': 'message_id',
                'thread_id': 'thread_id',
                'phone_number': 'phone_number',
                'contact_id': 'contact_id',
                'date_sent': 'date_sent',
                'read': 'read_status',
                'message_type': 'message_type',
                'message_text': 'message_text',
                'service_center': 'service_center',
                'error_code': 'error_code',
                'source_file': 'source_file'
            },
            'contact': {
                'display_name': 'display_name',
                'phone_number': 'phone_number',
                'email': 'email',
                'contact_id': 'contact_id',
                'source_file': 'source_file'
            },
            'location': {
                'timestamp': 'timestamp',
                'latitude': 'latitude',
                'longitude': 'longitude',
                'altitude': 'altitude',
                'speed': 'speed',
                'course': 'course',
                'bearing': 'bearing',
                'accuracy': 'accuracy',
                'location_mode': 'location_mode',
                'wifi_ssid': 'wifi_ssid',
                'wifi_bssid': 'wifi_bssid',
                'source_file': 'source_file'
            },
            'browser': {
                'url': 'url',
                'title': 'title',
                'timestamp': 'timestamp',
                'visit_count': 'visit_count',
                'source_file': 'source_file'
            },
            'media': {
                'filename': 'filename',
                'file_path': 'file_path',
                'file_size': 'file_size',
                'mime_type': 'mime_type',
                'created_time': 'created_time',
                'modified_time': 'modified_time',
                'width': 'image_width',
                'height': 'image_height',
                'duration': 'media_duration',
                'source_file': 'source_file'
            },
            'system': {
                'app_name': 'app_name',
                'package_name': 'package_name',
                'version': 'version',
                'permissions': 'permissions',
                'battery_usage': 'battery_usage',
                'data_usage': 'data_usage',
                'usage_time': 'usage_time',
                'launch_count': 'launch_count',
                'last_used': 'last_used',
                'source_file': 'source_file'
            }
        }
        
        return field_mappings.get(data_type, {})
    
    def map_row_data(self, row: Dict[str, str], header_mapping: Dict[str, str], 
                    data_type: str) -> Dict[str, Any]:
        """
        Map row data using header mapping and data type specific mappings.
        
        Args:
            row: TSV row data
            header_mapping: Header to key mapping
            data_type: Type of data
            
        Returns:
            Mapped row data
        """
        mapped_data = {}
        
        # Map all fields using header mapping
        for original_header, value in row.items():
            if not value or not value.strip():
                continue
                
            # Get mapped key
            mapped_key = header_mapping.get(original_header, original_header)
            
            # Clean and store value
            cleaned_value = value.strip()
            if cleaned_value:
                mapped_data[mapped_key] = cleaned_value
        
        # Apply data type specific mappings
        field_mapping = self.get_field_mapping(data_type)
        for field, standard_key in field_mapping.items():
            if field in mapped_data:
                mapped_data[standard_key] = mapped_data[field]
        
        return mapped_data


def main():
    """Test the enhanced header mapper."""
    mapper = EnhancedHeaderMapper()
    
    # Test headers from SMS file
    test_headers = [
        'Date', 'MSG ID', 'Thread ID', 'Address', 'Contact ID', 
        'Date sent', 'Read', 'Type', 'Body', 'Service Center', 'Error code'
    ]
    
    print("Original headers:", test_headers)
    print("Mapped headers:", mapper.map_headers(test_headers))
    
    # Test row mapping
    test_row = {
        'Date': '2024-01-27 14:06:13',
        'MSG ID': '2',
        'Thread ID': '3',
        'Address': '32665',
        'Contact ID': '',
        'Date sent': '2024-01-27 14:06:11',
        'Read': '1',
        'Type': 'Received',
        'Body': '946663 is your Facebook confirmation code',
        'Service Center': '6502531234',
        'Error code': '0'
    }
    
    header_mapping = mapper.map_headers(test_headers)
    mapped_data = mapper.map_row_data(test_row, header_mapping, 'message')
    
    print("\nTest row mapping:")
    for key, value in mapped_data.items():
        print(f"  {key}: {value}")


if __name__ == '__main__':
    main()
