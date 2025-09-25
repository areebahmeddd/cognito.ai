#!/usr/bin/env python3
"""
nlq_engine.py

Gemini-only NLQ engine that uses LLM to generate complete Elasticsearch DSL.
NO local regex/keyword matching - the LLM must produce the entire ES query DSL.

Key principles:
- LLM generates complete ES DSL based on natural language intent
- NO fallback to keyword searches - fail loudly if LLM fails
- Gemini-only (no OpenAI support)
- Always use temperature=0.0 for deterministic outputs
"""

import os
import json
import re
from typing import Dict, Optional
from datetime import datetime
import logging

# Setup logging first
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Configuration from environment
GENAI_API_KEY = os.environ.get("GENAI_API_KEY")
GENAI_MODEL = os.environ.get("GENAI_MODEL", "gemini-2.5-flash")
ES_HOST = os.environ.get("ES_HOST", "http://localhost:9200")
ES_INDEX = os.environ.get("ES_INDEX", "ufdr_records")

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)

# Dynamic imports with proper error handling
genai = None
GENAI_AVAILABLE = False

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
    logger.debug("Google Generative AI SDK loaded successfully")
except ImportError as e:
    logger.warning(f"Google Generative AI SDK not available: {e}")

try:
    from elasticsearch import Elasticsearch
    ES_AVAILABLE = True
    logger.debug("Elasticsearch SDK loaded successfully")
except ImportError as e:
    logger.error(f"Elasticsearch SDK not available: {e}")
    ES_AVAILABLE = False


def strip_code_fences_and_extract_json(text: str) -> str:
    """Strip ```json ... ``` or ``` ... ``` code fences from LLM output."""
    # strip ```json ... ``` or ``` ... ```
    m = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, flags=re.IGNORECASE)
    if m:
        return m.group(1).strip()
    # strip single backticks
    m = re.search(r"`([\s\S]*?)`", text)
    if m:
        return m.group(1).strip()
    return text.strip()


def extract_first_json_obj(text: str) -> str:
    """Extract the first balanced JSON object from text."""
    cleaned = strip_code_fences_and_extract_json(text)
    start = cleaned.find("{")
    if start == -1:
        raise ValueError("No JSON object found in model output.")
    stack = 0
    for i in range(start, len(cleaned)):
        if cleaned[i] == "{":
            stack += 1
        elif cleaned[i] == "}":
            stack -= 1
            if stack == 0:
                return cleaned[start:i+1]
    raise ValueError("Unbalanced JSON braces in model output.")


def parse_llm_json(raw_text: str):
    """Robustly parse JSON from LLM output with fence stripping and brace balancing."""
    sub = extract_first_json_obj(raw_text)
    return json.loads(sub)

def get_llm_model(model_name: Optional[str] = None, debug: bool = True):
    """Get the Gemini model instance."""
    effective_model = model_name or GENAI_MODEL
    
    if debug:
        logger.debug(f"Attempting to get Gemini model: {effective_model}")
    
    # Use Gemini only
    if GENAI_AVAILABLE and GENAI_API_KEY and genai:
        if debug:
            logger.debug("Using Gemini GenerativeAI model")
        
        genai.configure(api_key=GENAI_API_KEY)
        
        if "gemini-2.5-pro" in effective_model:
            return genai.GenerativeModel(model_name="gemini-2.5-pro")
        else:
            return genai.GenerativeModel(model_name="gemini-2.5-flash")
    
    # No valid model available
    else:
        error_msg = "No Gemini API key configured. Set GENAI_API_KEY environment variable."
        if not GENAI_AVAILABLE:
            error_msg = "Gemini SDK not installed. Run: pip install google-generativeai"
        
        raise RuntimeError(error_msg)

