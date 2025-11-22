# Downloader API Documentation

## Base URL
```
http://your-server-address:3000
```

## Authentication

All API endpoints (except `/api/auth/login`) require authentication via session cookies. The session cookie is automatically set upon successful login and should be included in subsequent requests.

---

## Endpoints

### 1. Authentication

#### POST `/api/auth/login`
Authenticate a user and create a session.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "username": "string"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing username or password
- `401 Unauthorized`: Invalid credentials
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}' \
  -c cookies.txt
```

---

#### GET `/api/auth/session`
Check current session status.

**Response (200 OK):**
```json
{
  "authenticated": true,
  "user": {
    "username": "string"
  }
}
```

**Or if not authenticated:**
```json
{
  "authenticated": false,
  "user": null
}
```

**Example:**
```bash
curl http://localhost:3000/api/auth/session \
  -b cookies.txt
```

---

#### POST `/api/auth/logout`
End the current session.

**Response (200 OK):**
```json
{
  "success": true
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

---

### 2. Downloads

#### GET `/api/downloads`
Get all downloads for the authenticated user.

**Response (200 OK):**
```json
{
  "downloads": [
    {
      "id": "string",
      "url": "string",
      "filename": "string",
      "status": "pending" | "downloading" | "completed" | "error",
      "progress": 0-100,
      "speed": "number (bytes/sec)",
      "eta": "number (seconds remaining)",
      "targetPath": "string",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl http://localhost:3000/api/downloads \
  -b cookies.txt
```

---

#### POST `/api/downloads`
Add a new download.

**Request Body:**
```json
{
  "url": "string (required)",
  "customFilename": "string (optional)",
  "targetPath": "string (optional)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "download": {
    "id": "string",
    "url": "string",
    "filename": "string",
    "status": "pending",
    "progress": 0,
    "targetPath": "string",
    "createdAt": "ISO 8601 timestamp"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing URL
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:3000/api/downloads \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "url": "https://1fichier.com/?abc123",
    "customFilename": "my-movie.mkv",
    "targetPath": "/downloads/movies"
  }'
```

---

### 3. Path Shortcuts

#### GET `/api/paths`
Get all path shortcuts.

**Response (200 OK):**
```json
{
  "paths": [
    {
      "id": "string",
      "name": "string",
      "path": "string"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl http://localhost:3000/api/paths \
  -b cookies.txt
```

---

#### POST `/api/paths`
Add a new path shortcut.

**Request Body:**
```json
{
  "name": "string (required)",
  "path": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Responses:**
- `400 Bad Request`: Missing name or path
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:3000/api/paths \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Movies",
    "path": "/mnt/media/movies"
  }'
```

---

#### DELETE `/api/paths?name={name}`
Delete a path shortcut.

**Query Parameters:**
- `name` (required): Name of the path shortcut to delete

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Responses:**
- `400 Bad Request`: Missing name parameter
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X DELETE "http://localhost:3000/api/paths?name=Movies" \
  -b cookies.txt
```

---

### 4. Settings

#### GET `/api/settings`
Get application settings (sensitive data like Plex token is not exposed).

**Response (200 OK):**
```json
{
  "settings": {
    "plexUrl": "string",
    "plexConfigured": boolean
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl http://localhost:3000/api/settings \
  -b cookies.txt
```

---

#### PUT `/api/settings`
Update application settings.

**Request Body:**
```json
{
  "plexUrl": "string (optional)",
  "plexToken": "string (optional)"
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "plexUrl": "http://192.168.1.100:32400",
    "plexToken": "your-plex-token"
  }'
```

---

### 5. Movie Search

#### GET `/api/movies/search?q={query}`
Search for movies on Zone-Telechargement.

**Query Parameters:**
- `q` (required): Search query

**Response (200 OK):**
```json
{
  "movies": [
    {
      "id": "string",
      "title": "string",
      "cleanTitle": "string",
      "year": "string",
      "poster": "string",
      "inPlex": boolean,
      "qualities": [
        {
          "quality": "string (e.g., '1080p', '720p')",
          "language": "string (e.g., 'FRENCH', 'MULTI')",
          "url": "string (detail page URL)",
          "fileSize": "string (e.g., '1.5 GB')",
          "links": []
        }
      ]
    }
  ],
  "total": number
}
```

**Error Responses:**
- `400 Bad Request`: Missing query parameter
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl "http://localhost:3000/api/movies/search?q=Avatar" \
  -b cookies.txt
```

---

#### POST `/api/movies/links`
Get 1fichier download links from a movie detail page.

**Request Body:**
```json
{
  "url": "string (required - detail page URL)"
}
```

**Response (200 OK):**
```json
{
  "links": [
    "https://dl-protect.link/...",
    "https://dl-protect.link/..."
  ]
}
```

**Error Responses:**
- `400 Bad Request`: Missing URL
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:3000/api/movies/links \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"url":"https://zone-telechargement.irish?p=film&id=12862-joker"}'
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200 OK`: Request successful
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or invalid
- `500 Internal Server Error`: Server-side error

---

## Session Management

### Cookie-Based Authentication

The API uses HTTP-only session cookies for authentication. After a successful login:

1. The server sets a session cookie in the response
2. The client must include this cookie in all subsequent requests
3. The cookie is automatically managed by URLSession in iOS

### iOS Implementation Example

```swift
// Configure URLSession to handle cookies
let config = URLSessionConfiguration.default
config.httpCookieAcceptPolicy = .always
config.httpShouldSetCookies = true
let session = URLSession(configuration: config)

// Login request
var request = URLRequest(url: URL(string: "http://server:3000/api/auth/login")!)
request.httpMethod = "POST"
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
request.httpBody = try? JSONEncoder().encode(["username": "admin", "password": "pass"])

// Cookies are automatically stored and sent with future requests
let (data, response) = try await session.data(for: request)
```

---

## Rate Limiting

Currently, there are no rate limits implemented. This may change in future versions.

---

## Versioning

Current API version: **v1** (no version prefix in URLs)

---

## Support

For issues or questions, contact the backend development team.
