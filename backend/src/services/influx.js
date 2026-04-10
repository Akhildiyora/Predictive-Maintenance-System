import { InfluxDB, Point } from '@influxdata/influxdb-client';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.INFLUXDB_URL || 'http://localhost:8086';
const token = process.env.INFLUXDB_TOKEN || 'super-secret-admin-token';
const org = process.env.INFLUXDB_ORG || 'factory_org';
const bucket = process.env.INFLUXDB_BUCKET || 'telemetry_bucket';

const influxDB = new InfluxDB({ url, token });
const writeApi = influxDB.getWriteApi(org, bucket);
const queryApi = influxDB.getQueryApi(org);

export { writeApi, queryApi, Point };