def build_llm_prompt(nl_query: str, index: str) -> str:
    """
    Returns the optimized Gemini-ready prompt with placeholders replaced.
    We use simple string replacement for placeholders to avoid f-string / .format
    brace-escaping issues because the prompt contains many JSON braces.
    """
    template = """You are a precise, auditable semantic-search DSL generator for UFDR-like forensic data.
**Run mode:** Gemini 2.5 (flash/pro). **Temperature:** 0.0. **Return ONLY one JSON object** and nothing else.

REQUIRED JSON schema (exact):
{
  "intent": "<short id, e.g. 'search_messages'>",
  "semantic_strategy": "<'vector'|'hybrid'|'textual'>",
  "es_dsl": { /* full Elasticsearch request body (query + size + highlight optional) */ },
  "confidence": <0.0-1.0>,
  "explain": "<one-line explanation>"
}

MANDATES (follow exactly)
1. Return JSON only. No markdown, no backticks, no commentary.
2. `es_dsl` must be a valid Elasticsearch request body that could be passed to `es.search(index, body=es_dsl)` after replacing any vector placeholders.
3. No regex in `es_dsl`.
4. No local/naive fallback. If you cannot produce a reliable DSL, return `es_dsl: {}` and `confidence: 0.0`.
5. Prefer vector/hybrid if embeddings exist. If using vector include a placeholder like:
   "vector_query": {"field":"message_embedding","k":50}
6. If no embeddings, produce semantic textual DSL using match_phrase, multi_match, bool/must, minimum_should_match.
7. For co-occurrence (e.g. "WhatsApp messages about bitcoin") require both app and topic in bool.must.
8. Normalize dates to ISO (e.g. "March 2024" -> "2024-03-01" to "2024-03-31") on fields timestamp/created_at/message_date.
9. Default size: 50. Include highlight for "text" unless user requested otherwise.
10. Use common fields: text, message, body, subject, app, source, thread_id, sender, receiver, timestamp, created_at, _source_file, message_embedding, text_embedding.
11. For crypto addresses / verification codes: do not use regex; prefer token/phrase/context matches or normalized flags (has_crypto_address).
12. Include semantic_strategy ('vector'|'hybrid'|'textual') and a one-line explain.
13. If unsure/confidence < 0.2 set confidence ~0.0 and return es_dsl: {}.

Now generate EXACTLY one JSON object mapping the NL query to an executable (or placeholder-ready) `es_dsl`.

NL_QUERY: "{NL_QUERY}"
INDEX: "{INDEX}"
"""
    # simple, safe replacement
    return template.replace("{NL_QUERY}", nl_query).replace("{INDEX}", index)

def call_gemini_and_parse(nl_query: str, index: str, model_name: Optional[str] = None, max_output_tokens: int = 2048, debug: bool = True):
    """
    Call Gemini model and robustly parse JSON response.
    Returns parsed JSON object and raw text for audit logging.
    """
    # build prompt
    prompt = build_llm_prompt(nl_query, index)
    if debug:
        logger.debug(f"Prompt preview: {prompt[:600].replace('\n', ' ')}...")
    
    # instantiate model exactly as requested
    chosen = model_name or os.environ.get("GENAI_MODEL", "gemini-2.5-flash")
    
    if not GENAI_AVAILABLE:
        raise RuntimeError("Google Generative AI SDK not available")
    
    if not GENAI_API_KEY:
        raise RuntimeError("GENAI_API_KEY environment variable not set")
    
    try:
        # Configure and create model
        genai.configure(api_key=GENAI_API_KEY)
        model = genai.GenerativeModel(model_name=chosen)   # EXACT line you requested
        
        # Generate content with deterministic temperature
        response = model.generate_content(
            prompt, 
            generation_config=genai.types.GenerationConfig(
                temperature=0.0,
                max_output_tokens=max_output_tokens,
                top_p=1.0,
                top_k=1
            )
        )
        
        # Extract text from response
        raw_text = ""
        if hasattr(response, 'text'):
            raw_text = response.text
        elif hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content'):
                if hasattr(candidate.content, 'parts') and candidate.content.parts:
                    raw_text = candidate.content.parts[0].text
                else:
                    raw_text = str(candidate.content)
            else:
                raw_text = str(candidate)
        else:
            raw_text = str(response)
        
        raw_text = raw_text.strip() if raw_text else ""
        
        if debug:
            logger.debug(f"Gemini raw output ({len(raw_text)} chars): {raw_text[:1200]}")

        # parse JSON robustly; raise on failure (fail loudly)
        try:
            parsed = parse_llm_json(raw_text)
        except Exception as e:
            # always include raw_text in logs for debugging — but do NOT send raw_text to external users
            raise RuntimeError(f"Failed to parse JSON from Gemini output: {e}\nRaw (truncated): {raw_text[:4000]}")

        if not isinstance(parsed, dict) or "es_dsl" not in parsed:
            raise RuntimeError(f"Parsed JSON missing 'es_dsl' key. Parsed keys: {list(parsed.keys())}\nRaw (truncated): {raw_text[:4000]}")

        return parsed, raw_text
        
    except Exception as e:
        error_msg = f"Gemini model call failed: {str(e)}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)

