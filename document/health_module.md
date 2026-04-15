# Health Module API Documentation

## 1. Overview
The Health module manages the user's non-study related physiological data, such as sleep and exercise.

**Base URL**: `/api/health`

---

## 2. HTTP REST API

### 2.1. Check In (Morning Sleep Record)
Records or updates the user's sleep data for the current UTC day.

- **Endpoint**: `POST /health/check-in`
- **Auth**: Required (Bearer Token)
- **Request Body**:
  ```json
  {
    "sleepHours": 7.5,
    "sleepQuality": "great" // Optional: "bad", "okay", "great", etc.
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "ok": true
  }
  ```
