# AI Agent Workspace

An autonomous development environment inspired by Replit, powered by Gemini AI.

## Overview

This is a full-stack workspace application that provides an AI agent with complete access to development tools including file management, terminal execution, database operations, secrets management, and workflow automation.

## Features

### Frontend
- **File Explorer**: Tree view with context menus, file creation, and deletion
- **Code Editor**: Multi-tab editor with syntax highlighting, save/revert functionality
- **Integrated Terminal**: Multiple terminal sessions with command history
- **Database Panel**: Database schema viewer and management
- **Secrets Manager**: Secure storage for API keys and credentials with visibility toggles
- **Workflow Engine**: Create and manage autonomous task sequences
- **AI Agent Console**: Real-time activity logs and task monitoring
- **Dark/Light Mode**: Theme toggle with localStorage persistence
- **WebSocket Support**: Real-time updates across all panels

### Backend
- **PostgreSQL Database**: Complete schema for projects, files, terminals, workflows, secrets, tasks, and logs
- **Gemini AI Integration**: 
  - Code generation from natural language
  - Code analysis for bugs and improvements
  - Bug fixing assistance
  - Project structure generation
- **RESTful API**: Comprehensive endpoints for all CRUD operations
- **Terminal Execution**: Safe command execution with history tracking
- **WebSocket Server**: Real-time broadcasting of updates to all connected clients

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui, TanStack Query, Wouter
- **Backend**: Express.js, PostgreSQL (Neon), Drizzle ORM, WebSocket (ws)
- **AI**: Google Gemini AI (gemini-2.0-flash-exp)

## Architecture

The application follows a schema-first approach with:
1. Shared TypeScript types between frontend and backend
2. Database-backed storage with Drizzle ORM
3. Real-time communication via WebSockets
4. AI-powered autonomous operations

## Project Structure

```
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # UI components (file explorer, editor, terminal, etc.)
│   │   ├── pages/       # Workspace page
│   │   └── hooks/       # Custom hooks (WebSocket, etc.)
├── server/              # Backend Express server
│   ├── db.ts           # Database connection
│   ├── storage.ts      # Data access layer
│   ├── gemini.ts       # AI integration
│   └── routes.ts       # API endpoints and WebSocket server
├── shared/              # Shared types and schemas
│   └── schema.ts       # Drizzle schema definitions
```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (auto-configured)
- `GEMINI_API_KEY`: Google AI API key
- `SESSION_SECRET`: Session encryption key

## Development

The workspace is already configured and running. The AI agent can autonomously:
- Create and modify files
- Execute terminal commands
- Manage database schemas
- Store and retrieve secrets
- Run workflow sequences
- Generate and analyze code

## Autonomous Capabilities

The AI agent has full access to:
1. **File System**: Read, write, create, and delete files
2. **Terminal**: Execute commands and view output
3. **Database**: Query and manage database schemas
4. **Secrets**: Securely store API keys and credentials
5. **Workflows**: Define and execute multi-step autonomous tasks
6. **Code Generation**: Create code from natural language descriptions
7. **Code Analysis**: Detect bugs and suggest improvements
