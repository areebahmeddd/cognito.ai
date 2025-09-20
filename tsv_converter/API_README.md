# Forensic Report Processor API

A FastAPI-based REST API for processing forensic report ZIP files and converting TSV exports to UFDR JSON format. Features optional parameters, dual processing modes, and comprehensive error handling.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r api_requirements.txt
```

### 2. Start the API Server
```bash
python forensic_api.py
```

### 3. Access the API
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Process Endpoint**: http://localhost:8000/process-forensic-report

## 📡 API Endpoints

### Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "healthy",
  "service": "forensic-processor"
}
```

### Process Forensic Report (File Output Mode)
```http
POST /process-forensic-report
Content-Type: multipart/form-data
```

**Parameters:**
- `zip_file`: Forensic report ZIP file (required)
- `case_id`: Case identifier (optional, default: "AUTO-CASE-001")
- `device_id`: Device identifier (optional, default: "AUTO-DEVICE-001")

**Response:**
```json
{
  "success": true,
  "message": "Forensic report processed successfully",
  "results": {
    "case_id": "AUTO-CASE-001",
    "device_id": "AUTO-DEVICE-001",
    "zip_filename": "forensic_report.zip",
    "tsv_files_processed": 49,
    "total_records": 10909,
    "json_files_created": 49,
    "processing_time": 20.07,
    "output_directory": "/path/to/json_report",
    "permanent_output_path": "/path/to/output/AUTO-CASE-001_AUTO-DEVICE-001",
    "conversion_report": "/path/to/conversion_report.json",
    "processing_report": "/path/to/processing_report.json"
  }
}
```

### Process Forensic Report (Sync Mode)
```http
POST /process-forensic-report-sync
Content-Type: multipart/form-data
```

**Parameters:**
- `zip_file`: Forensic report ZIP file (required)
- `case_id`: Case identifier (optional, default: "AUTO-CASE-001")
- `device_id`: Device identifier (optional, default: "AUTO-DEVICE-001")

**Response:**
```json
{
  "success": true,
  "message": "Forensic report processed successfully",
  "results": {
    "case_id": "AUTO-CASE-001",
    "device_id": "AUTO-DEVICE-001",
    "zip_filename": "forensic_report.zip",
    "tsv_files_processed": 49,
    "total_records": 10909,
    "json_files_created": 49,
    "processing_time": 20.07,
    "permanent_output_path": "/path/to/output/AUTO-CASE-001_AUTO-DEVICE-001",
    "conversion_report": { /* JSON data */ },
    "processing_report": { /* JSON data */ }
  }
}
```

## 🧪 Testing

### Test the API
```bash
python test_api.py
```

### Manual Testing with curl
```bash
curl -X POST "http://localhost:8000/process-forensic-report" \
  -F "zip_file=@forensic_report.zip" \
  -F "case_id=CASE-001" \
  -F "device_id=DEVICE-001"
```

## 🔧 Integration

### With Frontend
```javascript
const formData = new FormData();
formData.append('zip_file', zipFile);
formData.append('case_id', 'CASE-001');
formData.append('device_id', 'DEVICE-001');

const response = await fetch('http://localhost:8000/process-forensic-report', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

### With Python Requests
```python
import requests

with open('forensic_report.zip', 'rb') as f:
    files = {'zip_file': f}
    data = {
        'case_id': 'CASE-001',
        'device_id': 'DEVICE-001'
    }
    
    response = requests.post(
        'http://localhost:8000/process-forensic-report',
        files=files,
        data=data
    )
    
    result = response.json()
```

## 📊 Features

✅ **ZIP File Processing** - Extract and process forensic reports  
✅ **TSV to JSON Conversion** - Convert all TSV files to UFDR JSON format  
✅ **Dynamic Header Mapping** - Handle varying TSV formats automatically  
✅ **Data Type Detection** - Automatically classify data types  
✅ **Entity Extraction** - Extract phone numbers, emails, URLs  
✅ **Timestamp Normalization** - Convert timestamps to ISO format  
✅ **Clean Output** - Organized JSON files in `json_report` folder  
✅ **Processing Reports** - Detailed statistics and conversion reports  
✅ **Error Handling** - Robust error handling and logging  

## 🎯 Use Cases

- **Forensic Analysis** - Process ALEAPP, Cellebrite, and other forensic reports
- **Data Integration** - Convert forensic data to UFDR format for analysis
- **Automated Processing** - Batch process multiple forensic reports
- **API Integration** - Integrate with existing forensic analysis workflows

## 🔒 Security Notes

- Configure CORS properly for production
- Add authentication/authorization as needed
- Validate file types and sizes
- Implement rate limiting for production use
