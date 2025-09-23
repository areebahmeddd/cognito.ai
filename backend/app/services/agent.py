import uuid
import google.generativeai as genai
from datetime import datetime
from typing import Dict, List, Any
from ..core.config import settings
from .elasticsearch import es_client, index_name


def process_query(query: str) -> Dict[str, Any]:
    if not query:
        return {
            "query": query,
            "analysis": "Empty query provided.",
            "results": [],
            "total_results": 0,
            "tools_used": [],
        }

    try:
        chat = create_ai().start_chat()
        system_prompt = create_text(query)
        response = chat.send_message(system_prompt)
        result = process_data(response, chat)
        return result

    except Exception as e:
        if "quota" in str(e).lower() or "429" in str(e):
            return {
                "query": query,
                "error": "Rate limit exceeded. Please wait before making more requests.",
                "results": [],
                "analysis": "Rate limit exceeded. Please try again in a few minutes.",
            }
        else:
            return {
                "query": query,
                "error": str(e),
                "results": [],
                "analysis": "Error processing query",
            }


def process_data(response, chat) -> Dict[str, Any]:
    all_results = []
    analysis = ""
    tools_used = []

    if hasattr(response, "candidates") and response.candidates:
        candidate = response.candidates[0]

        if hasattr(candidate, "content") and candidate.content:
            for part in candidate.content.parts:
                if hasattr(part, "function_call"):
                    function_call = part.function_call
                    function_name = function_call.name
                    function_args = {k: v for k, v in function_call.args.items()}

                    function_result = execute_tool(function_name, function_args)

                    if function_result:
                        all_results.extend(function_result)
                        tools_used.append(function_name)

                    function_response = {
                        "name": function_name,
                        "response": {
                            "results": function_result,
                            "count": len(function_result),
                        },
                    }

                    response = chat.send_message(
                        genai.types.Part(function_response=function_response)
                    )

                    if hasattr(response, "candidates") and response.candidates:
                        final_candidate = response.candidates[0]
                        if (
                            hasattr(final_candidate, "content")
                            and final_candidate.content
                        ):
                            if hasattr(final_candidate.content, "parts"):
                                analysis_parts = [
                                    p.text
                                    for p in final_candidate.content.parts
                                    if hasattr(p, "text")
                                ]
                                if analysis_parts:
                                    analysis = " ".join(analysis_parts)
                elif hasattr(part, "text"):
                    analysis = part.text

            if hasattr(response, "candidates") and response.candidates:
                final_candidate = response.candidates[0]
                if hasattr(final_candidate, "content") and final_candidate.content:
                    if hasattr(final_candidate.content, "parts"):
                        final_text_parts = [
                            part.text
                            for part in final_candidate.content.parts
                            if hasattr(part, "text")
                        ]
                        if final_text_parts:
                            analysis = " ".join(final_text_parts)

            if analysis == "" and all_results:
                analysis = f"Found {len(all_results)} relevant records for your query."

    return {
        "query": "",
        "analysis": analysis,
        "results": all_results,
        "total_results": len(all_results),
        "tools_used": tools_used,
    }


def execute_tool(
    function_name: str, function_args: Dict[str, Any]
) -> List[Dict[str, Any]]:
    try:
        if function_name == "search_elasticsearch":
            if "search_type" not in function_args:
                function_args["search_type"] = "general"
            return search_data(**function_args)
        elif function_name == "analyze_results":
            return analyze_data(**function_args)
        elif function_name == "build_timeline":
            return build_events(**function_args)
        elif function_name == "find_correlations":
            return find_links(**function_args)
        else:
            return []
    except Exception:
        return []


def search_data(
    query: str,
    search_type: str = "general",
    time_range: str = None,
    fields: List[str] = None,
    exact_match: bool = False,
) -> List[Dict[str, Any]]:
    try:
        es_query = build_query(query, search_type, time_range, fields, exact_match)
        response = es_client.search(index=index_name, body=es_query)
        hits = response["hits"]["hits"]

        results = []
        for hit in hits:
            doc_data = hit["_source"]
            results.append(doc_data)

        return results

    except Exception:
        return []


