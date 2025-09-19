"""Tests for forensic query converter."""

import pytest
from unittest.mock import patch, MagicMock
from app.services.forensic_query_service import ForensicQueryConverter
from app.models.schemas import ForensicQueryResponse


class TestForensicQueryConverter:
    """Test cases for forensic query converter."""
    
    @patch('app.services.forensic_query_service.genai')
    @patch('app.services.forensic_query_service.settings')
    def test_converter_initialization(self, mock_settings, mock_genai):
        """Test converter initialization with API key."""
        mock_settings.gemini_api_key = "test_api_key"
        
        converter = ForensicQueryConverter()
        
        mock_genai.configure.assert_called_once_with(api_key="test_api_key")
        mock_genai.GenerativeModel.assert_called_once()
    
    @patch('app.services.forensic_query_service.genai')
    @patch('app.services.forensic_query_service.settings')
    def test_converter_initialization_no_api_key(self, mock_settings, mock_genai):
        """Test converter initialization fails without API key."""
        mock_settings.gemini_api_key = None
        
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(ValueError, match="GEMINI_API_KEY must be set"):
                ForensicQueryConverter()
    
    @patch('app.services.forensic_query_service.genai')
    @patch('app.services.forensic_query_service.settings')
    def test_convert_to_elasticsearch_success(self, mock_settings, mock_genai):
        """Test successful query conversion."""
        mock_settings.gemini_api_key = "test_api_key"
        
        # Mock the model response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"query": {"bool": {"must": [{"match": {"text": "test"}}]}}, "size": 20, "sort": [{"timestamp": {"order": "desc"}}], "highlight": {"fields": {"text": {}}}, "query_intent": "Test query"}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.GenerativeModel.return_value = mock_model
        
        converter = ForensicQueryConverter()
        result = converter.convert_to_elasticsearch("test query")
        
        assert isinstance(result, ForensicQueryResponse)
        assert result.query_intent == "Test query"
        assert result.size == 20
    
    @patch('app.services.forensic_query_service.genai')
    @patch('app.services.forensic_query_service.settings')
    def test_convert_to_elasticsearch_fallback(self, mock_settings, mock_genai):
        """Test fallback when conversion fails."""
        mock_settings.gemini_api_key = "test_api_key"
        
        # Mock the model to raise an exception
        mock_model = MagicMock()
        mock_model.generate_content.side_effect = Exception("API Error")
        mock_genai.GenerativeModel.return_value = mock_model
        
        converter = ForensicQueryConverter()
        result = converter.convert_to_elasticsearch("test query")
        
        assert isinstance(result, ForensicQueryResponse)
        assert "Basic text search for: test query" in result.query_intent
        assert "multi_match" in str(result.query)
    
    def test_create_fallback_query(self):
        """Test fallback query creation."""
        with patch('app.services.forensic_query_service.genai'):
            with patch('app.services.forensic_query_service.settings') as mock_settings:
                mock_settings.gemini_api_key = "test_api_key"
                
                converter = ForensicQueryConverter()
                result = converter._create_fallback_query("test query")
                
                assert isinstance(result, ForensicQueryResponse)
                assert "test query" in result.query_intent
                assert result.size == 20
                assert "multi_match" in str(result.query)
