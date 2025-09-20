"""
Data Cleaner Utility
====================

Cleans and normalizes data from TSV files.
"""

import re
import html
from typing import Optional, Union, List, Dict, Any


class DataCleaner:
    """Cleans and normalizes data from TSV files."""
    
    def __init__(self):
        """Initialize the data cleaner."""
        # Common HTML entities
        self.html_entities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&nbsp;': ' ',
            '&copy;': '©',
            '&reg;': '®',
            '&trade;': '™',
        }
        
        # Phone number patterns for normalization
        self.phone_patterns = [
            r'\+?(\d{1,3})[-.\s]?(\d{1,4})[-.\s]?(\d{1,4})[-.\s]?(\d{1,9})',
            r'\((\d{3})\)\s?(\d{3})-(\d{4})',
            r'(\d{3})[-.](\d{3})[-.](\d{4})',
        ]
    
    def clean_text(self, text: str) -> str:
        """
        Clean text content.
        
        Args:
            text: Raw text to clean
            
        Returns:
            Cleaned text
        """
        if not text or not isinstance(text, str):
            return ""
        
        # Decode HTML entities
        text = html.unescape(text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove control characters
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Clean up common issues
        text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
        
        # Remove multiple spaces
        text = re.sub(r' +', ' ', text)
        
        return text.strip()
    
    def normalize_phone(self, phone: str) -> Optional[str]:
        """
        Normalize phone number format.
        
        Args:
            phone: Raw phone number string
            
        Returns:
            Normalized phone number or None if invalid
        """
        if not phone or not isinstance(phone, str):
            return None
        
        # Clean the phone number
        phone = re.sub(r'[^\d+]', '', phone.strip())
        
        if not phone:
            return None
        
        # Add + for international numbers
        if len(phone) > 10 and not phone.startswith('+'):
            phone = '+' + phone
        
        # Validate length
        digits = re.sub(r'[^\d]', '', phone)
        if not (7 <= len(digits) <= 15):
            return None
        
        return phone
    
    def normalize_email(self, email: str) -> Optional[str]:
        """
        Normalize email address.
        
        Args:
            email: Raw email string
            
        Returns:
            Normalized email or None if invalid
        """
        if not email or not isinstance(email, str):
            return None
        
        email = email.strip().lower()
        
        # Basic email validation
        if '@' not in email or '.' not in email.split('@')[-1]:
            return None
        
        return email
    
    def normalize_url(self, url: str) -> Optional[str]:
        """
        Normalize URL.
        
        Args:
            url: Raw URL string
            
        Returns:
            Normalized URL or None if invalid
        """
        if not url or not isinstance(url, str):
            return None
        
        url = url.strip()
        
        # Add protocol if missing
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Basic URL validation
        if not re.match(r'https?://[^\s<>"{}|\\^`\[\]]+', url):
            return None
        
        return url
    
    def clean_filename(self, filename: str) -> str:
        """
        Clean filename for safe usage.
        
        Args:
            filename: Raw filename
            
        Returns:
            Cleaned filename
        """
        if not filename or not isinstance(filename, str):
            return ""
        
        # Remove invalid characters
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        
        # Remove control characters
        filename = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', filename)
        
        # Remove extra spaces
        filename = re.sub(r'\s+', ' ', filename)
        
        return filename.strip()
    
    def clean_path(self, path: str) -> str:
        """
        Clean file path.
        
        Args:
            path: Raw file path
            
        Returns:
            Cleaned file path
        """
        if not path or not isinstance(path, str):
            return ""
        
        # Normalize path separators
        path = path.replace('\\', '/')
        
        # Remove double slashes
        path = re.sub(r'/+', '/', path)
        
        # Clean filename part
        parts = path.split('/')
        cleaned_parts = [self.clean_filename(part) for part in parts]
        
        return '/'.join(cleaned_parts)
    
    def extract_numbers(self, text: str) -> List[Union[int, float]]:
        """
        Extract numbers from text.
        
        Args:
            text: Text to extract numbers from
            
        Returns:
            List of extracted numbers
        """
        if not text or not isinstance(text, str):
            return []
        
        # Pattern for numbers (including decimals)
        number_pattern = r'-?\d+\.?\d*'
        matches = re.findall(number_pattern, text)
        
        numbers = []
        for match in matches:
            try:
                if '.' in match:
                    numbers.append(float(match))
                else:
                    numbers.append(int(match))
            except ValueError:
                continue
        
        return numbers
    
    def extract_hashtags(self, text: str) -> List[str]:
        """
        Extract hashtags from text.
        
        Args:
            text: Text to extract hashtags from
            
        Returns:
            List of hashtags
        """
        if not text or not isinstance(text, str):
            return []
        
        hashtag_pattern = r'#\w+'
        return re.findall(hashtag_pattern, text)
    
    def extract_mentions(self, text: str) -> List[str]:
        """
        Extract mentions from text.
        
        Args:
            text: Text to extract mentions from
            
        Returns:
            List of mentions
        """
        if not text or not isinstance(text, str):
            return []
        
        mention_pattern = r'@\w+'
        return re.findall(mention_pattern, text)
    
    def clean_json_string(self, json_str: str) -> str:
        """
        Clean JSON string for safe parsing.
        
        Args:
            json_str: Raw JSON string
            
        Returns:
            Cleaned JSON string
        """
        if not json_str or not isinstance(json_str, str):
            return ""
        
        # Remove control characters that might break JSON
        json_str = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', json_str)
        
        # Fix common JSON issues
        json_str = json_str.replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
        
        return json_str.strip()
    
    def normalize_boolean(self, value: Union[str, bool, int]) -> Optional[bool]:
        """
        Normalize boolean values.
        
        Args:
            value: Value to normalize
            
        Returns:
            Boolean value or None if not convertible
        """
        if isinstance(value, bool):
            return value
        
        if isinstance(value, int):
            return bool(value)
        
        if isinstance(value, str):
            value = value.strip().lower()
            if value in ('true', '1', 'yes', 'on', 'enabled'):
                return True
            elif value in ('false', '0', 'no', 'off', 'disabled'):
                return False
        
        return None
    
    def clean_whitespace(self, text: str) -> str:
        """
        Clean whitespace in text.
        
        Args:
            text: Text to clean
            
        Returns:
            Text with normalized whitespace
        """
        if not text or not isinstance(text, str):
            return ""
        
        # Replace all whitespace with single space
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def remove_duplicates(self, items: List[Any]) -> List[Any]:
        """
        Remove duplicates from list while preserving order.
        
        Args:
            items: List of items
            
        Returns:
            List with duplicates removed
        """
        if not items:
            return []
        
        seen = set()
        result = []
        
        for item in items:
            if item not in seen:
                seen.add(item)
                result.append(item)
        
        return result
    
    def clean_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Clean all string values in a dictionary.
        
        Args:
            data: Dictionary to clean
            
        Returns:
            Cleaned dictionary
        """
        if not isinstance(data, dict):
            return data
        
        cleaned = {}
        for key, value in data.items():
            if isinstance(value, str):
                cleaned[key] = self.clean_text(value)
            elif isinstance(value, dict):
                cleaned[key] = self.clean_dict(value)
            elif isinstance(value, list):
                cleaned[key] = [self.clean_text(item) if isinstance(item, str) else item 
                               for item in value]
            else:
                cleaned[key] = value
        
        return cleaned

