#!/usr/bin/env python3
"""
Simple example of converting a single TSV file.
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from tsv_converter.main import TSVToJSONConverter


def main():
    """Simple conversion example."""
    # Create converter
    converter = TSVToJSONConverter(
        case_id="EXAMPLE-CASE-001",
        device_id="EXAMPLE-DEVICE"
    )
    
    # Example TSV content (Call Logs)
    tsv_content = """Call Date	Phone Account Address	Partner	Type	Duration in Secs	Source File
2020-09-12 14:44:47	2313604902	9195671775	Outgoing	96	/data/calllog.db
2020-09-13 01:38:51	2313604902	+495565102924	Incoming	1	/data/calllog.db"""
    
    # Write TSV file
    with open('example_call_logs.tsv', 'w') as f:
        f.write(tsv_content)
    
    # Convert to JSON
    count = converter.convert_file('example_call_logs.tsv', 'example_call_logs.json')
    
    print(f"Converted {count} records from TSV to JSON")
    print("Check 'example_call_logs.json' for the output")
    
    # Clean up
    import os
    os.remove('example_call_logs.tsv')


if __name__ == '__main__':
    main()

