#!/usr/bin/env python3
"""
Neo4j Integration Test Script
============================

Tests Neo4j connectivity and forensic graph functionality.
"""

import sys
import json
import logging
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent / "app"))

from app.services.neo4j_service import neo4j_service
from app.services.forensic_graph import forensic_graph_builder
from app.models.schemas import UFDRDocument

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_neo4j_connection():
    """Test Neo4j connection."""
    print("🔍 Testing Neo4j Connection...")
    print("-" * 40)
    
    try:
        is_connected = neo4j_service.is_connected()
        
        if is_connected:
            print("✅ Neo4j connection successful!")
            return True
        else:
            print("❌ Neo4j connection failed!")
            print("💡 Make sure Neo4j is running and credentials are correct")
            return False
            
    except Exception as e:
        print(f"❌ Neo4j connection error: {e}")
        return False


def test_entity_extraction():
    """Test entity extraction from mock documents."""
    print("\n🔍 Testing Entity Extraction...")
    print("-" * 40)
    
    try:
        # Create test documents with proper UFDRDocument schema
        test_docs = [
            UFDRDocument(
                artifact_id="test_001",
                case_id="CASE-2024-001",
                device_id="DEVICE-001",
                type="communication",
                data_type="call_log",
                timestamp="2024-01-01T12:00:00Z",
                source_path="/data/calls.db",
                text="Call from +1234567890 to john@example.com at location 40.7128,-74.0060",
                from_="+1234567890",
                to="john@example.com"
            ),
            UFDRDocument(
                artifact_id="test_002",
                case_id="CASE-2024-001", 
                device_id="DEVICE-001",
                type="communication",
                data_type="sms",
                timestamp="2024-01-01T13:00:00Z",
                source_path="/data/sms.db",
                text="Message sent to +1234567890: Meet me at 192.168.1.1",
                from_="alice@test.com",
                to="+1234567890"
            ),
            UFDRDocument(
                artifact_id="test_003",
                case_id="CASE-2024-001",
                device_id="DEVICE-001", 
                type="file",
                data_type="file_transfer",
                timestamp="2024-01-01T14:00:00Z",
                source_path="/data/files.db",
                text="File shared: /home/user/document.pdf via https://example.com/share",
                filename="document.pdf",
                url="https://example.com/share"
            )
        ]
        
        # Extract entities
        entities = forensic_graph_builder.extract_entities_from_documents(test_docs)
        
        print(f"✅ Processed {entities['document_count']} documents")
        print(f"📊 Total entities found: {entities['total_entities']}")
        print("\n📋 Entity breakdown:")
        
        for entity_type, entity_list in entities['entities'].items():
            if entity_list:
                print(f"  • {entity_type}: {len(entity_list)} items")
                for entity in entity_list[:3]:  # Show first 3
                    if isinstance(entity, dict):
                        print(f"    - {entity}")
                    else:
                        print(f"    - {entity}")
                if len(entity_list) > 3:
                    print(f"    ... and {len(entity_list) - 3} more")
        
        print(f"\n🔗 Relationships found: {len(entities['relationships'])}")
        for rel in entities['relationships'][:3]:  # Show first 3
            print(f"  • {rel['relationship_type']}: {rel['entity']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Entity extraction failed: {e}")
        return False


def test_graph_creation():
    """Test graph creation and visualization data."""
    print("\n🔍 Testing Graph Creation...")
    print("-" * 40)
    
    try:
        # Create test documents with proper schema
        test_docs = [
            UFDRDocument(
                artifact_id="graph_001",
                case_id="CASE-2024-001",
                device_id="DEVICE-001",
                type="communication",
                data_type="call",
                timestamp="2024-01-01T10:00:00Z",
                source_path="/data/calls.db",
                text="Communication between +1234567890 and alice@example.com",
                from_="+1234567890",
                to="alice@example.com"
            ),
            UFDRDocument(
                artifact_id="graph_002",
                case_id="CASE-2024-001",
                device_id="DEVICE-001",
                type="location",
                data_type="gps",
                timestamp="2024-01-01T11:00:00Z",
                source_path="/data/location.db",
                text="Location data: 40.7128,-74.0060 accessed by +1234567890",
                location={"lat": 40.7128, "lon": -74.0060}
            )
        ]
        
        # Create graph
        graph_data = forensic_graph_builder.create_graph_from_search_results(test_docs)
        
        print(f"✅ Graph created successfully!")
        print(f"📊 Nodes: {graph_data.get('total_nodes', 0)}")
        print(f"🔗 Relationships: {graph_data.get('total_relationships', 0)}")
        
        if graph_data.get('source') == 'mock_data':
            print("⚠️  Using mock data (Neo4j not connected)")
        else:
            print("✅ Using Neo4j database")
        
        # Show sample nodes
        nodes = graph_data.get('nodes', [])
        if nodes:
            print(f"\n📋 Sample nodes:")
            for node in nodes[:3]:
                print(f"  • {node.get('type', 'unknown')}: {node.get('label', 'no label')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Graph creation failed: {e}")
        return False


