#!/usr/bin/env python3
"""
Example usage of the forensic query converter with natural language queries.
"""

import asyncio
import json
from app.services.forensic_query_service import get_forensic_converter


async def main():
    """Example of using the forensic query converter"""
    
    # Initialize the converter
    converter = get_forensic_converter()
    
    # Example forensic queries
    forensic_queries = [
        "Find all WhatsApp messages about crypto transactions",
        "Show calls between 2 PM and 4 PM yesterday", 
        "Messages from foreign phone numbers mentioning meetings",
        "Deleted browser history containing suspicious searches",
        "Files with specific hash values",
        "Location data from last week",
        "Email communications with specific domains",
        "SMS messages containing financial amounts"
    ]
    
    print("🔍 Forensic Query Converter Examples")
    print("=" * 50)
    
    for i, query in enumerate(forensic_queries, 1):
        print(f"\n{i}. Query: {query}")
        print("-" * 30)
        
        try:
            # Convert natural language to Elasticsearch DSL
            result = converter.convert_to_elasticsearch(query)
            
            print(f"Intent: {result.query_intent}")
            print(f"Size: {result.size}")
            print(f"Sort: {result.sort}")
            print(f"Highlight: {result.highlight}")
            print(f"Elasticsearch Query:")
            print(json.dumps(result.query, indent=2))
            
        except Exception as e:
            print(f"Error: {e}")
        
        print()


if __name__ == "__main__":
    asyncio.run(main())
