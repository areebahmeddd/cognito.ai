"""
Data Type Detector Utility
==========================

Automatically detects data types based on TSV headers and sample data.
"""

import re
from typing import Dict, List, Any, Optional, Set
from collections import Counter


class DataTypeDetector:
    """Detects data types from TSV headers and sample data."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the data type detector.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config
        
        # Data type indicators from configuration
        self.type_indicators = config.get('data_type_indicators', {
            'call': {
                'required': ['timestamp', 'phone_number'],
                'optional': ['duration', 'type', 'direction'],
                'keywords': ['call', 'phone', 'duration', 'incoming', 'outgoing', 'missed']
            },
            'message': {
                'required': ['timestamp', 'message_text'],
                'optional': ['from', 'to', 'thread_id'],
                'keywords': ['message', 'sms', 'text', 'body', 'thread', 'chat']
            },
            'contact': {
                'required': ['name', 'phone_number'],
                'optional': ['email', 'display_name'],
                'keywords': ['contact', 'name', 'phone', 'email', 'address']
            },
            'browser': {
                'required': ['url'],
                'optional': ['title', 'timestamp', 'visit_count'],
                'keywords': ['url', 'history', 'bookmark', 'cookie', 'browser', 'web']
            },
            'location': {
                'required': ['latitude', 'longitude'],
                'optional': ['address', 'label', 'timestamp'],
                'keywords': ['latitude', 'longitude', 'address', 'place', 'location', 'coordinates']
            },
            'file': {
                'required': ['filename'],
                'optional': ['path', 'size', 'hash'],
                'keywords': ['filename', 'path', 'size', 'hash', 'file', 'download']
            },
            'email': {
                'required': ['subject', 'from', 'to'],
                'optional': ['timestamp', 'body'],
                'keywords': ['subject', 'from', 'to', 'email', 'message', 'body']
            },
            'transaction': {
                'required': ['amount', 'timestamp'],
                'optional': ['from', 'to', 'method'],
                'keywords': ['amount', 'transaction', 'payment', 'money', 'currency']
            }
        })
        
        # Header patterns for detection
        self.header_patterns = {
            'timestamp': [r'timestamp', r'date', r'time', r'created', r'last_access'],
            'phone_number': [r'phone', r'number', r'address', r'partner'],
            'duration': [r'duration', r'sec', r'seconds'],
            'message_text': [r'body', r'message', r'text', r'content', r'subject'],
            'url': [r'url', r'link', r'website'],
            'latitude': [r'lat', r'latitude'],
            'longitude': [r'lon', r'lng', r'longitude'],
            'filename': [r'filename', r'file', r'name'],
            'email': [r'email', r'mail'],
            'amount': [r'amount', r'value', r'price', r'cost']
        }
    
    def detect_data_type(self, headers: List[str], sample_rows: List[Dict[str, str]]) -> str:
        """
        Detect data type based on headers and sample data.
        
        Args:
            headers: List of column headers
            sample_rows: Sample data rows
            
        Returns:
            Detected data type
        """
        if not headers:
            return 'unknown'
        
        # Convert headers to lowercase for matching
        header_text = ' '.join(headers).lower()
        
        # Calculate scores for each data type
        scores = {}
        for data_type, indicators in self.type_indicators.items():
            score = self._calculate_type_score(data_type, header_text, sample_rows, headers)
            scores[data_type] = score
        
        # Find the best match
        if not scores or max(scores.values()) == 0:
            return 'unknown'
        
        best_type = max(scores, key=scores.get)
        
        # Only return if score is above threshold
        if scores[best_type] >= 2:  # Minimum threshold
            return best_type
        
        return 'unknown'
    
    def _calculate_type_score(self, data_type: str, header_text: str, 
                             sample_rows: List[Dict[str, str]], headers: List[str]) -> int:
        """
        Calculate score for a specific data type.
        
        Args:
            data_type: Type to score
            header_text: Lowercase header text
            sample_rows: Sample data rows
            
        Returns:
            Score for the data type
        """
        indicators = self.type_indicators.get(data_type, {})
        keywords = indicators.get('keywords', [])
        required = indicators.get('required', [])
        
        score = 0
        
        # Score based on keywords in headers
        for keyword in keywords:
            if keyword in header_text:
                score += 1
        
        # Score based on required fields
        for required_field in required:
            if self._has_field(required_field, headers):
                score += 2  # Higher weight for required fields
        
        # Score based on sample data content
        if sample_rows:
            sample_text = ' '.join(str(v) for v in sample_rows[0].values()).lower()
            for keyword in keywords:
                if keyword in sample_text:
                    score += 0.5
        
        return score
    
    def _has_field(self, field_name: str, headers: List[str]) -> bool:
        """
        Check if a field exists in headers.
        
        Args:
            field_name: Field name to check
            headers: List of headers
            
        Returns:
            True if field exists, False otherwise
        """
        patterns = self.header_patterns.get(field_name, [field_name])
        
        for header in headers:
            header_lower = header.lower()
            for pattern in patterns:
                if re.search(pattern, header_lower):
                    return True
        
        return False
    
    def detect_field_types(self, headers: List[str], sample_rows: List[Dict[str, str]]) -> Dict[str, str]:
        """
        Detect field types for each header.
        
        Args:
            headers: List of column headers
            sample_rows: Sample data rows
            
        Returns:
            Dictionary mapping headers to field types
        """
        field_types = {}
        
        for header in headers:
            field_type = self._detect_field_type(header, sample_rows)
            field_types[header] = field_type
        
        return field_types
    
    def _detect_field_type(self, header: str, sample_rows: List[Dict[str, str]]) -> str:
        """
        Detect type for a specific field.
        
        Args:
            header: Header name
            sample_rows: Sample data rows
            
        Returns:
            Detected field type
        """
        header_lower = header.lower()
        
        # Check for timestamp
        if any(re.search(pattern, header_lower) for pattern in self.header_patterns['timestamp']):
            return 'timestamp'
        
        # Check for phone number
        if any(re.search(pattern, header_lower) for pattern in self.header_patterns['phone_number']):
            return 'phone_number'
        
        # Check for duration
        if any(re.search(pattern, header_lower) for pattern in self.header_patterns['duration']):
            return 'duration'
        
        # Check for text content
        if any(re.search(pattern, header_lower) for pattern in self.header_patterns['message_text']):
            return 'text'
        
        # Check for URL
        if any(re.search(pattern, header_lower) for pattern in self.header_patterns['url']):
            return 'url'
        
        # Check for coordinates
        if any(re.search(pattern, header_lower) for pattern in self.header_patterns['latitude']):
            return 'latitude'
        if any(re.search(pattern, header_lower) for pattern in self.header_patterns['longitude']):
            return 'longitude'
        
        # Check for filename
        if any(re.search(pattern, header_lower) for pattern in self.header_patterns['filename']):
            return 'filename'
        
        # Check for email
        if any(re.search(pattern, header_lower) for pattern in self.header_patterns['email']):
            return 'email'
        
        # Check for amount
        if any(re.search(pattern, header_lower) for pattern in self.header_patterns['amount']):
            return 'amount'
        
        # Analyze sample data
        if sample_rows:
            sample_value = sample_rows[0].get(header, '')
            if sample_value:
                return self._analyze_sample_value(sample_value)
        
        return 'text'  # Default to text
    
    def _analyze_sample_value(self, value: str) -> str:
        """
        Analyze sample value to determine type.
        
        Args:
            value: Sample value
            
        Returns:
            Detected type
        """
        value = str(value).strip()
        
        if not value:
            return 'text'
        
        # Check for timestamp patterns
        if re.match(r'\d{4}-\d{2}-\d{2}', value):
            return 'timestamp'
        
        # Check for phone number patterns
        if re.match(r'\+?\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}', value):
            return 'phone_number'
        
        # Check for URL patterns
        if re.match(r'https?://', value) or re.match(r'www\.', value):
            return 'url'
        
        # Check for email patterns
        if '@' in value and '.' in value.split('@')[-1]:
            return 'email'
        
        # Check for numeric patterns
        if re.match(r'^\d+$', value):
            return 'number'
        if re.match(r'^\d+\.\d+$', value):
            return 'decimal'
        
        # Check for coordinate patterns
        if re.match(r'-?\d+\.\d+', value):
            return 'coordinate'
        
        return 'text'
    
    def get_confidence_score(self, data_type: str, headers: List[str], 
                           sample_rows: List[Dict[str, str]]) -> float:
        """
        Get confidence score for data type detection.
        
        Args:
            data_type: Detected data type
            headers: List of headers
            sample_rows: Sample data rows
            
        Returns:
            Confidence score between 0 and 1
        """
        if data_type == 'unknown':
            return 0.0
        
        indicators = self.type_indicators.get(data_type, {})
        required = indicators.get('required', [])
        keywords = indicators.get('keywords', [])
        
        # Calculate confidence based on required fields
        required_score = 0
        for field in required:
            if self._has_field(field, headers):
                required_score += 1
        
        required_confidence = required_score / len(required) if required else 0
        
        # Calculate confidence based on keywords
        header_text = ' '.join(headers).lower()
        keyword_matches = sum(1 for keyword in keywords if keyword in header_text)
        keyword_confidence = keyword_matches / len(keywords) if keywords else 0
        
        # Combine scores
        confidence = (required_confidence * 0.7) + (keyword_confidence * 0.3)
        
        return min(confidence, 1.0)
