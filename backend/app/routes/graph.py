"""
Graph API Routes
===============

Standalone graph endpoints for testing and future expansion.
Main functionality is integrated into search, but these provide direct graph access.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from ..services.neo4j_service import neo4j_service
from ..services.forensic_graph import forensic_graph_builder
from ..models.schemas import UFDRDocument

router = APIRouter(tags=["graph"])


@router.get("/health")
async def graph_health():
    """Check Neo4j connection health."""
    try:
        is_connected = neo4j_service.is_connected()
        return {
            "status": "healthy" if is_connected else "disconnected",
            "neo4j_connected": is_connected,
            "service": "forensic-graph"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


@router.get("/data")
async def get_graph_data(limit: int = 100):
    """Get current graph data for visualization."""
    try:
        graph_data = neo4j_service.get_graph_data(limit=limit)
        return {
            "graph_data": graph_data,
            "limit": limit,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve graph data: {str(e)}")


@router.post("/analyze")
async def analyze_documents(documents: List[Dict[str, Any]]):
    """Analyze documents and return entity/relationship data without creating graph."""
    try:
        # Convert to UFDRDocument objects
        ufdr_docs = []
        for doc in documents:
            try:
                ufdr_docs.append(UFDRDocument(**doc))
            except Exception as e:
                # If conversion fails, skip this document
                continue
        
        if not ufdr_docs:
            return {
                "entities": {},
                "relationships": [],
                "document_count": 0,
                "message": "No valid documents found"
            }
        
        # Extract entities and relationships
        analysis = forensic_graph_builder.extract_entities_from_documents(ufdr_docs)
        
        return {
            "entities": analysis["entities"],
            "relationships": analysis["relationships"],
            "document_count": analysis["document_count"],
            "total_entities": analysis["total_entities"],
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document analysis failed: {str(e)}")


@router.post("/create")
async def create_graph_from_documents(documents: List[Dict[str, Any]]):
    """Create graph in Neo4j from provided documents."""
    try:
        # Convert to UFDRDocument objects
        ufdr_docs = []
        for doc in documents:
            try:
                ufdr_docs.append(UFDRDocument(**doc))
            except Exception as e:
                continue
        
        if not ufdr_docs:
            raise HTTPException(status_code=400, detail="No valid documents provided")
        
        # Create graph
        graph_data = forensic_graph_builder.create_graph_from_search_results(ufdr_docs)
        
        return {
            "graph_data": graph_data,
            "documents_processed": len(ufdr_docs),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph creation failed: {str(e)}")


@router.delete("/clear")
async def clear_graph():
    """Clear all graph data (use with caution)."""
    try:
        neo4j_service.clear_database()
        return {
            "message": "Graph database cleared successfully",
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear graph: {str(e)}")


@router.get("/stats")
async def get_graph_stats():
    """Get graph statistics."""
    try:
        graph_data = neo4j_service.get_graph_data(limit=1)  # Just get counts
        
        return {
            "total_nodes": graph_data.get("total_nodes", 0),
            "total_relationships": graph_data.get("total_relationships", 0),
            "neo4j_connected": neo4j_service.is_connected(),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@router.post("/test")
async def test_graph_functionality():
    """Test graph functionality with mock data."""
    try:
        # Create test document
        test_doc = UFDRDocument(
            content="Test call from +1234567890 to john@example.com at 192.168.1.1",
            metadata={"test": True},
            timestamp="2024-01-01T12:00:00Z"
        )
        
        # Test entity extraction
        entities = forensic_graph_builder.extract_entities_from_documents([test_doc])
        
        # Test graph creation
        graph_data = forensic_graph_builder.create_graph_from_search_results([test_doc])
        
        return {
            "entities_extracted": entities,
            "graph_created": graph_data,
            "neo4j_connected": neo4j_service.is_connected(),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")
