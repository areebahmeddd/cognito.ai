#!/usr/bin/env python3
"""
reindex_and_ingest.py

Recreates the Elasticsearch index, builds a mapping based on inferred schema,
and bulk-ingests all JSON files under JSON_Exports.

Important:
 - Update ES_HOST, ES_INDEX if necessary.
 - This script prints each major step and summary counts.

Run:
  python reindex_and_ingest.py
"""

import os, json, time, sys, re
from elasticsearch import Elasticsearch, helpers
from collections import defaultdict, Counter
from datetime import datetime

ROOT = os.path.abspath(os.path.dirname(__file__))
EXPORT_DIR = os.path.join(ROOT, "JSON_Exports")
ES_HOST = os.environ.get("ES_HOST", "http://localhost:9200")
ES_INDEX = os.environ.get("ES_INDEX", "ufdr_records")

# Adjust batch size for bulk ingestion
BATCH_SIZE = 500

print(f"[CONFIG] Elasticsearch Host: {ES_HOST}")
print(f"[CONFIG] Target Index: {ES_INDEX}")
print(f"[CONFIG] JSON Export Directory: {EXPORT_DIR}")
print(f"[CONFIG] Batch Size: {BATCH_SIZE}")

es = Elasticsearch(ES_HOST, verify_certs=False)

def check_elasticsearch_connection():
    """Verify Elasticsearch is accessible"""
    try:
        if not es.ping():
            print("[ERROR] Elasticsearch is not reachable!")
            return False
        
        cluster_info = es.info()
        print(f"[INFO] Connected to Elasticsearch:")
        print(f"  • Version: {cluster_info['version']['number']}")
        print(f"  • Cluster: {cluster_info['cluster_name']}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to connect to Elasticsearch: {e}")
        return False

def infer_field_type(py_type_str):
    """
    Map Python type strings to Elasticsearch field mappings.
    This is a simple mapping - customize for your specific needs.
    """
    if py_type_str.startswith("date"):
        return {
            "type": "date", 
            "format": "strict_date_optional_time||yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
        }
    elif py_type_str in ("integer",):
        return {"type": "long"}
    elif py_type_str in ("float",):
        return {"type": "double"}
    elif py_type_str in ("boolean",):
        return {"type": "boolean"}
    elif py_type_str in ("object",):
        return {"type": "object", "enabled": False}  # Don't index nested objects by default
    elif py_type_str in ("array",):
        return {"type": "nested"}
    elif py_type_str in ("url",):
        return {"type": "keyword"}  # URLs as exact matches
    elif py_type_str in ("email",):
        return {"type": "keyword"}  # Emails as exact matches
    elif py_type_str in ("phone",):
        return {"type": "keyword"}  # Phone numbers as exact matches
    elif py_type_str in ("long_text",):
        return {
            "type": "text",
            "analyzer": "standard",
            "fields": {
                "keyword": {"type": "keyword", "ignore_above": 512}
            }
        }
    else:
        # Default to text with keyword subfield for aggregations
        return {
            "type": "text",
            "fields": {
                "keyword": {"type": "keyword", "ignore_above": 256}
            }
        }

