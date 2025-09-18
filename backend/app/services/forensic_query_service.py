import os
import time
from typing import Dict, Any
import google.generativeai as genai
from ..core.config import settings
from ..models.schemas import ForensicQueryResponse


class ForensicQueryConverter:
    def __init__(self):
        """Initialize the forensic query converter with Gemini AI"""
        # Configure Gemini with API key from settings
        api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY must be set in environment variables or config")
        
        genai.configure(api_key=api_key)
        
        # Use Gemini 2.0 Flash for best structured output support
        self.model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=ForensicQueryResponse  # Pydantic model directly!
            )
        )
    
    def convert_to_elasticsearch(self, user_query: str) -> ForensicQueryResponse:
        """Convert natural language to Elasticsearch query"""
        
        prompt = f"""
        You are an expert in digital forensics and Elasticsearch Query DSL.
        
        FORENSIC DATA SCHEMA:
        - type: "whatsapp", "sms", "call", "email", "browser", "file", "location"
        - data_type: "message", "call", "browser_history", "file", "location"
        - text: message content, search terms, browser history, file content
        - timestamp: ISO 8601 datetime format  
        - participants: array of phone numbers or contact names
        - from/to: sender/recipient information
        - display_from/display_to: human-readable names
        - location: geographic location data (lat/lon)
        - source_path: original device file path
        - device_id: source device identifier
        - case_id: case identifier
        - artifact_id: unique artifact identifier
        - channel: communication channel (whatsapp, sms, etc.)
        - platform: platform (android, ios, etc.)
        - service: service provider
        - duration_sec: call duration
        - direction: call direction (incoming, outgoing)
        - call_type: type of call (voice, video)
        - media_type: type of media
        - caption: media caption
        - url: web URL
        - email: email address
        - filename: file name
        - hashes: file hashes (md5, sha1, sha256)
        - country: country code
        - languages: detected languages
        - amount: financial amount
        - currency: currency code
        - method: payment method
        - ip: IP address
        - event: event type
        - notes: additional notes
        - tags: custom tags
        - entities: extracted entities
        - status: status information
        
        QUERY CONVERSION RULES:
        1. Use "must" array for required text matches and conditions
        2. Use "filter" array for exact matches, date ranges, categorical data
        3. Use "should" array for optional/OR conditions 
        4. Use "must_not" array for exclusions
        5. Always include appropriate highlighting for text fields
        6. Sort by timestamp desc for chronological data
        7. Limit results to reasonable numbers (10-50 for complex queries)
        8. Use proper field names from the schema above
        
        ELASTICSEARCH QUERY TYPES:
        - match: for text search in text fields
        - term: for exact keyword matches in keyword fields
        - range: for date/time/numeric ranges
        - wildcard: for pattern matching (phone numbers, file paths)
        - prefix: for starts-with matching
        - multi_match: for searching across multiple text fields
        - exists: for checking field existence
        - bool: for complex boolean logic
        
        USER QUERY: "{user_query}"
        
        Convert this to a complete Elasticsearch Query DSL with proper bool structure.
        Explain the query intent clearly in the query_intent field.
        """
        
        try:
            response = self.model.generate_content(prompt)
            # Gemini automatically validates against Pydantic schema
            return ForensicQueryResponse.model_validate_json(response.text)
            
        except Exception as e:
            # Fallback for malformed responses
            print(f"Query conversion error: {e}")
            return self._create_fallback_query(user_query)
    
    def _create_fallback_query(self, user_query: str) -> ForensicQueryResponse:
        """Enhanced fallback that creates proper forensic Query DSL"""
        query_lower = user_query.lower()
        
        # Initialize query components
        must_conditions = []
        filter_conditions = []
        should_conditions = []
        
        # Parse communication types
        if "whatsapp" in query_lower:
            filter_conditions.append({"term": {"type": "whatsapp"}})
        elif "sms" in query_lower:
            filter_conditions.append({"term": {"type": "sms"}})
        elif "call" in query_lower or "calls" in query_lower:
            filter_conditions.append({"term": {"data_type": "call"}})
        elif "email" in query_lower:
            filter_conditions.append({"term": {"type": "email"}})
        elif "browser" in query_lower:
            filter_conditions.append({"term": {"type": "browser"}})
        elif "file" in query_lower or "files" in query_lower:
            filter_conditions.append({"term": {"data_type": "file"}})
        elif "location" in query_lower:
            filter_conditions.append({"exists": {"field": "location"}})
        
        # Parse time-based queries
        if "yesterday" in query_lower:
            from datetime import datetime, timedelta
            yesterday = datetime.now() - timedelta(days=1)
            start_date = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
            filter_conditions.append({
                "range": {
                    "timestamp": {
                        "gte": start_date.isoformat(),
                        "lte": end_date.isoformat()
                    }
                }
            })
        elif "last week" in query_lower or "past week" in query_lower:
            from datetime import datetime, timedelta
            week_ago = datetime.now() - timedelta(days=7)
            filter_conditions.append({
                "range": {
                    "timestamp": {
                        "gte": week_ago.isoformat()
                    }
                }
            })
        elif "last 7 days" in query_lower:
            from datetime import datetime, timedelta
            week_ago = datetime.now() - timedelta(days=7)
            filter_conditions.append({
                "range": {
                    "timestamp": {
                        "gte": week_ago.isoformat()
                    }
                }
            })
        
        # Parse time ranges (e.g., "between 2 PM and 4 PM")
        if "between" in query_lower and "pm" in query_lower or "am" in query_lower:
            # This is a simplified time range parser
            filter_conditions.append({
                "range": {
                    "timestamp": {
                        "gte": "now-1d",
                        "lte": "now"
                    }
                }
            })
        
        # Parse content keywords
        content_keywords = []
        if "crypto" in query_lower or "cryptocurrency" in query_lower or "bitcoin" in query_lower:
            content_keywords.extend(["crypto", "cryptocurrency", "bitcoin", "ethereum", "blockchain"])
        if "transaction" in query_lower or "transactions" in query_lower:
            content_keywords.extend(["transaction", "payment", "transfer", "money"])
        if "meeting" in query_lower or "meetings" in query_lower:
            content_keywords.extend(["meeting", "appointment", "schedule", "conference"])
        if "financial" in query_lower or "money" in query_lower or "amount" in query_lower:
            content_keywords.extend(["financial", "money", "amount", "dollar", "payment"])
        
        # Add content search
        if content_keywords:
            must_conditions.append({
                "multi_match": {
                    "query": " ".join(content_keywords),
                    "fields": ["text^2", "display_from^1.5", "display_to^1.5", "notes^1.2"],
                    "type": "best_fields",
                    "fuzziness": "AUTO"
                }
            })
        else:
            # Fallback to general text search
            must_conditions.append({
                "multi_match": {
                    "query": user_query,
                    "fields": ["text^2", "display_from^1.5", "display_to^1.5", "notes^1.2"],
                    "type": "best_fields",
                    "fuzziness": "AUTO"
                }
            })
        
        # Parse foreign/international queries
        if "foreign" in query_lower or "international" in query_lower:
            # Look for phone numbers with country codes
            should_conditions.append({
                "wildcard": {
                    "from": "+*"
                }
            })
            should_conditions.append({
                "wildcard": {
                    "to": "+*"
                }
            })
        
        # Parse hash queries
        if "hash" in query_lower:
            filter_conditions.append({
                "exists": {"field": "hashes"}
            })
        
        # Parse deleted content
        if "deleted" in query_lower:
            filter_conditions.append({
                "term": {"deleted": True}
            })
        
        # Build the final query
        bool_query = {}
        if must_conditions:
            bool_query["must"] = must_conditions
        if filter_conditions:
            bool_query["filter"] = filter_conditions
        if should_conditions:
            bool_query["should"] = should_conditions
            bool_query["minimum_should_match"] = 1
        
        # Create query intent
        intent_parts = []
        if filter_conditions:
            for condition in filter_conditions:
                if "term" in condition:
                    for field, value in condition["term"].items():
                        intent_parts.append(f"{field}: {value}")
                elif "exists" in condition:
                    intent_parts.append(f"has {condition['exists']['field']}")
                elif "range" in condition:
                    intent_parts.append("time-based filter")
        
        if content_keywords:
            intent_parts.append(f"content: {', '.join(content_keywords)}")
        
        query_intent = f"Forensic search for: {', '.join(intent_parts) if intent_parts else user_query}"
        
        return ForensicQueryResponse(
            query={"bool": bool_query},
            size=20,
            sort=[{"timestamp": {"order": "desc"}}],
            highlight={
                "fields": {
                    "text": {"fragment_size": 150, "number_of_fragments": 2},
                    "display_from": {"fragment_size": 50},
                    "display_to": {"fragment_size": 50}
                }
            },
            query_intent=query_intent
        )


# Global instance
forensic_converter = None


def get_forensic_converter() -> ForensicQueryConverter:
    """Get or create the forensic query converter instance"""
    global forensic_converter
    if forensic_converter is None:
        forensic_converter = ForensicQueryConverter()
    return forensic_converter
