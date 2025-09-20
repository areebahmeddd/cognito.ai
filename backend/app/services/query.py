import json
import google.generativeai as genai
from app.core.config import settings
from app.models.schemas import QueryResponse


def convert_query(query: str) -> QueryResponse:
    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")

    prompt = create_prompt(query)
    response = model.generate_content(prompt)
    response_text = response.text.strip()

    if "```json" in response_text:
        response_text = response_text.split("```json")[1].split("```")[0].strip()
    elif "```" in response_text:
        response_text = response_text.split("```")[1].strip()

    result = json.loads(response_text)

    return QueryResponse(
        query=result.get("query", {}),
        query_intent=result.get("query_intent", "general_search"),
        size=result.get("size", 10000),
        sort=result.get("sort", [{"timestamp": {"order": "desc"}}]),
        highlight=result.get(
            "highlight",
            {
                "fields": {
                    "text": {"fragment_size": 150, "number_of_fragments": 2},
                    "display_from": {"fragment_size": 50},
                    "display_to": {"fragment_size": 50},
                }
            },
        ),
    )


def create_prompt(query: str) -> str:
    return f"""
You are a forensic data analysis expert. Convert the following natural language query into a SIMPLE Elasticsearch DSL query for searching UFDR (Universal Forensic Data Report) data.

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
        // SIMPLE Elasticsearch DSL query object - avoid complex nested structures
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

CRITICAL GUIDELINES - KEEP QUERIES SIMPLE:
1. Use simple multi_match queries for text searches
2. Use simple term queries for exact matches
3. Use simple range queries for time-based searches
4. Use simple bool queries with basic must/should clauses
5. AVOID complex nested structures, comments, or overly complicated logic
6. AVOID using 'comment' fields in queries
7. For cryptocurrency: search currency field for "BTC", "ETH", etc.
8. For financial transactions: search type="transaction" and data_type="payments"
9. For UPI: search entities.upi field and method field
10. For Bitcoin: search currency="BTC", not text="bitcoin"
11. For Ethereum: search currency="ETH", not text="ethereum"
12. For foreign communications: search for international phone numbers (+971, +92, etc.)
13. For suspicious activities: use simple multi_match with relevant keywords

Examples of SIMPLE queries:
- All messages: {{"term": {{"type": "message"}}}}
- Bitcoin transactions: {{"term": {{"currency": "BTC"}}}}
- Messages from Amit: {{"term": {{"display_from": "Amit"}}}}
- Time range: {{"range": {{"timestamp": {{"gte": "2024-05-01", "lte": "2024-05-05"}}}}}}

Convert the query now with a SIMPLE structure:
"""
