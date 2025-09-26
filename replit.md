# Overview

PodcastPros Productive Time Intelligence is a modern web application for executive productive time management. The platform provides comprehensive insights into employee productivity through an interactive dashboard, ranking systems, and data management tools. The application features seven interconnected pages that allow managers to track productive hours, identify top performers and underachievers, manage employee rosters, and upload CSV data for automated processing.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built using React with TypeScript in a modern single-page application architecture. The application uses:

- **Component Library**: Radix UI components with shadcn/ui for consistent, accessible UI elements
- **Styling**: Tailwind CSS with custom brand colors (Electric Blue, Vibrant Cyan, Success Green, Alert Red, Championship Gold)
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **Build Tool**: Vite for fast development and optimized production builds
- **Forms**: React Hook Form with Zod validation for type-safe form handling

The application follows a component-based architecture with shared UI components, custom hooks for data fetching, and page-specific components. The design system emphasizes bold colors, modern typography, and responsive layouts optimized for desktop-first with mobile support.

## Backend Architecture

The backend implements a RESTful API using Express.js with TypeScript:

- **Web Framework**: Express.js with middleware for JSON parsing, CORS, and request logging
- **API Design**: RESTful endpoints for employee management, productivity data, and file uploads
- **File Processing**: Multer for handling CSV file uploads with 10MB size limits
- **Data Validation**: Zod schemas for runtime type checking and validation
- **Development Tools**: TSX for TypeScript execution and hot reloading

The server architecture separates concerns with dedicated route handlers, storage abstraction layer, and utility functions for development tooling. The API provides endpoints for retrieving employees, productivity data by month, rankings, and bulk data operations.

## Data Storage Solutions

The application uses a hybrid approach for data persistence:

- **Database**: PostgreSQL configured through Drizzle ORM for production data storage
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **Development Storage**: In-memory storage implementation for development and testing
- **Data Models**: Strongly typed schemas for employees and productivity data with relationships

The storage layer abstracts database operations through an interface-based approach, allowing for different implementations (memory vs. database) while maintaining consistent API contracts.

## Authentication and Authorization

Currently implements basic session-based architecture foundation:

- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Session Management**: Express session middleware configured for development and production
- **Security**: Session cookies with appropriate security settings for different environments

The authentication system is prepared for expansion but currently focuses on session management infrastructure.

## External Dependencies

### Development and Build Tools

- **Vite**: Modern build tool with React plugin and development server
- **TypeScript**: Static type checking with strict configuration
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **PostCSS**: CSS processing with Autoprefixer for browser compatibility

### UI and Interaction Libraries

- **Radix UI**: Comprehensive set of accessible React components for complex UI patterns
- **Lucide React**: Modern icon library with consistent styling
- **React Hook Form**: Performant form library with minimal re-renders
- **TanStack React Query**: Powerful data synchronization for React applications

### Backend Services

- **Neon Database**: Serverless PostgreSQL for cloud-native data persistence
- **Drizzle ORM**: TypeScript-first ORM with excellent type safety
- **Express.js**: Minimal and flexible Node.js web application framework
- **Multer**: Middleware for handling multipart/form-data for file uploads

### Validation and Parsing

- **Zod**: TypeScript-first schema declaration and validation library
- **Drizzle-Zod**: Integration between Drizzle ORM and Zod for consistent schemas
- **Date-fns**: Modern date utility library for JavaScript

### Development Experience

- **Replit Plugins**: Custom Vite plugins for development banner, error overlay, and cartographer integration
- **ESBuild**: Fast JavaScript bundler for production builds
- **Class Variance Authority**: Utility for creating variant-based component APIs