def analyze_data(results: List[Dict[str, Any]], query: str) -> str:
    if not results:
        return f"Based on the previous search, no relevant records were found for '{query}'. Therefore, a comprehensive forensic analysis cannot be performed at this time."

    analysis_parts = [f"### Forensic Analysis for Query: '{query}'\n"]
    analysis_parts.append(f"**Total relevant records found:** {len(results)}\n")

    senders = set()
    recipients = set()
    keywords_found = set()
    timestamps = []

    for record in results:
        if record.get("sender"):
            senders.add(record["sender"])
        if record.get("recipient"):
            recipients.add(record["recipient"])
        if record.get("message"):
            keywords_found.update(
                word.lower() for word in record["message"].split() if len(word) > 3
            )
        if record.get("timestamp"):
            try:
                ts = record["timestamp"]
                if isinstance(ts, str):
                    for fmt in [
                        "%Y-%m-%d %H:%M:%S%z",
                        "%Y-%m-%d %H:%M:%S",
                        "%Y-%m-%dT%H:%M:%S.%f",
                        "%Y-%m-%dT%H:%M:%S",
                    ]:
                        try:
                            dt_obj = datetime.strptime(ts, fmt)
                            timestamps.append(dt_obj)
                            break
                        except ValueError:
                            pass
                elif isinstance(ts, datetime):
                    timestamps.append(ts)
            except Exception:
                continue

    if senders:
        analysis_parts.append(f"**Key Senders:** {', '.join(senders)}")
    if recipients:
        analysis_parts.append(f"**Key Recipients:** {', '.join(recipients)}")
    if keywords_found:
        analysis_parts.append(
            f"**Common Keywords:** {', '.join(list(keywords_found)[:10])}..."
        )

    if timestamps:
        min_time = min(timestamps)
        max_time = max(timestamps)
        analysis_parts.append(
            f"**Timeframe of Activity:** From {min_time.strftime('%Y-%m-%d %H:%M:%S')} to {max_time.strftime('%Y-%m-%d %H:%M:%S')}"
        )

    analysis_parts.append("\n**Detailed Forensic Significance of Sample Records:**")
    for i, record in enumerate(results[:5]):
        sig = assess_risk(record)
        analysis_parts.append(
            f"- Record {i + 1} (ID: {record.get('artifact_id', 'N/A')}): {sig}"
        )

    return "\n".join(analysis_parts)


def build_events(results: List[Dict[str, Any]]) -> str:
    if not results:
        return "No events to build a timeline."

    events_with_timestamps = []
    for event in results:
        if event.get("timestamp"):
            try:
                ts = event["timestamp"]
                if isinstance(ts, str):
                    for fmt in [
                        "%Y-%m-%d %H:%M:%S%z",
                        "%Y-%m-%d %H:%M:%S",
                        "%Y-%m-%dT%H:%M:%S.%f",
                        "%Y-%m-%dT%H:%M:%S",
                    ]:
                        try:
                            dt_obj = datetime.strptime(ts, fmt)
                            events_with_timestamps.append((dt_obj, event))
                            break
                        except ValueError:
                            pass
                elif isinstance(ts, datetime):
                    events_with_timestamps.append((ts, event))
            except Exception:
                continue

    if not events_with_timestamps:
        return "No events with valid timestamps to build a timeline."

    sorted_events = sorted(events_with_timestamps, key=lambda x: x[0])

    timeline_str = "**Chronological Timeline of Events:**\n\n"
    for dt_obj, event in sorted_events:
        timestamp_str = dt_obj.strftime("%Y-%m-%d %H:%M:%S")
        data_type = event.get("data_type", "Unknown Data Type")
        source_path = event.get("source_path", "N/A").split("\\")[-1]

        description = f"[{data_type}] "
        if event.get("message"):
            description += f"Message: '{event['message'][:100]}...'"
        elif event.get("title"):
            description += f"Title: '{event['title'][:100]}...'"
        elif event.get("url"):
            description += f"URL: '{event['url'][:100]}...'"
        elif event.get("caller") and event.get("callee"):
            description += f"Call from {event['caller']} to {event['callee']}"
        elif event.get("event_type"):
            description += f"System Event: {event['event_type']}"
        else:
            description += "Details available in full record."

        timeline_str += f"- **{timestamp_str}** ({source_path}): {description}\n"

        significance = assess_risk(event)
        if significance != "Routine activity.":
            timeline_str += f"  *Significance*: {significance}\n"

    timeline_str += "\n" + create_info([e for _, e in sorted_events])
    return timeline_str