def build_mapping_from_samples(samples):
    """
    Build Elasticsearch mapping from field type samples.
    samples: dict fieldname -> Counter of types
    """
    properties = {}
    
    print("[INFO] Building optimized mapping from data samples...")
    
    # Reserved Elasticsearch fields that shouldn't be in mapping
    reserved_fields = {'_id', '_index', '_type', '_source', '_score', '_routing', '_parent'}
    
    for field, types_counter in samples.items():
        # Skip reserved Elasticsearch fields
        if field in reserved_fields:
            print(f"  • Skipping reserved field: {field}")
            continue
            
        # Pick the most common type for this field
        most_common_type, count = types_counter.most_common(1)[0]
        properties[field] = infer_field_type(most_common_type)
        
        # Special handling for common forensic fields
        field_lower = field.lower()
        
        if 'message' in field_lower or 'body' in field_lower or 'text' in field_lower:
            # Optimize message fields for forensic analysis
            properties[field] = {
                "type": "text",
                "analyzer": "standard",
                "fields": {
                    "keyword": {"type": "keyword", "ignore_above": 512},
                    "search": {
                        "type": "text",
                        "analyzer": "standard",
                        "search_analyzer": "standard"
                    }
                }
            }
        elif 'timestamp' in field_lower or 'date' in field_lower:
            # Ensure all date fields have flexible parsing
            properties[field] = {
                "type": "date",
                "format": "strict_date_optional_time||yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis||yyyy-MM-dd'T'HH:mm:ss.SSSSSS"
            }
        elif 'id' in field_lower:
            # IDs should be keywords for exact matching
            properties[field] = {"type": "keyword"}
    
    # Add special forensic analysis fields
    properties.update({
        "_source_file": {"type": "keyword"},
        "_ingest_time": {"type": "date"},
        "_analysis_flags": {
            "type": "object",
            "properties": {
                "has_verification_code": {"type": "boolean"},
                "has_crypto_content": {"type": "boolean"},
                "has_phone_number": {"type": "boolean"},
                "platform": {"type": "keyword"}
            }
        }
    })
    
    # Root mapping with settings optimized for forensic search
    mapping = {
        "settings": {
            "number_of_shards": 1,
            "number_of_replicas": 0,  # No replicas for development
            "analysis": {
                "analyzer": {
                    "forensic_analyzer": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": ["lowercase", "stop"]
                    },
                    "code_analyzer": {
                        "type": "keyword",  # Don't analyze verification codes
                        "normalizer": "lowercase"
                    }
                },
                "normalizer": {
                    "lowercase": {
                        "type": "custom",
                        "filter": ["lowercase"]
                    }
                }
            },
            "refresh_interval": "30s"  # Optimize for bulk ingestion
        },
        "mappings": {
            "properties": properties
        }
    }
    
    return mapping

def scan_and_collect_types():
    """
    Scan all JSON files and collect field type information.
    Returns type statistics and total record count.
    """
    print("[STEP 1] Scanning JSON_Exports to infer field types...")
    
    if not os.path.exists(EXPORT_DIR):
        print(f"[ERROR] JSON_Exports directory not found: {EXPORT_DIR}")
        return None, 0
    
    types = defaultdict(lambda: defaultdict(int))
    count = 0
    file_count = 0
    
    for root, _, files in os.walk(EXPORT_DIR):
        json_files = [f for f in files if f.lower().endswith('.json')]
        
        for name in json_files:
            path = os.path.join(root, name)
            file_count += 1
            
            print(f"  • Analyzing {name} ({file_count})")
            
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except Exception as e:
                print(f"[WARN] Failed to parse {path}: {e}")
                continue
            
            # Handle both single objects and arrays
            if isinstance(data, dict):
                records = [data]
            else:
                records = data
            
            # Process each record
            for rec in records:
                if not isinstance(rec, dict):
                    continue
                    
                count += 1
                
                for k, v in rec.items():
                    # Determine type with enhanced detection
                    t = determine_field_type(v)
                    types[k][t] += 1
    
    print(f"[INFO] Processed {file_count} files, found ~{count:,} records")
    print(f"[INFO] Discovered {len(types)} unique fields")
    
    return types, count

def determine_field_type(value):
    """Enhanced field type detection for forensic data"""
    if value is None:
        return "null"
    elif isinstance(value, bool):
        return "boolean"
    elif isinstance(value, int):
        return "integer"
    elif isinstance(value, float):
        return "float"
    elif isinstance(value, str):
        # Enhanced string type detection
        from dateutil import parser as dateparser
        try:
            dateparser.parse(value)
            return "datetime" if len(value) > 10 else "date"
        except Exception:
            if value.startswith("http"):
                return "url"
            elif "@" in value and "." in value and len(value.split("@")) == 2:
                return "email"
            elif value.startswith("+") or (value.replace("-", "").replace(" ", "").replace("(", "").replace(")", "").isdigit() and len(value) > 7):
                return "phone"
            elif len(value) > 200:
                return "long_text"
            else:
                return "string"
    elif isinstance(value, dict):
        return "object"
    elif isinstance(value, list):
        return "array"
    else:
        return "unknown"

def create_index_with_mapping(index_name, mapping_body, recreate=True):
    """Create Elasticsearch index with the provided mapping"""
    print(f"[STEP 2] Setting up Elasticsearch index: {index_name}")
    
    if recreate and es.indices.exists(index=index_name):
        print(f"  • Deleting existing index: {index_name}")
        es.indices.delete(index=index_name)
        time.sleep(1)  # Give ES time to process deletion
    
    print(f"  • Creating new index: {index_name}")
    try:
        es.indices.create(index=index_name, body=mapping_body)
        print("  ✅ Index created successfully")
        
        # Verify the mapping was applied
        mapping_info = es.indices.get_mapping(index=index_name)
        field_count = len(mapping_info[index_name]["mappings"]["properties"])
        print(f"  • Applied mapping with {field_count} field definitions")
        
    except Exception as e:
        print(f"[ERROR] Failed to create index: {e}")
        raise

