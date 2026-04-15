# Analytics Module API Documentation

## 1. Overview
The Analytics module provides data aggregation endpoints to support advanced study visualization components such as the GitHub-style Contribution Heatmap and the 24-hour Time-of-Day distribution matrix.

**Base URL**: `/api/analytics`

---

## 2. HTTP REST API

### 2.1. Get Activity Heatmap
Retrieve total study minutes per day for an entire year to render a contribution heatmap. Only includes days with >0 minutes.

- **Endpoint**: `GET /analytics/activity-heatmap`
- **Auth**: Required (Bearer Token)
- **Query Parameters**:
  - `year`: The year to fetch data for (e.g. 2024). Defaults to the current year if not provided.
- **Response** (`200 OK`):
  ```json
  {
    "items": [
      {
        "date": "2024-03-01",
        "count": 120
      },
      {
        "date": "2024-03-05",
        "count": 45
      }
    ]
  }
  ```

### 2.2. Get Time-of-Day Matrix
Retrieve study duration distributed across a 24-hour x 7-day grid based on the past N days. This is used to visualize a user's "peak focus hours" and their study biological clock.

- **Endpoint**: `GET /analytics/time-matrix`
- **Auth**: Required
- **Query Parameters**:
  - `days`: Look-back window in days (e.g. 30). Defaults to 30 if not provided.
- **Response** (`200 OK`):
  ```json
  {
    "items": [
      {
        "day": 0, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        "hour": 22, // 0 - 23 
        "count": 40 // Total minutes focused in this specific hour slot over the period
      },
      {
        "day": 1, 
        "hour": 10,
        "count": 150
      }
    ]
  }
  ```
