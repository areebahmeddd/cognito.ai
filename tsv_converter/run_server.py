#!/usr/bin/env python3
"""
Simple TSV Converter Server
==========================

Runs both the FastAPI backend and serves the frontend HTML.
"""

import os
import sys
import subprocess
import threading
import time
import webbrowser
from pathlib import Path

def run_api_server():
    """Run the FastAPI server."""
    print("🚀 Starting Simple TSV API server...")
    try:
        import uvicorn
        from tsv_api import app
        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
    except Exception as e:
        print(f"❌ Error starting API server: {e}")

def run_frontend_server():
    """Run a simple HTTP server for the frontend."""
    print("🌐 Starting frontend server...")
    try:
        import http.server
        import socketserver
        from pathlib import Path
        
        # Change to the directory containing the HTML file
        os.chdir(Path(__file__).parent)
        
        PORT = 3000
        Handler = http.server.SimpleHTTPRequestHandler
        
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"Frontend server running at http://localhost:{PORT}")
            httpd.serve_forever()
    except Exception as e:
        print(f"❌ Error starting frontend server: {e}")

def main():
    """Main function to run both servers."""
    print("🚀 Simple TSV Converter Server")
    print("=" * 50)
    
    # Check if required files exist
    if not os.path.exists("tsv_api.py"):
        print("❌ tsv_api.py not found")
        return
    
    if not os.path.exists("frontend.html"):
        print("❌ frontend.html not found")
        return
    
    print("✅ All required files found")
    print("🚀 Starting servers...")
    print("📡 API Server: http://localhost:8000")
    print("🌐 Frontend: http://localhost:3000/frontend.html")
    print("=" * 50)
    
    # Start API server in a separate thread
    api_thread = threading.Thread(target=run_api_server, daemon=True)
    api_thread.start()
    
    # Wait a moment for API to start
    time.sleep(2)
    
    # Start frontend server in a separate thread
    frontend_thread = threading.Thread(target=run_frontend_server, daemon=True)
    frontend_thread.start()
    
    # Wait a moment for frontend to start
    time.sleep(2)
    
    # Open browser
    try:
        webbrowser.open("http://localhost:3000/frontend.html")
        print("🌐 Browser opened automatically")
    except:
        print("🌐 Please open http://localhost:3000/frontend.html in your browser")
    
    print("\n🎉 Servers are running!")
    print("Press Ctrl+C to stop both servers")
    
    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping servers...")
        print("✅ Servers stopped")

if __name__ == "__main__":
    main()
