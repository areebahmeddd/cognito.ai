"""
Neo4j Service Layer
==================

Provides connection management and basic operations for Neo4j graph database.
Handles node creation, relationship management, and graph queries for forensic data.
Configured for Neo4j Aura (Cloud).
"""

import logging
from typing import Dict, List, Any, Optional
from neo4j import GraphDatabase, Driver, Session

logger = logging.getLogger(__name__)


class Neo4jService:
    """Neo4j database service for managing graph operations."""
    
    def __init__(self):
        self.driver: Optional[Driver] = None
        self._connect()
    
    def _connect(self):
        """Establish connection to Neo4j Aura database."""
        try:
            # For Neo4j Aura (Cloud) - UPDATE THESE WITH YOUR CREDENTIALS
            uri = "neo4j+s://your-instance.databases.neo4j.io"  # Change this to your Aura URI
            username = "neo4j" 
            password = "your_aura_password"  # Change this to your Aura password
            
            # Note: For production, these should come from environment variables:
            # uri = os.getenv('NEO4J_URI', 'neo4j+s://your-instance.databases.neo4j.io')
            # username = os.getenv('NEO4J_USERNAME', 'neo4j')
            # password = os.getenv('NEO4J_PASSWORD', 'your_aura_password')
            
            self.driver = GraphDatabase.driver(
                uri,
                auth=(username, password)
            )
            
            # Test the connection
            with self.driver.session() as session:
                session.run("RETURN 1")
            
            logger.info("Successfully connected to Neo4j Aura")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j Aura: {e}")
            logger.info("Update Neo4j Aura credentials in neo4j_service.py or use environment variables")
            self.driver = None
    
    def close(self):
        """Close Neo4j connection."""
        if self.driver:
            self.driver.close()
            logger.info("Neo4j connection closed")
    
    def is_connected(self) -> bool:
        """Check if Neo4j connection is active."""
        if not self.driver:
            return False
        
        try:
            with self.driver.session() as session:
                session.run("RETURN 1")
                return True
        except Exception as e:
            logger.error(f"Neo4j connection check failed: {e}")
            return False
    
    def create_node(self, label: str, properties: Dict[str, Any]) -> str:
        """Create a node in the graph."""
        if not self.driver:
            raise Exception("Neo4j connection not available")
        
        try:
            with self.driver.session() as session:
                query = f"""
                CREATE (n:{label})
                SET n = $properties
                RETURN elementId(n) as node_id
                """
                result = session.run(query, properties=properties)
                record = result.single()
                return record["node_id"] if record else None
        except Exception as e:
            logger.error(f"Failed to create node: {e}")
            raise
    
    def create_relationship(self, from_node_id: str, to_node_id: str, 
                          relationship_type: str, properties: Dict[str, Any] = None) -> str:
        """Create a relationship between two nodes."""
        if not self.driver:
            raise Exception("Neo4j connection not available")
        
        try:
            with self.driver.session() as session:
                query = """
                MATCH (a), (b)
                WHERE elementId(a) = $from_id AND elementId(b) = $to_id
                CREATE (a)-[r:{}]->(b)
                SET r = $properties
                RETURN elementId(r) as rel_id
                """.format(relationship_type)
                
                result = session.run(
                    query,
                    from_id=from_node_id,
                    to_id=to_node_id,
                    properties=properties or {}
                )
                record = result.single()
                return record["rel_id"] if record else None
        except Exception as e:
            logger.error(f"Failed to create relationship: {e}")
            raise
    
    def find_nodes_by_property(self, label: str, property_name: str, 
                              property_value: Any) -> List[Dict[str, Any]]:
        """Find nodes by a specific property value."""
        if not self.driver:
            return []
        
        try:
            with self.driver.session() as session:
                query = f"""
                MATCH (n:{label})
                WHERE n.{property_name} = $value
                RETURN elementId(n) as node_id, n as properties
                """
                result = session.run(query, value=property_value)
                return [
                    {
                        "node_id": record["node_id"],
                        "properties": dict(record["properties"])
                    }
                    for record in result
                ]
        except Exception as e:
            logger.error(f"Failed to find nodes: {e}")
            return []
    
    def get_graph_data(self, limit: int = 100) -> Dict[str, Any]:
        """Retrieve graph data for visualization."""
        if not self.driver:
            return {"nodes": [], "relationships": []}
        
        try:
            with self.driver.session() as session:
                # Get nodes
                nodes_query = """
                MATCH (n)
                RETURN elementId(n) as id, labels(n) as labels, n as properties
                LIMIT $limit
                """
                nodes_result = session.run(nodes_query, limit=limit)
                nodes = [
                    {
                        "id": record["id"],
                        "labels": record["labels"],
                        "properties": dict(record["properties"])
                    }
                    for record in nodes_result
                ]
                
                # Get relationships
                rels_query = """
                MATCH (a)-[r]->(b)
                RETURN elementId(r) as id, elementId(a) as source, 
                       elementId(b) as target, type(r) as type, r as properties
                LIMIT $limit
                """
                rels_result = session.run(rels_query, limit=limit)
                relationships = [
                    {
                        "id": record["id"],
                        "source": record["source"],
                        "target": record["target"],
                        "type": record["type"],
                        "properties": dict(record["properties"])
                    }
                    for record in rels_result
                ]
                
                return {
                    "nodes": nodes,
                    "relationships": relationships,
                    "total_nodes": len(nodes),
                    "total_relationships": len(relationships)
                }
        except Exception as e:
            logger.error(f"Failed to get graph data: {e}")
            return {"nodes": [], "relationships": []}
    
    def clear_database(self):
        """Clear all nodes and relationships (use with caution)."""
        if not self.driver:
            raise Exception("Neo4j connection not available")
        
        try:
            with self.driver.session() as session:
                session.run("MATCH (n) DETACH DELETE n")
                logger.info("Neo4j database cleared")
        except Exception as e:
            logger.error(f"Failed to clear database: {e}")
            raise


# Global Neo4j service instance
neo4j_service = Neo4jService()
