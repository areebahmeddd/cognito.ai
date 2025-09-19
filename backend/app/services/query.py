"""Forensic Query Service for Natural Language to Elasticsearch DSL conversion using Gemini AI."""

import json
import os
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from app.core.config import settings
from app.models.schemas import ForensicQueryResponse

import google.generativeai as genai


class ForensicQueryConverter:
    """Converts natural language queries to Elasticsearch DSL queries using Gemini AI."""

    def __init__(self):
        """Initialize the converter with Gemini AI."""
        self.gemini_api_key = settings.gemini_api_key or os.getenv('GEMINI_API_KEY')

        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY must be set in environment variables or settings")

        genai.configure(api_key=self.gemini_api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    def convert_to_elasticsearch(self, query: str) -> ForensicQueryResponse:
        """
        Convert natural language query to Elasticsearch DSL.

        Args:
            query: Natural language query string

        Returns:
            ForensicQueryResponse with converted query
        """
        return self._convert_with_ai(query)

    def _convert_with_ai(self, query: str) -> ForensicQueryResponse:
        """Convert using Gemini AI."""
        prompt = self._create_conversion_prompt(query)

        response = self.model.generate_content(prompt)

        if not response.text or response.text.strip() == "":
            raise ValueError("Gemini API returned empty response")

        # Clean the response - remove markdown code blocks if present
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            # Remove ```json at the start and ``` at the end
            response_text = response_text[7:]  # Remove "```json"
            if response_text.endswith("```"):
                response_text = response_text[:-3]  # Remove "```"
        elif response_text.startswith("```"):
            # Handle case where it just starts with ```
            response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]

        response_text = response_text.strip()

        try:
            result = json.loads(response_text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse Gemini response as JSON: {e}")

        return ForensicQueryResponse(
            query=result.get("query", {}),
            query_intent=result.get("query_intent", "general_search"),
            size=result.get("size", 10000),  # Large size to get all results
            sort=result.get("sort", [{"timestamp": {"order": "desc"}}]),
            highlight=result.get("highlight", {
                "fields": {
                    "text": {"fragment_size": 150, "number_of_fragments": 2},
                    "display_from": {"fragment_size": 50},
                    "display_to": {"fragment_size": 50}
                }
            })
        )

    def _create_conversion_prompt(self, query: str) -> str:
        """Create prompt for Gemini AI conversion."""
        return f"""
You are a forensic data analysis expert. Convert the following natural language query into an Elasticsearch DSL query for searching UFDR (Universal Forensic Data Report) data.

Query: "{query}"

The UFDR data contains various types of forensic evidence including:
- Messages (SMS, WhatsApp, Signal, etc.)
- Calls (voice calls, video calls)
- Transactions (UPI, bank transfers, cryptocurrency)
- Web history (browser searches, visited URLs)
- Contacts and communication metadata
- Location data
- File metadata and hashes

Available fields in the data:
- type: message, call, transaction, web_history, contact, file, etc.
- data_type: chat, call_logs, payments, browser_history, contacts, etc.
- channel: sms, whatsapp, signal, telegram, etc.
- platform: android, ios, web, etc.
- service: sms, whatsapp, signal, etc.
- text: message content, search queries, etc.
- from, to, participants: phone numbers, email addresses, usernames
- display_from, display_to: display names
- timestamp: ISO datetime
- entities: extracted entities like crypto addresses, UPI handles, etc.
- location: GPS coordinates
- amount, currency, method: financial transaction details
- hashes: file hashes (md5, sha1, sha256)
- url: web URLs
- filename: file names
- notes: additional notes

Return a JSON response with this exact structure:
{{
    "query": {{
        // Elasticsearch DSL query object
    }},
    "query_intent": "brief description of what the query is looking for",
    "size": 10000,
    "sort": [{{"timestamp": {{"order": "desc"}}}}],
    "highlight": {{
        "fields": {{
            "text": {{"fragment_size": 150, "number_of_fragments": 2}},
            "display_from": {{"fragment_size": 50}},
            "display_to": {{"fragment_size": 50}}
        }}
    }}
}}

Guidelines:
1. Use multi_match queries for text searches across multiple fields
2. Use term queries for exact matches on categorical fields
3. Use range queries for time-based searches
4. Use bool queries to combine multiple conditions
5. Weight important fields higher (text^2, display_from^1.5, etc.)
6. Include fuzziness for text searches to handle typos
7. Use wildcard queries for partial matches on identifiers
8. Consider both exact and fuzzy matching for phone numbers and addresses
9. IMPORTANT: For cryptocurrency searches, look in currency field (BTC, ETH, etc.) and method field (crypto)
10. IMPORTANT: For financial transactions, check type="transaction" and data_type="payments"
11. IMPORTANT: For UPI searches, look in entities.upi field and method field
12. IMPORTANT: For Bitcoin searches, look for "BTC" in currency field, not "bitcoin" in text
13. IMPORTANT: For Ethereum searches, look for "ETH" in currency field, not "ethereum" in text

Convert the query now:
"""




def get_forensic_converter() -> ForensicQueryConverter:
    """Get forensic query converter instance."""
    return ForensicQueryConverter()
