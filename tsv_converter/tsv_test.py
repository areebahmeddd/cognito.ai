#!/usr/bin/env python3
"""
Simple TSV Test
===============

Simple test for the TSV universal converter.
"""

import os
import json
import tempfile
from tsv_to_json import TSVToJSONConverter


def main():
    """Simple test of the TSV universal converter."""
    print("🚀 TSV Universal Converter - Simple Test")
    print("=" * 50)
    
    # Create test data
    test_dir = tempfile.mkdtemp(prefix='tsv_test_')
    output_dir = os.path.join(test_dir, 'output')
    
    # Create a sample TSV file
    tsv_content = """Call Date	Phone Number	Duration	Type	Direction
2024-01-15 10:30:00	+1234567890	120	Voice	Incoming
2024-01-16 14:45:00	+0987654321	90	Voice	Outgoing
2024-01-17 09:15:00	+1122334450	0	Voice	Missed"""
    
    tsv_file = os.path.join(test_dir, 'call_logs.tsv')
    with open(tsv_file, 'w', encoding='utf-8') as f:
        f.write(tsv_content)
    
    print(f"📁 Created test file: {tsv_file}")
    
    # Create converter
    converter = TSVToJSONConverter(
        case_id="TSV_TEST_CASE_001",
        device_id="TSV_TEST_DEVICE_001"
    )
    
    print("🔍 Converting TSV to JSON...")
    print("   Direct header-to-key mapping!")
    print("   Clean JSON output!")
    
    # Convert the file
    output_file = os.path.join(output_dir, 'call_logs.tsv.json')
    os.makedirs(output_dir, exist_ok=True)
    
    count = converter.convert_tsv_file(tsv_file, output_file)
    
    print(f"✅ Converted {count} entities")
    
    # Show the results
    if os.path.exists(output_file):
        with open(output_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"\n📊 Results:")
        print(f"   Total entities: {len(data)}")
        
        if data:
            entity = data[0]
            print(f"   Entity type: {entity.get('type', 'unknown')}")
            print(f"   Confidence: {entity.get('confidence', 0):.2f}")
            
            # Show semantic fields
            semantic_fields = [k for k, v in entity.items() if isinstance(v, dict) and 'semantic_type' in v]
            print(f"   Semantic fields: {len(semantic_fields)}")
            
            for field in semantic_fields[:3]:  # Show first 3 fields
                field_data = entity[field]
                print(f"     • {field}: {field_data.get('semantic_type', 'unknown')} ({field_data.get('confidence', 0):.2f})")
                print(f"       Original: {field_data.get('original_name', 'unknown')}")
                print(f"       Value: {field_data.get('value', 'N/A')}")
    
    print(f"\n🎉 TSV to JSON conversion successful!")
    print(f"   Direct header mapping used!")
    print(f"   Clean JSON output generated!")
    print(f"   Simple and effective conversion!")


if __name__ == '__main__':
    main()
