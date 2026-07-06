# Kiln API Reference

## Authentication

All endpoints require JWT token.

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Core Endpoints

### AI Chat
```
POST /api/ai/chat
Content-Type: application/json

{
  "message": "Generate a React component",
  "context": "Building a dashboard",
  "projectId": "proj_123"
}
```

### Generate Code
```
POST /api/ai/generate-code

{
  "description": "Create a function to validate email",
  "language": "javascript"
}
```

### Execute Code
```
POST /api/execution/run

{
  "code": "console.log('Hello')",
  "language": "javascript"
}
```

### Projects
```
GET /api/projects
POST /api/projects
GET /api/projects/:id
PUT /api/projects/:id
DELETE /api/projects/:id
```

## Status Codes

- 200 - Success
- 201 - Created
- 400 - Bad Request
- 401 - Unauthorized
- 404 - Not Found
- 500 - Server Error
