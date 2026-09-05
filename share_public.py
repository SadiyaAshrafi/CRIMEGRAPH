import subprocess
import sys
import os
import time

def main():
    print("==================================================================")
    print("  CRIMEGRAPH - Public Sharing & Teammate Access Center           ")
    print("==================================================================")
    print("\n[1] LOCAL NETWORK ACCESS (Same Wi-Fi / Hotspot):")
    print("    Teammates on your Wi-Fi can open:")
    print("    👉 http://10.93.176.10:8000\n")

    print("[2] INSTANT PUBLIC TUNNEL (Accessible worldwide):")
    print("    Starting localtunnel on port 8000...")

    # Ensure backend is running
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=os.path.dirname(os.path.abspath(__file__))
    )
    time.sleep(2)

    # Launch localtunnel
    try:
        tunnel_proc = subprocess.Popen(
            ["npx.cmd" if os.name == "nt" else "npx", "-y", "localtunnel", "--port", "8000"],
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        tunnel_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping sharing session...")
        backend_proc.terminate()

if __name__ == "__main__":
    main()
