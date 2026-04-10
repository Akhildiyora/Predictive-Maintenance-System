import socket
import sys

SERVICES = [
    ("MQTT Broker", "localhost", 1883),
    ("PostgreSQL", "localhost", 5432),
    ("InfluxDB", "localhost", 8086),
    ("Backend API", "localhost", 4000),
    ("ML Service (FastAPI)", "localhost", 8000),
    ("Frontend Dashboard", "localhost", 5173),
    ("WebSocket Gateway", "localhost", 3001)
]

def check_port(name, host, port):
    try:
        with socket.create_connection((host, port), timeout=2):
            print(f"✅ {name:20} [ONLINE]  (Port {port})")
            return True
    except (socket.timeout, ConnectionRefusedError):
        print(f"❌ {name:20} [OFFLINE] (Port {port})")
        return False

def run_health_check():
    print("\n" + "="*40)
    print(" PREDICT.AI SYSTEM HEALTH CHECK")
    print("="*40)
    
    results = [check_port(n, h, p) for n, h, p in SERVICES]
    
    print("="*40)
    if all(results):
        print("🎉 ALL SYSTEMS OPERATIONAL")
    else:
        print("⚠️ SOME SERVICES ARE DOWN. Please restart them.")
    print("="*40 + "\n")

if __name__ == "__main__":
    run_health_check()
