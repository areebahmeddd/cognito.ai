import os
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import asyncio
from ..core.config import settings

class MongoDBService:
    def __init__(self):
        self.connection_string = settings.mongodb_connection_string
        self.client = None
        self.db = None
        self.cases_collection = None
        self.forensic_files_collection = None
        
    async def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(self.connection_string)
            self.db = self.client.forensic_analysis
            self.cases_collection = self.db.cases
            self.forensic_files_collection = self.db.forensic_files
            print("Connected to MongoDB Atlas")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            raise

    async def create_case(self, case_data: Dict[str, Any]) -> str:
        """Create a new case in MongoDB"""
        try:
            case_doc = {
                "case_id": case_data.get("case_id"),
                "device_id": case_data.get("device_id"),
                "case_name": case_data.get("case_name", "Untitled Case"),
                "description": case_data.get("description", ""),
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "status": "active",
                "metadata": case_data.get("metadata", {})
            }
            
            result = await self.cases_collection.insert_one(case_doc)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error creating case: {e}")
            raise

    async def store_forensic_file(self, file_data: Dict[str, Any]) -> str:
        """Store forensic file data in MongoDB"""
        try:
            forensic_file_doc = {
                "case_id": file_data.get("case_id"),
                "device_id": file_data.get("device_id"),
                "file_name": file_data.get("file_name"),
                "file_type": file_data.get("file_type"),
                "file_category": file_data.get("file_category", "general"),
                "records": file_data.get("records", []),
                "record_count": file_data.get("record_count", 0),
                "created_at": datetime.now(),
                "source_path": file_data.get("source_path"),
                "elasticsearch_indexed": False,
                "elasticsearch_index_name": None
            }
            
            result = await self.forensic_files_collection.insert_one(forensic_file_doc)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error storing forensic file: {e}")
            raise

    async def store_json_files(self, case_id: str, device_id: str, json_files_dir: str) -> Dict[str, Any]:
        """Store all JSON files from a directory in MongoDB"""
        try:
            stored_files = []
            total_records = 0
            
            if not os.path.exists(json_files_dir):
                print(f"JSON files directory not found: {json_files_dir}")
                return {"stored_files": 0, "total_records": 0, "files": []}
            
            for filename in os.listdir(json_files_dir):
                if filename.endswith('.json'):
                    file_path = os.path.join(json_files_dir, filename)
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            json_data = json.load(f)
                        
                        # Determine file type and category based on filename
                        file_type = self._determine_file_type(filename)
                        file_category = self._determine_file_category(filename)
                        
                        # Extract records from JSON
                        records = []
                        if isinstance(json_data, list):
                            records = json_data
                        elif isinstance(json_data, dict):
                            records = [json_data]
                        
                        # Store in MongoDB
                        file_data = {
                            "case_id": case_id,
                            "device_id": device_id,
                            "file_name": filename,
                            "file_type": file_type,
                            "file_category": file_category,
                            "records": records,
                            "record_count": len(records),
                            "source_path": file_path
                        }
                        
                        file_id = await self.store_forensic_file(file_data)
                        stored_files.append({
                            "file_id": file_id,
                            "file_name": filename,
                            "file_type": file_type,
                            "record_count": len(records)
                        })
                        
                        total_records += len(records)
                        print(f"Stored {filename} with {len(records)} records")
                        
                    except Exception as e:
                        print(f"Error processing {filename}: {e}")
                        continue
            
            return {
                "stored_files": len(stored_files),
                "total_records": total_records,
                "files": stored_files
            }
            
        except Exception as e:
            print(f"Error storing JSON files: {e}")
            raise

    def _determine_file_type(self, filename: str) -> str:
        """Determine file type based on filename"""
        filename_lower = filename.lower()
        
        if 'whatsapp' in filename_lower:
            if 'group' in filename_lower:
                return "WhatsApp Group Messages"
            else:
                return "WhatsApp Messages"
        elif 'call' in filename_lower:
            return "Call Logs"
        elif 'sms' in filename_lower:
            return "SMS Messages"
        elif 'contact' in filename_lower:
            return "Contacts"
        elif 'wifi' in filename_lower:
            return "Wi-Fi Data"
        elif 'location' in filename_lower:
            return "Location Data"
        else:
            return "General Data"

    def _determine_file_category(self, filename: str) -> str:
        """Determine file category based on filename"""
        filename_lower = filename.lower()
        
        if any(x in filename_lower for x in ['whatsapp', 'sms', 'call']):
            return "messages"
        elif any(x in filename_lower for x in ['contact', 'phone']):
            return "contacts"
        elif any(x in filename_lower for x in ['wifi', 'location', 'gps']):
            return "location"
        else:
            return "general"

    async def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()

# Global instance
mongodb_service = MongoDBService()
