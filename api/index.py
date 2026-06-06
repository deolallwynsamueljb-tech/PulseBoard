import sys, os

# Use abspath so Vercel serverless doesn't get confused by symlinks/relative paths
backend_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend"))
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from main import app
