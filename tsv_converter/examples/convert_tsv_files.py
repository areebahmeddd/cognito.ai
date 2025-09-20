#!/usr/bin/env python3
"""
Example script for converting TSV files to JSON format.
"""

import os
import sys
import argparse
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import TSVToJSONConverter


def main():
    """Main function for TSV conversion example."""
    parser = argparse.ArgumentParser(description='Convert TSV files to UFDR JSON format')
    parser.add_argument('--input-dir', required=True, help='Directory containing TSV files')
    parser.add_argument('--output-dir', required=True, help='Directory to save JSON files')
    parser.add_argument('--case-id', required=True, help='Case identifier')
    parser.add_argument('--device-id', required=True, help='Device identifier')
    parser.add_argument('--config', help='Path to configuration file')
    
    args = parser.parse_args()
    
    # Validate input directory
    if not os.path.exists(args.input_dir):
        print(f"Error: Input directory '{args.input_dir}' does not exist")
        sys.exit(1)
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    print(f"Converting TSV files from '{args.input_dir}' to '{args.output_dir}'")
    print(f"Case ID: {args.case_id}")
    print(f"Device ID: {args.device_id}")
    
    # Create converter
    converter = TSVToJSONConverter(
        case_id=args.case_id,
        device_id=args.device_id,
        config_path=args.config
    )
    
    # Convert files
    try:
        results = converter.convert_all_files(args.input_dir, args.output_dir)
        
        # Print results
        print(f"\nConversion Summary:")
        print(f"Total files: {results['total_files']}")
        print(f"Successful: {results['successful_conversions']}")
        print(f"Failed: {results['failed_conversions']}")
        print(f"Total records: {results['total_records']}")
        
        if results['errors']:
            print(f"\nErrors encountered:")
            for error in results['errors'][:5]:  # Show first 5 errors
                print(f"  - {error}")
        
        # Print success message
        if results['successful_conversions'] > 0:
            print(f"\n✅ Successfully converted {results['successful_conversions']} files")
            print(f"📁 JSON files saved to: {args.output_dir}")
        
        if results['failed_conversions'] > 0:
            print(f"\n❌ Failed to convert {results['failed_conversions']} files")
            print("Check the log file 'tsv_converter.log' for details")
        
    except Exception as e:
        print(f"Error during conversion: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