def find_links(results: List[Dict[str, Any]]) -> str:
    if not results:
        return "No results to find correlations."

    correlations = ["**Correlations and Linkages:**\n"]

    phone_numbers = {}
    emails = {}
    jids = {}
    account_names = {}

    for record in results:
        record_id = record.get("artifact_id", str(uuid.uuid4()))

        if record.get("phone_number"):
            phone_numbers.setdefault(record["phone_number"], []).append(record_id)
        if record.get("email"):
            emails.setdefault(record["email"], []).append(record_id)
        if record.get("sending_party_jid"):
            jids.setdefault(record["sending_party_jid"], []).append(record_id)
        if record.get("account_name"):
            account_names.setdefault(record["account_name"], []).append(record_id)

    correlations.append("\n**Entity Correlations:**")
    for entity_map, entity_name in [
        (phone_numbers, "Phone Number"),
        (emails, "Email"),
        (jids, "JID"),
        (account_names, "Account Name"),
    ]:
        for entity_value, record_ids in entity_map.items():
            if len(record_ids) > 1:
                correlations.append(
                    f"- {entity_name} '{entity_value}' linked across {len(record_ids)} records: {', '.join(record_ids)}"
                )

    correlations.append("\n**Temporal Correlations (Events within 5 minutes):**")
    events_with_timestamps = []
    for event in results:
        if event.get("timestamp"):
            try:
                ts = event["timestamp"]
                if isinstance(ts, str):
                    for fmt in [
                        "%Y-%m-%d %H:%M:%S%z",
                        "%Y-%m-%d %H:%M:%S",
                        "%Y-%m-%dT%H:%M:%S.%f",
                        "%Y-%m-%dT%H:%M:%S",
                    ]:
                        try:
                            dt_obj = datetime.strptime(ts, fmt)
                            events_with_timestamps.append(
                                (
                                    dt_obj,
                                    event.get("artifact_id", "N/A"),
                                    event.get("message", event.get("title", ""))[:50],
                                )
                            )
                            break
                        except ValueError:
                            pass
                elif isinstance(ts, datetime):
                    events_with_timestamps.append(
                        (
                            ts,
                            event.get("artifact_id", "N/A"),
                            event.get("message", event.get("title", ""))[:50],
                        )
                    )
            except Exception:
                continue

    sorted_events = sorted(events_with_timestamps, key=lambda x: x[0])

    for i in range(len(sorted_events) - 1):
        time1, id1, desc1 = sorted_events[i]
        time2, id2, desc2 = sorted_events[i + 1]

        time_diff = abs((time2 - time1).total_seconds())
        if time_diff <= 300:
            correlations.append(
                f"- Records {id1} ('{desc1}...') and {id2} ('{desc2}...') occurred within {int(time_diff)} seconds of each other."
            )

    correlations.append("\n**Cross-Data Type Linkages (Examples):**")
    web_urls = {
        record.get("url")
        for record in results
        if record.get("data_type") == "web_history" and record.get("url")
    }
    for record in results:
        if record.get("data_type") in [
            "whatsapp_message",
            "viber_message",
            "sms_message",
        ] and record.get("message"):
            for url in web_urls:
                if url in record["message"]:
                    correlations.append(
                        f"- URL '{url}' from web history (Record ID: {record.get('artifact_id', 'N/A')}) found in communication message (Record ID: {record.get('artifact_id', 'N/A')})."
                    )
                    break

    if len(correlations) == 1:
        correlations.append(
            "- No significant correlations identified based on current data and analysis scope."
        )

    return "\n".join(correlations)


