# Infrastructure considerations

This directory can house Terraform/CloudFormation/ARM templates once the deployment gets formalized. For now:

- **AWS**: IoT Core policies ingest MQTT, InfluxDB Cloud persists telemetry, PostgreSQL on RDS backs relational metadata, Lambda + EventBridge run ML/retraining, and ECS/Fargate or App Runner hosts the Hono backend.
- **Azure**: IoT Hub + Stream Analytics feed telemetry into Azure Managed Grafana/Influx, PostgreSQL on Flexible Server, Functions trigger model runs, and the frontend deploys to Static Web Apps.
- **CI/CD**: Build steps should lint/test both backend/frontend, publish backend Docker image, package React build, and kick off ML pipeline deployment.

Drop IaC files here once the cloud choice is locked.