def call_openai_model(prompt: str, debug: bool = True) -> str:
    """OpenAI support removed. Use Gemini only."""
    raise RuntimeError("OpenAI support has been removed. Please use Gemini with GENAI_API_KEY.")

def parse_llm_json_response(raw_output: str, debug: bool = True) -> Dict:
    """Parse LLM response to extract JSON, handling common formatting issues."""
    if debug:
        logger.debug(f"Parsing LLM JSON response (length: {len(raw_output)})")
    
    cleaned = raw_output.strip()
    
    # Remove markdown code blocks
    if cleaned.startswith('```json'):
        cleaned = cleaned[7:]
    if cleaned.startswith('```'):
        cleaned = cleaned[3:]
    if cleaned.endswith('```'):
        cleaned = cleaned[:-3]
    
    cleaned = cleaned.strip()
    
    # Find first balanced { ... }
    brace_start = cleaned.find('{')
    if brace_start == -1:
        raise RuntimeError(f"No JSON object found in LLM response. Raw output: {raw_output}")
    
    brace_count = 0
    brace_end = -1
    for i, char in enumerate(cleaned[brace_start:], brace_start):
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                brace_end = i
                break
    
    if brace_end == -1:
        raise RuntimeError(f"Unbalanced braces in LLM response. Raw output: {raw_output}")
    
    json_str = cleaned[brace_start:brace_end + 1]
    
    try:
        parsed = json.loads(json_str)
        
        if debug:
            logger.debug(f"Successfully parsed JSON: {json.dumps(parsed, indent=2)[:300]}...")
        
        return parsed
        
    except json.JSONDecodeError as e:
        error_msg = f"JSON parsing failed: {str(e)}. Extracted JSON: {json_str}. Raw output: {raw_output}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)

def validate_llm_response(parsed_json: Dict, raw_output: str) -> None:
    """Validate that parsed JSON contains required fields for semantic search."""
    if not isinstance(parsed_json, dict):
        raise RuntimeError(f"LLM response is not a JSON object. Raw output: {raw_output}")
    
    # Required fields for the new semantic search format
    if "es_dsl" not in parsed_json:
        raise RuntimeError(f"LLM response missing 'es_dsl' field. Parsed: {parsed_json}. Raw output: {raw_output}")
    
    if not isinstance(parsed_json["es_dsl"], dict):
        raise RuntimeError(f"'es_dsl' field is not a dictionary. Parsed: {parsed_json}. Raw output: {raw_output}")
    
    # Check for semantic_strategy field (new requirement)
    if "semantic_strategy" in parsed_json:
        valid_strategies = ["vector", "hybrid", "textual"]
        strategy = parsed_json["semantic_strategy"]
        if strategy not in valid_strategies:
            raise RuntimeError(f"Invalid semantic_strategy '{strategy}'. Must be one of {valid_strategies}. Raw output: {raw_output}")
    
    # Validate confidence if present
    if "confidence" in parsed_json:
        confidence = parsed_json["confidence"]
        if not isinstance(confidence, (int, float)) or not (0.0 <= confidence <= 1.0):
            raise RuntimeError(f"Invalid confidence value '{confidence}'. Must be float 0.0-1.0. Raw output: {raw_output}")

