import json
import google.generativeai as genai
from typing import Dict, Any, List, Optional
from ..core.config import settings

genai.configure(api_key=settings.gemini_api_key)
gemini_model = genai.GenerativeModel(model_name="gemini-2.5-flash")


def analyze_intent(query: str) -> Dict[str, Any]:
    prompt = (
        "You are an AI assistant. Analyze the user query and return STRICT JSON with keys: "
        "query_intent (string), search_types (array from communications,calls,web,location,social,system,contacts,cookies,notifications,general), "
        "time_range (optional 'YYYY-MM-DD to YYYY-MM-DD'), fields (optional array), exact_match (boolean), keywords (array of strings). "
        "Only JSON."
    )

    text = f"{prompt}\nQuery: {query}".strip()
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
                raise ValueError("no_json")
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

    query_text = " ".join([str(k) for k in keywords if k])

    field_mappings = {
        "communications": [
            "message^3",
            "body^3",
            "text^3",
            "title^2",
            "sender^2",
            "from^2",
            "to^2",
            "sending_party_jid^2",
            "message_type^2",
            "message_direction^2",
            "conversation_name^2",
        ],
        "calls": [
            "caller^3",
            "transcription^2",
            "call_direction^2",
            "call_type^2",
            "caller_jid^2",
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
            "sending_party_jid",
            "conversation_name",
            "host",
            "name",
            "value",
        }
    )

    if fields:
        cleaned = []
        for field in fields:
            base = str(field).split("^")[0]
            if base in known_fields:
                cleaned.append(field)
        combined_fields = cleaned if cleaned else list(known_fields)
    else:
        combined_fields: List[str] = []
        for st in search_types:
            combined_fields.extend(field_mappings.get(st, field_mappings["general"]))
        seen = set()
        combined_fields = [f for f in combined_fields if not (f in seen or seen.add(f))]

    query_dsl: Dict[str, Any] = {
        "query": {"bool": {"must": [], "filter": [], "should": []}},
        "size": 200,
    }

    app_terms = {
        "whatsapp",
        "viber",
        "telegram",
        "facebook",
        "sms",
        "imessage",
        "google messages",
        "googlemessages",
    }

    non_app_keywords = [k for k in keywords if str(k).lower() not in app_terms]
    hint_terms = {"code", "codes", "otp", "verification", "confirm", "confirmation"}

    if any(t in (query_text or "").lower() for t in hint_terms):
        if "communications" not in search_types:
            search_types.append("communications")

        if "social" in search_types and not non_app_keywords:
            search_types = [t for t in search_types if t != "social"]

        expansion = [
            "verification code",
            "confirmation code",
            "security code",
            "passcode",
            "one time code",
            "one-time password",
            "otp",
            "code",
        ]

        lower_set = {s.lower() for s in non_app_keywords}
        for synonym in expansion:
            if synonym.lower() not in lower_set:
                non_app_keywords.append(synonym)

    if non_app_keywords:
        target_fields = combined_fields
        if exact_match:
            query_dsl["query"]["bool"]["must"].append(
                {
                    "multi_match": {
                        "query": " ".join(non_app_keywords),
                        "fields": target_fields,
                        "type": "phrase",
                    }
                }
            )
        else:
            query_dsl["query"]["bool"]["must"].append(
                {
                    "multi_match": {
                        "query": " ".join(non_app_keywords),
                        "fields": target_fields,
                        "fuzziness": "AUTO",
                    }
                }
            )

    if time_range:
        try:
            start_date_str, end_date_str = map(str.strip, time_range.split(" to "))
            query_dsl["query"]["bool"]["filter"].append(
                {"range": {"timestamp": {"gte": start_date_str, "lte": end_date_str}}}
            )
            if "web" in search_types:
                query_dsl["query"]["bool"]["filter"].append(
                    {
                        "range": {
                            "last_visit_date": {
                                "gte": start_date_str,
                                "lte": end_date_str,
                            }
                        }
                    }
                )
        except ValueError:
            pass

    if (
        not query_dsl["query"]["bool"]["must"]
        and not query_dsl["query"]["bool"]["filter"]
        and not query_dsl["query"]["bool"]["should"]
    ):
        query_dsl["query"] = {"match_all": {}}

    return query_dsl
