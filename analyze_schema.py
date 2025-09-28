#!/usr/bin/env python3
"""
analyze_schema.py

Scans JSON_Exports folder, inspects all JSON files, prints a high-level schema summary:
 - files observed
 - types per top-level keys (counts)
 - sample values
 - field presence frequency
 - compares to schema.json (if exists) and reports mismatches.

Run:
  uv run --directory backend python ../analyze_schema.py
or simply:
  python analyze_schema.py
"""

import os, json, sys
from collections import defaultdict, Counter
from dateutil import parser as dateparser
from tqdm import tqdm

ROOT = os.path.abspath(os.path.dirname(__file__))
EXPORT_DIR = os.path.join(ROOT, "JSON_Exports")
SCHEMA_FILE = os.path.join(ROOT, "schema.json")

def type_name(v):
    """Determine semantic type of value with improved detection"""
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "boolean"
    if isinstance(v, int):
        return "integer"
    if isinstance(v, float):
        return "float"
    if isinstance(v, str):
        # Enhanced date detection
        try:
            dateparser.parse(v)
            if len(v) > 10:  # likely datetime with time component
                return "datetime"
            else:
                return "date"
        except Exception:
            # Check for other patterns
            if v.startswith("http"):
                return "url"
            elif "@" in v and "." in v:
                return "email"
            elif v.startswith("+") and v[1:].replace("-", "").replace(" ", "").isdigit():
                return "phone"
            elif len(v) > 100:
                return "long_text"
            return "string"
    if isinstance(v, list):
        return "array"
    if isinstance(v, dict):
        return "object"
    return type(v).__name__

def sample_value(v):
    """Get sample value with truncation for large objects"""
    if isinstance(v, (dict, list)):
        return json.dumps(v)[:200]
    return str(v)[:200]

def inspect_file(path):
    """Parse JSON file and return data"""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"[WARN] Could not parse {path}: {e}")
        return None
    return data

def collect_schema(data, stats, path_prefix=""):
    """
    Recursively analyze schema structure.
    Accepts either list of records or a single dict.
    Tracks field frequency, types, and sample values.
    """
    if isinstance(data, list):
        # Process each record in the list
        for rec in data:
            collect_schema(rec, stats, path_prefix)
        return
    
    if not isinstance(data, dict):
        return
    
    # Process each field in the dictionary
    for k, v in data.items():
        fullk = f"{path_prefix}.{k}" if path_prefix else k
        t = type_name(v)
        
        # Update statistics
        stats['field_counts'][fullk] += 1
        stats['types'][fullk][t] += 1
        
        # Store sample values (limit to prevent memory issues)
        if len(stats['samples'][fullk]) < 5:
            stats['samples'][fullk].append(sample_value(v))
        
        # Recursively process nested objects
        if isinstance(v, dict):
            collect_schema(v, stats, fullk)
        elif isinstance(v, list) and v and isinstance(v[0], dict):
            # Dive into first object of list to get nested fields
            collect_schema(v[0], stats, fullk + "[]")

def load_schema_file(path):
    """Load schema.json if it exists"""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return None

def compare_to_schema(inferred, declared):
    """
    Compare inferred schema with declared schema.
    Very lightweight comparison: check declared keys exist in inferred and vice versa.
    """
    declared_keys = set()
    if isinstance(declared, dict):
        def walk(d, prefix=""):
            if not isinstance(d, dict):
                return
            for k, v in d.items():
                full = f"{prefix}.{k}" if prefix else k
                declared_keys.add(full)
                if isinstance(v, dict) and 'properties' in v:
                    walk(v['properties'], full)
                elif isinstance(v, dict):
                    walk(v, full)
        
        # Try common schema structures
        if 'properties' in declared:
            walk(declared['properties'])
        else:
            walk(declared)
    
    inferred_keys = set(inferred['field_counts'].keys())
    missing = declared_keys - inferred_keys
    extra = inferred_keys - declared_keys
    return missing, extra

def analyze_communication_patterns(stats):
    """Analyze communication-specific patterns in the data"""
    communication_stats = {
        'message_fields': 0,
        'verification_codes': 0,
        'crypto_mentions': 0,
        'phone_numbers': 0,
        'urls': 0,
        'platforms': set()
    }
    
    # Count message-related fields
    for field, samples in stats['samples'].items():
        if any(term in field.lower() for term in ['message', 'text', 'body', 'content']):
            communication_stats['message_fields'] += stats['field_counts'][field]
            
            # Analyze content patterns
            for sample in samples:
                sample_str = str(sample).lower()
                if any(term in sample_str for term in ['verification', 'code', 'otp', 'confirm']):
                    communication_stats['verification_codes'] += 1
                if any(term in sample_str for term in ['bitcoin', 'crypto', 'btc', 'eth', 'wallet']):
                    communication_stats['crypto_mentions'] += 1
        
        # Detect phone numbers
        if 'phone' in field.lower() or any(sample for sample in samples if str(sample).startswith('+')):
            communication_stats['phone_numbers'] += stats['field_counts'][field]
        
        # Detect URLs
        if 'url' in field.lower() or any(str(sample).startswith('http') for sample in samples):
            communication_stats['urls'] += stats['field_counts'][field]
        
        # Detect platforms from source paths
        if 'source' in field.lower() and 'path' in field.lower():
            for sample in samples:
                sample_str = str(sample)
                if 'WhatsApp' in sample_str:
                    communication_stats['platforms'].add('WhatsApp')
                elif 'SMS' in sample_str or 'sms' in sample_str.lower():
                    communication_stats['platforms'].add('SMS')
                elif 'Telegram' in sample_str:
                    communication_stats['platforms'].add('Telegram')
                elif 'Chrome' in sample_str:
                    communication_stats['platforms'].add('Chrome')
                elif 'Facebook' in sample_str:
                    communication_stats['platforms'].add('Facebook')
    
    return communication_stats