def run_dsl_against_es(es_dsl: dict, index_name: str, debug: bool = True):
    """Execute the provided Elasticsearch DSL exactly as given."""
    if debug:
        logger.debug(f"Executing ES DSL on index '{index_name}': {json.dumps(es_dsl, indent=2)[:500]}...")
    
    if not ES_AVAILABLE:
        raise RuntimeError("Elasticsearch SDK not available")
    
    try:
        # Initialize ES client
        es = Elasticsearch(ES_HOST, verify_certs=False)
        
        # Execute DSL exactly as provided - no modifications
        result = es.search(index=index_name, body=es_dsl)
        
        if debug:
            try:
                # Try to get hit count for logging
                if hasattr(result, 'body') and 'hits' in result.body:
                    total = result.body['hits'].get('total', {})
                    hit_count = total.get('value', 0) if isinstance(total, dict) else total
                elif hasattr(result, '__getitem__') and 'hits' in result:
                    total = result['hits'].get('total', {})
                    hit_count = total.get('value', 0) if isinstance(total, dict) else total
                else:
                    hit_count = "unknown"
                logger.debug(f"ES query returned {hit_count} hits")
            except:
                logger.debug("ES query completed (hit count unavailable)")
        
        return result
        
    except Exception as e:
        error_msg = f"Elasticsearch execution failed: {str(e)}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)

def fetch_results_for_nl_query(nl_query: str, index: str, model_name: Optional[str] = None, debug: bool = True, user_id: str = "anon") -> dict:
    """
    Convenience wrapper that generates DSL from NL query and executes it.
    Uses the new robust call_gemini_and_parse function with enhanced error handling.
    """
    if debug:
        logger.debug(f"Processing NL query: '{nl_query}'")
    
    try:
        # Generate DSL from natural language using robust parsing
        parsed, raw = call_gemini_and_parse(nl_query, index, model_name=model_name, debug=debug)
        
        es_dsl = parsed["es_dsl"]
        
        # Ensure default size/highlight if not provided
        if "size" not in es_dsl:
            es_dsl["size"] = 50
        if "highlight" not in es_dsl:
            es_dsl["highlight"] = {"fields": {"text": {}}}
        
        # Execute against Elasticsearch
        es_result = run_dsl_against_es(es_dsl, index, debug)
        
        # Return full audit-friendly object
        result = {
            "nl_query": nl_query,
            "model": model_name or GENAI_MODEL,
            "intent": parsed.get("intent", "unknown"),
            "confidence": parsed.get("confidence", 0.0),
            "semantic_strategy": parsed.get("semantic_strategy", ""),
            "explain": parsed.get("explain", ""),
            "es_dsl": es_dsl,
            "es_result": es_result,
            "raw_llm": raw if debug else raw[:500] + "..." if len(raw) > 500 else raw
        }
        
        # Log successful execution
        write_audit_log(result, user_id, status="ok")
        
        return result
        
    except Exception as e:
        # Initialize error result for audit logging
        error_result = {
            "nl_query": nl_query,
            "model": model_name or GENAI_MODEL,
            "intent": "",
            "confidence": 0.0,
            "semantic_strategy": "",
            "explain": "",
            "es_dsl": {},
            "es_result": {"error": str(e)},
            "raw_llm": getattr(e, 'raw_output', str(e))
        }
        
        # Determine error type for appropriate logging
        if "parse JSON" in str(e) or "JSON object found" in str(e):
            write_audit_log(error_result, user_id, status="parse_failed")
        elif "Elasticsearch" in str(e):
            write_audit_log(error_result, user_id, status="es_failed")
        else:
            write_audit_log(error_result, user_id, status="system_failed")
        
        # Return user-safe error message
        raise ValueError("Query processing failed. The incident has been logged for investigation.")

