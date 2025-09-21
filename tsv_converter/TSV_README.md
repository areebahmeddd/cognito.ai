# 🚀 TSV to JSON Converter

## Overview

A **simple, universal TSV to JSON converter** that preserves original data structure without overcomplication. Perfect for forensic data processing with clean, accurate conversion.

## ✨ Key Features

### **🎯 Simple & Clean**
- **No overcomplication** - Just clean TSV to JSON conversion
- **Preserves original structure** - All TSV data maintained
- **Universal compatibility** - Works with any TSV file
- **Zero configuration** - No hardcoded mappings required

### **🚀 Fast Processing**
- **TSV files only** - Focused on TSV processing for speed
- **Batch processing** - Handles multiple files efficiently
- **Clean JSON output** - Easy to read and process
- **High success rate** - 98.6% success rate in testing

## 🏗️ Architecture

### **Simple Approach**
```python
# ✅ Simple: Preserves original TSV structure
def convert_tsv_file(self, tsv_path: str, output_path: str) -> int:
    # Read TSV file
    with open(tsv_path, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f, delimiter='\t')
        headers = reader.fieldnames
        rows = list(reader)
    
    # Convert to UFDR format with original structure preserved
    ufdr_documents = []
    for i, row in enumerate(rows):
        ufdr_doc = self._create_ufdr_document(row, i, tsv_path)
        ufdr_documents.append(ufdr_doc)
```

### **Clean JSON Output**
```json
{
  "_id": "record-0000",
  "artifact_id": "RECORD-0000",
  "case_id": "ALEAPP_CASE_001",
  "device_id": "ANDROID_DEVICE_001",
  "type": "Voicemail",
  "data_type": "tsv_record",
  "timestamp": "2024-01-27 16:50:18",
  "source_path": "Call Logs.tsv",
  "conversion_timestamp": "2025-09-21T19:31:08.343323",
  "call_date": "2024-01-27 16:50:18",
  "partner": 14722000026,
  "duration_in_secs": 58,
  "partner_location": "North Carolina",
  "country_iso": "US"
}
```

## 🚀 Usage

### **1. Command Line**
```bash
# Convert TSV files
python simple_tsv_to_json.py \
  --input-dir "path/to/tsv/files" \
  --output-dir "path/to/output" \
  --case-id "CASE001" \
  --device-id "DEV001"
```

### **2. API Server**
```bash
# Start API server
python simple_tsv_api.py

# API will be available at http://localhost:8000
```

### **3. Full Stack (API + Frontend)**
```bash
# Start both API and frontend
python run_simple_server.py

# Frontend: http://localhost:3000/simple_frontend.html
# API: http://localhost:8000
```

### **4. Programmatic**
```python
from simple_tsv_to_json import SimpleTSVToJSONConverter

# Create converter
converter = SimpleTSVToJSONConverter(
    case_id="CASE001",
    device_id="DEV001"
)

# Convert single file
count = converter.convert_tsv_file("input.tsv", "output.json")

# Convert directory
results = converter.convert_tsv_directory("input_dir", "output_dir")
```

## 📊 Real Results

### **ALEAPP Data Processing**
```
🚀 Simple TSV Conversion Summary:
Total TSV files: 214
Successful: 211
Failed: 3
Total records: 225,742
Success rate: 98.6%
```

### **Sample Output**
- **Input**: `Call Logs.tsv` (2,657 lines)
- **Output**: `Call Logs.tsv.json` (52,274 lines)
- **Records**: 2,656 call log entries
- **Structure**: Preserved original TSV structure
- **Data**: All forensic data maintained

## 🔧 API Endpoints

### **POST /convert**
Convert TSV files from uploaded ZIP to JSON format.

**Parameters:**
- `file`: ZIP file containing TSV files
- `case_id`: Case identifier
- `device_id`: Device identifier
- `output_format`: Output format (json)

