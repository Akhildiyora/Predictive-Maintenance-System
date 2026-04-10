from influxdb_client import InfluxDBClient
import pandas as pd
import os
from pathlib import Path

# Configuration (In a real app, these would be in a shared .env)
INFLUXDB_URL = "http://localhost:8086"
INFLUXDB_TOKEN = "super-secret-admin-token"
INFLUXDB_ORG = "factory_org"
INFLUXDB_BUCKET = "telemetry_bucket"

def export_to_csv(output_path=None):
    if output_path is None:
        output_path = Path(__file__).resolve().parent / "data" / "factory_telemetry.csv"
    
    print(f"Connecting to InfluxDB at {INFLUXDB_URL}...")
    client = InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG)
    query_api = client.query_api()

    # Query last 24 hours of data
    flux_query = f'''
    from(bucket: "{INFLUXDB_BUCKET}")
        |> range(start: -24h)
        |> filter(fn: (r) => r["_measurement"] == "machine_metrics")
        |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
    '''

    print("Executing Flux query...")
    df = query_api.query_data_frame(flux_query)
    
    if df.empty:
        print("No data found in InfluxDB for the last 24h. Please ensure the simulator is running.")
        return

    # Cleanup and format
    # Influx returns a list of DFs if there are multiple tags, we merge them
    if isinstance(df, list):
        df = pd.concat(df)

    # Rename columns and dropped internal Influx columns
    df = df.drop(columns=['result', 'table', '_start', '_stop', '_measurement'], errors='ignore')
    df = df.rename(columns={'_time': 'timestamp'})

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    df.to_csv(output_path, index=False)
    print(f"Export successful! Saved {len(df)} rows to {output_path}")

if __name__ == "__main__":
    export_to_csv()
