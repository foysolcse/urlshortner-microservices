# URL Shortener Microservices Capstone

This repository contains a Kubernetes-ready URL shortener platform with three independent services:

- Go redirect service on port `8000`
- Python dashboard and analytics service on port `5000`
- Node.js metadata service on port `3000`
- Redis cache and pub/sub for redirect lookups and click events

The project includes Dockerfiles, Kubernetes manifests, HPA autoscaling, GitHub Actions CI/CD, SonarQube configuration, Prometheus, Grafana, and a k6 load test for the 12:00 PM traffic spike scenario.

## Architecture

Architecture diagram source: [docs/architecture.mmd](docs/architecture.mmd)

Traffic flow:

1. Users access the Python dashboard through NGINX Ingress at `http://urlshortener.local`.
2. Python creates short URLs by calling the Go service and enriches metadata through the Node.js service.
3. Redirects go through `/u/{short_code}` to the Go service.
4. Go reads from Redis cache first, falls back to SQLite, and publishes click events to Redis.
5. Python subscribes to Redis events and stores analytics.
6. Prometheus scrapes Kubernetes metrics and Grafana visualizes pod/resource behavior.

## Local Run

```bash
docker-compose up --build
```

Open:

- Dashboard: `http://localhost:5000`
- Go service: `http://localhost:8000/health`
- Node service: `http://localhost:3000/health`

## Kubernetes Deployment

Prerequisites:

- Kubernetes cluster with Metrics Server installed
- NGINX Ingress Controller installed
- Docker images available in Docker Hub
- `urlshortener.local` mapped to the ingress IP in `/etc/hosts`

Deploy:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/redis/
kubectl apply -f k8s/go/
kubectl apply -f k8s/python/
kubectl apply -f k8s/node/
kubectl apply -f k8s/ingress.yaml
kubectl apply -f monitoring/prometheus/
kubectl apply -f monitoring/grafana/
```

Check deployment:

```bash
kubectl get pods,svc,ingress,hpa -n urlshortener
kubectl top pods -n urlshortener
```

Open Grafana locally:

```bash
kubectl port-forward svc/grafana 3001:3000 -n urlshortener
```

Default Grafana credentials are stored in `k8s/secret.yaml`.

## Autoscaling

Each application service includes an HPA:

- Minimum replicas: `2`
- Maximum replicas: `10`
- CPU target: `60%`
- Memory target: `75%`

The deployments include CPU and memory requests so the HPA can calculate utilization correctly.

## CI/CD

Workflow: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)

The pipeline:

1. Runs Go, Python, and Node validation.
2. Runs SonarQube analysis and waits for the quality gate.
3. Builds Docker images.
4. Pushes images to Docker Hub.
5. Deploys Kubernetes and monitoring manifests with `kubectl`.

Required GitHub secrets:

- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `SONAR_TOKEN`
- `SONAR_HOST_URL`
- `KUBE_CONFIG` as base64 encoded kubeconfig

Docker Hub repositories:

- `DOCKER_USERNAME/go-service`
- `DOCKER_USERNAME/python-service`
- `DOCKER_USERNAME/node-service`

## SonarQube

Configuration: [sonar-project.properties](sonar-project.properties)

The GitHub Actions pipeline uses the SonarQube quality gate. Configure the gate in SonarQube/SonarCloud to fail when code smells, duplicated code, or coverage fall outside the assignment threshold.

## Load Testing

Script: [load-test/k6-test.js](load-test/k6-test.js)

Report template and evidence checklist: [load-test/load-test-report.md](load-test/load-test-report.md)

Run:

```bash
k6 run -e BASE_URL=http://urlshortener.local load-test/k6-test.js
```

Watch autoscaling:

```bash
kubectl get hpa -n urlshortener -w
```

## Screenshots to Submit

Capture these after deployment and load testing:

- Kubernetes Dashboard or Lens showing pods and services
- HPA scaling during k6 peak load
- SonarQube quality gate report
- Grafana dashboard for pod CPU/memory
- `kubectl get pods` and `kubectl top pods` output
