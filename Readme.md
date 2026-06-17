# GCP Architecture Study: GKE vs GAE

An end-to-end, full-stack application built to explore and benchmark Google Cloud Platform (GCP) deployment architectures — specifically comparing **Google Kubernetes Engine (GKE)** against **Google App Engine (GAE)** under high-stress load testing conditions.

While the primary focus is cloud infrastructure, container orchestration, and performance analysis, the application itself is a fully functional AI-powered image processing platform.

---

## Project Objectives

The core motivation of this project was to gain hands-on mastery of GCP services, CI/CD pipelines, and network routing behavior at scale.

### GKE vs. GAE Architecture Comparison

The exact same application was deployed across two distinct GCP compute models to observe and compare their scaling behaviors:

- **Google App Engine (GAE):** Serverless, fully managed deployment. Evaluated for hands-off autoscaling characteristics and cold-start latencies.
- **Google Kubernetes Engine (GKE):** Containerized, highly configurable orchestration. Evaluated for pod-level resource management, Horizontal Pod Autoscaling (HPA), and network routing control.

### Key Infrastructure Learnings

- **Load Balancing:** Identified and resolved Layer 4 (TCP) Keep-Alive bottlenecks during high-concurrency load testing by implementing a Layer 7 Kubernetes Ingress controller, enabling true Round-Robin traffic distribution across autoscaled pods.
- **Immutable Containers:** Configured internal Kubernetes DNS (`svc.cluster.local`) to route frontend-to-backend traffic securely within the cluster, eliminating hardcoded external IP addresses.
- **CI/CD Automation:** Utilized Google Cloud Build to automate Docker image builds, tagging, pushing to Artifact Registry, and subsequent `kubectl apply` deployments.

---

## Application Features

The application serves as a realistic, CPU-intensive workload for stress-testing the underlying infrastructure, combining ML inference with standard CRUD operations.

- **Secure Authentication:** User registration and login flows protected by JWT (JSON Web Tokens).
- **AI Image Processing:** Uploaded images are processed in real time by a YOLOv8 computer vision model to detect and classify objects within the frame.
- **Cloud Storage Integration:** Uploaded images are stored securely in Google Cloud Storage (GCS) buckets.
- **Smart Filtering:** Extracted metadata is persisted to the database, enabling users to search and filter their photo library by detected object classes (e.g., filter by `car`, `person`, `bicycle`).

---

## Tech Stack

### Infrastructure & Cloud (GCP)

- Google Kubernetes Engine (GKE) and App Engine (GAE)
- Google Cloud Storage (GCS)
- Google Cloud Build and Artifact Registry
- Docker and Kubernetes (Manifests, Ingress, Services, HPA)

### Backend

- **Python / FastAPI** — High-performance asynchronous API framework
- **Pydantic** — Data validation and settings management
- **YOLOv8 (Ultralytics)** — Real-time object detection model
- **MongoDB** — NoSQL database for user data and image metadata

### Frontend

- **React and Vite** — Fast, modern frontend tooling
- **Nginx** — Serves compiled static assets and acts as an internal reverse proxy within the cluster

---

## Project Structure

```text
GCP-PROJECT/
├── app/
│   ├── backend/               # FastAPI application, YOLOv8 model, and ML logic
│   │   ├── core/              # Security, JWT, and configuration
│   │   ├── models/            # Pydantic and database models
│   │   ├── routes/            # API endpoint definitions
│   │   ├── main.py            # FastAPI application entry point
│   │   ├── yolov8n.pt         # Pre-trained YOLOv8 weights
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── front_end/             # React SPA
│       ├── src/               # UI components and API integration
│       ├── Dockerfile         # Multi-stage build: Node → Nginx
│       └── package.json
├── deployments/
│   ├── gke/                   # Kubernetes manifests
│   │   ├── backend-deployment.yaml
│   │   ├── backend-ingress.yaml
│   │   ├── backend-service.yaml
│   │   ├── frontend-deployment.yaml
│   │   ├── frontend-service.yaml
│   │   └── mongo-*            # Database manifests
│   └── local/                 # Local development environment
│       ├── docker-compose.yaml
│       └── load_test.py       # Custom benchmarking script
├── cloudbuild.yaml            # CI/CD pipeline definitions
├── dispatch.yaml              # App Engine routing rules
└── .env                       # Environment variables
```

---

## Getting Started

### Local Development

To run the application locally without deploying to GCP, use the provided Docker Compose configuration:

```bash
cd deployments/local
docker-compose up --build
```

### Cloud Deployment (GCP)

The project uses Google Cloud Build for automated deployments. Pushing to the configured branch triggers the pipeline defined in `cloudbuild.yaml`, which:

1. Builds the React and FastAPI Docker images.
2. Pushes them to Google Artifact Registry.
3. Applies the updated Kubernetes manifests in `/deployments/gke` to the active GKE cluster.

---

## Performance Testing

Postman Performance Runner was used to simulate high-concurrency environments (e.g., thousands of requests per minute).

The Stress Test (Triggering Autoscalers) -
Virtual Users: 100 to 150
Duration: 3 to 5 minutes
Goal: Sustained pressure. This is where we will see the latency spike, and both GAE and GKE should recognize the sustained load and begin provisioning new instances/pods.

The Burst (Spike Traffic)
Virtual Users: 500
Duration: 1 minute
Goal: Tests how the infrastructure handles sudden, violent spikes. We are looking for which platform throws the most 502 Bad Gateway or 503 Service Unavailable errors before it can scale.

This benchmarking was critical for comparing GAE instance spin-up times against CPU-triggered Horizontal Pod Autoscaling in GKE.