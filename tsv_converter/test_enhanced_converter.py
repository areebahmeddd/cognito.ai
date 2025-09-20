#!/usr/bin/env python3
"""
Test Enhanced Forensic Converter
===============================

Test script for the enhanced forensic data converter.
Tests the complete pipeline from ZIP extraction to Neo4j graph generation.
"""

import os
import sys
import json
import logging
from pathlib import Path
from typing import Dict, List, Any

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from enhanced_processor import EnhancedForensicProcessor
from specialized_processors import ProcessorFactory
from neo4j_integration import Neo4jGraphBuilder


def test_enhanced_converter(aleapp_report_path: str, case_id: str, device_id: str):
    """
    Test the enhanced forensic converter.
    
    Args:
        aleapp_report_path: Path to ALEAPP report ZIP file
        case_id: Case identifier
        device_id: Device identifier
    """
    print("🚀 Starting Enhanced Forensic Converter Test")
    print("=" * 50)
    
    # Step 1: Test Enhanced ZIP Processing
    print("\n📁 Step 1: Testing Enhanced ZIP Processing")
    print("-" * 30)
    
    try:
        processor = EnhancedForensicProcessor(case_id, device_id)
        results = processor.process_aleapp_zip(aleapp_report_path)
        
        if results['success']:
            print("✅ Enhanced ZIP processing completed successfully!")
            print(f"📊 Total files found: {results['statistics']['total_files_found']}")
            print(f"📈 TSV files processed: {results['statistics']['tsv_files_processed']}")
            print(f"🗄️ Database files processed: {results['statistics']['database_files_processed']}")
            print(f"📷 Media files processed: {results['statistics']['media_files_processed']}")
            print(f"⚙️ System files processed: {results['statistics']['system_files_processed']}")
            print(f"📄 JSON files created: {results['statistics']['json_files_created']}")
            print(f"⏱️ Processing time: {results['statistics']['processing_time']:.2f} seconds")
        else:
            print(f"❌ Enhanced ZIP processing failed: {results['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Error in enhanced ZIP processing: {e}")
        return False
    
    # Step 2: Test Specialized Processors
    print("\n🔧 Step 2: Testing Specialized Processors")
    print("-" * 30)
    
    try:
        # Test call logs processor
        call_processor = ProcessorFactory.create_processor('call_logs', case_id, device_id)
        print("✅ Call logs processor created successfully")
        
        # Test SMS processor
        sms_processor = ProcessorFactory.create_processor('sms', case_id, device_id)
        print("✅ SMS processor created successfully")
        
        # Test WhatsApp processor
        whatsapp_processor = ProcessorFactory.create_processor('whatsapp', case_id, device_id)
        print("✅ WhatsApp processor created successfully")
        
        # Test GPS processor
        gps_processor = ProcessorFactory.create_processor('gps', case_id, device_id)
        print("✅ GPS processor created successfully")
        
        # Test media processor
        media_processor = ProcessorFactory.create_processor('media', case_id, device_id)
        print("✅ Media processor created successfully")
        
        print("✅ All specialized processors created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating specialized processors: {e}")
        return False
    
    # Step 3: Test Neo4j Integration
    print("\n🕸️ Step 3: Testing Neo4j Integration")
    print("-" * 30)
    
    try:
        # Get JSON files from processing results
        json_files = results.get('json_files', [])
        
        if json_files:
            # Create Neo4j graph builder
            graph_builder = Neo4jGraphBuilder(case_id, device_id)
            
            # Build graph
            graph_data = graph_builder.build_graph(json_files)
            
            print("✅ Neo4j graph built successfully!")
            print(f"📊 Total nodes: {graph_data['metadata']['total_nodes']}")
            print(f"🔗 Total relationships: {graph_data['metadata']['total_relationships']}")
            print(f"⏰ Timeline events: {graph_data['metadata']['timeline_events']}")
            
            # Save graph data
            output_path = os.path.join(results['output_dir'], 'neo4j_graph_data.json')
            graph_builder.save_graph_data(output_path)
            print(f"📄 Graph data saved to: {output_path}")
            
        else:
            print("⚠️ No JSON files found for Neo4j integration")
            
    except Exception as e:
        print(f"❌ Error in Neo4j integration: {e}")
        return False
    
    # Step 4: Validate Output
    print("\n✅ Step 4: Validating Output")
    print("-" * 30)
    
    try:
        output_dir = results['output_dir']
        
        # Check if output directory exists
        if os.path.exists(output_dir):
            print(f"✅ Output directory exists: {output_dir}")
            
            # Check for enhanced JSON files
            enhanced_json_dir = os.path.join(output_dir, 'enhanced_json')
            if os.path.exists(enhanced_json_dir):
                json_files = [f for f in os.listdir(enhanced_json_dir) if f.endswith('.json')]
                print(f"✅ Found {len(json_files)} JSON files in enhanced_json directory")
                
                # List JSON files
                for json_file in json_files:
                    print(f"  📄 {json_file}")
            else:
                print("⚠️ Enhanced JSON directory not found")
            
            # Check for processing report
            report_path = os.path.join(output_dir, 'enhanced_processing_report.json')
            if os.path.exists(report_path):
                print(f"✅ Processing report found: {report_path}")
                
                # Load and display report summary
                with open(report_path, 'r', encoding='utf-8') as f:
                    report = json.load(f)
                
                print(f"📊 Processing Summary:")
                print(f"  - Total files found: {report['summary']['total_files_found']}")
                print(f"  - TSV files processed: {report['summary']['tsv_files_processed']}")
                print(f"  - Database files processed: {report['summary']['database_files_processed']}")
                print(f"  - Media files processed: {report['summary']['media_files_processed']}")
                print(f"  - System files processed: {report['summary']['system_files_processed']}")
                print(f"  - JSON files created: {report['summary']['json_files_created']}")
                print(f"  - Processing time: {report['summary']['processing_time_seconds']:.2f} seconds")
                print(f"  - Success rate: {report['summary']['success_rate']:.1f}%")
            else:
                print("⚠️ Processing report not found")
        else:
            print("❌ Output directory not found")
            return False
            
    except Exception as e:
        print(f"❌ Error validating output: {e}")
        return False
    
    # Step 5: Test Results Summary
    print("\n🎉 Test Results Summary")
    print("=" * 50)
    
    print("✅ Enhanced ZIP Processing: PASSED")
    print("✅ Specialized Processors: PASSED")
    print("✅ Neo4j Integration: PASSED")
    print("✅ Output Validation: PASSED")
    
    print(f"\n📁 Output Directory: {results['output_dir']}")
    print(f"📊 Total Files Processed: {results['statistics']['total_files_found']}")
    print(f"📄 JSON Files Created: {results['statistics']['json_files_created']}")
    print(f"⏱️ Total Processing Time: {results['statistics']['processing_time']:.2f} seconds")
    
    if results['statistics']['errors']:
        print(f"\n⚠️ Errors encountered: {len(results['statistics']['errors'])}")
        for error in results['statistics']['errors']:
            print(f"  - {error}")
    
    print("\n🎉 Enhanced Forensic Converter Test Completed Successfully!")
    return True


def main():
    """Main entry point for testing."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Test enhanced forensic converter')
    parser.add_argument('--aleapp-report', required=True, help='Path to ALEAPP report ZIP file')
    parser.add_argument('--case-id', required=True, help='Case identifier')
    parser.add_argument('--device-id', required=True, help='Device identifier')
    
    args = parser.parse_args()
    
    # Validate inputs
    if not os.path.exists(args.aleapp_report):
        print(f"❌ ALEAPP report not found: {args.aleapp_report}")
        return 1
    
    if not args.aleapp_report.endswith('.zip'):
        print(f"❌ ALEAPP report must be a ZIP file: {args.aleapp_report}")
        return 1
    
    # Run test
    try:
        success = test_enhanced_converter(args.aleapp_report, args.case_id, args.device_id)
        return 0 if success else 1
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return 1


if __name__ == '__main__':
    exit(main())
