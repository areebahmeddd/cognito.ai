import json
import google.generativeai as genai
from typing import Dict, Any, List, Optional
from ..core.config import settings

genai.configure(api_key=settings.gemini_api_key)
gemini_model = genai.GenerativeModel(model_name="gemini-2.5-flash")


def analyze_intent(query: str) -> Dict[str, Any]:
    text = create_prompt(query)
    response = gemini_model.generate_content(text)
    content = (getattr(response, "text", "") or "").strip()

    if "```json" in content:
        try:
            content = content.split("```json")[1].split("```")[0].strip()
        except Exception:
            pass
    elif "```" in content:
        try:
            content = content.split("```")[1].strip()
        except Exception:
            pass

    intent_plan: Dict[str, Any] = {}

    try:
        intent_plan = json.loads(content)
    except Exception:
        try:
            start = content.find("{")
            end = content.rfind("}")
            if start != -1 and end != -1 and end > start:
                intent_plan = json.loads(content[start : end + 1])
            else:
                raise ValueError("No JSON found")
        except Exception:
            intent_plan = {
                "search_type": "general",
                "exact_match": False,
                "keywords": [query],
                "query_intent": "forensic_analysis",
            }

    if not (
        isinstance(intent_plan.get("search_types"), list)
        and intent_plan["search_types"]
    ):
        search_type = intent_plan.get("search_type", "general")
        intent_plan["search_types"] = [search_type]
        intent_plan.pop("search_type", None)

    intent_plan.setdefault("exact_match", False)
    intent_plan.setdefault("keywords", [query])
    intent_plan.setdefault("query_intent", "forensic_analysis")

    return intent_plan


