"""
Forensic Graph Builder
=====================

Universal entity extraction and relationship mapping for any UFDRDocument structure.
Automatically detects entities and creates meaningful forensic relationships.
"""

import re
import logging
from typing import Dict, List, Any, Set, Tuple, Optional
from datetime import datetime
from ..models.schemas import UFDRDocument
from .neo4j_service import neo4j_service

logger = logging.getLogger(__name__)


class ForensicGraphBuilder:
    """Universal forensic graph builder that works with any document structure."""
    
    def __init__(self):
        self.entity_patterns = {
            'phone_number': [
                r'\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})',
                r'\+?[1-9]\d{1,14}',  # International format
                r'\d{10,15}'  # Simple digit sequence
            ],
            'email': [
                r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            ],
            'ip_address': [
                r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'
            ],
            'url': [
                r'https?://[^\s<>"\']+',
                r'www\.[^\s<>"\']+',
                r'[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}'
            ],
            'crypto_address': [
                r'\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b',  # Bitcoin
                r'\b0x[a-fA-F0-9]{40}\b',  # Ethereum
                r'\bbc1[a-z0-9]{39,59}\b'  # Bitcoin Bech32
            ],
            'coordinates': [
                r'[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)'
            ],
            'timestamp': [
                r'\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}',
                r'\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2}',
                r'\d{10,13}'  # Unix timestamp
            ]
        }
    
    def extract_entities_from_documents(self, documents: List[UFDRDocument]) -> Dict[str, Any]:
        """Extract entities from a list of documents and build relationships."""
        entities = {
            'persons': set(),
            'locations': set(),
            'communications': [],
            'devices': set(),
            'files': [],
            'timestamps': set()
        }
        
        relationships = []
        document_entities = []
        
        for doc in documents:
            doc_entities = self._extract_entities_from_document(doc)
            document_entities.append({
                'document_id': getattr(doc, 'artifact_id', None) or str(hash(str(doc.dict()))),
                'entities': doc_entities
            })
            
            # Aggregate entities
            for entity_type, entity_set in doc_entities.items():
                if entity_type in entities:
                    if isinstance(entities[entity_type], set):
                        entities[entity_type].update(entity_set)
                    elif isinstance(entities[entity_type], list):
                        entities[entity_type].extend(entity_set)
        
        # Find cross-document relationships
        relationships = self._find_relationships(document_entities)
        
        return {
            'entities': {k: list(v) if isinstance(v, set) else v for k, v in entities.items()},
            'relationships': relationships,
            'document_count': len(documents),
            'total_entities': sum(len(v) for v in entities.values())
        }
    
    def _extract_entities_from_document(self, doc: UFDRDocument) -> Dict[str, Any]:
        """Extract entities from a single document by scanning all fields."""
        entities = {
            'persons': set(),
            'locations': set(),
            'communications': [],
            'devices': set(),
            'files': [],
            'timestamps': set()
        }
        
        # Extract from specific UFDRDocument fields
        self._extract_from_ufdr_fields(doc, entities)
        
        # Recursively scan all fields for additional patterns
        doc_dict = doc.dict()
        self._scan_fields_for_entities(doc_dict, entities)
        
        return entities
    
    def _extract_from_ufdr_fields(self, doc: UFDRDocument, entities: Dict[str, Any]):
        """Extract entities from known UFDRDocument fields."""
        # Extract persons from communication fields
        if doc.from_:
            if isinstance(doc.from_, list):
                entities['persons'].update(doc.from_)
            else:
                entities['persons'].add(doc.from_)
        
        if doc.to:
            if isinstance(doc.to, list):
                entities['persons'].update(doc.to)
            else:
                entities['persons'].add(doc.to)
        
        if doc.participants:
            entities['persons'].update(doc.participants)
        
        if doc.display_from:
            entities['persons'].add(doc.display_from)
        
        if doc.display_to:
            entities['persons'].add(doc.display_to)
        
        if doc.email:
            entities['persons'].add(doc.email)
        
        # Extract locations
        if doc.location:
            location_str = f"{doc.location.lat},{doc.location.lon}"
            entities['locations'].add(location_str)
        
        if doc.country:
            entities['locations'].add(doc.country)
        
        # Extract communications
        if doc.text:
            entities['communications'].append(doc.text)
        
        if doc.caption:
            entities['communications'].append(doc.caption)
        
        # Extract devices/files
        if doc.device_id:
            entities['devices'].add(doc.device_id)
        
        if doc.filename:
            entities['files'].append({
                'filename': doc.filename,
                'source_path': doc.source_path
            })
        
        if doc.url:
            entities['files'].append({
                'url': doc.url,
                'source_path': doc.source_path
            })
        
        # Extract timestamps
        if doc.timestamp:
            entities['timestamps'].add(str(doc.timestamp))
        
        # Extract from text content using patterns
        if doc.text:
            self._extract_entities_by_patterns(doc.text, entities, "text")
    
    def _scan_fields_for_entities(self, data: Any, entities: Dict[str, Any], field_path: str = ""):
        """Recursively scan data structure for entities."""
        if isinstance(data, dict):
            for key, value in data.items():
                current_path = f"{field_path}.{key}" if field_path else key
                self._scan_fields_for_entities(value, entities, current_path)
                
                # Field name-based classification
                self._classify_by_field_name(key, value, entities)
                
        elif isinstance(data, list):
            for i, item in enumerate(data):
                current_path = f"{field_path}[{i}]"
                self._scan_fields_for_entities(item, entities, current_path)
                
        elif isinstance(data, str):
            # Pattern-based entity extraction
            self._extract_entities_by_patterns(data, entities, field_path)
    
    def _classify_by_field_name(self, field_name: str, value: Any, entities: Dict[str, Any]):
        """Classify entities based on field names."""
        field_lower = field_name.lower()
        
        if not isinstance(value, str):
            return
        
        # Person-related fields
        if any(keyword in field_lower for keyword in ['phone', 'number', 'caller', 'recipient']):
            if self._is_phone_number(value):
                entities['persons'].add(value)
        
        elif any(keyword in field_lower for keyword in ['email', 'mail', 'sender', 'recipient']):
            if self._is_email(value):
                entities['persons'].add(value)
        
        elif any(keyword in field_lower for keyword in ['name', 'contact', 'user']):
            if len(value) > 2 and not self._is_numeric(value):
                entities['persons'].add(value)
        
        # Location-related fields
        elif any(keyword in field_lower for keyword in ['lat', 'lng', 'longitude', 'latitude', 'coord']):
            if self._is_coordinate(value):
                entities['locations'].add(value)
        
        elif any(keyword in field_lower for keyword in ['address', 'location', 'place', 'city']):
            if len(value) > 3:
                entities['locations'].add(value)
        
        # Communication-related fields
        elif any(keyword in field_lower for keyword in ['message', 'text', 'body', 'content']):
            entities['communications'].append(value)
        
        # Device-related fields
        elif any(keyword in field_lower for keyword in ['device', 'imei', 'serial', 'mac', 'ip']):
            entities['devices'].add(value)
        
        # File-related fields
        elif any(keyword in field_lower for keyword in ['file', 'path', 'name', 'url']):
            if '/' in value or '\\' in value or '.' in value:
                entities['files'].append({
                    'path': value,
                    'field': field_name
                })
        
        # Timestamp fields
        elif any(keyword in field_lower for keyword in ['time', 'date', 'created', 'modified', 'timestamp']):
            if self._is_timestamp(value):
                entities['timestamps'].add(value)
    
    def _extract_entities_by_patterns(self, text: str, entities: Dict[str, Any], field_path: str):
        """Extract entities using regex patterns."""
        # Phone numbers
        for pattern in self.entity_patterns['phone_number']:
            matches = re.findall(pattern, text)
            for match in matches:
                if isinstance(match, tuple):
                    phone = ''.join(match)
                else:
                    phone = match
                if len(phone) >= 10:
                    entities['persons'].add(phone)
        
        # Emails
        for pattern in self.entity_patterns['email']:
            matches = re.findall(pattern, text)
            entities['persons'].update(matches)
        
        # IP addresses
        for pattern in self.entity_patterns['ip_address']:
            matches = re.findall(pattern, text)
            entities['devices'].update(matches)
        
        # URLs
        for pattern in self.entity_patterns['url']:
            matches = re.findall(pattern, text)
            for url in matches:
                entities['files'].append({
                    'url': url,
                    'field': field_path
                })
        
        # Crypto addresses
        for pattern in self.entity_patterns['crypto_address']:
            matches = re.findall(pattern, text)
            entities['devices'].update(matches)
        
        # Coordinates
        for pattern in self.entity_patterns['coordinates']:
            matches = re.findall(pattern, text)
            entities['locations'].update(matches)
        
        # Timestamps
        for pattern in self.entity_patterns['timestamp']:
            matches = re.findall(pattern, text)
            entities['timestamps'].update(matches)
    
    def _find_relationships(self, document_entities: List[Dict]) -> List[Dict]:
        """Find relationships between entities across documents."""
        relationships = []
        
        # Find entities that appear in multiple documents
        entity_docs = {}
        
        for doc_data in document_entities:
            doc_id = doc_data['document_id']
            entities = doc_data['entities']
            
            for entity_type, entity_set in entities.items():
                if isinstance(entity_set, (list, set)):
                    for entity in entity_set:
                        if isinstance(entity, dict):
                            entity_key = str(entity)
                        else:
                            entity_key = str(entity)
                        
                        if entity_key not in entity_docs:
                            entity_docs[entity_key] = []
                        entity_docs[entity_key].append({
                            'doc_id': doc_id,
                            'entity_type': entity_type,
                            'entity': entity
                        })
        
        # Create relationships for entities appearing in multiple documents
        for entity_key, appearances in entity_docs.items():
            if len(appearances) > 1:
                for i in range(len(appearances)):
                    for j in range(i + 1, len(appearances)):
                        relationships.append({
                            'source': appearances[i]['doc_id'],
                            'target': appearances[j]['doc_id'],
                            'relationship_type': 'SHARES_ENTITY',
                            'entity': entity_key,
                            'entity_type': appearances[i]['entity_type']
                        })
        
        return relationships
    
    def create_graph_from_search_results(self, search_results: List[UFDRDocument]) -> Dict[str, Any]:
        """Create a graph visualization from search results."""
        if not neo4j_service.is_connected():
            logger.warning("Neo4j not connected, returning mock graph data")
            return self._create_mock_graph(search_results)
        
        try:
            # Extract entities and relationships
            graph_data = self.extract_entities_from_documents(search_results)
            
            # Create nodes in Neo4j
            node_ids = {}
            
            # Create person nodes
            for person in graph_data['entities']['persons']:
                node_id = neo4j_service.create_node('Person', {
                    'identifier': person,
                    'type': self._classify_person_type(person),
                    'created_at': datetime.now().isoformat()
                })
                node_ids[f"person_{person}"] = node_id
            
            # Create location nodes
            for location in graph_data['entities']['locations']:
                node_id = neo4j_service.create_node('Location', {
                    'identifier': location,
                    'created_at': datetime.now().isoformat()
                })
                node_ids[f"location_{location}"] = node_id
            
            # Create device nodes
            for device in graph_data['entities']['devices']:
                node_id = neo4j_service.create_node('Device', {
                    'identifier': device,
                    'created_at': datetime.now().isoformat()
                })
                node_ids[f"device_{device}"] = node_id
            
            # Create relationships
            for rel in graph_data['relationships']:
                source_key = f"doc_{rel['source']}"
                target_key = f"doc_{rel['target']}"
                
                if source_key in node_ids and target_key in node_ids:
                    neo4j_service.create_relationship(
                        node_ids[source_key],
                        node_ids[target_key],
                        rel['relationship_type'],
                        {
                            'entity': rel['entity'],
                            'entity_type': rel['entity_type'],
                            'created_at': datetime.now().isoformat()
                        }
                    )
            
            # Return graph data for visualization
            return neo4j_service.get_graph_data()
            
        except Exception as e:
            logger.error(f"Failed to create graph: {e}")
            return self._create_mock_graph(search_results)
    
    def _create_mock_graph(self, search_results: List[UFDRDocument]) -> Dict[str, Any]:
        """Create mock graph data when Neo4j is not available."""
        graph_data = self.extract_entities_from_documents(search_results)
        
        nodes = []
        relationships = []
        
        # Create nodes from entities
        node_id = 0
        for entity_type, entities in graph_data['entities'].items():
            for entity in entities:
                if isinstance(entity, dict):
                    label = entity.get('path', entity.get('url', entity.get('filename', str(entity))))
                else:
                    label = str(entity)
                
                nodes.append({
                    'id': str(node_id),
                    'label': label,
                    'type': entity_type,
                    'properties': {'identifier': label}
                })
                node_id += 1
        
        # Create relationships
        for rel in graph_data['relationships']:
            if len(nodes) > 1:
                relationships.append({
                    'id': str(len(relationships)),
                    'source': str(hash(rel['source']) % len(nodes)),
                    'target': str(hash(rel['target']) % len(nodes)),
                    'type': rel['relationship_type'],
                    'properties': {'entity': rel['entity']}
                })
        
        return {
            'nodes': nodes,
            'relationships': relationships,
            'total_nodes': len(nodes),
            'total_relationships': len(relationships),
            'source': 'mock_data'
        }
    
    # Helper methods
    def _is_phone_number(self, value: str) -> bool:
        """Check if value looks like a phone number."""
        cleaned = re.sub(r'[^0-9]', '', value)
        return 10 <= len(cleaned) <= 15
    
    def _is_email(self, value: str) -> bool:
        """Check if value looks like an email."""
        return '@' in value and '.' in value.split('@')[-1]
    
    def _is_coordinate(self, value: str) -> bool:
        """Check if value looks like coordinates."""
        try:
            coord = float(value)
            return -180 <= coord <= 180
        except ValueError:
            return False
    
    def _is_timestamp(self, value: str) -> bool:
        """Check if value looks like a timestamp."""
        for pattern in self.entity_patterns['timestamp']:
            if re.match(pattern, value):
                return True
        return False
    
    def _is_numeric(self, value: str) -> bool:
        """Check if value is purely numeric."""
        return value.replace('.', '').replace('-', '').isdigit()
    
    def _classify_person_type(self, identifier: str) -> str:
        """Classify the type of person identifier."""
        if self._is_phone_number(identifier):
            return 'phone'
        elif self._is_email(identifier):
            return 'email'
        else:
            return 'name'


# Global forensic graph builder instance
forensic_graph_builder = ForensicGraphBuilder()
