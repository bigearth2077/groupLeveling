# Matching Module API Documentation

## 1. Overview
The Matching module provides algorithm-driven recommendations for study rooms and ambient buddies. It computes Jaccard-like tag intersections, active popularity, and Cosine similarity without relying on external generative AI, ensuring high speed and relevance.

**Base URLs**: 
- Users: `/api/users/ambient`
- Rooms: `/api/rooms/recommended`

---

## 2. HTTP REST API

### 2.1. Get Ambient Buddies
Retrieve a list of users mathematically determined to have high synergy with the current user, intended for non-intrusive side-bar display (Ambient Companionship).

- **Endpoint**: `GET /users/ambient`
- **Auth**: Required (Bearer Token)
- **Query Parameters**:
  - `limit`: Maximum number of buddies to return. Default is 10.
- **Response** (`200 OK`):
  ```json
  {
    "items": [
      {
        "id": "uuid-string",
        "nickname": "Alice",
        "avatarUrl": "https://example.com/alice.png",
        "bio": "Keep hacking",
        "matchScore": 0.89,
        "sharedTags": ["React", "Go"]
      }
    ]
  }
  ```

### 2.2. Get Recommended Rooms
Retrieve public rooms sorted by algorithm relevance instead of chronological order. Factors in current user's tag weights, total study ratios, and room popularity.

- **Endpoint**: `GET /rooms/recommended`
- **Auth**: Required (Bearer Token)
- **Response** (`200 OK`): Returns an array equivalent to the standard Room listing, but augmented with the calculated match score.
  ```json
  {
    "items": [
      {
        "id": "uuid-string",
        "name": "Late Night Go Routine",
        "description": "Silent coding session",
        "isPrivate": false,
        "maxMembers": 50,
        "onlineCount": 12,
        "tagName": "Go",
        "tagId": "uuid-tag-123",
        "matchScore": 85.50
      }
    ]
  }
  ```