def test_search_integration():
    """Test integration with search results format."""
    print("\n🔍 Testing Search Integration...")
    print("-" * 40)
    
    try:
        # Simulate search results format with proper schema
        mock_search_results = [
            UFDRDocument(
                artifact_id="evidence_001",
                case_id="CASE-2024-001",
                device_id="DEVICE-001",
                type="communication",
                data_type="call",
                timestamp="2024-01-15T14:30:00Z",
                source_path="/evidence/calls.db",
                text="Forensic evidence: phone call +1555123456 to suspect@email.com",
                from_="+1555123456",
                to="suspect@email.com"
            ),
            UFDRDocument(
                artifact_id="evidence_002",
                case_id="CASE-2024-001",
                device_id="DEVICE-001", 
                type="location",
                data_type="gps",
                timestamp="2024-01-15T14:35:00Z",
                source_path="/evidence/location.db",
                text="GPS coordinates: 37.7749,-122.4194 linked to device IMEI:123456789012345",
                location={"lat": 37.7749, "lon": -122.4194}
            ),
            UFDRDocument(
                artifact_id="evidence_003",
                case_id="CASE-2024-001",
                device_id="DEVICE-001",
                type="financial",
                data_type="crypto",
                timestamp="2024-01-15T15:00:00Z",
                source_path="/evidence/crypto.db",
                text="Crypto transaction: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa sent 0.5 BTC",
                amount=0.5
            )
        ]
        
        # Process as if coming from search
        graph_data = forensic_graph_builder.create_graph_from_search_results(mock_search_results)
        
        print("✅ Search integration successful!")
        print(f"📊 Graph contains {graph_data.get('total_nodes', 0)} nodes")
        print(f"🔗 Graph contains {graph_data.get('total_relationships', 0)} relationships")
        
        # This simulates what would be returned with search results
        mock_search_response = {
            "query": "test forensic query",
            "query_intent": "forensic_investigation",
            "total_results": len(mock_search_results),
            "analysis": {"summary": "Test analysis"},
            "results": mock_search_results,
            "graph_data": graph_data,  # This is what we added!
            "took": 42
        }
        
        print("✅ Mock search response with graph data created")
        print(f"🔍 Response includes graph with {len(graph_data.get('nodes', []))} entities")
        
        return True
        
    except Exception as e:
        print(f"❌ Search integration test failed: {e}")
        return False


def main():
    """Run all tests."""
    print("🚀 Cognito.ai Neo4j Integration Test")
    print("=" * 50)
    
    results = []
    
    # Test 1: Neo4j Connection
    results.append(test_neo4j_connection())
    
    # Test 2: Entity Extraction
    results.append(test_entity_extraction())
    
    # Test 3: Graph Creation
    results.append(test_graph_creation())
    
    # Test 4: Search Integration
    results.append(test_search_integration())
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Summary")
    print("-" * 20)
    
    test_names = [
        "Neo4j Connection",
        "Entity Extraction", 
        "Graph Creation",
        "Search Integration"
    ]
    
    passed = sum(results)
    total = len(results)
    
    for i, (name, result) in enumerate(zip(test_names, results)):
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{i+1}. {name}: {status}")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Neo4j integration is ready.")
    else:
        print("⚠️  Some tests failed. Check the errors above.")
        
        if not results[0]:  # Neo4j connection failed
            print("\n💡 Setup Tips:")
            print("1. Install Neo4j Desktop or use Neo4j Aura")
            print("2. Start Neo4j database")
            print("3. Update NEO4J_* settings in .env file")
            print("4. Install neo4j Python driver: pip install neo4j")
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
