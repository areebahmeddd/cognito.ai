#!/usr/bin/env python3
"""
TSV Converter Frontend Server
============================

Simple HTTP server to serve the TSV Converter web frontend. This server provides
a modern web interface for uploading forensic report ZIP files and converting them
to UFDR JSON format.

Features:
- Serves the frontend.html file as the main interface
- Automatic browser opening for easy access
- Custom request handler for root path redirection
- Error handling for port conflicts and missing files
- Integration with FastAPI backend on port 8000

Usage:
    python serve_frontend.py

Access:
    - Frontend: http://localhost:3000
    - API: http://localhost:8000 (must be running separately)

Author: TSV Converter Team
Version: 1.0.0
"""

import http.server
import socketserver
import webbrowser
import os
from pathlib import Path


def serve_frontend():
    """
    Start the HTTP server to serve the TSV Converter frontend.
    
    This function:
    1. Validates that frontend.html exists
    2. Creates a custom HTTP request handler
    3. Starts the server on port 3000
    4. Opens the browser automatically
    5. Provides usage instructions
    
    The server will continue running until interrupted (Ctrl+C).
    
    Raises:
        FileNotFoundError: If frontend.html is not found
        OSError: If port 3000 is already in use or other server errors
    """
    # Get the directory of this script to locate frontend.html
    script_dir = Path(__file__).parent
    frontend_file = script_dir / "frontend.html"
    
    # Validate that the frontend HTML file exists
    if not frontend_file.exists():
        print("❌ frontend.html not found!")
        print(f"   Expected location: {frontend_file}")
        print("   Make sure frontend.html is in the same directory as this script.")
        return
    
    # Change to the script directory to serve files from the correct location
    os.chdir(script_dir)
    
    # Create a custom HTTP request handler that redirects root path to frontend.html
    class CustomHandler(http.server.SimpleHTTPRequestHandler):
        """
        Custom HTTP request handler that serves frontend.html for root requests.
        
        This handler automatically redirects requests to '/' or '/index.html' to
        serve the frontend.html file, providing a better user experience.
        """
        def do_GET(self):
            """
            Handle GET requests with automatic redirection to frontend.html.
            
            If the request is for the root path ('/') or index.html, it redirects
            to frontend.html to serve the main interface.
            """
            if self.path == '/' or self.path == '/index.html':
                self.path = '/frontend.html'
            return super().do_GET()
    
    # Use port 3000 for frontend (API server runs on port 8000)
    PORT = 3000
    
    # Display startup information
    print("🌐 Starting TSV Converter Frontend Server")
    print("=" * 50)
    print(f"📡 Frontend: http://localhost:{PORT}")
    print(f"🔧 API: http://localhost:8000")
    print("=" * 50)
    
    try:
        # Create and start the HTTP server
        with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
            print(f"✅ Server running on port {PORT}")
            print("🚀 Opening browser...")
            
            # Open the default web browser to the frontend URL
            webbrowser.open(f'http://localhost:{PORT}')
            
            # Display usage instructions for the user
            print("\n📋 Instructions:")
            print("1. Make sure the API server is running on port 8000")
            print("2. Upload a ZIP file using the web interface")
            print("3. View the processing results and JSON files")
            print("\nPress Ctrl+C to stop the server")
            
            # Start serving requests (this blocks until interrupted)
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        # Handle graceful shutdown when user presses Ctrl+C
        print("\n👋 Server stopped")
    except OSError as e:
        # Handle port conflicts and other server errors
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use. Try a different port.")
            print("   You can modify the PORT variable in this script to use a different port.")
        else:
            print(f"❌ Error starting server: {e}")


if __name__ == "__main__":
    """
    Main entry point for the frontend server.
    
    This function starts the HTTP server to serve the TSV Converter web interface.
    The server runs on port 3000 and automatically opens the browser.
    
    Prerequisites:
        - frontend.html must exist in the same directory
        - API server should be running on port 8000 (separate process)
    
    Usage:
        python serve_frontend.py
    
    Access:
        - Frontend: http://localhost:3000
        - API Documentation: http://localhost:8000/docs
    """
    serve_frontend()
