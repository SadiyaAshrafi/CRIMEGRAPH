import subprocess
import time
import sys
import os

def main():
    print("===============================================================")
    print("  CRIMEGRAPH - AI Criminal Network Analysis Platform          ")
    print("  Starting FastAPI Backend and Vite Frontend...                ")
    print("===============================================================")

    # 1. Start Backend
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=os.path.dirname(os.path.abspath(__file__))
    )
    print("✓ Backend running on http://localhost:8000 (API Docs: http://localhost:8000/docs)")

    # 2. Start Frontend
    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
    frontend_proc = subprocess.Popen(
        ["npm.cmd" if os.name == "nt" else "npm", "run", "dev"],
        cwd=frontend_dir
    )
    print("✓ Frontend running on http://localhost:5173")
    print("\nPress Ctrl+C to terminate both servers.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping CrimeGraph servers...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    main()
