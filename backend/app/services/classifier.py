import json
import re
from typing import Dict, Any, Optional
import google.generativeai as genai
from ..core.config import settings

# Configure Gemini
genai.configure(api_key=settings.gemini_api_key)
gemini_model = genai.GenerativeModel(model_name="gemini-2.5-flash")


def classify_file_type(filename: str) -> Dict[str, str]:
    """
    Classify file type using AI to determine both specific type and general category.
    
    Args:
        filename: The filename to classify
        
    Returns:
        Dict with 'type' and 'category' keys
    """
    try:
        # Clean filename for better classification
        clean_filename = clean_filename_for_ai(filename)
        
        # Generate AI classification
        result = classify_with_ai(clean_filename)
        
        # Validate and clean the result
        return validate_classification(result)
        
    except Exception as e:
        print(f"AI classification failed for {filename}: {e}")
        # Fallback to rule-based classification
        return fallback_classification(filename)


def clean_filename_for_ai(filename: str) -> str:
    """Clean filename to make it more suitable for AI classification"""
    # Remove common file extensions
    clean = filename.lower()
    clean = re.sub(r'\.(json|tsv|txt|csv)$', '', clean)
    
    # Remove common prefixes/suffixes that don't add meaning
    clean = re.sub(r'^(exported_|extracted_|parsed_)', '', clean)
    clean = re.sub(r'(_exported|_extracted|_parsed)$', '', clean)
    
    # Replace underscores and hyphens with spaces for better readability
    clean = re.sub(r'[-_]', ' ', clean)
    
    # Clean up multiple spaces
    clean = re.sub(r'\s+', ' ', clean).strip()
    
    return clean


def classify_with_ai(filename: str) -> Dict[str, str]:
    """Use Gemini 2.5 Flash to classify the file"""
    
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
        response = gemini_model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Extract JSON from response (in case there's extra text)
        json_match = re.search(r'\{[^}]*\}', response_text)
        if json_match:
            json_str = json_match.group(0)
            return json.loads(json_str)
        else:
            raise ValueError("No JSON found in response")
            
    except Exception as e:
        raise Exception(f"AI classification failed: {e}")


def validate_classification(result: Dict[str, str]) -> Dict[str, str]:
    """Validate and clean the AI classification result"""
    
    # Valid categories
    valid_categories = {
        "messages", "browsing history", "calls", "contacts", 
        "location data", "account data", "file data", 
        "notifications", "usage data", "general data"
    }
    
    # Extract and clean
    file_type = result.get("type", "").strip()
    category = result.get("category", "").strip().lower()
    
    # Validate category
    if category not in valid_categories:
        # Try to find closest match
        for valid_cat in valid_categories:
            if any(word in category for word in valid_cat.split()):
                category = valid_cat
                break
        else:
            category = "general data"
    
    # Clean up type
    if not file_type:
        file_type = "Unknown Data"
    
    # Ensure type is properly formatted
    file_type = file_type.title()
    
    return {
        "type": file_type,
        "category": category
    }

def batch_classify_files(filenames: list[str]) -> Dict[str, Dict[str, str]]:
    """
    Classify multiple files in a single API call to avoid rate limits.
    
    Args:
        filenames: List of filenames to classify
        
    Returns:
        Dict mapping filename -> classification result
    """
    try:
        # Clean all filenames
        clean_filenames = [clean_filename_for_ai(f) for f in filenames]
        
        # Generate batch AI classification
        result = batch_classify_with_ai(clean_filenames)
        
        # Map back to original filenames and validate
        classifications = {}
        for i, filename in enumerate(filenames):
            if i < len(result):
                classifications[filename] = validate_classification(result[i])
            else:
                # Fallback for any missing classifications
                classifications[filename] = fallback_classification(filename)
        
        return classifications
        
    except Exception as e:
        print(f"Batch AI classification failed: {e}")
        # Fallback to individual rule-based classification
        return {filename: fallback_classification(filename) for filename in filenames}


def batch_classify_with_ai(filenames: list[str]) -> list[Dict[str, str]]:
    """Use Gemini 2.5 Flash to classify multiple files in one request"""
    
    # Create a numbered list for better organization
    filename_list = "\n".join([f"{i+1}. {filename}" for i, filename in enumerate(filenames)])
    
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
        response = gemini_model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Extract JSON array from response
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            return json.loads(json_str)
        else:
            raise ValueError("No JSON array found in response")
            
    except Exception as e:
        raise Exception(f"Batch AI classification failed: {e}")


def fallback_classification(filename: str) -> Dict[str, str]:
    """Fallback rule-based classification when AI fails"""
    
    base_name = filename.lower().replace(".json", "").replace(".tsv", "").replace(".txt", "")
    
    # Message patterns
    if any(keyword in base_name for keyword in ["whatsapp", "sms", "message", "chat", "discord", "teams", "telegram", "viber", "tiktok"]):
        return {"type": "Message Data", "category": "messages"}
    
    # Browsing history patterns
    if any(keyword in base_name for keyword in ["browser", "webhistory", "chrome", "firefox", "safari", "duckduckgo", "search"]):
        return {"type": "Browsing History", "category": "browsing history"}
    
    # Call patterns
    if any(keyword in base_name for keyword in ["call", "phone", "duo", "teamscall"]):
        return {"type": "Call Data", "category": "calls"}
    
    # Contact patterns
    if any(keyword in base_name for keyword in ["contact", "friends", "users", "snapchat"]):
        return {"type": "Contact Data", "category": "contacts"}
    
    # Location patterns
    if any(keyword in base_name for keyword in ["location", "gps", "maps", "waze", "life360"]):
        return {"type": "Location Data", "category": "location data"}
    
    # Account patterns
    if any(keyword in base_name for keyword in ["account", "userid", "identity", "login", "user"]):
        return {"type": "Account Data", "category": "account data"}
    
    # File patterns
    if any(keyword in base_name for keyword in ["file", "download", "media", "image", "video", "audio"]):
        return {"type": "File Data", "category": "file data"}
    
    # Notification patterns
    if any(keyword in base_name for keyword in ["notification", "alert", "fcm"]):
        return {"type": "Notification Data", "category": "notifications"}
    
    # Usage patterns
    if any(keyword in base_name for keyword in ["usage", "battery", "turbo", "wellbeing"]):
        return {"type": "Usage Data", "category": "usage data"}
    
    return {"type": "Unknown Data", "category": "general data"}



