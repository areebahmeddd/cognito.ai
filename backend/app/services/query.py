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
