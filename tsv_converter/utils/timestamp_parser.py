"""
Timestamp Parser Utility
========================

Handles parsing of various timestamp formats found in TSV files.
"""

import re
from datetime import datetime
from typing import Optional, Union
import dateutil.parser


class TimestampParser:
    """Parser for various timestamp formats."""
    
    def __init__(self):
        """Initialize the timestamp parser."""
        self.formats = [
            # ISO formats
            '%Y-%m-%dT%H:%M:%SZ',
            '%Y-%m-%dT%H:%M:%S.%fZ',
            '%Y-%m-%dT%H:%M:%S.%f%z',
            '%Y-%m-%dT%H:%M:%S%z',
            
            # Standard formats
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d %H:%M:%S.%f',
            '%Y-%m-%d %H:%M:%S.%f%z',
            '%Y-%m-%d %H:%M:%S%z',
            
            # Date only
            '%Y-%m-%d',
            '%m/%d/%Y',
            '%d/%m/%Y',
            
            # Custom formats
            '%Y-%m-%d %H:%M:%S.%f%z',
            '%Y-%m-%d %H:%M:%S.%f+00:00',
        ]
    
    def parse_timestamp(self, timestamp_str: str) -> Optional[str]:
        """
        Parse a timestamp string to ISO format.
        
        Args:
            timestamp_str: Timestamp string to parse
            
        Returns:
            ISO formatted timestamp string or None if parsing fails
        """
        if not timestamp_str or not timestamp_str.strip():
            return None
        
        timestamp_str = timestamp_str.strip()
        
        # Try dateutil parser first (most flexible)
        try:
            dt = dateutil.parser.parse(timestamp_str)
            return dt.isoformat()
        except (ValueError, TypeError):
            pass
        
        # Try manual format matching
        for fmt in self.formats:
            try:
                dt = datetime.strptime(timestamp_str, fmt)
                return dt.isoformat()
            except ValueError:
                continue
        
        # Try to clean and parse
        cleaned = self._clean_timestamp(timestamp_str)
        if cleaned != timestamp_str:
            return self.parse_timestamp(cleaned)
        
        return None
    
    def _clean_timestamp(self, timestamp_str: str) -> str:
        """
        Clean timestamp string for better parsing.
        
        Args:
            timestamp_str: Raw timestamp string
            
        Returns:
            Cleaned timestamp string
        """
        # Remove extra whitespace
        cleaned = re.sub(r'\s+', ' ', timestamp_str.strip())
        
        # Handle common issues
        cleaned = cleaned.replace('  ', ' ')
        
        # Handle timezone formats
        cleaned = re.sub(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\.(\d{6})\+00:00', 
                        r'\1.\2+00:00', cleaned)
        
        # Handle missing timezone
        if re.match(r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$', cleaned):
            cleaned += 'Z'
        
        return cleaned
    
    def is_valid_timestamp(self, timestamp_str: str) -> bool:
        """
        Check if a string is a valid timestamp.
        
        Args:
            timestamp_str: String to check
            
        Returns:
            True if valid timestamp, False otherwise
        """
        return self.parse_timestamp(timestamp_str) is not None
    
    def extract_timestamps_from_text(self, text: str) -> list:
        """
        Extract all timestamps from a text string.
        
        Args:
            text: Text to search for timestamps
            
        Returns:
            List of ISO formatted timestamps
        """
        # Common timestamp patterns
        patterns = [
            r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?',
            r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?',
            r'\d{4}-\d{2}-\d{2}',
            r'\d{2}/\d{2}/\d{4}',
            r'\d{2}-\d{2}-\d{4}',
        ]
        
        timestamps = []
        for pattern in patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                parsed = self.parse_timestamp(match)
                if parsed:
                    timestamps.append(parsed)
        
        return list(set(timestamps))  # Remove duplicates
    
    def normalize_timestamp(self, timestamp_str: str, target_format: str = 'iso') -> Optional[str]:
        """
        Normalize timestamp to a specific format.
        
        Args:
            timestamp_str: Input timestamp string
            target_format: Target format ('iso', 'unix', 'readable')
            
        Returns:
            Normalized timestamp string
        """
        parsed = self.parse_timestamp(timestamp_str)
        if not parsed:
            return None
        
        dt = datetime.fromisoformat(parsed.replace('Z', '+00:00'))
        
        if target_format == 'iso':
            return dt.isoformat()
        elif target_format == 'unix':
            return str(int(dt.timestamp()))
        elif target_format == 'readable':
            return dt.strftime('%Y-%m-%d %H:%M:%S')
        else:
            return parsed

