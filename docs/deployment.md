# Deployment Guidance

## Infrastructure baseline
- Provision managed MQTT broker (AWS IoT Core or Azure IoT Hub).
- Stand up InfluxDB (managed or self-hosted) for telemetry and PostgreSQL for relational data.
- Host Node.js backend on ECS/Fargate, App Service, or AWS Lambda behind API Gateway.
- Deploy React static build to S3/CloudFront or Azure Static Web Apps.
- Schedule ML training jobs using AWS SageMaker Processing or Azure ML pipelines.

## CI/CD outline
- Lint & test backend (`npm test`) and frontend (`npm run test`).
- Build and publish Docker images for backend.
- Package React build artifacts and deploy via AWS CLI/az cli.
- Trigger ML training pipeline when sensor labels or failure data changes.
