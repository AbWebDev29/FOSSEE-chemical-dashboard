import subprocess
import time
import os
import sys
import signal

# --- GET ABSOLUTE PATHS ---
# This finds exactly where 'desktop.py' is stored on your Mac
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Point everything relative to that directory
BASE_DIR = os.path.join(SCRIPT_DIR, "my-awesome-project")
VENV_PYTHON = os.path.join(BASE_DIR, ".venv", "bin", "python")

def start_app():
    # 1. Path Validation
    if not os.path.exists(BASE_DIR):
        print(f"❌ Error: Could not find project folder at {BASE_DIR}")
        return

    print("🚀 Starting Chemical Dashboard Desktop App...")

    # 2. Start Django Backend
    # If the venv python isn't found, we fallback to the system python
    python_cmd = VENV_PYTHON if os.path.exists(VENV_PYTHON) else sys.executable
    
    print(f"📦 Backend: Starting Django via {python_cmd}")
    backend_proc = subprocess.Popen(
        [python_cmd, "manage.py", "runserver"],
        cwd=BASE_DIR 
    )

    # 3. Start React Frontend
    print("🎨 Frontend: Starting React...")
    frontend_proc = subprocess.Popen(
        ["npm", "start"],
        cwd=BASE_DIR
    )

    # Wait for React to bundle and port 3000 to open
    print("⏳ Waiting for servers to initialize (10s)...")
    time.sleep(10)

    # 4. Launch Desktop-style window
    chrome_cmd = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    app_url = "http://localhost:3000"
    
    print(f"🖥️  Opening Desktop Interface at {app_url}")
    try:
        # Launching as an 'app' removes browser bars and tabs
        subprocess.Popen([chrome_cmd, f"--app={app_url}"])
    except Exception as e:
        print(f"⚠️  Chrome App Mode failed, using default browser. Error: {e}")
        import webbrowser
        webbrowser.open(app_url)

    print("\n✅ Dashboard is live! Keep this terminal open.")
    print("💡 Press Ctrl+C here to shut down all services.")

    try:
        # Keep the script running so the processes stay alive
        while True:
            time.sleep(1)
            # Check if backend crashed
            if backend_proc.poll() is not None:
                print("❌ Backend service stopped.")
                break
    except KeyboardInterrupt:
        print("\n🛑 Shutting down gracefully...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("👋 Goodbye!")

if __name__ == "__main__":
    start_app()