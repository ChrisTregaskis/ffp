# FFP Postman Configuration

This directory contains Postman collections and environments for testing the FFP API.

## Files

- **`FFP-API-Collection.postman_collection.json`** - Main API collection with all endpoints
- **`FFP-Dev-Environment.postman_environment.json`** - Development environment variables

## Quick Setup

### 1. Import Collection & Environment

In Postman:

1. Click **Import** button
2. Drag both JSON files into the import dialog
3. Click **Import**

### 2. Configure Environment Variables

1. Select the **"FFP - Development"** environment (top right dropdown)
2. Click the environment name to edit variables
3. Get your SST outputs:

```bash
# From your terminal (while sst dev is running, or after sst deploy)
pnpm sst:dev
# or
pnpm sst:deploy:dev
```

4. Copy the output values into Postman environment variables:

| Variable           | Source                         | Example                                              |
| ------------------ | ------------------------------ | ---------------------------------------------------- |
| `apiUrl`           | SST output: `apiUrl`           | `https://abc123.execute-api.eu-west-2.amazonaws.com` |
| `userPoolId`       | SST output: `userPoolId`       | `eu-west-2_ABC123XYZ`                                |
| `userPoolClientId` | SST output: `userPoolClientId` | `1a2b3c4d5e6f7g8h9i0j`                               |
| `region`           | Already set                    | `eu-west-2`                                          |

5. Click **Save**

### 3. Test the Health Check

1. Open the collection: **FFP - Fit For Purpose API**
2. Navigate to: **Health & Status** → **Health Check**
3. Click **Send**
4. You should see a `200 OK` response:

```json
{
  "status": "healthy",
  "message": "FFP Functions - Health Check OK",
  "timestamp": "2025-10-25T12:34:56.789Z",
  "service": "auth",
  "version": "1.0.0"
}
```

## Collection Structure

### Current Endpoints

- **Health & Status**
  - `GET /health` - Public health check (no auth required)

### Coming Soon

- **Authentication** - User registration, login, token management
- **Assessments** - Patient assessment CRUD operations
- **Programmes** - Workout programme generation
- **Videos** - Video metadata and streaming