def debug_nl_query_pipeline(nl_query: str, index: str, model_name: Optional[str] = None, user_id: str = "debug") -> dict:
    """
    Debug version of fetch_results_for_nl_query with extensive logging.
    Uses the new robust parsing pipeline for enhanced error handling.
    """
    print(f"\n=== DEBUG: NLQ Pipeline Start ===")
    print(f"Query: {nl_query}")
    print(f"Index: {index}")
    print(f"Model: {model_name or GENAI_MODEL}")
    
    try:
        # Use robust parsing with debug enabled
        parsed, raw = call_gemini_and_parse(nl_query, index, model_name=model_name, debug=True)
        
        print(f"\n--- LLM Raw Output ---")
        print(raw[:1000] + "..." if len(raw) > 1000 else raw)
        
        print(f"\n--- Parsed JSON ---") 
        print(json.dumps(parsed, indent=2))
        
        es_dsl = parsed["es_dsl"]
        
        # Ensure defaults
        if "size" not in es_dsl:
            es_dsl["size"] = 50
        if "highlight" not in es_dsl:
            es_dsl["highlight"] = {"fields": {"text": {}}}
            
        print(f"\n--- Final ES DSL ---")
        print(json.dumps(es_dsl, indent=2))
        
        # Execute
        print(f"\n--- Executing against Elasticsearch ---")
        es_result = run_dsl_against_es(es_dsl, index, debug=True)
        
        print(f"\n--- ES Result Summary ---")
        print(f"Hits: {es_result.get('hits', {}).get('total', {}).get('value', 0)}")
        print(f"Max score: {es_result.get('hits', {}).get('max_score', 'N/A')}")
        
        result = {
            "nl_query": nl_query,
            "model": model_name or GENAI_MODEL,
            "intent": parsed.get("intent", "unknown"),
            "confidence": parsed.get("confidence", 0.0),
            "semantic_strategy": parsed.get("semantic_strategy", ""),
            "explain": parsed.get("explain", ""),
            "es_dsl": es_dsl,
            "es_result": es_result,
            "raw_llm": raw
        }
        
        write_audit_log(result, user_id, status="debug_ok")
        print(f"\n=== DEBUG: Pipeline Success ===")
        
        return result
        
    except Exception as e:
        print(f"\n!!! DEBUG ERROR: {e}")
        print(f"Type: {type(e).__name__}")
        
        error_result = {
            "nl_query": nl_query,
            "model": model_name or GENAI_MODEL,
            "intent": "",
            "confidence": 0.0,
            "semantic_strategy": "",
            "explain": "",
            "es_dsl": {},
            "es_result": {"error": str(e)},
            "raw_llm": getattr(e, 'raw_output', str(e))
        }
        
        write_audit_log(error_result, user_id, status="debug_failed")
        print(f"=== DEBUG: Pipeline Failed ===")
        
        raise

