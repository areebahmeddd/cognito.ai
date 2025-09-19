#!/usr/bin/env python3
"""
Example API usage for the forensic query endpoints.
"""

import requests
import json


def test_forensic_endpoints():
    """Test the forensic query API endpoints"""
    
    base_url = "http://localhost:8000/api/v1"
    
    # Example queries
    test_queries = [
        "Find all WhatsApp messages about crypto transactions",
        "Show calls between 2 PM and 4 PM yesterday",
        "Messages from foreign phone numbers mentioning meetings"
    ]
    
    print("🔍 Testing Forensic Query API Endpoints")
    print("=" * 50)
    
    for query in test_queries:
        print(f"\nQuery: {query}")
        print("-" * 30)
        
        # Test query conversion endpoint
        try:
            convert_response = requests.post(
                f"{base_url}/forensic/convert-query",
                json={"query": query, "size": 10}
            )
            
            if convert_response.status_code == 200:
                result = convert_response.json()
                print(f"✅ Conversion successful")
                print(f"Intent: {result['converted_query']['query_intent']}")
                print(f"Query DSL: {json.dumps(result['converted_query']['query'], indent=2)}")
            else:
                print(f"❌ Conversion failed: {convert_response.status_code}")
                print(convert_response.text)
                
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test natural language search endpoint
        try:
            search_response = requests.post(
                f"{base_url}/forensic/search-natural",
                json={"query": query, "size": 5}
            )
            
            if search_response.status_code == 200:
                result = search_response.json()
                print(f"✅ Search successful - Found {result['total']} results")
                for hit in result['hits'][:2]:  # Show first 2 results
                    print(f"  - {hit.get('type', 'unknown')}: {hit.get('text', 'No text')[:100]}...")
            else:
                print(f"❌ Search failed: {search_response.status_code}")
                print(search_response.text)
                
        except Exception as e:
            print(f"❌ Error: {e}")
        
        print()


def test_enhanced_search_endpoint():
    """Test the enhanced search endpoint with natural language support"""
    
    base_url = "http://localhost:8000/api/v1"
    
    print("\n🔍 Testing Enhanced Search Endpoint")
    print("=" * 50)
    
    # Test with natural language enabled
    search_request = {
        "query": "Find all WhatsApp messages about crypto transactions",
        "size": 5,
        "use_natural_language": True
    }
    
    try:
        response = requests.post(
            f"{base_url}/search/search",
            json=search_request
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Enhanced search successful - Found {result['total']} results")
            for hit in result['hits'][:2]:
                print(f"  - {hit.get('type', 'unknown')}: {hit.get('text', 'No text')[:100]}...")
        else:
            print(f"❌ Enhanced search failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    test_forensic_endpoints()
    test_enhanced_search_endpoint()
