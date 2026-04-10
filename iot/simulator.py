import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime

# Configuration
BROKER = "localhost"
PORT = 1883
TOPIC_TEMPLATE = "factory/{}/sensor/data"

MACHINES = ["machine-001", "machine-002", "machine-003"]

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print(f"Connected to MQTT Broker at {BROKER}")
    else:
        print(f"Failed to connect, return code {rc}")

client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
client.on_connect = on_connect

try:
    client.connect(BROKER, PORT, 60)
except Exception as e:
    print(f"Could not connect to broker: {e}")
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
