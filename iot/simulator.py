import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime

import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
BROKER = os.getenv("MQTT_BROKER_URL") or "localhost"
PORT = int(os.getenv("MQTT_PORT") or 1883)
USER = os.getenv("MQTT_USERNAME") or os.getenv("MQTT_USER")
PASS = os.getenv("MQTT_PASSWORD") or os.getenv("MQTT_PASS")
TOPIC_TEMPLATE = "factory/{}/sensor/data"

MACHINES = ["machine-001", "machine-002", "machine-003", "machine-004", "machine-005"]

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print(f"Connected to MQTT Broker at {BROKER}")
    else:
        print(f"Failed to connect, return code {rc}")

client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
client.on_connect = on_connect

if USER and PASS:
    client.username_pw_set(USER, PASS)

# Enable TLS if using port 8883/8884 or mqtts
if PORT in [8883, 8884] or BROKER.startswith("mqtts"):
    # If a manual cert file is provided (Step 5.4), use it
    cert_path = os.getenv("MQTT_CERT_PATH") or "cert.pem"
    if os.path.exists(cert_path):
        print(f"Using device certificate: {cert_path}")
        client.tls_set(ca_certs=None, certfile=cert_path)
    else:
        client.tls_set() # Fallback to standard CA validation

try:
    # Remove prefix if BROKER was given as a URL
    clean_broker = BROKER.replace("mqtts://", "").replace("mqtt://", "").split(":")[0]
    client.connect(clean_broker, PORT, 60)
except Exception as e:
    print(f"Could not connect to broker {BROKER}: {e}")
    exit(1)

print("Starting IoT Simulator (Step 3 Alignment)...")

while True:
    for machine_id in MACHINES:
        # Occasional anomaly
        is_anomaly = random.random() < 0.05
        
        data = {
            "machine_id": machine_id,
            "temperature": random.uniform(45, 80) if not is_anomaly else random.uniform(90, 110),
            "vibration": random.uniform(0.01, 0.05) if not is_anomaly else random.uniform(0.08, 0.15),
            "pressure": random.uniform(95, 120),
            "rpm": random.uniform(1200, 3200),
            "voltage": random.uniform(210, 240),
            "timestamp": datetime.now().isoformat()
        }
        
        topic = TOPIC_TEMPLATE.format(machine_id)
        client.publish(topic, json.dumps(data))
        print(f"Published to {topic}: {data['temperature']}°C")
    
    time.sleep(2)
