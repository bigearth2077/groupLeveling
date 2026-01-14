# Room Module API Documentation

## 1. Overview
The Room module manages the lifecycle of study rooms (Squads), including creation, discovery, management, and real-time interactions. It supports both HTTP REST APIs for management and Socket.IO for real-time communication (chat, status updates).

**Base URL**: `/api`

---

## 2. HTTP REST API

### 2.1. Create Room
Create a new study room.

- **Endpoint**: `POST /rooms`
- **Auth**: Required (Bearer Token)
- **Request Body**:
  ```json
  {
    "name": "Late Night Coding",       // Required, String (Max 50 chars)
    "description": "Focus on Go",      // Optional, String
    "tagId": "uuid-string",            // Optional, UUID of a tag
    "maxMembers": 20,                  // Optional, Default 50
    "isPrivate": true,                 // Optional, Boolean
    "password": "secret_password"      // Optional, Required if isPrivate is true
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "id": "uuid",
    "name": "Late Night Coding",
    "description": "Focus on Go",
    "tagId": "uuid",
    "tagName": "Coding",
    "isPrivate": true,
    "maxMembers": 20,
    "creatorId": "user-uuid",
    "createdAt": "2024-03-20T10:00:00Z",
    "onlineCount": 0,
    "hasPassword": true
  }
  ```

### 2.2. Get Rooms (List)
Retrieve a paginated list of rooms. Supports filtering and searching.

- **Endpoint**: `GET /rooms`
- **Auth**: Required
- **Query Parameters**:
  - `page`: Page number (default 1)
  - `pageSize`: Items per page (default 20)
  - `tag`: Filter by Tag ID (optional)
  - `search`: Search by room name or description (optional)
- **Response** (`200 OK`):
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "name": "Study Hall",
        "description": "...",
        "onlineCount": 5,
        "maxMembers": 50,
        "isPrivate": false,
        "hasPassword": false,
        "creatorId": "user-uuid",
        "createdAt": "...",
        "tagName": "General"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
  ```

### 2.3. Get Room Detail
Get detailed metadata for a specific room. Useful for checking host permissions or pre-loading UI.

- **Endpoint**: `GET /rooms/:id`
- **Auth**: Required
- **Response** (`200 OK`):
  ```json
  {
    "id": "uuid",
    "name": "My Room",
    "description": "Description...",
    "creatorId": "user-uuid", // Check against current user ID to determine Host status
    "isPrivate": true,
    "hasPassword": true,
    // ... other room fields
  }
  ```

### 2.4. Update Room
Update room settings. **Only the Room Creator (Host) can perform this action.**

- **Endpoint**: `PATCH /rooms/:id`
- **Auth**: Required (Must be Creator)
- **Request Body** (All fields optional):
  ```json
  {
    "name": "New Name",
    "description": "Updated desc",
    "maxMembers": 100,
    "isPrivate": false,
    "password": null // Send null (or omit if public) to remove password
  }
  ```
- **Response** (`200 OK`): Returns updated room object.

### 2.5. Delete Room
Delete a room. **Only the Room Creator (Host) can perform this action.**
This will remove the room and all associated member records.

- **Endpoint**: `DELETE /rooms/:id`
- **Auth**: Required (Must be Creator)
- **Response** (`200 OK`):
  ```json
  { "ok": true }
  ```

### 2.6. Validate Password (Pre-flight)
Check if a password is correct before attempting to join via Socket. Used for UI validation.

- **Endpoint**: `POST /rooms/validate-password`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "roomId": "uuid",
    "password": "input_password"
  }
  ```
- **Response**:
  - `200 OK`: Password correct (or room is public).
  - `403 Forbidden`: Incorrect password.

### 2.7. Get Room Members
Get a list of users currently in the room.

- **Endpoint**: `GET /rooms/:id/members`
- **Auth**: Required
- **Response** (`200 OK`):
  ```json
  {
    "items": [
      {
        "userId": "uuid",
        "nickname": "Alice",
        "avatarUrl": "http://...",
        "status": "learning", // 'learning' | 'rest' | 'idle'
        "joinedAt": "..."
      }
    ],
    "total": 5
  }
  ```

---

## 3. Socket.IO Real-time Events

**Namespace**: `/`
**Connection**: Requires `token` query parameter (JWT).
`ws://host/socket.io/?token=YOUR_JWT_TOKEN&transport=websocket`

### 3.1. Client -> Server Events

#### `join_room`
Join a room.
- **Payload**:
  ```json
  {
    "roomId": "uuid",
    "password": "optional_password" // Required if room is private
  }
  ```
- **Ack**: Returns `{ message: "joined" }` or `{ error: "msg" }`.

#### `leave_room`
Leave the current room.
- **Payload**: `{"roomId": "uuid"}`

#### `send_message`
Send a chat message to the room.
- **Payload**:
  ```json
  {
    "roomId": "uuid",
    "content": "Hello world"
  }
  ```

#### `update_status`
Update user's study status (e.g., when Pomodoro timer starts/stops).
- **Payload**:
  ```json
  {
    "roomId": "uuid",
    "status": "learning" // 'learning' | 'rest' | 'idle'
  }
  ```

### 3.2. Server -> Client Events (Broadcasts)

#### `user_joined`
Fired when another user joins the room.
- **Data**:
  ```json
  {
    "user": {
      "id": "uuid",
      "nickname": "Bob",
      "avatarUrl": "..."
    }
  }
  ```

#### `user_left`
Fired when a user leaves the room.
- **Data**: `{"userId": "uuid"}`

#### `new_message`
Fired when a chat message is received.
- **Data**:
  ```json
  {
    "id": "msg-uuid",
    "content": "Hello world",
    "createdAt": "...",
    "sender": { "id": "...", "nickname": "...", "avatarUrl": "..." }
  }
  ```

#### `status_updated`
Fired when a user changes their status.
- **Data**:
  ```json
  {
    "userId": "uuid",
    "status": "learning"
  }
  ```

---

## 4. Data Models (Reference)

### Room
| Field | Type | Description |
|-------|------|-------------|
| ID | UUID | Primary Key |
| Name | String | Room Name |
| Description | Text | Optional |
| CreatorID | UUID | User who owns the room |
| TagID | UUID | Associated Topic Tag |
| IsPrivate | Boolean | If true, requires password |
| MaxMembers | Int | Capacity limit |
| OnlineCount | Int | (Computed) Current users |

### RoomMember
| Field | Type | Description |
|-------|------|-------------|
| RoomID | UUID | FK to Room |
| UserID | UUID | FK to User |
| Status | Enum | 'learning', 'rest', 'idle' |
| JoinedAt | Time | When user entered |
