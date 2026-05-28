"""
Diagnostic tool — inspect live server file state on cPanel.
Checks .htaccess, index.html title, and public_html file listing.

Usage:
    python tools/check_server.py

Requires in .env (project root):
    CPANEL_USER=falleng1
    CPANEL_PASS=your_password
    CPANEL_HOST=your_host_or_ip
    CPANEL_PORT=2083
"""
import os
import re
import sys
import urllib3
from pathlib import Path
from dotenv import load_dotenv

urllib3.disable_warnings()

load_dotenv(Path(__file__).parent.parent / ".env")
load_dotenv(Path(__file__).parent.parent / ".env.local", override=True)

try:
    import requests
except ImportError:
    print("ERROR: requests not installed. Run: pip install requests python-dotenv")
    sys.exit(1)

CPANEL_USER = os.environ["CPANEL_USER"]
CPANEL_PASS = os.environ["CPANEL_PASS"]
CPANEL_HOST = os.environ["CPANEL_HOST"]
CPANEL_PORT = os.environ.get("CPANEL_PORT", "2083")
BASE_URL = f"https://{CPANEL_HOST}:{CPANEL_PORT}/execute"

s = requests.Session()
s.auth = (CPANEL_USER, CPANEL_PASS)
s.verify = False

def get_file(path: str, filename: str) -> str:
    r = s.get(f"{BASE_URL}/Fileman/get_file_content", params={"dir": path, "file": filename}, timeout=20)
    return r.json().get("data", {}).get("content", "NOT FOUND")

print("=== .htaccess ===")
print(get_file("/public_html", ".htaccess"))

print("\n=== index.html title ===")
content = get_file("/public_html", "index.html")
match = re.search(r"<title>(.*?)</title>", content)
print(match.group(1) if match else "NOT FOUND")

print("\n=== public_html files ===")
r = s.get(f"{BASE_URL}/Fileman/list", params={"dir": "/public_html", "show_hidden": 1}, timeout=20)
files = r.json().get("data", {}).get("files", [])
for f in files:
    print(f"  {f['file']:40s} {f.get('size', 0):>10}  {f.get('mtime', '')}")
