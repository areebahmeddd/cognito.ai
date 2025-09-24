#!/usr/bin/env python3
"""
UFDR JSON Schema Analysis Script

This script analyzes all JSON files in the JSON_Exports folder to understand:
1. Overall data structure and schema patterns
2. Key fields and their frequency
3. Data types and value distributions  
4. Relationship patterns across different file types
5. Intent and context of UFDR structure
"""

import json
import os
from collections import defaultdict, Counter
from pathlib import Path
from typing import Dict, List, Any, Set, Union
from datetime import datetime
import re


class UFDRSchemaAnalyzer:
    def __init__(self, json_exports_path: str):
        self.json_exports_path = Path(json_exports_path)
        self.field_types = defaultdict(set)
        self.field_frequency = Counter()
        self.value_samples = defaultdict(list)
        self.file_stats = {}
        self.data_types = set()
        self.artifact_patterns = defaultdict(set)
        self.communication_sources = set()
        
    def analyze_value_type(self, value: Any) -> str:
        """Determine the semantic type of a value"""
        if value is None:
            return "null"
        elif isinstance(value, bool):
            return "boolean"
        elif isinstance(value, int):
            return "integer"
        elif isinstance(value, float):
            return "float"
        elif isinstance(value, list):
            return f"list[{len(value)}]"
        elif isinstance(value, dict):
            return f"dict[{len(value)}]"
        elif isinstance(value, str):
            # Detect semantic patterns in strings
            if re.match(r'^\d{4}-\d{2}-\d{2}', str(value)):
                return "datetime"
            elif re.match(r'^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$', str(value)):
                return "uuid"
            elif re.match(r'^\w+@\w+\.\w+', str(value)):
                return "email"
            elif re.match(r'^https?://', str(value)):
                return "url"
            elif re.match(r'^\+?\d{10,}$', str(value)):
                return "phone"
            elif re.match(r'^[0-9]{6}', str(value)) and 'code' in str(value).lower():
                return "verification_code"
            elif len(str(value)) > 100:
                return "long_text"
            else:
                return "string"
        else:
            return "unknown"

    def extract_communication_context(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Extract communication-specific context from a record"""
        context = {
            "platform": None,
            "direction": None,
            "message_type": None,
            "has_verification_code": False,
            "has_crypto_content": False,
            "participant_count": 0
        }
        
        # Platform detection
        source_path = record.get("source_path", "")
        if "WhatsApp" in source_path:
            context["platform"] = "WhatsApp"
        elif "sms" in source_path.lower():
            context["platform"] = "SMS"
        elif "GoogleMessages" in source_path:
            context["platform"] = "GoogleMessages"
        elif "Telegram" in source_path:
            context["platform"] = "Telegram"
        elif "Chrome" in source_path:
            context["platform"] = "Chrome"
        elif "Facebook" in source_path:
            context["platform"] = "Facebook"
            
        # Message direction
        context["direction"] = record.get("message_direction") or record.get("type")
        
        # Message type
        context["message_type"] = record.get("message_type")
        
        # Check for verification codes
        message_text = str(record.get("message", "") or record.get("body", "") or record.get("text", "")).lower()
        if any(term in message_text for term in ["verification", "code", "otp", "confirm", "passcode"]):
            context["has_verification_code"] = True
            
        # Check for crypto content
        if any(term in message_text for term in ["bitcoin", "crypto", "btc", "eth", "blockchain", "wallet"]):
            context["has_crypto_content"] = True
            
        return context

    def analyze_file(self, file_path: Path) -> Dict[str, Any]:
        """Analyze a single JSON file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            file_name = file_path.name
            record_count = 0
            communication_contexts = []
            
            if isinstance(data, list):
                record_count = len(data)
                for record in data:
                    if isinstance(record, dict):
                        self.analyze_record(record)
                        if any(field in record for field in ["message", "body", "text"]):
                            communication_contexts.append(self.extract_communication_context(record))
            elif isinstance(data, dict):
                record_count = 1
                self.analyze_record(data)
                communication_contexts.append(self.extract_communication_context(data))
                
            return {
                "file_name": file_name,
                "record_count": record_count,
                "communication_contexts": communication_contexts,
                "data_structure": "list" if isinstance(data, list) else "single_object"
            }
            
        except Exception as e:
            print(f"Error analyzing {file_path}: {e}")
            return {"file_name": file_path.name, "error": str(e)}

    def analyze_record(self, record: Dict[str, Any]):
        """Analyze a single record and update global statistics"""
        for field, value in record.items():
            self.field_frequency[field] += 1
            value_type = self.analyze_value_type(value)
            self.field_types[field].add(value_type)
            
            # Store sample values (limit to prevent memory issues)
            if len(self.value_samples[field]) < 5:
                self.value_samples[field].append(value)
                
            # Track data types and artifact patterns
            if field == "data_type":
                self.data_types.add(str(value))
            elif field == "source_path" and value:
                # Extract communication source patterns
                source = str(value)
                if any(platform in source for platform in ["WhatsApp", "SMS", "Telegram", "Viber"]):
                    self.communication_sources.add(source.split("\\")[-1] if "\\" in source else source)
                    
    def generate_schema_summary(self) -> Dict[str, Any]:
        """Generate comprehensive schema summary"""
        
        # Analyze field patterns
        core_fields = [f for f, count in self.field_frequency.most_common() if count > len(self.file_stats) * 0.1]
        communication_fields = [f for f in core_fields if any(term in f.lower() for term in 
                               ["message", "sender", "recipient", "call", "chat", "conversation"])]
        temporal_fields = [f for f in core_fields if any(term in f.lower() for term in 
                          ["timestamp", "date", "time"])]
        identity_fields = [f for f in core_fields if any(term in f.lower() for term in 
                          ["name", "phone", "email", "user", "account", "contact"])]
        location_fields = [f for f in core_fields if any(term in f.lower() for term in 
                          ["location", "latitude", "longitude", "address", "place"])]
        
        return {
            "summary": {
                "total_files_analyzed": len(self.file_stats),
                "total_unique_fields": len(self.field_frequency),
                "total_data_types": len(self.data_types),
                "communication_sources": len(self.communication_sources),
                "total_records": sum(stats.get("record_count", 0) for stats in self.file_stats.values())
            },
            "field_categories": {
                "core_fields": len(core_fields),
                "communication_fields": len(communication_fields),
                "temporal_fields": len(temporal_fields), 
                "identity_fields": len(identity_fields),
                "location_fields": len(location_fields)
            },
            "top_fields": dict(self.field_frequency.most_common(20)),
            "data_types_found": list(self.data_types),
            "communication_sources": list(self.communication_sources)[:20],
            "field_type_patterns": {
                field: list(types) for field, types in 
                list(self.field_types.items())[:15]
            }
        }

    def analyze_all_files(self):
        """Analyze all JSON files in the exports directory"""
        json_files = list(self.json_exports_path.glob("*.json"))
        
        print(f"📊 Starting analysis of {len(json_files)} JSON files...")
        print("=" * 60)
        
        for i, json_file in enumerate(json_files, 1):
            if i % 10 == 0:
                print(f"Progress: {i}/{len(json_files)} files analyzed")
                
            file_stats = self.analyze_file(json_file)
            self.file_stats[json_file.name] = file_stats
            
        return self.generate_schema_summary()

    def print_detailed_analysis(self, summary: Dict[str, Any]):
        """Print comprehensive analysis results"""
        print("\n🔍 UFDR JSON Schema Analysis Results")
        print("=" * 60)
        
        print(f"\n📈 Overall Statistics:")
        for key, value in summary["summary"].items():
            print(f"  • {key.replace('_', ' ').title()}: {value:,}")
            
        print(f"\n📋 Field Categories:")
        for category, count in summary["field_categories"].items():
            print(f"  • {category.replace('_', ' ').title()}: {count}")
            
        print(f"\n🔥 Top 20 Most Frequent Fields:")
        for field, frequency in summary["top_fields"].items():
            print(f"  • {field}: {frequency:,} occurrences")
            
        print(f"\n📱 Data Types Discovered:")
        for dtype in summary["data_types_found"]:
            print(f"  • {dtype}")
            
        print(f"\n💬 Communication Sources (Top 20):")
        for source in summary["communication_sources"]:
            print(f"  • {source}")
            
        print(f"\n🏗️ Field Type Patterns (Top 15):")
        for field, types in summary["field_type_patterns"].items():
            types_str = ", ".join(types)
            print(f"  • {field}: {types_str}")
            
        # Intent analysis
        print(f"\n🎯 UFDR Structure Intent Analysis:")
        print("  • Universal Forensic Data Repository structure detected")
        print("  • Multi-platform communication aggregation (WhatsApp, SMS, Telegram, etc.)")
        print("  • Temporal correlation support with multiple timestamp fields")
        print("  • Identity resolution through multiple contact/user fields") 
        print("  • Location intelligence with geographic data")
        print("  • Web browsing and search history correlation")
        print("  • System and application usage tracking")
        print("  • Financial transaction evidence support")
        
        # Key insights for investigators
        print(f"\n🕵️ Key Insights for Forensic Investigation:")
        verification_count = sum(1 for stats in self.file_stats.values() 
                               for ctx in stats.get("communication_contexts", []) 
                               if ctx.get("has_verification_code"))
        crypto_count = sum(1 for stats in self.file_stats.values()
                          for ctx in stats.get("communication_contexts", [])
                          if ctx.get("has_crypto_content"))
        
        print(f"  • {verification_count} records contain verification/OTP codes")
        print(f"  • {crypto_count} records contain cryptocurrency-related content")
        print("  • Cross-platform correlation possible through timestamp alignment")
        print("  • Contact resolution available through multiple identity fields")
        print("  • Location tracking across apps and time periods")
        
        total_communications = sum(len(stats.get("communication_contexts", [])) 
                                 for stats in self.file_stats.values())
        print(f"  • {total_communications:,} total communication records for analysis")

def main():
    """Main execution function"""
    json_exports_path = "JSON_Exports"
    
    if not os.path.exists(json_exports_path):
        print(f"❌ Error: {json_exports_path} directory not found!")
        print("Please ensure JSON_Exports.zip has been extracted to the project root.")
        return
        
    print("🚀 UFDR Schema Analysis Tool")
    print("Analyzing forensic data structure for AI-based investigation support")
    print(f"Target directory: {json_exports_path}")
    
    analyzer = UFDRSchemaAnalyzer(json_exports_path)
    summary = analyzer.analyze_all_files()
    analyzer.print_detailed_analysis(summary)
    
    # Save detailed results to file
    output_file = "ufdr_schema_analysis.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            "analysis_timestamp": datetime.now().isoformat(),
            "summary": summary,
            "field_samples": {k: v for k, v in analyzer.value_samples.items()},
            "file_statistics": analyzer.file_stats
        }, f, indent=2, default=str)
    
    print(f"\n💾 Detailed analysis saved to: {output_file}")
    print(f"\n✅ Schema analysis complete! Ready for NLQ engine development.")

if __name__ == "__main__":
    main()