def build_query(plan: Dict[str, Any]) -> Dict[str, Any]:
    search_types = plan.get("search_types", ["general"]) or ["general"]
    time_range: Optional[str] = plan.get("time_range")
    fields: Optional[List[str]] = plan.get("fields")
    exact_match: bool = bool(plan.get("exact_match", False))
    keywords: List[str] = plan.get("keywords", [])

    field_mappings = {
        "communications": [
            "message^3",
            "body^3",
            "text^3",
            "title^2",
            "sender^2",
            "from^2",
            "to^2",
            "sending_party^2",
            "sending_party_jid^2",
            "message_type^2",
            "message_direction^2",
            "conversation_name^2",
        ],
        "calls": [
            "caller^3",
            "partner^3",
            "transcription^2",
            "call_direction^2",
            "call_type^2",
            "caller_jid^2",
            "partner_location^2",
        ],
        "web": [
            "title^4",
            "url^3",
            "search_term^3",
            "host^2",
            "domain^2",
            "name^1.5",
            "value^1.5",
        ],
        "location": [
            "place^3",
            "address^2",
            "latitude^2",
            "longitude^2",
            "altitude^2",
        ],
        "social": [
            "username^3",
            "display_name^2",
            "query^2",
            "mentions^2",
            "sender^2",
            "account_name^2",
        ],
        "system": [
            "package_name^3",
            "title^2",
            "status^2",
            "app_package_name^2",
            "package_id^2",
            "event_type^2",
        ],
        "contacts": [
            "display_name^3",
            "phone_number^2",
            "data_1^2",
            "contact_name^2",
            "account_name^2",
        ],
        "cookies": ["host^3", "name^2", "value^2", "domain^2"],
        "notifications": [
            "title^3",
            "message^2",
            "package_name^2",
            "status^2",
            "notification_type^2",
        ],
        "general": [
            "message^3",
            "body^3",
            "text^3",
            "title^2",
            "content^2",
            "url^2",
            "search_term^2",
            "username^2",
            "display_name^2",
            "sender^2",
            "host^1.5",
            "name^1.5",
            "value^1.5",
            "sending_party_jid^1.5",
            "conversation_name^1.5",
        ],
    }

    known_field_sets = list(field_mappings.values())
    known_fields = {f.split("^")[0] for lst in known_field_sets for f in lst}
    known_fields.update(
        {
            "message",
            "body",
            "text",
            "title",
            "content",
            "url",
            "search_term",
            "username",
            "display_name",
            "sender",
            "from",
            "to",
            "sending_party",
            "sending_party_jid",
            "conversation_name",
            "partner",
            "partner_location",
            "host",
            "name",
            "value",
        }
    )

    text_like_fields = {
        "message",
        "body",
        "text",
        "title",
        "content",
        "search_term",
        "display_name",
        "conversation_name",
        "transcription",
        "sending_party",
        "partner_location",
        "name",
        "value",
        "address",
        "place",
    }

    if fields:
        cleaned_fields: List[str] = []
        for field in fields:
            base = str(field).split("^")[0]
            if base in known_fields and base in text_like_fields:
                cleaned_fields.append(field)
        combined_fields = cleaned_fields if cleaned_fields else list(known_fields)
    else:
        combined_fields: List[str] = []
        for st in search_types:
            combined_fields.extend(field_mappings.get(st, field_mappings["general"]))
        seen = set()
        combined_fields = [
            f
            for f in combined_fields
            if not (f in seen or seen.add(f)) and f.split("^")[0] in text_like_fields
        ]

    if "general" in search_types or len(search_types) > 2:
        combined_fields = [
            "message^3",
            "body^3",
            "text^3",
            "title^2",
            "url^2",
            "search_term^2",
            "display_name^1.5",
            "conversation_name^1.5",
        ]

    query_dsl: Dict[str, Any] = {
        "query": {"bool": {"must": [], "filter": [], "should": []}},
        "size": 200,
        "sort": [{"timestamp": {"order": "desc"}}],
    }

    if keywords:
        target_fields = [
            f for f in combined_fields if f.split("^")[0] in text_like_fields
        ] or [
            "message^3",
            "body^3",
            "text^3",
            "title^2",
        ]
        if exact_match:
            query_dsl["query"]["bool"]["must"].append(
                {
                    "multi_match": {
                        "query": " ".join([str(k) for k in keywords if k]),
                        "fields": target_fields,
                        "type": "phrase",
                    }
                }
            )
        else:
            query_dsl["query"]["bool"]["must"].append(
                {
                    "multi_match": {
                        "query": " ".join([str(k) for k in keywords if k]),
                        "fields": target_fields,
                        "fuzziness": "AUTO",
                    }
                }
            )

    if time_range:
        try:
            start_date_str, end_date_str = map(str.strip, time_range.split(" to "))
            date_fields = [
                "timestamp",
                "message_timestamp",
                "call_date",
                "call_start_timestamp",
                "call_end_timestamp",
                "last_time_active",
                "conversion_timestamp",
                "creation_timestamp",
                "last_updated_timestamp",
                "debug_time",
            ]
            query_dsl["query"]["bool"]["filter"].append(
                {
                    "bool": {
                        "should": [
                            {"range": {f: {"gte": start_date_str, "lte": end_date_str}}}
                            for f in date_fields
                        ],
                        "minimum_should_match": 1,
                    }
                }
            )
        except ValueError:
            pass

    filters = plan.get("filters") or {}
    term_filters = filters.get("term") if isinstance(filters, dict) else None
    if isinstance(term_filters, list):
        for item in term_filters:
            if isinstance(item, dict):
                field = item.get("field")
                value = item.get("value")
                if field and value is not None:
                    query_dsl["query"]["bool"]["filter"].append(
                        {"term": {field: value}}
                    )

    if (
        not query_dsl["query"]["bool"]["must"]
        and not query_dsl["query"]["bool"]["filter"]
        and not query_dsl["query"]["bool"]["should"]
    ):
        query_dsl["query"] = {"match_all": {}}

    return query_dsl


def create_prompt(query: str) -> str:
    return (
        f"""
You are a forensic data analysis expert. Convert the following natural language query into a SIMPLE plan for building an Elasticsearch DSL for UFDR (Universal Forensic Data Report) data.

Query: "{query}"

UFDR data types include: messages (SMS, WhatsApp, Signal), calls, transactions, web history, contacts, locations, files, notifications, system usage.

Available fields (non-exhaustive):
- category, file_type, data_type, channel, platform, service
- message, body, text, title, transcription
- from, to, sender, recipient, display_from, display_to, username, display_name
- timestamp (ISO), message_timestamp, call_date
- conversation_name, message_type, message_direction
- url, host, domain, search_term
- address, place
- currency, amount
- entities (may contain extracted addresses like crypto, upi, etc.)

Return STRICT JSON with EXACT keys:
{{"query_intent": "brief description",
  "search_types": ["communications" | "calls" | "web" | "location" | "social" | "system" | "contacts" | "cookies" | "notifications" | "general"],
  "time_range": "YYYY-MM-DD to YYYY-MM-DD" (optional),
  "fields": ["field", ...] (optional),
  "exact_match": true | false,
  "keywords": ["term", ...]
}}

Guidelines:
1) Keep it simple. Favor multi_match across relevant text fields.
2) Choose search_types that fit the intent (messages/codes -> communications; browser/cookies -> web/cookies; etc.).
3) Include a time_range only if the query clearly specifies one.
4) Keywords should reflect the intent (e.g., bitcoin, verification code, cookie).
5) Do NOT include explanations or extra keys.
"""
    ).strip()
