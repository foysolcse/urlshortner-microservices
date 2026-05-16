# Load Testing Report

## Scenario

Tool: k6

The script in `load-test/k6-test.js` models the daily 12:00 PM traffic spike:

- 1 minute warm-up to 10 virtual users
- 2 minute ramp to 75 virtual users
- 3 minute peak at 150 virtual users
- 2 minute cool-down to 25 virtual users
- 1 minute ramp-down to 0

## Command

```bash
k6 run -e BASE_URL=http://urlshortener.local load-test/k6-test.js
```

For local port-forward testing:

```bash
kubectl port-forward svc/python-service 5000:5000 -n urlshortener
kubectl port-forward svc/go-service 8000:8000 -n urlshortener
k6 run -e BASE_URL=http://localhost:5000 load-test/k6-test.js
```

## Evidence to Capture

- `kubectl get hpa -n urlshortener -w`
- `kubectl top pods -n urlshortener`
- Grafana dashboard during the peak stage
- k6 summary output with p95 latency and failure rate

## Expected Result

The HPA targets CPU at 60 percent and memory at 75 percent. During the peak stage, the Python, Go, and Node.js deployments should scale above their baseline of 2 replicas when load increases, then scale down after the 5 minute stabilization window.

## Bottlenecks and Improvements

- SQLite is acceptable for this assignment demo, but production should move service data to managed databases or persistent volumes.
- Redis caching improves redirect latency by avoiding repeated SQLite reads in the Go service.
- Node.js metadata fetching depends on external websites and should be protected with timeouts and retries for production traffic.
