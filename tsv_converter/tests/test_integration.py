"""
Integration tests for TSV to JSON converter.
"""

import pytest
import tempfile
import json
import os
from tsv_converter.main import TSVToJSONConverter


class TestIntegration:
    """Integration test cases."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.converter = TSVToJSONConverter(
            case_id="TEST-CASE-001",
            device_id="TEST-DEVICE"
        )
    
    def test_convert_call_logs_file(self):
        """Test converting call logs TSV file."""
        # Create test TSV file
        test_tsv = """Call Date	Phone Account Address	Partner	Type	Duration in Secs	Source File
2020-09-12 14:44:47	2313604902	9195671775	Outgoing	96	/data/calllog.db
2020-09-13 01:38:51	2313604902	+495565102924	Incoming	1	/data/calllog.db"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.tsv', delete=False) as f:
            f.write(test_tsv)
            tsv_path = f.name
        
        try:
            # Convert to JSON
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json_path = f.name
            
            count = self.converter.convert_file(tsv_path, json_path)
            
            # Verify conversion
            assert count == 2
            
            with open(json_path, 'r') as f:
                data = json.load(f)
            
            assert len(data) == 2
            assert data[0]['type'] == 'call'
            assert data[0]['from'] == '2313604902'
            assert data[0]['to'] == ['9195671775']
            assert data[0]['duration_sec'] == 96
            assert data[0]['direction'] == 'outbound'
            
        finally:
            # Cleanup
            os.unlink(tsv_path)
            os.unlink(json_path)
    
    def test_convert_sms_messages_file(self):
        """Test converting SMS messages TSV file."""
        # Create test TSV file
        test_tsv = """Date	MSG ID	Thread ID	Address	Type	Body
2020-09-11 23:00:32	1	3	22000	Received	Your verification code is 123456
2020-09-12 14:00:44	2	4	+19102697333	Sent	Hello world"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.tsv', delete=False) as f:
            f.write(test_tsv)
            tsv_path = f.name
        
        try:
            # Convert to JSON
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json_path = f.name
            
            count = self.converter.convert_file(tsv_path, json_path)
            
            # Verify conversion
            assert count == 2
            
            with open(json_path, 'r') as f:
                data = json.load(f)
            
            assert len(data) == 2
            assert data[0]['type'] == 'message'
            assert data[0]['text'] == 'Your verification code is 123456'
            assert data[0]['message_id'] == '1'
            assert data[0]['thread_id'] == '3'
            
        finally:
            # Cleanup
            os.unlink(tsv_path)
            os.unlink(json_path)
    
    def test_convert_contacts_file(self):
        """Test converting contacts TSV file."""
        # Create test TSV file
        test_tsv = """Display Name	Phone Number	Email Address	Source File
John Doe	(919) 579-0479	john@example.com	/data/contacts.db
Jane Smith	(919) 391-2507	jane@example.com	/data/contacts.db"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.tsv', delete=False) as f:
            f.write(test_tsv)
            tsv_path = f.name
        
        try:
            # Convert to JSON
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json_path = f.name
            
            count = self.converter.convert_file(tsv_path, json_path)
            
            # Verify conversion
            assert count == 2
            
            with open(json_path, 'r') as f:
                data = json.load(f)
            
            assert len(data) == 2
            assert data[0]['type'] == 'contact'
            assert data[0]['display_from'] == 'John Doe'
            assert data[0]['email'] == 'john@example.com'
            
        finally:
            # Cleanup
            os.unlink(tsv_path)
            os.unlink(json_path)
    
    def test_convert_browser_history_file(self):
        """Test converting browser history TSV file."""
        # Create test TSV file
        test_tsv = """Last Visit Time	URL	Title	Visit Count
2020-09-12 00:26:30	https://www.example.com	Example Site	1
2020-09-12 00:26:30	https://www.google.com	Google	1"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.tsv', delete=False) as f:
            f.write(test_tsv)
            tsv_path = f.name
        
        try:
            # Convert to JSON
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json_path = f.name
            
            count = self.converter.convert_file(tsv_path, json_path)
            
            # Verify conversion
            assert count == 2
            
            with open(json_path, 'r') as f:
                data = json.load(f)
            
            assert len(data) == 2
            assert data[0]['type'] == 'browser'
            assert data[0]['url'] == 'https://www.example.com'
            assert data[0]['text'] == 'Example Site'
            
        finally:
            # Cleanup
            os.unlink(tsv_path)
            os.unlink(json_path)
    
    def test_convert_location_file(self):
        """Test converting location TSV file."""
        # Create test TSV file
        test_tsv = """Timestamp	Label	Latitude	Longitude	Address
