"""
Tests for entity extractor utility.
"""

import pytest
from tsv_converter.utils.entity_extractor import EntityExtractor


class TestEntityExtractor:
    """Test cases for EntityExtractor."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.extractor = EntityExtractor()
    
    def test_extract_phone_numbers(self):
        """Test phone number extraction."""
        test_cases = [
            ("Call me at +919820123456 or 919004567890", ["+919820123456", "919004567890"]),
            ("Phone: (919) 579-0479", ["(919) 579-0479"]),
            ("Contact: 919-391-2507", ["919-391-2507"]),
            ("No phone numbers here", []),
        ]
        
        for text, expected in test_cases:
            result = self.extractor.extract_phone_numbers(text)
            assert set(result) == set(expected)
    
    def test_extract_emails(self):
        """Test email extraction."""
        test_cases = [
            ("Contact us at support@example.com", ["support@example.com"]),
            ("Email: john.doe@company.co.uk", ["john.doe@company.co.uk"]),
            ("No emails here", []),
        ]
        
        for text, expected in test_cases:
            result = self.extractor.extract_emails(text)
            assert set(result) == set(expected)
    
    def test_extract_urls(self):
        """Test URL extraction."""
        test_cases = [
            ("Visit https://example.com for more info", ["https://example.com"]),
            ("Check www.google.com", ["www.google.com"]),
            ("No URLs here", []),
        ]
        
        for text, expected in test_cases:
            result = self.extractor.extract_urls(text)
            assert set(result) == set(expected)
    
    def test_extract_ip_addresses(self):
        """Test IP address extraction."""
        test_cases = [
            ("Server IP: 192.168.1.1", ["192.168.1.1"]),
            ("IPv6: 2001:db8::1", ["2001:db8::1"]),
            ("No IPs here", []),
        ]
        
        for text, expected in test_cases:
            result = self.extractor.extract_ip_addresses(text)
            assert set(result) == set(expected)
    
    def test_extract_financial_info(self):
        """Test financial information extraction."""
        test_cases = [
            ("UPI: user@paytm", {"upi": ["user@paytm"]}),
            ("IFSC: HDFC0001234", {"ifsc": ["HDFC0001234"]}),
            ("Bitcoin: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", {"bitcoin": ["1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"]}),
            ("No financial info", {}),
        ]
        
        for text, expected in test_cases:
            result = self.extractor.extract_financial_info(text)
            assert result == expected
    
    def test_extract_location_info(self):
        """Test location information extraction."""
        test_cases = [
            ("Coordinates: 35.734602, -78.636654", {"coordinates": ["35.734602, -78.636654"]}),
            ("Address: 121 E Tryon Rd, Raleigh, NC 27603", {"addresses": ["121 E Tryon Rd, Raleigh, NC 27603"]}),
            ("No location info", {}),
        ]
        
        for text, expected in test_cases:
            result = self.extractor.extract_location_info(text)
            assert result == expected
    
    def test_extract_entities(self):
        """Test general entity extraction."""
        text = "Call +919820123456 or email support@example.com or visit https://example.com"
        entities = self.extractor.extract_entities(text)
        
        assert "phone" in entities
        assert "email" in entities
        assert "url" in entities
        assert "+919820123456" in entities["phone"]
        assert "support@example.com" in entities["email"]
        assert "https://example.com" in entities["url"]
    
    def test_extract_entities_by_type(self):
        """Test extracting specific entity types."""
        text = "Call +919820123456 or email support@example.com"
        entities = self.extractor.extract_entities_by_type(text, ["phone", "email"])
        
        assert "phone" in entities
        assert "email" in entities
        assert "url" not in entities
    
    def test_get_entity_count(self):
        """Test entity counting."""
        text = "Call +919820123456 or +919004567890 or email support@example.com"
        counts = self.extractor.get_entity_count(text)
        
        assert counts["phone"] == 2
        assert counts["email"] == 1
        assert counts.get("url", 0) == 0
    
    def test_clean_entity_phone(self):
        """Test phone number cleaning."""
        test_cases = [
            ("+91 9820 123 456", "+919820123456"),
            ("(919) 579-0479", "(919)579-0479"),
            ("919-391-2507", "919-391-2507"),
        ]
        
        for input_phone, expected in test_cases:
            result = self.extractor._clean_entity("phone", input_phone)
            assert result == expected
    
    def test_clean_entity_email(self):
        """Test email cleaning."""
        test_cases = [
            ("Support@Example.COM", "support@example.com"),
            ("  user@domain.com  ", "user@domain.com"),
        ]
        
        for input_email, expected in test_cases:
            result = self.extractor._clean_entity("email", input_email)
            assert result == expected
    
    def test_clean_entity_url(self):
        """Test URL cleaning."""
        test_cases = [
            ("example.com", "https://example.com"),
            ("www.example.com", "https://www.example.com"),
            ("https://example.com", "https://example.com"),
        ]
        
        for input_url, expected in test_cases:
            result = self.extractor._clean_entity("url", input_url)
            assert result == expected
    
    def test_validate_entity_phone(self):
        """Test phone number validation."""
        valid_cases = ["+919820123456", "919004567890", "(919) 579-0479"]
        invalid_cases = ["123", "abc", "12345678901234567890"]
        
        for phone in valid_cases:
            assert self.extractor._validate_entity("phone", phone) is True
        
        for phone in invalid_cases:
            assert self.extractor._validate_entity("phone", phone) is False
    
    def test_validate_entity_email(self):
        """Test email validation."""
        valid_cases = ["user@example.com", "test.email@domain.co.uk"]
        invalid_cases = ["invalid", "@domain.com", "user@", "user@domain"]
        
        for email in valid_cases:
            assert self.extractor._validate_entity("email", email) is True
        
        for email in invalid_cases:
            assert self.extractor._validate_entity("email", email) is False
    
    def test_validate_entity_url(self):
        """Test URL validation."""
        valid_cases = ["https://example.com", "http://www.google.com"]
        invalid_cases = ["invalid", "ftp://example.com", "not-a-url"]
        
        for url in valid_cases:
            assert self.extractor._validate_entity("url", url) is True
        
        for url in invalid_cases:
            assert self.extractor._validate_entity("url", url) is False
    
    def test_extract_empty_text(self):
        """Test extraction from empty text."""
        result = self.extractor.extract_entities("")
        assert result == {}
        
        result = self.extractor.extract_entities(None)
        assert result == {}
    
    def test_extract_entities_with_special_characters(self):
        """Test extraction with special characters."""
        text = "Call +91-9820-123-456 or email user+tag@example.com"
        entities = self.extractor.extract_entities(text)
        
        assert "phone" in entities
        assert "email" in entities