def write_audit_log(result: dict, user_id: str = "anon", status: str = "ok") -> None:
    """
    Write comprehensive audit log entry for NLQ processing to JSONL format.
    
    Each line in logs/nlq_audit.log is a complete JSON object with:
    - Full raw LLM response (for debugging)
    - ES DSL preview (truncated for readability)
    - Complete result metadata
    - Status tracking for monitoring
    """
    try:
        # Extract ES result info safely
        es_result_meta = {"hits_total": 0, "returned": 0}
        
        try:
            es_result = result.get("es_result", {})
            if hasattr(es_result, 'body'):
                es_data = es_result.body
            elif hasattr(es_result, '__getitem__'):
                es_data = es_result
            else:
                es_data = {}
            
            if 'hits' in es_data:
                hits = es_data['hits']
                total = hits.get('total', {})
                if isinstance(total, dict):
                    es_result_meta["hits_total"] = total.get('value', 0)
                else:
                    es_result_meta["hits_total"] = total or 0
                es_result_meta["returned"] = len(hits.get('hits', []))
            
            if 'took' in es_data:
                es_result_meta["took_ms"] = es_data['took']
                
        except Exception as e:
            logger.debug(f"Could not extract ES result info for audit log: {e}")
        
        # Build comprehensive audit entry
        raw_llm = result.get("raw_llm", "")
        es_dsl = result.get("es_dsl", {})
        
        audit_entry = {
            "ts": datetime.now().isoformat() + "Z",  # ISO format with Z timezone
            "user": user_id,
            "nl_query": result.get("nl_query", ""),
            "model": result.get("model", GENAI_MODEL),
            "raw_llm": raw_llm,  # Store full raw LLM response for debugging
            "parsed_intent": {
                "intent": result.get("intent", ""),
                "confidence": result.get("confidence", 0.0),
                "semantic_strategy": result.get("semantic_strategy", "")
            },
            "es_dsl_preview": json.dumps(es_dsl, separators=(',', ':'))[:4000],  # Truncated for readability
            "es_result_meta": es_result_meta,
            "status": status
        }
        
        # Write to JSONL format (one JSON object per line)
        audit_log_path = "logs/nlq_audit.log"
        with open(audit_log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(audit_entry, separators=(',', ':')) + "\n")
        
        # Also log failed responses to separate file for easier debugging
        if status in ("parse_failed", "es_failed") and raw_llm:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            failed_log_path = f"logs/failed_llm/{timestamp}_{status}.txt"
            os.makedirs(os.path.dirname(failed_log_path), exist_ok=True)
            
            with open(failed_log_path, "w", encoding="utf-8") as f:
                f.write(f"Status: {status}\n")
                f.write(f"Query: {result.get('nl_query', '')}\n")
                f.write(f"Model: {result.get('model', GENAI_MODEL)}\n")
                f.write(f"Timestamp: {audit_entry['ts']}\n")
                f.write("=" * 60 + "\n")
                f.write("Raw LLM Response:\n")
                f.write("=" * 60 + "\n")
                f.write(raw_llm)
                
            logger.info(f"Failed LLM response saved to: {failed_log_path}")
            
    except Exception as e:
        logger.error(f"Failed to write audit log: {e}")

if __name__ == "__main__":
    # Simple test when run directly
    try:
        print("Testing NLQ Engine...")
        
        # Test with a simple query first (without ES execution)
        print("1. Testing LLM DSL generation...")
        parsed_json, raw_output = call_gemini_and_parse(
            "Show me WhatsApp messages about bitcoin", 
            ES_INDEX, 
            debug=True
        )
        print(f"✅ LLM generated DSL successfully")
        print(f"Intent: {parsed_json.get('intent', 'unknown')}")
        print(f"Confidence: {parsed_json.get('confidence', 0.0)}")
        print(f"DSL preview: {json.dumps(parsed_json['es_dsl'], indent=2)[:300]}...")
        
        # Test full execution if ES is available
        print("\n2. Testing full NLQ execution...")
        result = fetch_results_for_nl_query(
            "Show me WhatsApp messages about bitcoin", 
            ES_INDEX, 
            debug=True
        )
        
        # Extract hit count safely
        try:
            es_result = result.get('es_result', {})
            if hasattr(es_result, 'body'):
                hits_info = es_result.body.get('hits', {})
            elif hasattr(es_result, '__getitem__'):
                hits_info = es_result.get('hits', {})
            else:
                hits_info = {}
            
            total = hits_info.get('total', {})
            if isinstance(total, dict):
                hit_count = total.get('value', 0)
            else:
                hit_count = total
        except:
            hit_count = "unknown"
        
        print(f"✅ Success! Found {hit_count} results")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()