2019-04-04 19:49:03.604000+00:00	Work	35.734602	-78.636654	121 E Tryon Rd, Raleigh, NC 27603"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.tsv', delete=False) as f:
            f.write(test_tsv)
            tsv_path = f.name
        
        try:
            # Convert to JSON
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json_path = f.name
            
            count = self.converter.convert_file(tsv_path, json_path)
            
            # Verify conversion
            assert count == 1
            
            with open(json_path, 'r') as f:
                data = json.load(f)
            
            assert len(data) == 1
            assert data[0]['type'] == 'location'
            assert data[0]['location']['lat'] == 35.734602
            assert data[0]['location']['lon'] == -78.636654
            assert data[0]['text'] == '121 E Tryon Rd, Raleigh, NC 27603'
            
        finally:
            # Cleanup
            os.unlink(tsv_path)
            os.unlink(json_path)
    
    def test_convert_empty_file(self):
        """Test converting empty TSV file."""
        # Create empty TSV file
        test_tsv = """Header1	Header2	Header3
"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.tsv', delete=False) as f:
            f.write(test_tsv)
            tsv_path = f.name
        
        try:
            # Convert to JSON
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json_path = f.name
            
            count = self.converter.convert_file(tsv_path, json_path)
            
            # Verify conversion
            assert count == 0
            
        finally:
            # Cleanup
            os.unlink(tsv_path)
            os.unlink(json_path)
    
    def test_convert_file_with_errors(self):
        """Test converting file with some invalid rows."""
        # Create TSV file with some invalid data
        test_tsv = """Call Date	Phone Account Address	Partner	Type	Duration in Secs
2020-09-12 14:44:47	2313604902	9195671775	Outgoing	96
invalid_date	invalid_phone	invalid_partner	Invalid	invalid_duration
2020-09-13 01:38:51	2313604902	+495565102924	Incoming	1"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.tsv', delete=False) as f:
            f.write(test_tsv)
            tsv_path = f.name
        
        try:
            # Convert to JSON
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json_path = f.name
            
            count = self.converter.convert_file(tsv_path, json_path)
            
            # Should still convert valid rows
            assert count == 2  # Only valid rows
            
            with open(json_path, 'r') as f:
                data = json.load(f)
            
            assert len(data) == 2
            
        finally:
            # Cleanup
            os.unlink(tsv_path)
            os.unlink(json_path)
    
    def test_convert_all_files(self):
        """Test converting multiple files."""
        # Create temporary directory with multiple TSV files
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create test TSV files
            test_files = {
                'Call Logs.tsv': """Call Date	Phone Account Address	Partner	Type	Duration in Secs
2020-09-12 14:44:47	2313604902	9195671775	Outgoing	96""",
                'sms messages.tsv': """Date	MSG ID	Thread ID	Address	Type	Body
2020-09-11 23:00:32	1	3	22000	Received	Your verification code is 123456""",
                'Contacts.tsv': """Display Name	Phone Number	Email Address
John Doe	(919) 579-0479	john@example.com"""
            }
            
            for filename, content in test_files.items():
                with open(os.path.join(temp_dir, filename), 'w') as f:
                    f.write(content)
            
            # Convert all files
            results = self.converter.convert_all_files(temp_dir, temp_dir)
            
            # Verify results
            assert results['total_files'] == 3
            assert results['successful_conversions'] == 3
            assert results['failed_conversions'] == 0
            assert results['total_records'] == 3
            
            # Check output files exist
            for filename in test_files.keys():
                json_file = os.path.join(temp_dir, filename.replace('.tsv', '.json'))
                assert os.path.exists(json_file)
                
                # Verify JSON is valid
                with open(json_file, 'r') as f:
                    data = json.load(f)
                    assert isinstance(data, list)
                    assert len(data) > 0

