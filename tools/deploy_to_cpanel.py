"""
Deploy frontend/dist to the live cPanel server.

Usage:
    python tools/deploy_to_cpanel.py

Requires in .env (project root):
    CPANEL_USER=falleng1
    CPANEL_PASS=your_password
    CPANEL_HOST=your_host_or_ip
    CPANEL_PORT=2083
    CPANEL_REMOTE_ROOT=/public_html
"""
import os
import sys
import urllib3
from pathlib import Path
from dotenv import load_dotenv

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

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
REMOTE_ROOT = os.environ.get("CPANEL_REMOTE_ROOT", "/public_html")
BASE_URL = f"https://{CPANEL_HOST}:{CPANEL_PORT}/execute"

DIST_DIR = Path(__file__).parent.parent / "frontend" / "dist"

session = requests.Session()
session.auth = (CPANEL_USER, CPANEL_PASS)
session.verify = False

def upload_file(local_path: Path, remote_dir: str) -> bool:
    with open(local_path, "rb") as f:
        content = f.read()
    resp = session.post(
        f"{BASE_URL}/Fileman/upload_files",
        data={"dir": remote_dir, "overwrite": 1},
        files={"file-1": (local_path.name, content)},
    )
    try:
        result = resp.json()
        if result.get("status") == 1:
            uploads = result.get("data", {}).get("uploads", [])
            if uploads and uploads[0].get("status") == 1:
                print(f"  OK  {remote_dir}/{local_path.name}")
                return True
        print(f"  FAIL  {remote_dir}/{local_path.name} → {result.get('errors')}")
        return False
    except Exception as e:
        print(f"  ERROR  {local_path.name} → {e}")
        return False

def main():
    if not DIST_DIR.exists():
        print(f"ERROR: dist folder not found at {DIST_DIR}")
        print("Run:  cd frontend && pnpm build")
        sys.exit(1)

    succeeded, failed = 0, 0

    print("Uploading root files...")
    for fname in ["index.html", "robots.txt", "sitemap.xml", "favicon.svg"]:
        local = DIST_DIR / fname
        if local.exists():
            (succeeded if upload_file(local, REMOTE_ROOT) else failed)
        else:
            print(f"  SKIP (not found): {fname}")

    assets_dir = DIST_DIR / "assets"
    if assets_dir.exists():
        print("\nUploading assets/...")
        for f in sorted(assets_dir.iterdir()):
            if f.is_file():
                (succeeded if upload_file(f, f"{REMOTE_ROOT}/assets") else failed)

    blog_dir = DIST_DIR / "blog"
    if blog_dir.exists():
        print("\nUploading blog/...")
        for f in blog_dir.iterdir():
            if f.is_file():
                (succeeded if upload_file(f, f"{REMOTE_ROOT}/blog") else failed)

    print(f"\n{'='*40}")
    print(f"Done: {succeeded} succeeded, {failed} failed")
    if failed:
        print("WARNING: Some files failed to upload. Check errors above.")

if __name__ == "__main__":
    main()
