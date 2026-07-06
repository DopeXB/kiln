# Kiln Quick Start

Welcome to **Kiln** 🔥 - An AI-integrated platform builder!

## Prerequisites
- Node.js 18+
- Docker & Docker Compose (optional)
- OpenAI API key

## Installation

```bash
git clone https://github.com/DopeXB/kiln.git
cd kiln
npm install
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your API keys.

## Development

```bash
npm run dev
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Production

```bash
npm run build
docker-compose up
```

## Features

- 🤖 AI Chat Assistant
- 💻 Monaco Code Editor
- 🛠️ 6 AI-Powered Tools
- 📦 Project Management
- 🚀 One-Click Deploy

## Documentation

- [API Reference](./API.md)
- [Architecture](./ARCHITECTURE.md)
- [Contributing](./CONTRIBUTING.md)
