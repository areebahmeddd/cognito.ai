#!/usr/bin/env python3
"""
Example: Process Forensic Report ZIP File
========================================

This example shows how to process a forensic report ZIP file.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from forensic_processor import ForensicReportProcessor


def main():
    """Example of processing a forensic report ZIP file."""
    
    # Example ZIP file path (modify as needed)
    zip_file = "../../aleapp_report.zip"  # Adjust path as needed
    
    # Case and device information
    case_id = "FORENSIC-CASE-001"
    device_id = "FORENSIC-DEVICE-001"
    
    print("🔍 Forensic Report Processor Example")
    print("=" * 50)
    
    # Check if ZIP file exists
    if not os.path.exists(zip_file):
        print(f"❌ Error: ZIP file not found: {zip_file}")
        print("Please provide a valid forensic report ZIP file")
        return
    
    print(f"📁 Processing: {zip_file}")
    print(f"🆔 Case ID: {case_id}")
    print(f"📱 Device ID: {device_id}")
    
    # Create processor
    processor = ForensicReportProcessor(
        case_id=case_id,
        device_id=device_id
    )
    
    try:
        # Process the ZIP file
        print("\n🚀 Starting processing...")
        results = processor.process_zip_file(zip_file)
        
        # Print detailed results
        print(f"\n🎉 Processing Complete!")
        print(f"📂 Extracted to: {results['extracted_folder']}")
        print(f"📊 TSV files found: {results['tsv_files_found']}")
        print(f"📈 Total records converted: {results['total_records']}")
        print(f"⏱️  Processing time: {results['processing_time']:.2f} seconds")
        
        # Show conversion details
        conversion_results = results['conversion_results']
        if conversion_results:
            print(f"\n📊 Conversion Details:")
            print(f"  • Successful conversions: {conversion_results.get('successful_conversions', 0)}")
            print(f"  • Failed conversions: {conversion_results.get('failed_conversions', 0)}")
            print(f"  • Total records: {conversion_results.get('total_records', 0)}")
        
        # Show where to find the results
        extracted_folder = results['extracted_folder']
        json_folder = os.path.join(extracted_folder, "_JSON Exports")
        report_file = os.path.join(extracted_folder, "forensic_processing_report.json")
        
        print(f"\n📁 Results Location:")
        print(f"  • Extracted report: {extracted_folder}")
        print(f"  • JSON files: {json_folder}")
        print(f"  • Processing report: {report_file}")
        
        # List some of the converted files
        if os.path.exists(json_folder):
            json_files = [f for f in os.listdir(json_folder) if f.endswith('.json')]
            print(f"\n📄 Converted JSON files ({len(json_files)} files):")
            for file in json_files[:5]:  # Show first 5 files
                print(f"  • {file}")
            if len(json_files) > 5:
                print(f"  • ... and {len(json_files) - 5} more files")
        
        print(f"\n✅ Forensic report processed successfully!")
        print(f"🔍 Check the extracted folder for all converted JSON files")
        print(f"📊 Review the processing report for detailed statistics")
        
    except Exception as e:
        print(f"❌ Error processing forensic report: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
