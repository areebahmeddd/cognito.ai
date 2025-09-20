#!/usr/bin/env python3
"""
Neo4j Graph Database Integration
===============================

Integrates with Neo4j graph database for relationship visualization
and pattern analysis of forensic data.

Features:
- Node creation for entities (Person, Location, Communication, Media)
- Relationship mapping between entities
- Timeline reconstruction
- Pattern analysis and visualization
"""

import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import re


class Neo4jGraphBuilder:
    """
    Builds Neo4j graph database from processed forensic data.
    """
    
    def __init__(self, case_id: str, device_id: str):
        """
        Initialize the Neo4j graph builder.
        
        Args:
            case_id: Case identifier
            device_id: Device identifier
        """
        self.case_id = case_id
        self.device_id = device_id
        self.logger = logging.getLogger(__name__)
        
        # Graph data structure
        self.nodes = {
            'Person': [],
            'Location': [],
            'Communication': [],
            'Media': [],
            'Device': [],
            'Application': [],
            'Time': []
        }
        
        self.relationships = []
        self.timeline = []
    
    def build_graph(self, json_files: List[str]) -> Dict[str, Any]:
        """
        Build Neo4j graph from JSON files.
        
        Args:
            json_files: List of JSON file paths
            
        Returns:
            Dictionary with graph data
        """
        self.logger.info("Building Neo4j graph from JSON files...")
        
        # Process each JSON file
        for json_file in json_files:
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Process based on file type
                if 'call_logs' in json_file.lower():
                    self._process_call_logs(data)
                elif 'sms' in json_file.lower():
                    self._process_sms_messages(data)
                elif 'whatsapp' in json_file.lower():
                    self._process_whatsapp_data(data)
                elif 'gps' in json_file.lower():
                    self._process_gps_data(data)
                elif 'media' in json_file.lower():
                    self._process_media_data(data)
                elif 'system' in json_file.lower():
                    self._process_system_data(data)
                
            except Exception as e:
                self.logger.error(f"Error processing JSON file {json_file}: {e}")
                continue
        
        # Create timeline
        self._create_timeline()
        
        # Generate graph data
        graph_data = {
            'metadata': {
                'case_id': self.case_id,
                'device_id': self.device_id,
                'total_nodes': sum(len(nodes) for nodes in self.nodes.values()),
                'total_relationships': len(self.relationships),
                'timeline_events': len(self.timeline),
                'processing_timestamp': datetime.now().isoformat()
            },
            'nodes': self.nodes,
            'relationships': self.relationships,
            'timeline': self.timeline
        }
        
        return graph_data
    
    def _process_call_logs(self, data: Dict[str, Any]):
        """Process call logs data for graph."""
        try:
            calls = data.get('calls', [])
            voicemails = data.get('voicemails', [])
            
            # Create person nodes for phone numbers
            for call in calls:
                from_number = call.get('from_number', '')
                to_number = call.get('to_number', '')
                
                if from_number:
                    self._add_person_node(from_number, 'phone_number')
                if to_number:
                    self._add_person_node(to_number, 'phone_number')
                
                # Create communication node
                comm_node = {
                    'id': call.get('id', ''),
                    'type': 'call',
                    'timestamp': call.get('timestamp', ''),
                    'duration': call.get('duration', ''),
                    'call_type': call.get('call_type', ''),
                    'location': call.get('location', ''),
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
                self.nodes['Communication'].append(comm_node)
                
                # Create relationships
                if from_number and to_number:
                    self._add_relationship(from_number, to_number, 'CALLED', comm_node['id'])
            
            # Process voicemails similarly
            for voicemail in voicemails:
                from_number = voicemail.get('from_number', '')
                to_number = voicemail.get('to_number', '')
                
                if from_number:
                    self._add_person_node(from_number, 'phone_number')
                if to_number:
                    self._add_person_node(to_number, 'phone_number')
                
                # Create communication node
                comm_node = {
                    'id': voicemail.get('id', ''),
                    'type': 'voicemail',
                    'timestamp': voicemail.get('timestamp', ''),
                    'duration': voicemail.get('duration', ''),
                    'transcription': voicemail.get('transcription', ''),
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
                self.nodes['Communication'].append(comm_node)
                
                # Create relationships
                if from_number and to_number:
                    self._add_relationship(from_number, to_number, 'LEFT_VOICEMAIL', comm_node['id'])
                    
        except Exception as e:
            self.logger.error(f"Error processing call logs: {e}")
    
    def _process_sms_messages(self, data: Dict[str, Any]):
        """Process SMS messages data for graph."""
        try:
            messages = data.get('messages', [])
            
            for message in messages:
                from_number = message.get('from_number', '')
                to_number = message.get('to_number', '')
                
                if from_number:
                    self._add_person_node(from_number, 'phone_number')
                if to_number:
                    self._add_person_node(to_number, 'phone_number')
                
                # Create communication node
                comm_node = {
                    'id': message.get('id', ''),
                    'type': 'sms',
                    'timestamp': message.get('timestamp', ''),
                    'body': message.get('body', ''),
                    'message_type': message.get('message_type', ''),
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
                self.nodes['Communication'].append(comm_node)
                
                # Create relationships
                if from_number and to_number:
                    self._add_relationship(from_number, to_number, 'SENT_MESSAGE', comm_node['id'])
                    
        except Exception as e:
            self.logger.error(f"Error processing SMS messages: {e}")
    
    def _process_whatsapp_data(self, data: Dict[str, Any]):
        """Process WhatsApp data for graph."""
        try:
            messages = data.get('messages', [])
            contacts = data.get('contacts', [])
            groups = data.get('groups', [])
            media = data.get('media', [])
            
            # Process contacts
            for contact in contacts:
                person_node = {
                    'id': contact.get('id', ''),
                    'phone_number': contact.get('phone_number', ''),
                    'display_name': contact.get('display_name', ''),
                    'platform': 'whatsapp',
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
                self.nodes['Person'].append(person_node)
            
            # Process messages
            for message in messages:
                from_number = message.get('from_number', '')
                to_number = message.get('to_number', '')
                
                if from_number:
                    self._add_person_node(from_number, 'whatsapp')
                if to_number:
                    self._add_person_node(to_number, 'whatsapp')
                
                # Create communication node
                comm_node = {
                    'id': message.get('id', ''),
                    'type': 'whatsapp_message',
                    'timestamp': message.get('timestamp', ''),
                    'body': message.get('message_body', ''),
                    'message_type': message.get('message_type', ''),
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
                self.nodes['Communication'].append(comm_node)
                
                # Create relationships
                if from_number and to_number:
                    self._add_relationship(from_number, to_number, 'SENT_WHATSAPP_MESSAGE', comm_node['id'])
            
            # Process groups
            for group in groups:
                group_node = {
                    'id': group.get('id', ''),
                    'group_name': group.get('group_name', ''),
                    'group_description': group.get('group_description', ''),
                    'platform': 'whatsapp',
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
                self.nodes['Application'].append(group_node)
            
            # Process media
            for media_item in media:
                media_node = {
                    'id': media_item.get('id', ''),
                    'file_path': media_item.get('file_path', ''),
                    'file_name': media_item.get('file_name', ''),
                    'file_size': media_item.get('file_size', ''),
                    'mime_type': media_item.get('mime_type', ''),
                    'platform': 'whatsapp',
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
                self.nodes['Media'].append(media_node)
                
        except Exception as e:
            self.logger.error(f"Error processing WhatsApp data: {e}")
    
    def _process_gps_data(self, data: Dict[str, Any]):
        """Process GPS data for graph."""
        try:
            locations = data.get('locations', [])
            routes = data.get('routes', [])
            
            # Process locations
            for location in locations:
                location_node = {
                    'id': location.get('id', ''),
                    'timestamp': location.get('timestamp', ''),
                    'latitude': location.get('latitude', ''),
                    'longitude': location.get('longitude', ''),
                    'altitude': location.get('altitude', ''),
                    'accuracy': location.get('accuracy', ''),
                    'location_mode': location.get('location_mode', ''),
                    'wifi_ssid': location.get('wifi_ssid', ''),
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
                self.nodes['Location'].append(location_node)
            
            # Process routes
            for route in routes:
                route_node = {
                    'id': route.get('id', ''),
                    'timestamp': route.get('timestamp', ''),
                    'latitude': route.get('latitude', ''),
                    'longitude': route.get('longitude', ''),
                    'speed': route.get('speed', ''),
                    'course': route.get('course', ''),
                    'bearing': route.get('bearing', ''),
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
                self.nodes['Location'].append(route_node)
                
        except Exception as e:
            self.logger.error(f"Error processing GPS data: {e}")
    
    def _process_media_data(self, data: Dict[str, Any]):
        """Process media data for graph."""
        try:
            media_files = data.get('media_files', [])
            
            for media_file in media_files:
                media_node = {
                    'id': media_file.get('id', ''),
                    'file_path': media_file.get('file_path', ''),
                    'file_name': media_file.get('file_name', ''),
                    'file_size': media_file.get('file_size', ''),
                    'created_time': media_file.get('created_time', ''),
                    'modified_time': media_file.get('modified_time', ''),
                    'file_extension': media_file.get('file_extension', ''),
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
                self.nodes['Media'].append(media_node)
                
        except Exception as e:
            self.logger.error(f"Error processing media data: {e}")
    
    def _process_system_data(self, data: Dict[str, Any]):
        """Process system data for graph."""
        try:
            system_files = data.get('system_files', [])
            
            for system_file in system_files:
                system_node = {
                    'id': f"system-{len(self.nodes['Device'])}",
                    'file_path': system_file.get('file_path', ''),
                    'file_name': system_file.get('file_name', ''),
                    'file_size': system_file.get('file_size', ''),
                    'created_time': system_file.get('created_time', ''),
                    'modified_time': system_file.get('modified_time', ''),
                    'file_extension': system_file.get('file_extension', ''),
                    'case_id': self.case_id,
                    'device_id': self.device_id
                }
                self.nodes['Device'].append(system_node)
                
        except Exception as e:
            self.logger.error(f"Error processing system data: {e}")
    
    def _add_person_node(self, identifier: str, platform: str):
        """Add person node if not already exists."""
        # Check if person already exists
        for person in self.nodes['Person']:
            if person.get('phone_number') == identifier or person.get('email') == identifier:
                return
        
        person_node = {
            'id': f"person-{identifier}",
            'phone_number': identifier if platform == 'phone_number' else '',
            'email': identifier if platform == 'email' else '',
            'platform': platform,
            'case_id': self.case_id,
            'device_id': self.device_id
        }
        self.nodes['Person'].append(person_node)
    
    def _add_relationship(self, from_entity: str, to_entity: str, relationship_type: str, communication_id: str):
        """Add relationship between entities."""
        relationship = {
            'id': f"rel-{len(self.relationships)}",
            'from_entity': from_entity,
            'to_entity': to_entity,
            'relationship_type': relationship_type,
            'communication_id': communication_id,
            'case_id': self.case_id,
            'device_id': self.device_id
        }
        self.relationships.append(relationship)
    
    def _create_timeline(self):
        """Create timeline from all events."""
        timeline_events = []
        
        # Add communication events
        for comm in self.nodes['Communication']:
            timeline_events.append({
                'timestamp': comm.get('timestamp', ''),
                'type': 'communication',
                'id': comm.get('id', ''),
                'data': comm
            })
        
        # Add location events
        for location in self.nodes['Location']:
            timeline_events.append({
                'timestamp': location.get('timestamp', ''),
                'type': 'location',
                'id': location.get('id', ''),
                'data': location
            })
        
        # Sort by timestamp
        timeline_events.sort(key=lambda x: x.get('timestamp', ''))
        
        self.timeline = timeline_events
    
    def generate_cypher_queries(self) -> List[str]:
        """Generate Cypher queries for Neo4j."""
        queries = []
        
        # Create nodes
        for node_type, nodes in self.nodes.items():
            if nodes:
                query = f"CREATE (n:{node_type}) SET n = $data"
                queries.append(query)
        
        # Create relationships
        for relationship in self.relationships:
            query = f"""
            MATCH (a:Person {{phone_number: $from_entity}})
            MATCH (b:Person {{phone_number: $to_entity}})
            CREATE (a)-[r:{relationship['relationship_type']}]->(b)
            SET r = $relationship_data
            """
            queries.append(query)
        
        return queries
    
    def save_graph_data(self, output_path: str):
        """Save graph data to JSON file."""
        graph_data = {
            'metadata': {
                'case_id': self.case_id,
                'device_id': self.device_id,
                'total_nodes': sum(len(nodes) for nodes in self.nodes.values()),
                'total_relationships': len(self.relationships),
                'timeline_events': len(self.timeline),
                'processing_timestamp': datetime.now().isoformat()
            },
            'nodes': self.nodes,
            'relationships': self.relationships,
            'timeline': self.timeline,
            'cypher_queries': self.generate_cypher_queries()
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(graph_data, f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"Graph data saved to: {output_path}")


def main():
    """Main entry point for Neo4j integration."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Neo4j graph builder for forensic data')
    parser.add_argument('--json-files', required=True, nargs='+', help='List of JSON file paths')
    parser.add_argument('--case-id', required=True, help='Case identifier')
    parser.add_argument('--device-id', required=True, help='Device identifier')
    parser.add_argument('--output', required=True, help='Output JSON file path')
    
    args = parser.parse_args()
    
    # Create graph builder
    builder = Neo4jGraphBuilder(args.case_id, args.device_id)
    
    try:
        # Build graph
        graph_data = builder.build_graph(args.json_files)
        
        # Save graph data
        builder.save_graph_data(args.output)
        
        print(f"✅ Neo4j graph data generated successfully!")
        print(f"📊 Total nodes: {graph_data['metadata']['total_nodes']}")
        print(f"🔗 Total relationships: {graph_data['metadata']['total_relationships']}")
        print(f"⏰ Timeline events: {graph_data['metadata']['timeline_events']}")
        print(f"📄 Output file: {args.output}")
        
    except Exception as e:
        print(f"❌ Error building Neo4j graph: {e}")
        return 1
    
    return 0


if __name__ == '__main__':
    exit(main())