def analyze_record_for_flags(record):
    """Analyze record content for forensic flags"""
    flags = {
        "has_verification_code": False,
        "has_crypto_content": False,
        "has_phone_number": False,
        "platform": "unknown"
    }
    
    # Convert record to searchable text
    text_fields = []
    for key, value in record.items():
        if isinstance(value, str):
            text_fields.append(value.lower())
        elif key.lower() in ['message', 'body', 'text', 'content', 'subject']:
            text_fields.append(str(value).lower())
    
    combined_text = " ".join(text_fields)
    
    # Check for verification codes
    verification_terms = ['verification', 'code', 'otp', 'confirm', 'passcode', 'pin']
    if any(term in combined_text for term in verification_terms):
        # Look for numeric patterns that might be codes
        if re.search(r'\b\d{4,8}\b', combined_text):
            flags["has_verification_code"] = True
    
    # Check for crypto content
    crypto_terms = ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain', 'wallet']
    if any(term in combined_text for term in crypto_terms):
        flags["has_crypto_content"] = True
    
    # Check for phone numbers
    phone_patterns = [r'\+\d{10,15}', r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b']
    for pattern in phone_patterns:
        if re.search(pattern, combined_text):
            flags["has_phone_number"] = True
            break
    
    # Detect platform from source path
    source_path = record.get("source_path", "").lower()
    if "whatsapp" in source_path:
        flags["platform"] = "whatsapp"
    elif "sms" in source_path:
        flags["platform"] = "sms"
    elif "telegram" in source_path:
        flags["platform"] = "telegram"
    elif "chrome" in source_path:
        flags["platform"] = "chrome"
    elif "facebook" in source_path:
        flags["platform"] = "facebook"
    
    return flags

def doc_generator():
    """
    Generator function that yields Elasticsearch bulk actions.
    Each JSON record becomes a document with added metadata.
    """
    print("[STEP 3] Generating documents for bulk ingestion...")
    
    total_docs = 0
    
    for root, _, files in os.walk(EXPORT_DIR):
        json_files = [f for f in files if f.lower().endswith('.json')]
        
        for name in json_files:
            path = os.path.join(root, name)
            print(f"  • Processing file: {name}")
            
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except Exception as e:
                print(f"[WARN] Failed to parse {path}: {e}")
                continue
            
            # Handle both single objects and arrays
            if isinstance(data, dict):
                records = [data]
            else:
                records = data
            
            file_doc_count = 0
            for rec in records:
                if not isinstance(rec, dict):
                    continue
                
                # Create enriched record
                rec_meta = rec.copy()
                
                # Add metadata fields
                rec_meta["_source_file"] = os.path.relpath(path, ROOT)
                rec_meta["_ingest_time"] = datetime.now().isoformat() + "Z"
                
                # Add forensic analysis flags
                rec_meta["_analysis_flags"] = analyze_record_for_flags(rec)
                
                # Generate document action for Elasticsearch
                yield {
                    "_index": ES_INDEX,
                    "_source": rec_meta
                }
                
                file_doc_count += 1
                total_docs += 1
            
            print(f"    → Generated {file_doc_count} documents")
    
    print(f"[INFO] Total documents prepared for ingestion: {total_docs:,}")

def bulk_ingest():
    """Perform bulk ingestion with progress reporting and error handling"""
    print("[STEP 4] Starting bulk ingestion...")
    
    start_time = time.time()
    success_count = 0
    error_count = 0
    
    try:
        # Use parallel_bulk for better error handling
        for success, info in helpers.parallel_bulk(
            es, 
            doc_generator(), 
            chunk_size=BATCH_SIZE,
            max_chunk_bytes=5 * 1024 * 1024,  # Smaller 5MB chunks
            timeout="120s",
            max_retries=2,
            thread_count=2,
            raise_on_error=False,
            raise_on_exception=False
        ):
            if success:
                success_count += 1
            else:
                error_count += 1
                if error_count <= 10:  # Log first 10 errors
                    print(f"[WARN] Document indexing failed: {str(info)[:200]}...")
            
            # Progress reporting every 5000 documents
            if (success_count + error_count) % 5000 == 0:
                print(f"  • Progress: {success_count + error_count:,} documents processed ({success_count:,} success, {error_count:,} failed)")
    
    except Exception as e:
        print(f"[ERROR] Bulk ingestion encountered error: {e}")
        # Continue with what we have
    
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"[COMPLETED] Bulk ingestion finished:")
    print(f"  • Successfully ingested: {success_count:,} documents")
    print(f"  • Failed: {error_count:,} documents")
    print(f"  • Duration: {duration:.2f} seconds")
    if duration > 0 and success_count > 0:
        print(f"  • Rate: {success_count/duration:.0f} docs/second")
    
    return success_count, error_count