def create_ai():
    genai.configure(api_key=settings.gemini_api_key)
    tools = [
        {
            "function_declarations": [
                {
                    "name": "search_elasticsearch",
                    "description": "Search through forensic data in Elasticsearch",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "The search query to execute",
                            },
                            "search_type": {
                                "type": "string",
                                "description": "Optional: Type of forensic data to search (communications, calls, web, location, social, system, contacts, cookies, notifications, or general)",
                            },
                            "time_range": {
                                "type": "string",
                                "description": "Optional time range filter (e.g., '2024-01-01 to 2024-03-31')",
                            },
                            "fields": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Specific fields to search in",
                            },
                            "exact_match": {
                                "type": "boolean",
                                "description": "Whether to use exact matching",
                            },
                        },
                        "required": ["query"],
                    },
                },
                {
                    "name": "analyze_results",
                    "description": "Analyze search results and provide forensic insights",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "results": {
                                "type": "array",
                                "items": {"type": "object"},
                                "description": "List of search results (documents) to analyze",
                            },
                            "query": {
                                "type": "string",
                                "description": "The original query that led to these results",
                            },
                        },
                        "required": ["results", "query"],
                    },
                },
                {
                    "name": "build_timeline",
                    "description": "Construct a chronological timeline from forensic events",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "results": {
                                "type": "array",
                                "items": {"type": "object"},
                                "description": "List of search results (documents) to build a timeline from",
                            }
                        },
                        "required": ["results"],
                    },
                },
                {
                    "name": "find_correlations",
                    "description": "Identify correlations and linkages between different forensic data points",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "results": {
                                "type": "array",
                                "items": {"type": "object"},
                                "description": "List of search results (documents) to find correlations within",
                            }
                        },
                        "required": ["results"],
                    },
                },
            ]
        }
    ]

    return genai.GenerativeModel(model_name="gemini-2.5-flash", tools=tools)


def create_text(query: str) -> str:
    return f"""You are an AI forensic analyst specializing in UFDR (Universal Forensic Extraction Device Report) analysis.

    Your task is to help investigating officers analyze digital evidence from seized devices by understanding their intent and finding relevant evidence.

    CRITICAL: You must understand the user's intent and search intelligently, not just match keywords.

    Available forensic data types and their key fields:
    - Communications (WhatsApp, SMS, Viber, etc.): message, conversation_name, sending_party, message_direction, sender, recipient
    - Calls: caller, callee, call_duration, call_type, transcription
    - Web: url, search_term, host, domain, title
    - Location: latitude, longitude, address, place
    - Social: username, display_name, account_name
    - System: package_name, app_name, notification_type, event_type
    - Contacts: phone_number, email, contact_name, display_name
    - Cookies: host, name, value, domain

    For the query: "{query}"

    ANALYSIS STEPS:
    1. UNDERSTAND INTENT: What is the officer really looking for?
    2. IDENTIFY DATA TYPES: Which types of forensic data are relevant?
    3. SEARCH INTELLIGENTLY: Use appropriate search terms and fields
    4. ANALYZE RESULTS: Provide forensic insights and connections
    5. BUILD TIMELINE: If time-based analysis is needed
    6. FIND CORRELATIONS: Identify connections between evidence

    EXAMPLES OF INTENT UNDERSTANDING:
    - "crypto messages" → Search for cryptocurrency-related content in message fields
    - "foreign numbers" → Search for international phone numbers in communications
    - "facebook activity" → Search for Facebook-related URLs, usernames, or app usage
    - "suspicious communications" → Look for keywords like "scam", "fraud", "illegal" in messages

    Always use the search_elasticsearch tool first to find relevant data, then analyze the results."""