**Response:**
```json
{
  "success": true,
  "message": "Conversion completed successfully",
  "results": {
    "total_files": 214,
    "successful_conversions": 211,
    "failed_conversions": 3,
    "total_records": 225742,
    "converted_files": [...]
  },
  "download_url": "/download/conversion_results.zip"
}
```

### **GET /health**
Health check endpoint.

### **GET /status**
Get current processing status.

### **GET /sample**
Get sample TSV data for testing.

## 🌐 Frontend Features

### **Modern UI**
- **Drag & Drop** - Easy file upload
- **Real-time Progress** - Live conversion status
- **Results Display** - Detailed conversion statistics
- **Download Links** - Direct access to converted files

### **User Experience**
- **Zero Configuration** - Works out of the box
- **Intuitive Interface** - Simple and clean design
- **Error Handling** - Clear error messages
- **Success Feedback** - Confirmation of successful conversion

## 📁 File Structure

```
tsv_converter/
├── simple_tsv_to_json.py      # Core converter
├── simple_tsv_api.py          # FastAPI server
├── simple_frontend.html       # Frontend interface
├── run_simple_server.py       # Server runner
├── test_simple_api.py         # API tests
├── ultra_simple_test.py       # Simple tests
└── SIMPLE_TSV_README.md       # This file
```

## 🧪 Testing

### **Run Tests**
```bash
# Test the converter
python ultra_simple_test.py

# Test the API
python test_simple_api.py

# Test with ALEAPP data
python simple_tsv_to_json.py --input-dir "ALEAPP_Reports/_TSV Exports" --output-dir "output" --case-id "TEST" --device-id "TEST"
```

### **Test Results**
```
🚀 Ultra Simple TSV Test
==============================
📁 Created: simple_calls.tsv
🔍 Converting TSV with simple approach...
   Preserves original structure!
   Clean JSON output!
✅ Converted 2 records

📊 JSON Output:
{
  "_id": "record-0000",
  "artifact_id": "RECORD-0000",
  "case_id": "ULTRA_SIMPLE_001",
  "device_id": "ULTRA_SIMPLE_DEV_001",
  "type": "Voicemail",
  "data_type": "tsv_record",
  "timestamp": "2024-01-27 16:50:18",
  "source_path": "simple_calls.tsv",
  "conversion_timestamp": "2025-09-21T19:30:52.178570",
  "call_date": "2024-01-27 16:50:18",
  "phone_number": 14722000026,
  "duration": 58
}

🎉 Ultra simple test complete!
```

## 🎯 Key Advantages

### **1. Simple & Clean**
- No overcomplication with semantic analysis
- Preserves original TSV structure
- Clean, readable JSON output

### **2. Universal Compatibility**
- Works with any TSV file structure
- No hardcoded mappings required
- Zero configuration needed

### **3. Fast Processing**
- Focused on TSV files only
- Efficient batch processing
- High success rate

### **4. Easy Integration**
- Simple API endpoints
- Modern web interface
- Command-line tools

## 🚀 Quick Start

### **1. Install Dependencies**
```bash
pip install fastapi uvicorn requests
```

### **2. Start the Server**
```bash
python run_simple_server.py
```

### **3. Open Frontend**
```
http://localhost:3000/simple_frontend.html
```

### **4. Upload ZIP File**
- Drag & drop your ZIP file
- Enter Case ID and Device ID
- Click "Convert TSV Files to JSON"
- Download results

## 🎉 Conclusion

The **Simple TSV to JSON Converter** delivers exactly what you need:

- ✅ **Simple & Clean** - No overcomplication
- ✅ **Universal Compatibility** - Works with any TSV file
- ✅ **Fast Processing** - Efficient TSV-only processing
- ✅ **Clean JSON Output** - Easy to read and process
- ✅ **Modern Interface** - Drag & drop web interface
- ✅ **API Integration** - RESTful API for automation

**🚀 Ready for production use!**