def verify_ingestion():
    """Verify the ingestion was successful"""
    print("[STEP 5] Verifying ingestion...")
    
    # Wait for refresh
    time.sleep(2)
    
    try:
        # Get document count
        result = es.count(index=ES_INDEX)
        doc_count = result['count']
        
        # Get some sample documents
        search_result = es.search(
            index=ES_INDEX,
            body={
                "size": 5,
                "query": {"match_all": {}},
                "source": ["_source_file", "_analysis_flags", "message", "timestamp"]
            }
        )
        
        print(f"[VERIFY] Elasticsearch reports {doc_count:,} documents in {ES_INDEX}")
        
        # Show sample documents
        print("[VERIFY] Sample documents:")
        for i, hit in enumerate(search_result['hits']['hits'][:5]):
            source = hit['_source']
            print(f"  {i+1}. File: {source.get('_source_file', 'unknown')}")
            if '_analysis_flags' in source:
                flags = source['_analysis_flags']
                print(f"     Platform: {flags.get('platform', 'unknown')}")
                print(f"     Has verification: {flags.get('has_verification_code', False)}")
                print(f"     Has crypto: {flags.get('has_crypto_content', False)}")
            
        # Test search capabilities
        print("[VERIFY] Testing search capabilities...")
        
        # Test message search
        message_search = es.count(
            index=ES_INDEX,
            body={"query": {"exists": {"field": "message"}}}
        )
        print(f"  • Documents with messages: {message_search['count']:,}")
        
        # Test verification code search
        verification_search = es.count(
            index=ES_INDEX,
            body={"query": {"term": {"_analysis_flags.has_verification_code": True}}}
        )
        print(f"  • Documents with verification codes: {verification_search['count']:,}")
        
        # Test crypto content search
        crypto_search = es.count(
            index=ES_INDEX,
            body={"query": {"term": {"_analysis_flags.has_crypto_content": True}}}
        )
        print(f"  • Documents with crypto content: {crypto_search['count']:,}")
        
        return doc_count > 0
        
    except Exception as e:
        print(f"[ERROR] Verification failed: {e}")
        return False

def main():
    """Main execution function"""
    print("🚀 UFDR Elasticsearch Reindexing & Ingestion Tool")
    print("=" * 60)
    
    # Check Elasticsearch connection
    if not check_elasticsearch_connection():
        return False
    
    # Scan and collect field types
    types, record_count = scan_and_collect_types()
    if types is None:
        return False
    
    # Convert to Counter format for mapping builder
    samples = {k: Counter(v) for k, v in types.items()}
    
    # Build mapping
    mapping = build_mapping_from_samples(samples)
    
    print(f"[INFO] Generated mapping with {len(mapping['mappings']['properties'])} field definitions")
    
    # Show sample mapping
    print("[INFO] Sample field mappings:")
    sample_props = list(mapping['mappings']['properties'].items())[:10]
    for k, v in sample_props:
        print(f"  • {k}: {v}")
    
    # Create index with mapping
    create_index_with_mapping(ES_INDEX, mapping, recreate=True)
    
    # Perform bulk ingestion
    success_count, error_count = bulk_ingest()
    
    # Verify the ingestion
    if verify_ingestion():
        print("\n🎉 SUCCESS: UFDR data successfully ingested into Elasticsearch!")
        print(f"   • Index: {ES_INDEX}")
        print(f"   • Documents: {success_count:,}")
        print("   • Ready for NLQ testing")
        return True
    else:
        print("\n❌ FAILED: Ingestion verification failed")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)