"""
Tests for data cleaner utility.
"""

import pytest
from tsv_converter.utils.data_cleaner import DataCleaner


class TestDataCleaner:
    """Test cases for DataCleaner."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.cleaner = DataCleaner()
    
    def test_clean_text(self):
        """Test text cleaning."""
        test_cases = [
            ("  Hello   World  ", "Hello World"),
            ("Hello\nWorld", "Hello World"),
            ("Hello\tWorld", "Hello World"),
            ("Hello\rWorld", "Hello World"),
            ("<p>Hello</p>", "Hello"),
            ("&amp; &lt; &gt;", "& < >"),
            ("", ""),
            (None, ""),
        ]
        
        for input_text, expected in test_cases:
            result = self.cleaner.clean_text(input_text)
            assert result == expected
    
    def test_normalize_phone(self):
        """Test phone number normalization."""
        test_cases = [
            ("+91 9820 123 456", "+919820123456"),
            ("(919) 579-0479", "(919)579-0479"),
            ("919-391-2507", "919-391-2507"),
            ("1234567890", "+1234567890"),
            ("", None),
            (None, None),
            ("abc", None),
        ]
        
        for input_phone, expected in test_cases:
            result = self.cleaner.normalize_phone(input_phone)
            assert result == expected
    
    def test_normalize_email(self):
        """Test email normalization."""
        test_cases = [
            ("Support@Example.COM", "support@example.com"),
            ("  user@domain.com  ", "user@domain.com"),
            ("", None),
            (None, None),
            ("invalid", None),
        ]
        
        for input_email, expected in test_cases:
            result = self.cleaner.normalize_email(input_email)
            assert result == expected
    
    def test_normalize_url(self):
        """Test URL normalization."""
        test_cases = [
            ("example.com", "https://example.com"),
            ("www.example.com", "https://www.example.com"),
            ("https://example.com", "https://example.com"),
            ("", None),
            (None, None),
            ("invalid", None),
        ]
        
        for input_url, expected in test_cases:
            result = self.cleaner.normalize_url(input_url)
            assert result == expected
    
    def test_clean_filename(self):
        """Test filename cleaning."""
        test_cases = [
            ("file<name>.txt", "file_name_.txt"),
            ("file/name.txt", "file_name.txt"),
            ("file:name.txt", "file_name.txt"),
            ("file|name.txt", "file_name.txt"),
            ("file?name.txt", "file_name.txt"),
            ("file*name.txt", "file_name.txt"),
            ("  file name.txt  ", "file name.txt"),
        ]
        
        for input_filename, expected in test_cases:
            result = self.cleaner.clean_filename(input_filename)
            assert result == expected
    
    def test_clean_path(self):
        """Test path cleaning."""
        test_cases = [
            ("C:\\Users\\file.txt", "C:/Users/file.txt"),
            ("path//to//file.txt", "path/to/file.txt"),
            ("path/to/file<name>.txt", "path/to/file_name_.txt"),
        ]
        
        for input_path, expected in test_cases:
            result = self.cleaner.clean_path(input_path)
            assert result == expected
    
    def test_extract_numbers(self):
        """Test number extraction."""
        test_cases = [
            ("Price: $123.45", [123.45]),
            ("Count: 10 items", [10]),
            ("Range: 1-100", [1, 100]),
            ("No numbers", []),
            ("", []),
            (None, []),
        ]
        
        for input_text, expected in test_cases:
            result = self.cleaner.extract_numbers(input_text)
            assert result == expected
    
    def test_extract_hashtags(self):
        """Test hashtag extraction."""
        test_cases = [
            ("#hashtag1 #hashtag2", ["#hashtag1", "#hashtag2"]),
            ("No hashtags", []),
            ("", []),
            (None, []),
        ]
        
        for input_text, expected in test_cases:
            result = self.cleaner.extract_hashtags(input_text)
            assert result == expected
    
    def test_extract_mentions(self):
        """Test mention extraction."""
        test_cases = [
            ("@user1 @user2", ["@user1", "@user2"]),
            ("No mentions", []),
            ("", []),
            (None, []),
        ]
        
        for input_text, expected in test_cases:
            result = self.cleaner.extract_mentions(input_text)
            assert result == expected
    
    def test_clean_json_string(self):
        """Test JSON string cleaning."""
        test_cases = [
            ('{"key": "value"}', '{"key": "value"}'),
            ('{"key": "value\nwith\nnewlines"}', '{"key": "value\\nwith\\nnewlines"}'),
            ('{"key": "value\rwith\rreturns"}', '{"key": "value\\rwith\\rreturns"}'),
            ('{"key": "value\twith\ttabs"}', '{"key": "value\\twith\\ttabs"}'),
        ]
        
        for input_json, expected in test_cases:
            result = self.cleaner.clean_json_string(input_json)
            assert result == expected
    
    def test_normalize_boolean(self):
        """Test boolean normalization."""
        test_cases = [
            (True, True),
            (False, False),
            (1, True),
            (0, False),
            ("true", True),
            ("false", False),
            ("1", True),
            ("0", False),
            ("yes", True),
            ("no", False),
            ("on", True),
            ("off", False),
            ("enabled", True),
            ("disabled", False),
            ("invalid", None),
            ("", None),
            (None, None),
        ]
        
        for input_value, expected in test_cases:
            result = self.cleaner.normalize_boolean(input_value)
            assert result == expected
    
    def test_clean_whitespace(self):
        """Test whitespace cleaning."""
        test_cases = [
            ("  Hello   World  ", "Hello World"),
            ("Hello\nWorld", "Hello World"),
            ("Hello\tWorld", "Hello World"),
            ("Hello\rWorld", "Hello World"),
            ("", ""),
            (None, ""),
        ]
        
        for input_text, expected in test_cases:
            result = self.cleaner.clean_whitespace(input_text)
            assert result == expected
    
    def test_remove_duplicates(self):
        """Test duplicate removal."""
        test_cases = [
            ([1, 2, 3, 2, 1], [1, 2, 3]),
            (["a", "b", "a", "c"], ["a", "b", "c"]),
            ([], []),
            (None, []),
        ]
        
        for input_list, expected in test_cases:
            result = self.cleaner.remove_duplicates(input_list)
            assert result == expected
    
    def test_clean_dict(self):
        """Test dictionary cleaning."""
        test_cases = [
            ({"key1": "  value1  ", "key2": "value2"}, {"key1": "value1", "key2": "value2"}),
            ({"key1": "<p>value1</p>", "key2": "value2"}, {"key1": "value1", "key2": "value2"}),
            ({"key1": "&amp;value1", "key2": "value2"}, {"key1": "&value1", "key2": "value2"}),
            ({}, {}),
            (None, None),
        ]
        
        for input_dict, expected in test_cases:
            result = self.cleaner.clean_dict(input_dict)
            assert result == expected

