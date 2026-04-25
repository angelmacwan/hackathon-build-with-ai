# GCP Deployment Guide

This guide will walk you through deploying this Next.js app to Google Cloud Platform (GCP) using **Cloud Run**.

## 1. Prerequisites DONE
- Have the [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) installed.
- Have a GCP project.
- Billing must be enabled for your project.

## 2. One-Time Setup (via CLI)

Run these commands in your terminal:

```bash
# Login to GCP
gcloud auth login

# Set your project ID (replace YOUR_PROJECT_ID)
gcloud config set project bubbly-mission-494405-v5

# Enable required APIs
gcloud services enable \
    run.googleapis.com \
    containerregistry.googleapis.com \
    cloudbuild.googleapis.com \
    aiplatform.googleapis.com
```

## 3. Deployment & Permissions

### Grant Vertex AI Permissions
Cloud Run uses a service account to interact with other GCP services. You must give it permission to use Vertex AI:

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')

# Grant the Vertex AI User role to the default compute service account
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/aiplatform.user"
```

### Deploy to Cloud Run
Run this from the project root:

```bash
gcloud run deploy hackathon-app \
    --source . \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID,GOOGLE_CLOUD_LOCATION=us-central1"
```

Replace `YOUR_PROJECT_ID` with your actual GCP Project ID.

## 4. How it works
- **Cloud Run** will detect the `Dockerfile`, build the image using **Cloud Build**, and deploy it.
- The `aiplatform.googleapis.com` API allows the app to connect to **Vertex AI**.
- The environment variables `GOOGLE_CLOUD_PROJECT` and `GOOGLE_CLOUD_LOCATION` are used by the app to initialize the Vertex AI SDK.

## 5. Local Development
To run locally, you need to authenticate your local environment:

```bash
gcloud auth application-default login
```

Then create a `.env.local` file:
```env
GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
GOOGLE_CLOUD_LOCATION=us-central1
```

And run:
```bash
npm run dev
```
