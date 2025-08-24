# Replit.md

## Overview

This is a modern AI-powered form builder application with a full-stack architecture. The application allows users to create dynamic forms with AI-enhanced text processing capabilities. It features a React frontend with a glassmorphism design aesthetic, Express.js backend API, and PostgreSQL database with Drizzle ORM. The key innovation is the integration of Anthropic's Claude AI for enhancing form responses and providing intelligent text suggestions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with custom glassmorphism design system and CSS variables for theming
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **State Management**: React hooks (useState, useCallback) with custom hooks like `useFormBuilder`
- **Data Fetching**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Drag & Drop**: Custom implementation for form question reordering

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API with JSON responses and comprehensive error handling
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Middleware**: Custom logging middleware for API request tracking
- **Development**: Hot module replacement with Vite integration for development workflow

### Database Design
The application uses PostgreSQL with four main entities:
- **Users**: User profiles with authentication fields
- **Forms**: Form definitions with JSON-stored questions and workflow configurations
- **Form Responses**: User submissions with original and AI-enhanced response data
- **AI Prompts**: Custom AI enhancement settings per question

The schema supports flexible JSON storage for dynamic form structures while maintaining relational integrity.

### AI Integration
- **Provider**: Anthropic Claude (latest claude-sonnet-4-20250514 model)
- **Capabilities**: Text enhancement with configurable tone and length parameters
- **Features**: Real-time text suggestions, response enhancement, and customizable AI prompts per question
- **Configuration**: Support for professional, casual, formal, and creative tones with concise, moderate, or detailed length options

### Development Workflow
- **Build System**: Vite for fast development and optimized production builds
- **Type Safety**: Full TypeScript coverage across frontend, backend, and shared types
- **Database Migrations**: Drizzle Kit for schema management and migrations
- **Environment**: Replit-optimized with runtime error handling and cartographer integration

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database with connection pooling
- **AI Service**: Anthropic Claude API for text enhancement and intelligent suggestions
- **Build Tools**: Vite for frontend bundling and ESBuild for backend compilation

### Key Libraries
- **Frontend**: React, TanStack Query, Radix UI, Tailwind CSS, Wouter routing
- **Backend**: Express.js, Drizzle ORM, Zod for validation
- **Development**: TypeScript, ESLint, PostCSS with Autoprefixer

### Authentication & Sessions
- Uses connect-pg-simple for PostgreSQL session storage
- Prepared for user authentication integration with profile management

The application is designed for scalability with serverless-first architecture choices and modern development practices throughout the stack.