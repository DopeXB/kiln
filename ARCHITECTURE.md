# Kiln Architecture

## System Design

```
┌─────────────────┐
│  React Frontend │
│ Monaco Editor   │
│ AI Chat Panel   │
└────────┬────────┘
         │ HTTP/WS
┌────────▼────────┐
│ Express Backend │
│ AI Engine       │
│ Tool System     │
└────────┬────────┘
         │
  ┌──────┼──────┐
  │      │      │
┌─▼─┐ ┌─▼──┐ ┌─▼──┐
│DB │ │Redis│ │Docker
│   │ │     │ │Sandbox
└───┘ └─────┘ └────┘
```

## Services

### AI Engine
- OpenAI GPT-4 / Claude
- Context-aware code generation
- Real-time suggestions

### Tools
- Code Generator
- Database Builder
- API Generator
- UI Builder
- AI Debugger
- Deployer

### Sandbox
- Docker-based execution
- Supports Node.js, Python, Go, Rust, Java
- Memory & CPU limits

## Database

```sql
users(id, email, name, password_hash, created_at)
projects(id, user_id, name, description, template, created_at)
executions(id, project_id, code, language, output, execution_time)
```

## Deployment

- Docker
- Docker Compose
- Kubernetes
- AWS/GCP ready
