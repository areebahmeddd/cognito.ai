# TSV to JSON Converter

A comprehensive forensic report processing system that converts TSV files from forensic tools (ALEAPP, Cellebrite, etc.) to UFDR JSON format. Features a FastAPI backend, modern web frontend, and supports dynamic header mapping with automatic data type detection.

## 🚀 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   FastAPI       │    │   TSV Converter │
│   (Web UI)      │◄──►│   Backend       │◄──►│   Core Engine   │
│   Port 3000     │    │   Port 8000     │    │   Processing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ✨ Features

### 🔧 Core Processing
- **Dynamic Header Mapping**: Automatically maps TSV headers to standardized JSON keys
- **Data Type Detection**: Automatically detects data types (call, message, contact, browser, location, etc.)
- **Entity Extraction**: Extracts entities like phone numbers, emails, URLs from text content
- **Timestamp Parsing**: Handles various timestamp formats and normalizes them
- **Data Cleaning**: Cleans and normalizes data from TSV files
- **UFDR Compliance**: Generates standardized forensic data records

### 🌐 Web Interface
- **Modern UI**: Drag & drop file upload with real-time feedback
- **Optional Parameters**: Case ID and Device ID with sensible defaults
- **Processing Statistics**: Real-time progress and detailed results
- **JSON Preview**: View conversion reports and processing data
- **Responsive Design**: Works on desktop and mobile devices

### 🔌 API Endpoints
- **RESTful API**: FastAPI-based backend with automatic documentation
- **File Upload**: Multipart form data support for ZIP files
- **Flexible Parameters**: Optional case/device IDs with defaults
- **Dual Modes**: File output or direct JSON response
- **Error Handling**: Comprehensive error responses and logging

## 🚀 Quick Start

### Option 1: Web Interface (Recommended)
```bash
# Start API server
python forensic_api.py

# Start frontend (in another terminal)
python serve_frontend.py

# Open browser: http://localhost:3000
```

### Option 2: API Only
```bash
# Start API server
python forensic_api.py

# Access API docs: http://localhost:8000/docs
```

### Option 3: Command Line
```bash
# Process ZIP file directly
python run_forensic_processor.py
```

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

### Process Forensic Report (File Output)
```http
POST /process-forensic-report
Content-Type: multipart/form-data

Form Data:
- zip_file: ZIP file (required)
- case_id: string (optional, default: "AUTO-CASE-001")
- device_id: string (optional, default: "AUTO-DEVICE-001")
```

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
    "conversion_report": "/path/to/conversion_report.json",
    "processing_report": "/path/to/processing_report.json"
  }
}
```

### Process Forensic Report (Sync Mode)
```http
POST /process-forensic-report-sync
Content-Type: multipart/form-data

Form Data:
- zip_file: ZIP file (required)
- case_id: string (optional, default: "AUTO-CASE-001")
- device_id: string (optional, default: "AUTO-DEVICE-001")
```

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

## 🌐 Web Interface

### Features
- **Drag & Drop Upload**: Drop ZIP files directly onto the interface
- **Optional Parameters**: Case ID and Device ID with defaults
- **Real-time Processing**: Loading states and progress indicators
- **Results Display**: Processing statistics and file locations
- **JSON Preview**: View conversion reports in browser
- **Responsive Design**: Works on all devices

### Usage
1. **Upload**: Drag & drop or click to select ZIP file
2. **Configure**: Set Case ID and Device ID (optional)
3. **Process**: Click "Process Forensic Report"
4. **View Results**: See processing statistics and file locations
5. **Download**: Access JSON files from output directory

## 📁 File Structure

```
tsv_converter/
├── 🚀 Core Files
│   ├── forensic_api.py          # FastAPI server
│   ├── main.py                  # TSV converter core
│   ├── backend_processor.py     # Backend processor
│   └── forensic_processor.py   # Forensic processor
├── 🌐 Frontend
│   ├── frontend.html            # Web interface
│   └── serve_frontend.py       # Frontend server
├── 🔧 Utilities
│   ├── utils/                   # Helper modules
│   ├── config/                  # Configuration
│   └── examples/                # Usage examples
├── 🧪 Tests
│   └── tests/                   # Unit tests
└── 📚 Documentation
    ├── README.md
    ├── API_README.md
    └── FRONTEND_README.md
```

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd tsv_converter

# Install dependencies
pip install -r requirements.txt
```

## Quick Start

### Basic Usage

```python
from tsv_converter.main import TSVToJSONConverter

# Create converter
converter = TSVToJSONConverter(
    case_id="CASE-001",
    device_id="DEVICE-001"
)

# Convert single file
count = converter.convert_file("input.tsv", "output.json")

# Convert all files in directory
results = converter.convert_all_files("input_dir", "output_dir")
```

### Forensic Report Processing

```python
from tsv_converter.forensic_processor import ForensicReportProcessor

# Process forensic report ZIP file
processor = ForensicReportProcessor(
    case_id="CASE-001",
    device_id="DEVICE-001"
)

# Process ZIP file (extracts and converts automatically)
results = processor.process_zip_file("forensic_report.zip")
```

### Command Line Usage

```bash
# Convert all TSV files in a directory
python -m tsv_converter.main \
    --input-dir "_TSV Exports" \
    --output-dir "_JSON Exports" \
    --case-id "CASE-001" \
    --device-id "DEVICE-001"

# Process forensic report ZIP file
python tsv_converter/forensic_processor.py \
    --zip-file "forensic_report.zip" \
    --case-id "CASE-001" \
    --device-id "DEVICE-001"

# Process with custom output directory
python tsv_converter/forensic_processor.py \
    --zip-file "forensic_report.zip" \
    --case-id "CASE-001" \
    --device-id "DEVICE-001" \
    --output-dir "custom_output"
```

## Configuration

The converter uses YAML configuration files to map TSV headers to standardized JSON keys and detect data types.

### Default Configuration

```yaml
header_variations:
  timestamp:
    - "Call Date"
    - "Date"
    - "Timestamp"
    - "Time"
  
  phone_number:
    - "Phone Number"
    - "Address"
    - "Phone"
    - "Number"
  
  # ... more mappings

data_type_indicators:
  call:
    required: ["timestamp", "phone_number"]
    optional: ["duration", "type", "direction"]
    keywords: ["call", "phone", "duration", "incoming", "outgoing"]
  
  # ... more data types
```

### Custom Configuration

Create a custom configuration file:

```python
from tsv_converter.config.mapping_config import create_sample_config

# Create sample configuration
create_sample_config("my_config.yaml")
```

## Supported Data Types

### Call Logs
- **Headers**: Call Date, Phone Account Address, Partner, Type, Duration in Secs
- **Output**: UFDR call documents with participants, duration, direction

### SMS/MMS Messages
- **Headers**: Date, MSG ID, Thread ID, Address, Type, Body
- **Output**: UFDR message documents with text, participants, thread information

### Contacts
- **Headers**: Display Name, Phone Number, Email Address
- **Output**: UFDR contact documents with names, phone numbers, emails

### Browser History
- **Headers**: Last Visit Time, URL, Title, Visit Count
- **Output**: UFDR browser documents with URLs, titles, timestamps

### Location Data
- **Headers**: Timestamp, Label, Latitude, Longitude, Address
- **Output**: UFDR location documents with coordinates and addresses

## Examples

### Example 1: Convert Call Logs

```python
from tsv_converter.main import TSVToJSONConverter

converter = TSVToJSONConverter(
    case_id="CASE-001",
    device_id="DEVICE-001"
)

# Convert call logs
count = converter.convert_file("Call Logs.tsv", "call_logs.json")
print(f"Converted {count} call records")
```

### Example 2: Convert All Files

```python
from tsv_converter.main import TSVToJSONConverter

converter = TSVToJSONConverter(
    case_id="CASE-001",
    device_id="DEVICE-001"
)

# Convert all TSV files
results = converter.convert_all_files("_TSV Exports", "_JSON Exports")

print(f"Total files: {results['total_files']}")
print(f"Successful: {results['successful_conversions']}")
print(f"Failed: {results['failed_conversions']}")
print(f"Total records: {results['total_records']}")
```

### Example 3: Custom Configuration

```python
from tsv_converter.main import TSVToJSONConverter

converter = TSVToJSONConverter(
    case_id="CASE-001",
    device_id="DEVICE-001",
    config_path="custom_config.yaml"
)

results = converter.convert_all_files("input_dir", "output_dir")
```

## Output Format

The converter generates UFDR-compliant JSON documents with the following structure:

```json
{
  "_id": "call-0",
  "artifact_id": "CALL-0000",
  "case_id": "CASE-001",
  "device_id": "DEVICE-001",
  "type": "call",
  "data_type": "call_logs",
  "timestamp": "2020-09-12T14:44:47",
  "from": "2313604902",
  "to": ["9195671775"],
  "participants": ["2313604902", "9195671775"],
  "duration_sec": 96,
  "direction": "outbound",
  "call_type": "voice",
  "source_path": "/data/calllog.db",
  "entities": {
    "phones": ["2313604902", "9195671775"]
  }
}
```

## Testing

Run the test suite:

```bash
# Run all tests
pytest tsv_converter/tests/

# Run specific test categories
pytest tsv_converter/tests/test_unit.py
pytest tsv_converter/tests/test_integration.py

# Run with coverage
pytest --cov=tsv_converter tsv_converter/tests/
```

## Error Handling

The converter includes comprehensive error handling:

- **File-level errors**: Logged and reported in conversion summary
- **Row-level errors**: Individual rows with errors are skipped, processing continues
- **Validation errors**: Invalid data is cleaned or skipped as appropriate
- **Logging**: Detailed logs saved to `tsv_converter.log`

## Performance

- **Batch processing**: Processes files in batches for memory efficiency
- **Streaming**: Large files are processed row by row
- **Memory management**: Automatic cleanup of temporary data
- **Progress tracking**: Real-time progress updates for large conversions

## Troubleshooting

### Common Issues

1. **Encoding errors**: Ensure TSV files are UTF-8 encoded
2. **Header mapping**: Check configuration for proper header mappings
3. **Timestamp parsing**: Verify timestamp formats in configuration
4. **Memory issues**: Reduce batch size in configuration for large files

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Log Files

Check `tsv_converter.log` for detailed error information and conversion statistics.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Create an issue in the repository
- Check the documentation
- Review the test cases for usage examples