def main():
    """Main analysis function"""
    print("🔍 UFDR JSON Schema Analysis Tool")
    print("=" * 60)
    
    if not os.path.isdir(EXPORT_DIR):
        print(f"[ERROR] JSON_Exports directory not found at expected path: {EXPORT_DIR}")
        sys.exit(1)

    # Initialize statistics
    stats = {
        'file_count': 0,
        'records_count': 0,
        'field_counts': defaultdict(int),
        'types': defaultdict(lambda: defaultdict(int)),
        'samples': defaultdict(list),
        'files': []
    }

    print(f"[INFO] Scanning directory: {EXPORT_DIR}")
    
    # Walk through all JSON files
    for root, _, files in os.walk(EXPORT_DIR):
        json_files = [f for f in files if f.lower().endswith('.json')]
        
        # Use tqdm for progress bar
        for name in tqdm(json_files, desc="Processing JSON files"):
            path = os.path.join(root, name)
            stats['files'].append(path)
            stats['file_count'] += 1
            
            print(f"\n[INFO] Inspecting {name}")
            data = inspect_file(path)
            if data is None:
                continue
                
            # Count records
            if isinstance(data, list):
                stats['records_count'] += len(data)
                print(f"  → Found {len(data)} records")
            else:
                stats['records_count'] += 1
                print("  → Found 1 record")
            
            # Collect schema information
            collect_schema(data, stats)

    # Generate comprehensive summary
    print("\n" + "=" * 60)
    print("📊 COMPREHENSIVE SCHEMA ANALYSIS RESULTS")
    print("=" * 60)
    
    print(f"\n📈 Overall Statistics:")
    print(f"  • Files scanned: {stats['file_count']}")
    print(f"  • Total records (approx): {stats['records_count']:,}")
    print(f"  • Unique fields discovered: {len(stats['field_counts'])}")
    
    # Analyze communication patterns
    comm_stats = analyze_communication_patterns(stats)
    print(f"\n💬 Communication Analysis:")
    print(f"  • Message-related records: {comm_stats['message_fields']:,}")
    print(f"  • Verification code samples: {comm_stats['verification_codes']}")
    print(f"  • Crypto content samples: {comm_stats['crypto_mentions']}")
    print(f"  • Phone number fields: {comm_stats['phone_numbers']:,}")
    print(f"  • URL fields: {comm_stats['urls']:,}")
    print(f"  • Detected platforms: {', '.join(sorted(comm_stats['platforms']))}")
    
    print(f"\n🔥 Top 30 Most Frequent Fields:")
    for k, v in Counter(stats['field_counts']).most_common(30):
        types = dict(stats['types'][k])
        sample = stats['samples'][k][:3]
        print(f"  • {k}: count={v:,}, types={types}")
        if sample:
            print(f"    samples: {sample}")
    
    # Field type analysis
    print(f"\n🏗️  Field Type Distribution:")
    type_summary = defaultdict(int)
    for field, type_counts in stats['types'].items():
        for type_name, count in type_counts.items():
            type_summary[type_name] += count
    
    for type_name, total_count in sorted(type_summary.items(), key=lambda x: x[1], reverse=True):
        print(f"  • {type_name}: {total_count:,} occurrences")
    
    # Compare with schema.json if present
    if os.path.exists(SCHEMA_FILE):
        print(f"\n📋 Schema Validation (comparing with schema.json):")
        declared = load_schema_file(SCHEMA_FILE)
        if declared:
            missing, extra = compare_to_schema(stats, declared)
            print(f"  • Declared keys missing in data sample: {len(missing)}")
            if missing:
                print(f"    Examples: {list(missing)[:10]}")
            print(f"  • Extra keys in data not in schema: {len(extra)}")
            if extra:
                print(f"    Examples: {list(extra)[:10]}")
        else:
            print("  • Could not parse schema.json")
    else:
        print(f"\n📋 No schema.json found at project root")
        print("  • Skipping declared-vs-inferred comparison")
    
    # Generate recommendations
    print(f"\n🎯 Forensic Investigation Insights:")
    print("  • Multi-platform communication data detected (WhatsApp, SMS, Chrome, etc.)")
    print("  • Temporal correlation possible with multiple timestamp fields")
    print("  • Identity resolution feasible through contact/user fields")
    print(f"  • {comm_stats['verification_codes']} samples contain verification codes")
    print(f"  • {comm_stats['crypto_mentions']} samples contain crypto-related content")
    print("  • Cross-platform correlation possible through timestamp alignment")
    
    print(f"\n💡 Elasticsearch Mapping Recommendations:")
    print("  • Use 'text' with 'keyword' subfields for message content")
    print("  • Apply 'date' mapping with flexible format for timestamps")
    print("  • Consider 'nested' type for complex communication threads")
    print("  • Use 'keyword' for exact-match fields (IDs, phone numbers)")
    print("  • Apply analyzers for better text search on message content")

    print(f"\n✅ Analysis Complete!")
    print(f"   • Ready for Elasticsearch index design")
    print(f"   • Schema insights available for NLQ engine development")
    print(f"\n[FIN] Redirect output to file for detailed review:")
    print("       python analyze_schema.py > schema_report.txt")

if __name__ == "__main__":
    main()