def build_query(
    query: str,
    search_type: str,
    time_range: str = None,
    fields: List[str] = None,
    exact_match: bool = False,
) -> Dict[str, Any]:
    es_query = {
        "query": {"bool": {"must": [], "filter": []}},
        "size": 10000,
        "highlight": {
            "fields": {
                "*": {"pre_tags": ["<em>"], "post_tags": ["</em>"]},
                "message": {"fragment_size": 150},
                "body": {"fragment_size": 150},
                "text": {"fragment_size": 150},
                "title": {"fragment_size": 150},
                "url": {"fragment_size": 150},
                "search_term": {"fragment_size": 150},
                "username": {"fragment_size": 150},
                "display_name": {"fragment_size": 150},
                "sender": {"fragment_size": 150},
                "host": {"fragment_size": 150},
                "name": {"fragment_size": 150},
                "value": {"fragment_size": 150},
            }
        },
    }

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
            "url^3",
            "title^2",
            "search_term^2",
            "host^2",
            "name^2",
            "value^2",
            "domain^2",
        ],
        "location": ["place^3", "address^2", "latitude^2", "longitude^2", "altitude^2"],
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

    search_fields = (
        fields if fields else field_mappings.get(search_type, field_mappings["general"])
    )

    if query:
        if exact_match:
            es_query["query"]["bool"]["must"].append(
                {
                    "multi_match": {
                        "query": query,
                        "fields": search_fields,
                        "type": "phrase",
                    }
                }
            )
        else:
            es_query["query"]["bool"]["must"].append(
                {
                    "multi_match": {
                        "query": query,
                        "fields": search_fields,
                        "fuzziness": "AUTO",
                    }
                }
            )

    if time_range:
        try:
            start_date_str, end_date_str = map(str.strip, time_range.split(" to "))
            es_query["query"]["bool"]["filter"].append(
                {
                    "range": {
                        "timestamp": {
                            "gte": start_date_str,
                            "lte": end_date_str,
                            "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis||yyyy-MM-dd HH:mm:ssXXX",
                        }
                    }
                }
            )
        except ValueError:
            pass

    if (
        not es_query["query"]["bool"]["must"]
        and not es_query["query"]["bool"]["filter"]
    ):
        es_query["query"] = {"match_all": {}}

    return es_query


def assess_risk(event: Dict[str, Any]) -> str:
    significance = []

    suspicious_keywords = [
        "crypto",
        "bitcoin",
        "scam",
        "fraud",
        "illegal",
        "warning",
        "delete",
        "secret",
        "unauthorized",
    ]

    message_content = event.get("message", event.get("text", "")).lower()
    if any(keyword in message_content for keyword in suspicious_keywords):
        significance.append("Contains suspicious keywords.")

    if event.get("data_type") in [
        "whatsapp_message",
        "viber_message",
        "sms_message",
        "email",
    ]:
        if event.get("message_direction") == "Outgoing" and "delete" in message_content:
            significance.append(
                "Outgoing message with deletion request (potential evidence tampering)."
            )
        if event.get("message_direction") == "Incoming" and any(
            keyword in message_content
            for keyword in ["scam", "fraud", "investment opportunity"]
        ):
            significance.append(
                "Incoming message promoting suspicious investment/scam."
            )

    if event.get("data_type") == "web_history" and any(
        k in event.get("url", "").lower() for k in ["darkweb", "onion", "scam", "fraud"]
    ):
        significance.append("Accessed suspicious website.")

    if (
        event.get("data_type") == "file"
        and event.get("filename", "").lower().endswith((".exe", ".dll", ".zip", ".rar"))
        and "malware" in message_content
    ):
        significance.append("Potential malware-related file activity.")

    return ", ".join(significance) if significance else "Routine activity."


def create_info(sorted_events: List[Dict[str, Any]]) -> str:
    if not sorted_events:
        return "No events to build a timeline."

    summary_lines = ["**Timeline Summary:**"]
    for event in sorted_events:
        timestamp = event.get("timestamp", "N/A")
        event_type = event.get("type", "N/A")
        message = event.get(
            "message", event.get("title", event.get("text", "No description"))
        )
        summary_lines.append(f"- {timestamp}: {event_type} - {message[:100]}...")
    return "\n".join(summary_lines)


gemini_agent = type("GeminiAgent", (), {"process_query": staticmethod(process_query)})()
