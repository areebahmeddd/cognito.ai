"""
Entity Extractor Utility
========================

Extracts entities like phone numbers, emails, URLs, etc. from text content.
"""

import re
from typing import Dict, List, Set, Optional
from urllib.parse import urlparse


class EntityExtractor:
    """Extracts various entities from text content."""
    
    def __init__(self):
        """Initialize the entity extractor with regex patterns."""
        self.patterns = {
            'phone': [
                r'\+?[1-9]\d{1,14}',  # International format
                r'\(\d{3}\)\s?\d{3}-\d{4}',  # US format (123) 456-7890
                r'\d{3}-\d{3}-\d{4}',  # US format 123-456-7890
                r'\d{3}\.\d{3}\.\d{4}',  # US format 123.456.7890
                r'\d{10}',  # 10-digit number
                r'\+?\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}',  # Flexible format
            ],
            'email': [
                r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
            ],
            'url': [
                r'https?://[^\s<>"{}|\\^`\[\]]+',
                r'www\.[^\s<>"{}|\\^`\[\]]+',
                r'[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[^\s<>"{}|\\^`\[\]]*)?',
            ],
            'ip_address': [
                r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b',
                r'\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b',  # IPv6
            ],
            'credit_card': [
                r'\b(?:\d{4}[-\s]?){3}\d{4}\b',
            ],
            'ssn': [
                r'\b\d{3}-\d{2}-\d{4}\b',
                r'\b\d{9}\b',
            ],
            'upi': [
                r'[a-zA-Z0-9._%+-]+@[a-zA-Z]{2,}',
                r'[a-zA-Z0-9._%+-]+\.[a-zA-Z]{2,}',
            ],
            'ifsc': [
                r'[A-Z]{4}0[A-Z0-9]{6}',
            ],
            'bitcoin': [
                r'\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b',
                r'\bbc1[a-z0-9]{39,59}\b',
            ],
            'coordinates': [
                r'-?\d{1,3}\.\d+,\s*-?\d{1,3}\.\d+',
                r'-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+',
            ],
        }
        
        # Compile regex patterns for efficiency
        self.compiled_patterns = {}
        for entity_type, patterns in self.patterns.items():
            self.compiled_patterns[entity_type] = [
                re.compile(pattern, re.IGNORECASE) for pattern in patterns
            ]
    
    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """
        Extract all entities from text.
        
        Args:
            text: Text to extract entities from
            
        Returns:
            Dictionary mapping entity types to lists of found entities
        """
        if not text or not text.strip():
            return {}
        
        entities = {}
        
        for entity_type, patterns in self.compiled_patterns.items():
            found_entities = set()
            
            for pattern in patterns:
                matches = pattern.findall(text)
                for match in matches:
                    # Clean and validate the match
                    cleaned = self._clean_entity(entity_type, match)
                    if cleaned and self._validate_entity(entity_type, cleaned):
                        found_entities.add(cleaned)
            
            if found_entities:
                entities[entity_type] = list(found_entities)
        
        return entities
    
    def extract_phone_numbers(self, text: str) -> List[str]:
        """Extract phone numbers from text."""
        entities = self.extract_entities(text)
        return entities.get('phone', [])
    
    def extract_emails(self, text: str) -> List[str]:
        """Extract email addresses from text."""
        entities = self.extract_entities(text)
        return entities.get('email', [])
    
    def extract_urls(self, text: str) -> List[str]:
        """Extract URLs from text."""
        entities = self.extract_entities(text)
        return entities.get('url', [])
    
    def extract_ip_addresses(self, text: str) -> List[str]:
        """Extract IP addresses from text."""
        entities = self.extract_entities(text)
        return entities.get('ip_address', [])
    
    def extract_financial_info(self, text: str) -> Dict[str, List[str]]:
        """Extract financial information from text."""
        entities = self.extract_entities(text)
        financial = {}
        
        for key in ['upi', 'ifsc', 'credit_card', 'bitcoin']:
            if key in entities:
                financial[key] = entities[key]
        
        return financial
    
    def extract_location_info(self, text: str) -> Dict[str, List[str]]:
        """Extract location information from text."""
        entities = self.extract_entities(text)
        location = {}
        
        if 'coordinates' in entities:
            location['coordinates'] = entities['coordinates']
        
        # Extract addresses (basic pattern)
        address_pattern = re.compile(r'\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)', re.IGNORECASE)
        addresses = address_pattern.findall(text)
        if addresses:
            location['addresses'] = [addr.strip() for addr in addresses]
        
        return location
    
    def _clean_entity(self, entity_type: str, entity: str) -> str:
        """
        Clean and normalize an extracted entity.
        
        Args:
            entity_type: Type of entity
            entity: Raw entity string
            
        Returns:
            Cleaned entity string
        """
        if not entity:
            return ""
        
        entity = entity.strip()
        
        if entity_type == 'phone':
            # Remove common phone number formatting
            entity = re.sub(r'[^\d+]', '', entity)
            # Add + if it's an international number
            if len(entity) > 10 and not entity.startswith('+'):
                entity = '+' + entity
        
        elif entity_type == 'email':
            # Convert to lowercase
            entity = entity.lower()
        
        elif entity_type == 'url':
            # Ensure protocol
            if not entity.startswith(('http://', 'https://')):
                entity = 'https://' + entity
        
        elif entity_type == 'upi':
            # Convert to lowercase
            entity = entity.lower()
        
        elif entity_type == 'ifsc':
            # Convert to uppercase
            entity = entity.upper()
        
        return entity
    
    def _validate_entity(self, entity_type: str, entity: str) -> bool:
        """
        Validate an extracted entity.
        
        Args:
            entity_type: Type of entity
            entity: Entity string to validate
            
        Returns:
            True if entity is valid, False otherwise
        """
        if not entity:
            return False
        
        if entity_type == 'phone':
            # Check if it's a reasonable phone number length
            digits = re.sub(r'[^\d]', '', entity)
            return 7 <= len(digits) <= 15
        
        elif entity_type == 'email':
            # Basic email validation
            return '@' in entity and '.' in entity.split('@')[-1]
        
        elif entity_type == 'url':
            # Basic URL validation
            try:
                parsed = urlparse(entity)
                return bool(parsed.netloc)
            except:
                return False
        
        elif entity_type == 'ip_address':
            # Basic IP validation
            if '.' in entity:
                parts = entity.split('.')
                return len(parts) == 4 and all(0 <= int(part) <= 255 for part in parts if part.isdigit())
            elif ':' in entity:
                # IPv6 validation (basic)
                return len(entity.split(':')) <= 8
        
        elif entity_type == 'upi':
            # UPI validation
            return '@' in entity and len(entity.split('@')) == 2
        
        elif entity_type == 'ifsc':
            # IFSC validation
            return len(entity) == 11 and entity[:4].isalpha() and entity[4] == '0'
        
        return True
    
    def extract_entities_by_type(self, text: str, entity_types: List[str]) -> Dict[str, List[str]]:
        """
        Extract specific entity types from text.
        
        Args:
            text: Text to extract entities from
            entity_types: List of entity types to extract
            
        Returns:
            Dictionary mapping entity types to lists of found entities
        """
        all_entities = self.extract_entities(text)
        return {entity_type: all_entities.get(entity_type, []) 
                for entity_type in entity_types}
    
    def get_entity_count(self, text: str) -> Dict[str, int]:
        """
        Get count of entities in text.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary mapping entity types to counts
        """
        entities = self.extract_entities(text)
        return {entity_type: len(entity_list) 
                for entity_type, entity_list in entities.items()}

