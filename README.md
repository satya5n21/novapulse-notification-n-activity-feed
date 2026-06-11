# Real-Time Notification & Activity Feed System

- a backend module to power the notifications + live feed.
- This can used in apps where events from multiple sources fan out to users in real time.

## Tech Stack

- Runtime: Node
- Language: Javascript + Express framework
- Infra:

| tech | Role |
| -------- | ---- |
| MongoDB | Persistant storage for users, events, notifications |
| Redis Cache | Cache hot feed data & user preference |
| Redis Pub/Sub | Fan out events to connected clients in real time |

## Core Features

1. Event Ingestion (`POST /events`):
    - Any service posts an event (e.g, `{type:task_completed, userId, payload}`),
    - saved to MongoDB
    - then published
2. Redis Pub/Sub Fan-out
    - A subscriber layer listens to Redis channels
    - and pushes updates to connected SSE/Websocket clients
3. Notification Service
    - Reads events, generate per-user notificatoin, stores in MongoDB
    - Marks read/unread
4. Feed API with Redis Cache
    - `GET /feed/:userId`
    - First checks Redis cache (TTL-60s)
    - falls back to MongoDB aggregation if not found
    - Cache invalidates on new event.
5. User Preference Filtering
    - users subscribe to specific event types.
    - preferences cached in Redis (hash),
    - persisted in MongoDB
