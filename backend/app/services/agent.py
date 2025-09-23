import google.generativeai as genai
from typing import Dict, Any, List, Optional
from ..core.config import settings


def _model():
    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel(model_name="gemini-2.5-flash")


def build_dsl_from_intent(query: str) -> Dict[str, Any]:
    """Use LLM to map natural language query to a targeted Elasticsearch DSL.
    No tool-calls; just text → JSON plan describing: search_type, time_range, fields, exactness, boosted terms.
    """
    instruction = (
        "You convert investigator queries into an Elasticsearch search plan JSON.\n"
        "Return STRICT JSON with keys: query_intent (string), search_types (array of types from: communications,calls,web,location,social,system,contacts,cookies,notifications,general),\n"
        "time_range (optional 'YYYY-MM-DD to YYYY-MM-DD'), fields (optional array), exact_match (boolean), keywords (array of strings).\n"
        "Guidance: If the query mentions messages, codes, OTP, verification, SMS, WhatsApp, Viber, Telegram, include 'communications'.\n"
        "If mixed sources are implied (e.g., WhatsApp and Facebook), include both in search_types (communications + social).\n"
        "Prefer concise intents and only include fields that help precision. Do not add explanations."
    )

    prompt = f"{instruction}\nQuery: {query}"
    resp = _model().generate_content(prompt)
    response_text = getattr(resp, "text", "") or ""
    response_text = response_text.strip()
    if "```json" in response_text:
        try:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        except Exception:
            pass
    elif "```" in response_text:
        try:
            response_text = response_text.split("```")[1].strip()
        except Exception:
            pass

    plan: Dict[str, Any] = {}
    try:
        import json as _json
        plan = _json.loads(response_text)
    except Exception:
        # try a lenient parse if model returned trailing text
        try:
            start = response_text.find("{")
            end = response_text.rfind("}")
            if start != -1 and end != -1 and end > start:
                import json as _json2
                plan = _json2.loads(response_text[start:end + 1])
            else:
                raise ValueError("no_json_found")
        except Exception:
            plan = {
                "search_type": "general",
                "exact_match": False,
                "keywords": [query],
                "query_intent": "forensic_analysis",
            }

    # Normalize
    # Normalize: allow both single and multiple types
    if "search_types" in plan and isinstance(plan["search_types"], list) and plan["search_types"]:
        pass
    else:
        st = plan.get("search_type", "general")
        plan["search_types"] = [st]
        plan.pop("search_type", None)
    plan.setdefault("exact_match", False)
    plan.setdefault("keywords", [query])
    plan.setdefault("query_intent", "forensic_analysis")
    return plan


def to_es_query(plan: Dict[str, Any]) -> Dict[str, Any]:
    search_types = plan.get("search_types", ["general"]) or ["general"]
    time_range: Optional[str] = plan.get("time_range")
    fields: Optional[List[str]] = plan.get("fields")
    exact_match: bool = bool(plan.get("exact_match", False))
    keywords: List[str] = plan.get("keywords", [])
    query_intent: str = str(plan.get("query_intent", ""))

    query_text = " ".join([str(k) for k in keywords if k])

    # aligned with previous mapping in elasticsearch.py build_query defaults
    field_mappings = {
        "communications": [
            "message^3","body^3","text^3","title^2","sender^2","from^2","to^2",
            "sending_party_jid^2","message_type^2","message_direction^2","conversation_name^2",
        ],
        "calls": ["caller^3","transcription^2","call_direction^2","call_type^2","caller_jid^2"],
        "web": ["title^4","url^3","search_term^3","host^2","domain^2","name^1.5","value^1.5"],
        "location": ["place^3","address^2","latitude^2","longitude^2","altitude^2"],
        "social": ["username^3","display_name^2","query^2","mentions^2","sender^2","account_name^2"],
        "system": ["package_name^3","title^2","status^2","app_package_name^2","package_id^2","event_type^2"],
        "contacts": ["display_name^3","phone_number^2","data_1^2","contact_name^2","account_name^2"],
        "cookies": ["host^3","name^2","value^2","domain^2"],
        "notifications": ["title^3","message^2","package_name^2","status^2","notification_type^2"],
        "general": [
            "message^3","body^3","text^3","title^2","content^2","url^2","search_term^2","username^2",
            "display_name^2","sender^2","host^1.5","name^1.5","value^1.5","sending_party_jid^1.5","conversation_name^1.5",
        ],
    }

    # When multiple types are present, combine their field sets
    # Known field catalog (from our ES mapping focus)
    known_field_sets = list(field_mappings.values())
    known_fields = set([f.split('^')[0] for lst in known_field_sets for f in lst])
    # Common core fields
    known_fields.update({
        "message","body","text","title","content","url","search_term","username","display_name","sender","from","to",
        "sending_party_jid","conversation_name","host","name","value"
    })

    if fields:
        cleaned = []
        for f in fields:
            base = str(f).split('^')[0]
            if base in known_fields:
                cleaned.append(f)
        combined_fields = cleaned if cleaned else list(known_fields)
    else:
        combined_fields: List[str] = []
        for st in search_types:
            combined_fields.extend(field_mappings.get(st, field_mappings["general"]))
        # de-duplicate while preserving order
        seen = set()
        combined_fields = [f for f in combined_fields if not (f in seen or seen.add(f))]

    dsl: Dict[str, Any] = {"query": {"bool": {"must": [], "filter": [], "should": []}}, "size": 200}

    # If keywords are only app names, don't force a must match that could over-filter
    app_terms = {"whatsapp","viber","telegram","facebook","sms","imessage","google messages","googlemessages"}
    non_app_keywords = [k for k in keywords if str(k).lower() not in app_terms]

    # Heuristic: treat codes/otp/verification as communications-centric
    hint_terms = {"code","codes","otp","verification","confirm","confirmation"}
    if any(t in (query_text or "").lower() for t in hint_terms):
        if "communications" not in search_types:
            search_types.append("communications")
        # remove pure 'social' if only app term is facebook but intent is code
        if "social" in search_types and not non_app_keywords:
            search_types = [t for t in search_types if t != "social"]
        # Expand synonyms to improve recall across SMS/email phrasing
        expansion = [
            "verification code",
            "confirmation code",
            "security code",
            "passcode",
            "one time code",
            "one-time password",
            "otp",
            "code"
        ]
        lower_set = set(s.lower() for s in non_app_keywords)
        for syn in expansion:
            if syn.lower() not in lower_set:
                non_app_keywords.append(syn)

    if non_app_keywords:
        target_fields = combined_fields
        if exact_match:
            dsl["query"]["bool"]["must"].append({"multi_match": {"query": " ".join(non_app_keywords), "fields": target_fields, "type": "phrase"}})
        else:
            dsl["query"]["bool"]["must"].append({"multi_match": {"query": " ".join(non_app_keywords), "fields": target_fields, "fuzziness": "AUTO"}})

    if time_range:
        try:
            start_date_str, end_date_str = map(str.strip, time_range.split(" to "))
            dsl["query"]["bool"]["filter"].append({
                "range": {"timestamp": {"gte": start_date_str, "lte": end_date_str}}
            })
            if "web" in search_types:
                dsl["query"]["bool"]["filter"].append({
                    "range": {"last_visit_date": {"gte": start_date_str, "lte": end_date_str}}
                })
        except ValueError:
            pass

    if not dsl["query"]["bool"]["must"] and not dsl["query"]["bool"]["filter"] and not dsl["query"]["bool"]["should"]:
        dsl["query"] = {"match_all": {}}

    return dsl


