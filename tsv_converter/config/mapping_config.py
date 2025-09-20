"""
Configuration for TSV to JSON mapping.
"""

import yaml
import os
from typing import Dict, Any, Optional


def load_config(config_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Load configuration from file or return default configuration.
    
    Args:
        config_path: Path to configuration file
        
    Returns:
        Configuration dictionary
    """
    if config_path and os.path.exists(config_path):
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except Exception as e:
            print(f"Warning: Could not load config from {config_path}: {e}")
            print("Using default configuration.")
    
    return get_default_config()


def get_default_config() -> Dict[str, Any]:
    """
    Get default configuration.
    
    Returns:
        Default configuration dictionary
    """
    return {
        'header_variations': {
            'timestamp': [
                'Call Date', 'Date', 'Timestamp', 'Time', 'Created Date', 
                'Last Access Date', 'Last Visit Time', 'Added Date'
            ],
            'phone_number': [
                'Phone Number', 'Address', 'Phone', 'Number', 'Partner',
                'Phone Account Address', 'From', 'To'
            ],
            'duration': [
                'Duration', 'Duration in Secs', 'Duration_sec', 'Call Duration'
            ],
            'message_text': [
                'Body', 'Message', 'Text', 'Content', 'Subject', 'Title'
            ],
            'url': [
                'URL', 'Link', 'Address', 'Website'
            ],
            'location': [
                'Location', 'Address', 'Place', 'Country', 'City'
            ],
            'latitude': [
                'Latitude', 'Lat', 'Latitude', 'Lat_coord'
            ],
            'longitude': [
                'Longitude', 'Lon', 'Lng', 'Lng_coord'
            ],
            'filename': [
                'Filename', 'File', 'Name', 'Source File'
            ],
            'email': [
                'Email', 'Email Address', 'Mail'
            ],
            'amount': [
                'Amount', 'Value', 'Price', 'Cost'
            ],
            'message_id': [
                'MSG ID', 'Message ID', 'ID'
            ],
            'thread_id': [
                'Thread ID', 'Thread'
            ],
            'source_path': [
                'Source File', 'Source Path', 'File Path'
            ]
        },
        
        'data_type_indicators': {
            'call': {
                'required': ['timestamp', 'phone_number'],
                'optional': ['duration', 'type', 'direction'],
                'keywords': ['call', 'phone', 'duration', 'incoming', 'outgoing', 'missed', 'rejected']
            },
            'message': {
                'required': ['timestamp', 'message_text'],
                'optional': ['from', 'to', 'thread_id'],
                'keywords': ['message', 'sms', 'text', 'body', 'thread', 'chat', 'msg']
            },
            'contact': {
                'required': ['name', 'phone_number'],
                'optional': ['email', 'display_name'],
                'keywords': ['contact', 'name', 'phone', 'email', 'address', 'display']
            },
            'browser': {
                'required': ['url'],
                'optional': ['title', 'timestamp', 'visit_count'],
                'keywords': ['url', 'history', 'bookmark', 'cookie', 'browser', 'web', 'chrome', 'firefox', 'edge']
            },
            'location': {
                'required': ['latitude', 'longitude'],
                'optional': ['address', 'label', 'timestamp'],
                'keywords': ['latitude', 'longitude', 'address', 'place', 'location', 'coordinates', 'maps']
            },
            'file': {
                'required': ['filename'],
                'optional': ['path', 'size', 'hash'],
                'keywords': ['filename', 'path', 'size', 'hash', 'file', 'download']
            },
            'email': {
                'required': ['subject', 'from', 'to'],
                'optional': ['timestamp', 'body'],
                'keywords': ['subject', 'from', 'to', 'email', 'message', 'body', 'gmail']
            },
            'transaction': {
                'required': ['amount', 'timestamp'],
                'optional': ['from', 'to', 'method'],
                'keywords': ['amount', 'transaction', 'payment', 'money', 'currency', 'upi']
            }
        },
        
        'timestamp_formats': [
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%dT%H:%M:%SZ',
            '%Y-%m-%dT%H:%M:%S.%fZ',
            '%Y-%m-%dT%H:%M:%S.%f%z',
            '%Y-%m-%dT%H:%M:%S%z',
            '%Y-%m-%d %H:%M:%S.%f',
            '%Y-%m-%d %H:%M:%S.%f%z',
            '%Y-%m-%d %H:%M:%S%z',
            '%Y-%m-%d',
            '%m/%d/%Y',
            '%d/%m/%Y',
            '%Y-%m-%d %H:%M:%S.%f%z',
            '%Y-%m-%d %H:%M:%S.%f+00:00'
        ],
        
        'entity_patterns': {
            'phone': [
                r'\+?[1-9]\d{1,14}',
                r'\(\d{3}\)\s?\d{3}-\d{4}',
                r'\d{3}-\d{3}-\d{4}',
                r'\d{3}\.\d{3}\.\d{4}',
                r'\d{10}',
                r'\+?\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}'
            ],
            'email': [
                r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
            ],
            'url': [
                r'https?://[^\s<>"{}|\\^`\[\]]+',
                r'www\.[^\s<>"{}|\\^`\[\]]+',
                r'[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[^\s<>"{}|\\^`\[\]]*)?'
            ],
            'ip_address': [
                r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b',
                r'\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b'
            ],
            'upi': [
                r'[a-zA-Z0-9._%+-]+@[a-zA-Z]{2,}',
                r'[a-zA-Z0-9._%+-]+\.[a-zA-Z]{2,}'
            ],
            'ifsc': [
                r'[A-Z]{4}0[A-Z0-9]{6}'
            ],
            'bitcoin': [
                r'\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b',
                r'\bbc1[a-z0-9]{39,59}\b'
            ],
            'coordinates': [
                r'-?\d{1,3}\.\d+,\s*-?\d{1,3}\.\d+',
                r'-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+'
            ]
        },
        
        'file_mappings': {
            'Call Logs.tsv': {
                'type': 'call',
                'data_type': 'call_logs',
                'mapper': 'CallLogsMapper'
            },
            'sms messages.tsv': {
                'type': 'message',
                'data_type': 'chat',
                'channel': 'sms',
                'mapper': 'MessagesMapper'
            },
            'mms messages.tsv': {
                'type': 'message',
                'data_type': 'chat',
                'channel': 'mms',
                'mapper': 'MessagesMapper'
            },
            'Contacts.tsv': {
                'type': 'contact',
                'data_type': 'contacts',
                'mapper': 'ContactsMapper'
            },
            'Chrome - Web History.tsv': {
                'type': 'browser',
                'data_type': 'web_history',
                'mapper': 'BrowserMapper'
            },
            'Chrome - Cookies.tsv': {
                'type': 'browser',
                'data_type': 'cookies',
                'mapper': 'BrowserMapper'
            },
            'Chrome - Bookmarks.tsv': {
                'type': 'browser',
                'data_type': 'bookmarks',
                'mapper': 'BrowserMapper'
            },
            'Google Maps Label Places.tsv': {
                'type': 'location',
                'data_type': 'places',
                'mapper': 'LocationMapper'
            }
        },
        
        'conversion_settings': {
            'max_file_size_mb': 100,
            'batch_size': 1000,
            'encoding': 'utf-8',
            'error_handling': 'continue',
            'validation': True,
            'logging_level': 'INFO'
        }
    }


def save_config(config: Dict[str, Any], config_path: str):
    """
    Save configuration to file.
    
    Args:
        config: Configuration dictionary
        config_path: Path to save configuration
    """
    try:
        with open(config_path, 'w', encoding='utf-8') as f:
            yaml.dump(config, f, default_flow_style=False, indent=2)
    except Exception as e:
        print(f"Error saving config to {config_path}: {e}")


def create_sample_config(config_path: str):
    """
    Create a sample configuration file.
    
    Args:
        config_path: Path to save sample configuration
    """
    config = get_default_config()
    save_config(config, config_path)
    print(f"Sample configuration created at {config_path}")

