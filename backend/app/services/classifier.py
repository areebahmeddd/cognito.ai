import json
import re
from typing import Dict

import google.generativeai as genai

from ..core.config import settings


genai.configure(api_key=settings.gemini_api_key)
gemini_model = genai.GenerativeModel(model_name="gemini-2.5-flash-lite")


def classify_file(filename: str) -> Dict[str, str]:
    try:
        print(f"[ai] classify_file: {filename}", flush=True)
        clean_name = clean_filename(filename)
        result = classify_ai(clean_name)
        return validate_result(result)
    except Exception as e:
        raise Exception(f"File classification failed: {str(e)}")


def batch_classify(filenames: list[str]) -> Dict[str, Dict[str, str]]:
    try:
        print(f"[ai] batch_classify: {len(filenames)} files", flush=True)
        clean_filenames = [clean_filename(f) for f in filenames]
        result = batch_classify_ai(clean_filenames)

        classifications = {}
        for i, filename in enumerate(filenames):
            if i < len(result):
                classifications[filename] = validate_result(result[i])
            else:
                raise Exception("Missing classification result")

        print(f"[ai] batch_classify: ok -> {len(classifications)}", flush=True)
        return classifications
    except Exception as e:
        raise Exception(f"Batch classification failed: {str(e)}")


def classify_ai(filename: str) -> Dict[str, str]:
    prompt = f"""
You are an expert at classifying digital forensics file types. Analyze the filename and determine:

1. TYPE: The specific application/service and data type (e.g., "WhatsApp Messages", "Chrome Browsing History", "Discord Messages")
2. CATEGORY: The general data category (e.g., "Messages", "Browsing History", "Calls", "Contacts", "Location Data")

Filename: "{filename}"

Categories to choose from:
- Messages (SMS, WhatsApp, Discord, Teams, Telegram, etc.)
- Browsing History (Chrome, Firefox, Safari, DuckDuckGo, etc.)
- Calls (Phone calls, WhatsApp calls, Teams calls, etc.)
- Contacts (Phone contacts, social media contacts, etc.)
- Location Data (GPS, Maps, Waze, etc.)
- Account Data (Login info, user profiles, etc.)
- File Data (Downloads, media files, etc.)
- Notifications (Push notifications, alerts, etc.)
- Usage Data (App usage, battery, etc.)
- General Data (Unknown or miscellaneous)

Return ONLY a valid JSON object with this exact format:
{{"type": "Specific App Data Type", "category": "General Category"}}

Examples:
- "WhatsApp-OneToOneMessages" → {{"type": "WhatsApp Messages", "category": "Messages"}}
- "DuckDuckGo-WebBrowserHistory" → {{"type": "DuckDuckGo Browsing History", "category": "Browsing History"}}
- "TeamsCallLog" → {{"type": "Teams Calls", "category": "Calls"}}
- "Snapchat-Friends" → {{"type": "Snapchat Contacts", "category": "Contacts"}}
- "Waze-RecentlySearchedLocations" → {{"type": "Waze Location Data", "category": "Location Data"}}

JSON Response:"""

    try:
        print("[ai] classify_ai: request", flush=True)
        response = gemini_model.generate_content(prompt)
        response_text = response.text.strip()

        json_match = re.search(r"\{[^}]*\}", response_text)
        if not json_match:
            raise ValueError("No JSON found in response")

        return json.loads(json_match.group(0))
    except Exception as e:
        raise Exception(f"AI classification failed: {str(e)}")


def batch_classify_ai(filenames: list[str]) -> list[Dict[str, str]]:
    filename_list = "\n".join(f"{i + 1}. {f}" for i, f in enumerate(filenames))

    prompt = f"""
You are an expert at classifying digital forensics file types. Analyze the following filenames and determine for each:

1. TYPE: The specific application/service and data type (e.g., "WhatsApp Messages", "Chrome Browsing History", "Discord Messages")
2. CATEGORY: The general data category (e.g., "Messages", "Browsing History", "Calls", "Contacts", "Location Data")

Filenames to classify:
{filename_list}

Categories to choose from:
- Messages (SMS, WhatsApp, Discord, Teams, Telegram, etc.)
- Browsing History (Chrome, Firefox, Safari, DuckDuckGo, etc.)
- Calls (Phone calls, WhatsApp calls, Teams calls, etc.)
- Contacts (Phone contacts, social media contacts, etc.)
- Location Data (GPS, Maps, Waze, etc.)
- Account Data (Login info, user profiles, etc.)
- File Data (Downloads, media files, etc.)
- Notifications (Push notifications, alerts, etc.)
- Usage Data (App usage, battery, etc.)
- General Data (Unknown or miscellaneous)

Return ONLY a valid JSON array with this exact format:
[
  {{"type": "Specific App Data Type", "category": "General Category"}},
  {{"type": "Specific App Data Type", "category": "General Category"}},
  ...
]

Examples:
- "WhatsApp-OneToOneMessages" → {{"type": "WhatsApp Messages", "category": "Messages"}}
- "DuckDuckGo-WebBrowserHistory" → {{"type": "DuckDuckGo Browsing History", "category": "Browsing History"}}
- "TeamsCallLog" → {{"type": "Teams Calls", "category": "Calls"}}
- "Snapchat-Friends" → {{"type": "Snapchat Contacts", "category": "Contacts"}}
- "Waze-RecentlySearchedLocations" → {{"type": "Waze Location Data", "category": "Location Data"}}

JSON Response:"""

    try:
        print(f"[ai] batch_classify_ai: request for {len(filenames)}", flush=True)
        response = gemini_model.generate_content(prompt)
        response_text = response.text.strip()

        json_match = re.search(r"\[.*\]", response_text, re.DOTALL)
        if not json_match:
            raise ValueError("No JSON array found in response")

        return json.loads(json_match.group(0))
    except Exception as e:
        raise Exception(f"Batch AI classification failed: {str(e)}")


def validate_result(result: Dict[str, str]) -> Dict[str, str]:
    valid_categories = {
        "messages",
        "browsing history",
        "calls",
        "contacts",
        "location data",
        "account data",
        "file data",
        "notifications",
        "usage data",
        "general data",
    }

    file_type = result.get("type", "").strip()
    category = result.get("category", "").strip().lower()

    if category not in valid_categories:
        for valid_cat in valid_categories:
            if any(word in category for word in valid_cat.split()):
                category = valid_cat
                break
        else:
            category = "general data"

    if not file_type:
        file_type = "Unknown Data"

    return {"type": file_type.title(), "category": category}


def clean_filename(filename: str) -> str:
    clean = filename.lower()
    clean = re.sub(r"\.(json|tsv|txt|csv)$", "", clean)
    clean = re.sub(r"^(exported_|extracted_|parsed_)", "", clean)
    clean = re.sub(r"(_exported|_extracted|_parsed)$", "", clean)
    clean = re.sub(r"[-_]", " ", clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean
