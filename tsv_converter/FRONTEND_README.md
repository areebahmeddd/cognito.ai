# TSV Converter Frontend

A modern, responsive web interface for the TSV Converter API that provides an intuitive way to upload forensic report ZIP files and convert them to UFDR JSON format. Features drag & drop upload, real-time processing feedback, and comprehensive results display.

## 🚀 Quick Start

### Option 1: Run Separately (Recommended)

**Terminal 1 - Start API Server:**
```bash
python forensic_api.py
```

**Terminal 2 - Start Frontend Server:**
```bash
python serve_frontend.py
```

### Option 2: Use Web Interface Only
If the API is already running, just start the frontend:
```bash
python serve_frontend.py
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **API Health Check**: http://localhost:8000/health

## ✨ Features

### 🎨 Modern User Interface
- **Drag & Drop Upload**: Drop ZIP files directly onto the upload area
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Real-time Feedback**: Loading animations and progress indicators
- **Error Handling**: Clear error messages and validation
- **Results Display**: Comprehensive processing statistics and file locations

### 📁 File Upload Options
- **Drag & Drop**: Simply drag ZIP files onto the interface
- **Click to Browse**: Traditional file selection dialog
- **File Validation**: Automatic ZIP file type checking
- **Visual Feedback**: Upload area changes color and style on interaction

### ⚙️ Configuration Options
- **Case ID**: Optional case identifier (defaults to "AUTO-CASE-001")
- **Device ID**: Optional device identifier (defaults to "AUTO-DEVICE-001")
- **Sync Mode**: Toggle between file output and direct JSON response
- **Custom Values**: Override defaults with your own identifiers

### 📊 Results Display
- **Processing Statistics**: Files processed, records converted, timing
- **Output Location**: Shows where JSON files are saved
- **JSON Preview**: View conversion reports and processing data
- **Download Access**: Direct links to generated JSON files

## 🎯 Usage Guide

### Step-by-Step Process
1. **Upload File**: Drag & drop or click to select ZIP file
2. **Configure Options**: Set Case ID and Device ID (optional)
3. **Choose Mode**: Select Standard or Sync mode
4. **Process**: Click "Process Forensic Report"
5. **View Results**: See processing statistics and file locations
6. **Access Files**: Download JSON files from output directory

### Upload Methods
- **Drag & Drop**: Drag ZIP file onto the upload area
- **Click to Browse**: Click "Choose ZIP File" button
- **File Validation**: Only ZIP files are accepted

## 🔧 Configuration

### Default Values
- **Case ID**: `AUTO-CASE-001` (can be customized)
- **Device ID**: `AUTO-DEVICE-001` (can be customized)

### Processing Modes
- **Standard Mode**: `/process-forensic-report` - Saves files to disk
- **Sync Mode**: `/process-forensic-report-sync` - Returns JSON data directly

## 📁 File Structure

```
tsv_converter/
├── frontend.html          # Main frontend interface
├── serve_frontend.py      # Frontend server
├── forensic_api.py        # API server
└── output/                # Generated JSON files
    └── {case_id}_{device_id}/
        └── _JSON Exports/
            ├── Call Logs.json
            ├── Messages.json
            └── ...
```

## 🎯 Usage Examples

### Basic Upload
1. Open http://localhost:3000
2. Drag and drop a ZIP file or click "Choose ZIP File"
3. Click "Process Forensic Report"
4. View results and download JSON files

### Custom Case/Device IDs
1. Enter custom Case ID (e.g., "CASE-2024-001")
2. Enter custom Device ID (e.g., "DEVICE-SAMSUNG-001")
3. Upload and process

### Sync Mode
1. Check "Use Sync Mode" checkbox
2. Upload file
3. Get JSON data directly in the response

## 🔍 API Integration

The frontend communicates with the FastAPI backend:

```javascript
// Upload file with custom parameters
const formData = new FormData();
formData.append('zip_file', zipFile);
formData.append('case_id', 'CASE-2024-001');
formData.append('device_id', 'DEVICE-001');

const response = await fetch('http://localhost:8000/process-forensic-report', {
    method: 'POST',
    body: formData
});
```

## 🛠️ Development

### Frontend Technologies
- **HTML5**: Modern semantic markup
- **CSS3**: Flexbox, Grid, animations
- **Vanilla JavaScript**: No frameworks, pure JS
- **Fetch API**: Modern HTTP requests

### Styling Features
- **Gradient Backgrounds**: Modern visual appeal
- **Hover Effects**: Interactive feedback
- **Responsive Grid**: Mobile-first design
- **Loading States**: User experience enhancements

## 🚨 Troubleshooting

### Common Issues

**"Cannot connect to API"**
- Make sure the API server is running on port 8000
- Check that `python forensic_api.py` is working

**"Port 3000 already in use"**
- The frontend server port is already occupied
- Kill the process using port 3000 or modify the port in `serve_frontend.py`

**"ZIP file not found"**
- Make sure you have a valid ZIP file with TSV exports
- Check that the ZIP contains a `_TSV Exports` folder

### Debug Mode
Open browser developer tools (F12) to see:
- Network requests to the API
- Console logs and errors
- Response data from the server

## 📈 Performance

- **File Size**: Handles large ZIP files (tested with 50MB+ files)
- **Processing Time**: Real-time progress updates
- **Memory Usage**: Efficient file handling
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

## 🔒 Security Notes

- **CORS**: Configured for localhost development
- **File Validation**: ZIP file type checking
- **Input Sanitization**: XSS protection in place
- **Production**: Update CORS settings for production use

## 🎉 Success!

Once everything is running, you'll have a complete forensic report processing system:

1. **Upload** ZIP files through the web interface
2. **Process** them with the FastAPI backend
3. **Convert** TSV files to UFDR JSON format
4. **Download** the results from the permanent output directory

The system maintains forensic data integrity while providing a user-friendly interface! 🚀