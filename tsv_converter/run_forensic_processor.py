#!/usr/bin/env python3
"""
Run Forensic Processor with File Picker
=======================================

Simple script to run the forensic processor with a file picker dialog.
"""

import os
import sys
from pathlib import Path

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from forensic_processor import ForensicReportProcessor


def main():
    """Run the forensic processor with file picker."""
    
    print("🔍 Forensic Report Processor")
    print("=" * 50)
    
    # Get case and device information
    case_id = input("Enter Case ID (e.g., CASE-001): ").strip()
    if not case_id:
        case_id = "FORENSIC-CASE-001"
        print(f"Using default Case ID: {case_id}")
    
    device_id = input("Enter Device ID (e.g., DEVICE-001): ").strip()
    if not device_id:
        device_id = "FORENSIC-DEVICE-001"
        print(f"Using default Device ID: {device_id}")
    
    # Create processor
    processor = ForensicReportProcessor(
        case_id=case_id,
        device_id=device_id
    )
    
    try:
        # Get ZIP file path from user input
        print("\n🔍 Please provide the path to your forensic report ZIP file:")
        print("   You can drag and drop the ZIP file into this terminal, or type the full path")
        print("   Example: C:\\Users\\Hamad\\Documents\\forensic_report.zip")
        
        zip_file = input("\nZIP file path: ").strip().strip('"').strip("'")
        
        if not zip_file:
            print("❌ No ZIP file path provided. Exiting.")
            return
        
        # Check if file exists
        if not os.path.exists(zip_file):
            print(f"❌ ZIP file not found: {zip_file}")
            return
        
        print(f"📁 Selected ZIP file: {zip_file}")
        
        # Create json_report folder in the same directory as the ZIP file
        zip_dir = os.path.dirname(os.path.abspath(zip_file))
        json_report_dir = os.path.join(zip_dir, "json_report")
        
        print(f"📂 Output directory: {json_report_dir}")
        
        # Process ZIP file
        results = processor.process_zip_file(zip_file, json_report_dir)
        
        # Print results
        print(f"\n🎉 Forensic Report Processing Complete!")
        print(f"📁 ZIP file: {results['zip_file']}")
        print(f"📂 JSON report created in: {json_report_dir}")
        print(f"📊 TSV files processed: {results['tsv_files_found']}")
        print(f"📈 Total records converted: {results['total_records']}")
        print(f"⏱️ Processing time: {results['processing_time']:.2f} seconds")
        
        # Cleanup extracted files but preserve JSON exports
        processor.cleanup_extracted_files(results['extracted_folder'])
        print(f"🧹 Cleaned up extracted files, JSON exports moved to json_report folder")
        
        print(f"\n✅ Success! Check the json_report folder for all converted JSON files")
        
    except Exception as e:
        print(f"❌ Error processing forensic report: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
